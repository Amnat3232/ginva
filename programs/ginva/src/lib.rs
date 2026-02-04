use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use std::mem::size_of;

// Program ID - matches Anchor.toml devnet deployment
declare_id!("DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv");

// ═════════════════════════════════════════════════════════════
// CONSTANTS

// Pyth SOL/USD Price Feed ID (from https://pyth.network/developers/price-feed-ids)
pub const SOL_USD_FEED_ID: &str =
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 60; // Maximum age of price data in seconds
                                           // ═════════════════════════════════════════════════════════════
const LIQUIDATION_TIMEOUT: i64 = 2; // 2 seconds for testing (change to 86400 for production)
const AUTO_SWAP_REWARD_BPS: u64 = 600; // 6% = 600 basis points for auto-swap caller
const DISTRIBUTE_REWARD_BPS: u64 = 100; // 1% for keeper C

// Jupiter Program ID (for CPI calls)
// Note: This is the mainnet address. For devnet, use different address
const JUPITER_PROGRAM_ID: &str = "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB";

#[program]
pub mod ginva {
    use super::*;

    // ═════════════════════════════════════════════════════════════
    // 1️⃣ INITIALIZE SYSTEM
    // ═════════════════════════════════════════════════════════════
    pub fn initialize_system(ctx: Context<InitializeSystem>, deposit_fee_bps: u16) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        system_config.admin = ctx.accounts.admin.key();
        system_config.capital_wallet_authority = ctx.accounts.capital_wallet_authority.key();
        system_config.vault_wallet_authority = ctx.accounts.vault_wallet_authority.key();
        system_config.revenue_wallet_authority = ctx.accounts.revenue_wallet_authority.key();
        system_config.seized_assets_authority = ctx.accounts.seized_assets_authority.key();

        system_config.collateral_mint = ctx.accounts.collateral_mint.key();
        system_config.loan_mint = ctx.accounts.loan_mint.key();

        system_config.deposit_fee_bps = deposit_fee_bps;
        system_config.is_active = true;
        system_config.total_borrowed = 0;
        system_config.total_collateral = 0;

        msg!("✅ System initialized with Auto-Swap Liquidation v3.0");
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 2️⃣ DEPOSIT COLLATERAL
    // ═════════════════════════════════════════════════════════════
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        let loan_account = &mut ctx.accounts.loan_account;
        let user = ctx.accounts.user.key();

        require!(amount > 0, GinvaError::InvalidAmount);

        if loan_account.borrower == Pubkey::default() {
            loan_account.borrower = user;
            loan_account.collateral_mint = system_config.collateral_mint;
            loan_account.created_at = Clock::get()?.unix_timestamp;
        } else {
            require!(
                loan_account.borrower == user,
                GinvaError::AccountAlreadyInUse
            );
        }

        // Transfer Collateral: User -> Vault
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_collateral_account.to_account_info(),
            to: ctx.accounts.vault_collateral_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update State
        loan_account.collateral_amount = loan_account.collateral_amount.saturating_add(amount);
        loan_account.status = LoanStatus::Active as u8;
        loan_account.last_payment_at = Clock::get()?.unix_timestamp;
        system_config.total_collateral = system_config.total_collateral.saturating_add(amount);

        msg!("✅ Collateral deposited: {}", amount);
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 3️⃣ BORROW USDC
    // ═════════════════════════════════════════════════════════════
    pub fn borrow_usdc(ctx: Context<BorrowUsdc>, ltv_option: u8, duration_days: u16) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;

        // Get Price and Exponent from Pyth
        let feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID).map_err(|_| GinvaError::PythError)?;
        let (current_price, price_exponent) =
            get_pyth_price_with_exponent(&ctx.accounts.pyth_price_feed, &feed_id)?;

        // Calculate collateral value in USDC with proper decimals
        let collateral_decimals = 9u8; // SOL decimals
        let usdc_decimals = 6u8;
        let collateral_value_usdc = calculate_collateral_value(
            loan_account.collateral_amount,
            current_price,
            price_exponent,
            collateral_decimals,
            usdc_decimals,
        )?;

        let ltv_percentage = match ltv_option {
            1 => 20u64,
            2 => 40u64,
            3 => 60u64,
            _ => return Err(GinvaError::InvalidLTV.into()),
        };

        let loan_amount = collateral_value_usdc
            .saturating_mul(ltv_percentage)
            .checked_div(100)
            .unwrap_or(0);

        require!(
            ctx.accounts.capital_wallet.amount >= loan_amount,
            GinvaError::InsufficientFunds
        );

        // Transfer USDC: Capital Wallet -> User (PDA Signer)
        let bump = ctx.bumps.capital_wallet_authority;
        let seeds = &[b"capital_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.capital_wallet.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.capital_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, loan_amount)?;

        // Update Loan Account
        let current_time = Clock::get()?.unix_timestamp;
        loan_account.loan_amount = loan_account.loan_amount.saturating_add(loan_amount);
        loan_account.ltv_option = ltv_option;
        loan_account.duration_days = duration_days;
        loan_account.borrow_at = current_time;
        loan_account.maturity_at = current_time + (duration_days as i64 * 86400);
        loan_account.interest_rate_bps = match duration_days {
            30 => 250,
            90 => 225,
            380 => 200,
            _ => 0,
        };

        system_config.total_borrowed = system_config.total_borrowed.saturating_add(loan_amount);

        msg!("💰 Loan created: {} USDC", loan_amount);
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 4️⃣ STEP 1: TRIGGER LIQUIDATION (Keeper A - 1% Reward)
    // ═════════════════════════════════════════════════════════════
    pub fn trigger_liquidation(ctx: Context<TriggerLiquidation>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let keeper_a = ctx.accounts.keeper_a.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 1. Check Health Factor
        let feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID).map_err(|_| GinvaError::PythError)?;
        let (current_price, price_exponent) =
            get_pyth_price_with_exponent(&ctx.accounts.pyth_price_feed, &feed_id)?;
        let collateral_value = calculate_collateral_value(
            loan_account.collateral_amount,
            current_price,
            price_exponent,
            9, // SOL decimals
            6, // USDC decimals
        )?;

        let safety_threshold = collateral_value
            .saturating_mul(85)
            .checked_div(100)
            .unwrap_or(0);
        let health_factor = if loan_account.loan_amount > 0 {
            safety_threshold
                .saturating_mul(100)
                .checked_div(loan_account.loan_amount)
                .unwrap_or(0)
        } else {
            1000
        };

        let days_overdue = (current_time - loan_account.last_payment_at) / 86400;
        require!(
            health_factor < 100 || days_overdue > 33,
            GinvaError::NotYetLiquidatable
        );

        // 2. Calculate Rewards (1% for Keeper A, 99% for auto-swap)
        let trigger_reward = loan_account
            .collateral_amount
            .saturating_mul(100)
            .checked_div(10000)
            .unwrap_or(0);
        let remaining_for_swap = loan_account
            .collateral_amount
            .saturating_sub(trigger_reward);

        // 3. Transfer 1% to Keeper A immediately
        let bump = ctx.bumps.vault_authority;
        let seeds = &[b"vault_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_collateral_account.to_account_info(),
            to: ctx.accounts.keeper_a_collateral_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, trigger_reward)?;

        // 4. Transfer 99% to Seized Assets Vault (waiting for auto-swap after 24h)
        let cpi_accounts_seized = Transfer {
            from: ctx.accounts.vault_collateral_account.to_account_info(),
            to: ctx.accounts.seized_assets_vault.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx_seized = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_seized,
            signer,
        );
        token::transfer(cpi_ctx_seized, remaining_for_swap)?;

        // 5. Initialize Liquidation Process
        liquidation_process.loan_account = loan_account.key();
        liquidation_process.status = LiquidationStatus::Triggered as u8;
        liquidation_process.trigger_keeper = keeper_a;
        liquidation_process.seized_collateral_amount = remaining_for_swap;
        liquidation_process.triggered_at = current_time;
        liquidation_process.deadline_for_swap = current_time + LIQUIDATION_TIMEOUT;
        liquidation_process.swapped = false;

        // Update Loan
        loan_account.status = LoanStatus::Liquidated as u8;
        loan_account.liquidated_at = current_time;
        loan_account.keeper_address = keeper_a;
        loan_account.collateral_amount = 0;

        // Update System
        system_config.total_collateral = system_config
            .total_collateral
            .saturating_sub(loan_account.collateral_amount);

        msg!(
            "🔨 Step 1 Complete! Keeper A received: {} SOL (1%)",
            trigger_reward
        );
        msg!(
            "⏳ Auto-swap available after 24h for {} SOL...",
            remaining_for_swap
        );
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 5️⃣ STEP 2: OTC SWAP (Caller buys Seized Assets with USDC)
    // ═════════════════════════════════════════════════════════════
    // Atomic swap: Caller pays USDC -> receives SOL (0.6% discount)
    pub fn execute_auto_swap(ctx: Context<ExecuteAutoSwap>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let caller = ctx.accounts.caller.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 1. Validation Checks
        require!(
            current_time >= liquidation_process.deadline_for_swap,
            GinvaError::SwapTimeoutNotReached
        );
        require!(!liquidation_process.swapped, GinvaError::AlreadySwapped);
        require!(
            liquidation_process.status == LiquidationStatus::Triggered as u8,
            GinvaError::InvalidLiquidationStatus
        );

        let seized_sol_amount = liquidation_process.seized_collateral_amount;
        require!(seized_sol_amount > 0, GinvaError::InvalidAmount);

        // 2. Calculate Fair Value via Pyth
        let feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID).map_err(|_| GinvaError::PythError)?;
        let (current_price, price_exponent) =
            get_pyth_price_with_exponent(&ctx.accounts.pyth_price_feed, &feed_id)?;

        let gross_usdc_value = calculate_collateral_value(
            seized_sol_amount,
            current_price,
            price_exponent,
            9, // SOL decimals
            6, // USDC decimals
        )?;

        // 3. Calculate Discounted Price for Caller
        // Reward 0.6% -> Caller pays 99.4% of the value
        let caller_discount = gross_usdc_value
            .saturating_mul(AUTO_SWAP_REWARD_BPS)
            .checked_div(10000)
            .unwrap_or(0);

        let usdc_required_from_caller = gross_usdc_value.saturating_sub(caller_discount);

        require!(usdc_required_from_caller > 0, GinvaError::InvalidAmount);

        // 4. ACTION A: Pull USDC from Caller -> Processing Vault
        // "ยื่นหมู" (Caller pays money)
        msg!("🔄 Caller paying {} USDC...", usdc_required_from_caller);
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts_pay = Transfer {
            from: ctx.accounts.caller_usdc_account.to_account_info(),
            to: ctx.accounts.processing_vault.to_account_info(),
            authority: ctx.accounts.caller.to_account_info(),
        };
        let cpi_ctx_pay = CpiContext::new(cpi_program.clone(), cpi_accounts_pay);
        token::transfer(cpi_ctx_pay, usdc_required_from_caller)?;

        // 5. ACTION B: Push Seized SOL -> Caller
        // "ยื่นแมว" (System sends collateral)
        msg!("📦 System sending {} SOL...", seized_sol_amount);

        let bump = ctx.bumps.seized_assets_authority;
        let seeds = &[b"seized_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts_send = Transfer {
            from: ctx.accounts.seized_assets_vault.to_account_info(),
            to: ctx.accounts.caller_collateral_account.to_account_info(),
            authority: ctx.accounts.seized_assets_authority.to_account_info(),
        };
        let cpi_ctx_send = CpiContext::new_with_signer(cpi_program, cpi_accounts_send, signer);
        token::transfer(cpi_ctx_send, seized_sol_amount)?;

        // 6. Update State
        liquidation_process.swapped = true;
        liquidation_process.usdc_received = usdc_required_from_caller;
        liquidation_process.swap_executor = caller;
        liquidation_process.swap_reward = caller_discount;
        liquidation_process.status = LiquidationStatus::Swapped as u8;
        liquidation_process.deadline_for_distribution = current_time + LIQUIDATION_TIMEOUT;

        msg!(
            "✅ OTC Swap Complete! Sold {} SOL for {} USDC (Discount: {})",
            seized_sol_amount,
            usdc_required_from_caller,
            caller_discount
        );

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 6️⃣ STEP 3: FINALIZE LIQUIDATION (Keeper C - 0.6% Reward)
    // ═════════════════════════════════════════════════════════════
    pub fn finalize_liquidation(ctx: Context<FinalizeLiquidation>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let keeper_c = ctx.accounts.keeper_c.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 1. Check Status and Timeout
        require!(
            liquidation_process.status == LiquidationStatus::Swapped as u8,
            GinvaError::InvalidLiquidationStatus
        );
        require!(
            current_time <= liquidation_process.deadline_for_distribution,
            GinvaError::DistributionTimeout
        );
        require!(
            keeper_c != liquidation_process.trigger_keeper
                && keeper_c != liquidation_process.swap_executor,
            GinvaError::SameKeeperNotAllowed
        );

        let total_usdc = liquidation_process.usdc_received;
        let loan_principal = loan_account.loan_amount;

        // 2. VALIDATE: Ensure we have enough to cover principal
        require!(
            total_usdc >= loan_principal,
            GinvaError::InsufficientFundsForPrincipal
        );

        // 3. Calculate waterfall distribution
        let principal_return = loan_principal;
        let gross_profit = total_usdc.saturating_sub(principal_return);

        // Keeper C reward: 0.6% of total
        let keeper_c_reward = total_usdc
            .saturating_mul(DISTRIBUTE_REWARD_BPS)
            .checked_div(10000)
            .unwrap_or(0);

        // Adjust if profit insufficient
        let net_profit = if gross_profit >= keeper_c_reward {
            gross_profit.saturating_sub(keeper_c_reward)
        } else {
            // If profit < reward, reduce reward to 50% of profit
            let adjusted_reward = gross_profit / 2;
            liquidation_process.swap_reward = adjusted_reward;
            gross_profit - adjusted_reward
        };

        // Split net profit: 5% Growth Fund, 95% Revenue
        let growth_fund = net_profit.saturating_mul(5).checked_div(100).unwrap_or(0);
        let revenue_share = net_profit.saturating_sub(growth_fund);

        let bump = ctx.bumps.processing_vault_authority;
        let seeds = &[b"processing_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // 4. Transfer Principal to Capital Wallet
        if principal_return > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.capital_wallet.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
            token::transfer(cpi_ctx, principal_return)?;
        }

        // 5. Transfer Keeper C Reward
        if liquidation_process.swap_reward > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.keeper_c_usdc_account.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
            token::transfer(cpi_ctx, liquidation_process.swap_reward)?;
        }

        // 6. Transfer Growth Fund (5% of net profit) to Capital
        if growth_fund > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.capital_wallet.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
            token::transfer(cpi_ctx, growth_fund)?;
        }

        // 7. Transfer Revenue Share (95% of net profit) to Revenue Wallet
        if revenue_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.revenue_wallet.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, revenue_share)?;
        }

        // 8. Update Status
        liquidation_process.status = LiquidationStatus::Finalized as u8;
        liquidation_process.distribute_keeper = keeper_c;
        liquidation_process.finalized_at = current_time;
        liquidation_process.keeper_c_reward = liquidation_process.swap_reward;
        liquidation_process.principal_returned = principal_return;
        liquidation_process.growth_fund = growth_fund;
        liquidation_process.revenue_share = revenue_share;

        // Update System
        system_config.total_borrowed = system_config
            .total_borrowed
            .saturating_sub(principal_return);

        msg!("✅ Step 3 Complete! Liquidation Finalized");
        msg!(
            "💸 Principal: {}, Keeper C: {}, Growth: {}, Revenue: {}",
            principal_return,
            liquidation_process.swap_reward,
            growth_fund,
            revenue_share
        );
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 7️⃣ TIMEOUT RECOVERY
    // ═════════════════════════════════════════════════════════════
    pub fn claim_expired_swap(ctx: Context<ClaimExpiredSwap>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            liquidation_process.status == LiquidationStatus::Triggered as u8,
            GinvaError::InvalidLiquidationStatus
        );
        require!(
            current_time > liquidation_process.deadline_for_swap,
            GinvaError::TimeoutNotReached
        );
        require!(!liquidation_process.swapped, GinvaError::AlreadySwapped);

        // Reset deadline to allow new caller
        liquidation_process.deadline_for_swap = current_time + LIQUIDATION_TIMEOUT;

        msg!("⚠️ Swap timeout extended! Anyone can now execute auto-swap");
        Ok(())
    }

    pub fn claim_expired_distribution(ctx: Context<ClaimExpiredDistribution>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            liquidation_process.status == LiquidationStatus::Swapped as u8,
            GinvaError::InvalidLiquidationStatus
        );
        require!(
            current_time > liquidation_process.deadline_for_distribution,
            GinvaError::TimeoutNotReached
        );

        liquidation_process.distribute_keeper = Pubkey::default();
        liquidation_process.deadline_for_distribution = current_time + LIQUIDATION_TIMEOUT;

        msg!("⚠️ Distribution timeout! New keeper can now take over");
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 8️⃣ REPAY LOAN
    // ═════════════════════════════════════════════════════════════
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;

        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        // 1. Calculate interest
        let current_time = Clock::get()?.unix_timestamp;
        let time_elapsed = (current_time - loan_account.borrow_at) as u64;
        let seconds_per_year: u64 = 31_536_000;

        let interest = loan_account
            .loan_amount
            .saturating_mul(loan_account.interest_rate_bps as u64)
            .saturating_mul(time_elapsed)
            .checked_div(10000)
            .unwrap_or(0)
            .checked_div(seconds_per_year)
            .unwrap_or(0);

        let total_repayment = loan_account.loan_amount.saturating_add(interest);
        loan_account.total_interest_paid = interest;

        // 2. User pays USDC (Principal + Interest) -> Capital Wallet
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts_pay = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.capital_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx_pay = CpiContext::new(cpi_program.clone(), cpi_accounts_pay);
        token::transfer(cpi_ctx_pay, total_repayment)?;

        // 2. Vault returns Collateral -> User (PDA Signer)
        let bump = ctx.bumps.vault_authority;
        let seeds = &[b"vault_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts_return = Transfer {
            from: ctx.accounts.vault_collateral_account.to_account_info(),
            to: ctx.accounts.user_collateral_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx_return = CpiContext::new_with_signer(cpi_program, cpi_accounts_return, signer);
        token::transfer(cpi_ctx_return, loan_account.collateral_amount)?;

        // Get values before resetting
        let principal = loan_account.loan_amount;
        let collateral = loan_account.collateral_amount;

        // Update State
        loan_account.status = LoanStatus::Repaid as u8;
        loan_account.repaid_at = current_time;
        loan_account.loan_amount = 0;
        loan_account.collateral_amount = 0;

        system_config.total_borrowed = system_config.total_borrowed.saturating_sub(principal);
        system_config.total_collateral = system_config.total_collateral.saturating_sub(collateral);

        msg!(
            "✅ Loan Repaid: Principal {} + Interest {}",
            principal,
            interest
        );
        msg!("💰 Total Paid: {}", total_repayment);
        Ok(())
    }
}

// ═════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════

fn get_pyth_price_with_exponent(
    price_update: &Account<PriceUpdateV2>,
    feed_id: &[u8; 32],
) -> Result<(u64, i32)> {
    let clock = Clock::get()?;

    // Get price no older than 60 seconds
    let price = price_update
        .get_price_no_older_than(&clock, MAX_PRICE_AGE_SECONDS, feed_id)
        .map_err(|_| GinvaError::PythPriceUnavailable)?;

    let price_u64 = price.price.unsigned_abs();
    let exponent = price.exponent;

    Ok((price_u64, exponent))
}

fn calculate_collateral_value(
    collateral_amount: u64,
    price: u64,
    price_exponent: i32,
    collateral_decimals: u8,
    target_decimals: u8,
) -> Result<u64> {
    // Formula: value = amount * price / 10^(collateral_decimals + price_exponent - target_decimals)
    let total_decimals = collateral_decimals as i32 + price_exponent - target_decimals as i32;

    let amount_u128 = collateral_amount as u128;
    let price_u128 = price as u128;

    let value = if total_decimals >= 0 {
        let divisor = 10u128.pow(total_decimals as u32);
        amount_u128
            .saturating_mul(price_u128)
            .checked_div(divisor)
            .unwrap_or(0)
    } else {
        let multiplier = 10u128.pow((-total_decimals) as u32);
        amount_u128
            .saturating_mul(price_u128)
            .saturating_mul(multiplier)
    };

    Ok(value as u64)
}

// ═════════════════════════════════════════════════════════════
// 📋 ENUMS
// ═════════════════════════════════════════════════════════════

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum LoanStatus {
    Active = 1,
    Overdue = 2,
    Default = 3,
    Liquidated = 4,
    Repaid = 5,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum LiquidationStatus {
    Triggered = 1,
    Swapped = 2,
    Finalized = 3,
    Expired = 4,
}

// ═════════════════════════════════════════════════════════════
// 📋 ACCOUNT STRUCTURES
// ═════════════════════════════════════════════════════════════

#[account]
#[derive(Default)]
pub struct SystemConfig {
    pub admin: Pubkey,
    pub capital_wallet_authority: Pubkey,
    pub vault_wallet_authority: Pubkey,
    pub revenue_wallet_authority: Pubkey,
    pub seized_assets_authority: Pubkey,
    pub collateral_mint: Pubkey,
    pub loan_mint: Pubkey,
    pub deposit_fee_bps: u16,
    pub is_active: bool,
    pub total_borrowed: u64,
    pub total_collateral: u64,
}

#[account]
#[derive(Default)]
pub struct LoanAccount {
    pub borrower: Pubkey,
    pub collateral_amount: u64,
    pub collateral_mint: Pubkey,
    pub loan_amount: u64,
    pub ltv_option: u8,
    pub duration_days: u16,
    pub interest_rate_bps: u16,
    pub status: u8,
    pub created_at: i64,
    pub borrow_at: i64,
    pub maturity_at: i64,
    pub last_payment_at: i64,
    pub total_interest_paid: u64,
    pub liquidated_at: i64,
    pub repaid_at: i64,
    pub keeper_address: Pubkey,
}

#[account]
#[derive(Default)]
pub struct LiquidationProcess {
    pub loan_account: Pubkey,
    pub status: u8,
    pub trigger_keeper: Pubkey,
    pub swap_executor: Pubkey, // NEW: Who executed the auto-swap
    pub distribute_keeper: Pubkey,
    pub seized_collateral_amount: u64,
    pub usdc_received: u64,
    pub swap_reward: u64, // Reward for auto-swap executor
    pub triggered_at: i64,
    pub deadline_for_swap: i64,
    pub deadline_for_distribution: i64,
    pub swapped: bool, // NEW: Track if swap completed
    pub finalized_at: i64,
    // Distribution tracking
    pub keeper_c_reward: u64,
    pub principal_returned: u64,
    pub growth_fund: u64,
    pub revenue_share: u64,
}

// ═════════════════════════════════════════════════════════════
// 🧩 CONTEXT STRUCTURES
// ═════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitializeSystem<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + size_of::<SystemConfig>(),
        seeds = [b"config"],
        bump
    )]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,
    /// CHECK: PDA derived from [b"vault_auth"]
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_wallet_authority: AccountInfo<'info>,
    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,
    /// CHECK: PDA derived from [b"seized_auth"]
    #[account(seeds = [b"seized_auth"], bump)]
    pub seized_assets_authority: AccountInfo<'info>,

    pub collateral_mint: Account<'info, Mint>,
    pub loan_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<LoanAccount>(),
        seeds = [b"loan", user.key().as_ref()],
        bump
    )]
    pub loan_account: Account<'info, LoanAccount>,

    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, token::authority = system_config.vault_wallet_authority)]
    pub vault_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BorrowUsdc<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"loan", user.key().as_ref()], bump)]
    pub loan_account: Account<'info, LoanAccount>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,
    #[account(mut, token::authority = capital_wallet_authority)]
    pub capital_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    pub pyth_price_feed: Account<'info, PriceUpdateV2>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TriggerLiquidation<'info> {
    #[account(mut)]
    pub keeper_a: Signer<'info>,
    #[account(mut)]
    pub loan_account: Box<Account<'info, LoanAccount>>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,

    #[account(
        init,
        payer = keeper_a,
        space = 8 + size_of::<LiquidationProcess>(),
        seeds = [b"liquidation", loan_account.key().as_ref()],
        bump
    )]
    pub liquidation_process: Box<Account<'info, LiquidationProcess>>,

    /// CHECK: PDA derived from [b"vault_auth"]
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: AccountInfo<'info>,
    #[account(mut, token::authority = vault_authority)]
    pub vault_collateral_account: Box<Account<'info, TokenAccount>>,

    // Mint account for seized vault initialization
    #[account(address = system_config.collateral_mint)]
    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = keeper_a,
        token::mint = collateral_mint,
        token::authority = seized_assets_authority,
        seeds = [b"seized_vault", loan_account.key().as_ref()],
        bump
    )]
    pub seized_assets_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: PDA derived from [b"seized_auth"]
    #[account(seeds = [b"seized_auth"], bump)]
    pub seized_assets_authority: AccountInfo<'info>,

    #[account(mut)]
    pub keeper_a_collateral_account: Box<Account<'info, TokenAccount>>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecuteAutoSwap<'info> {
    #[account(mut)]
    pub caller: Signer<'info>, // Anyone can call this
    #[account(mut)]
    pub liquidation_process: Box<Account<'info, LiquidationProcess>>,
    #[account(seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,

    /// CHECK: PDA derived from [b"seized_auth"]
    #[account(seeds = [b"seized_auth"], bump)]
    pub seized_assets_authority: AccountInfo<'info>,
    #[account(mut, token::authority = seized_assets_authority)]
    pub seized_assets_vault: Box<Account<'info, TokenAccount>>,

    // Mint account for processing vault initialization
    #[account(address = system_config.loan_mint)]
    pub loan_mint: Box<Account<'info, Mint>>,

    // Processing Vault (where USDC will be sent after swap)
    #[account(
        init_if_needed,
        payer = caller,
        token::mint = loan_mint,
        token::authority = processing_vault_authority,
        seeds = [b"processing_vault", liquidation_process.key().as_ref()],
        bump
    )]
    pub processing_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: PDA derived from [b"processing_auth"]
    #[account(seeds = [b"processing_auth"], bump)]
    pub processing_vault_authority: AccountInfo<'info>,

    // 1. Caller pays USDC from this account
    #[account(mut)]
    pub caller_usdc_account: Box<Account<'info, TokenAccount>>,

    // 2. Caller receives SOL (collateral) into this account
    #[account(mut)]
    pub caller_collateral_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Jupiter Program for CPI (optional - depends on implementation)
    pub jupiter_program: AccountInfo<'info>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FinalizeLiquidation<'info> {
    #[account(mut)]
    pub keeper_c: Signer<'info>,
    #[account(mut)]
    pub liquidation_process: Account<'info, LiquidationProcess>,
    #[account(mut)]
    pub loan_account: Account<'info, LoanAccount>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"processing_auth"]
    #[account(seeds = [b"processing_auth"], bump)]
    pub processing_vault_authority: AccountInfo<'info>,
    #[account(mut, token::authority = processing_vault_authority)]
    pub processing_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub capital_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub keeper_c_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimExpiredSwap<'info> {
    #[account(mut)]
    pub liquidation_process: Account<'info, LiquidationProcess>,
}

#[derive(Accounts)]
pub struct ClaimExpiredDistribution<'info> {
    #[account(mut)]
    pub liquidation_process: Account<'info, LiquidationProcess>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"loan", user.key().as_ref()], bump)]
    pub loan_account: Account<'info, LoanAccount>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"vault_auth"]
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: AccountInfo<'info>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub capital_wallet: Account<'info, TokenAccount>,

    #[account(mut, token::authority = vault_authority)]
    pub vault_collateral_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ═════════════════════════════════════════════════════════════
// 🚨 ERROR CODES
// ═════════════════════════════════════════════════════════════

#[error_code]
pub enum GinvaError {
    #[msg("Invalid loan amount")]
    InvalidAmount,
    #[msg("Account already in use")]
    AccountAlreadyInUse,
    #[msg("Invalid LTV option")]
    InvalidLTV,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Loan is not active")]
    LoanNotActive,
    #[msg("Conditions not met for liquidation")]
    NotYetLiquidatable,
    #[msg("Pyth Oracle Error")]
    PythError,
    #[msg("Price unavailable")]
    PythPriceUnavailable,
    #[msg("Invalid liquidation status")]
    InvalidLiquidationStatus,
    #[msg("Swap timeout not yet reached (need 24h)")]
    SwapTimeoutNotReached,
    #[msg("Already swapped")]
    AlreadySwapped,
    #[msg("Distribution timeout reached")]
    DistributionTimeout,
    #[msg("Timeout not yet reached")]
    TimeoutNotReached,
    #[msg("Same keeper cannot perform multiple steps")]
    SameKeeperNotAllowed,
    #[msg("Insufficient funds to return principal")]
    InsufficientFundsForPrincipal,
}
