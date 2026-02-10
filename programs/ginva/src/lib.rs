use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use std::mem::size_of;

// ═══════════════════════════════════════════════════════════
// 🛡️ SECURITY CONSTANTS & VALIDATIONS
// ═══════════════════════════════════════════════════════════════════

// Rate limiting constants
pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500; // 5% max price change
pub const MIN_TIME_BETWEEN_OPERATIONS: i64 = 1; // 1 second between user ops

// Flash loan protection
pub const MIN_HOLD_TIME: i64 = 2; // 2 seconds minimum hold (kept for backward compatibility)
pub const MIN_HOLD_BLOCKS: u64 = 10; // 🛡️ FIX: Block-based protection (~4 seconds on Solana)
pub const MAX_RENT_OPS: u64 = 10; // Max rent operations per day

// Reentrancy protection
pub const REENTRANCY_GUARD_ACTIVE: u8 = 1;
pub const REENTRANCY_GUARD_INACTIVE: u8 = 0;

// Program ID - matches Anchor.toml devnet deployment
declare_id!("8ScUJa35gUNrdxhaJH6QdUjquzDt8tW5oEUe6kjpDuHK");

// ═════════════════════════════════════════════════════════════
// CONSTANTS

// Pyth SOL/USD Price Feed ID (from https://pyth.network/developers/price-feed-ids)
pub const SOL_USD_FEED_ID: &str =
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 60; // Maximum age of price data in seconds
pub const MAX_CONFIDENCE_RATIO: u128 = 100; // 1% max confidence ratio (100/10000 = 1%)
                                            // ═════════════════════════════════════════════════════════════
                                            // Note: LIQUIDATION_TIMEOUT, AUTO_SWAP_REWARD_BPS, DISTRIBUTE_REWARD_BPS
                                            // are now stored in ProtocolConfig for dynamic updates
                                            // Keeping LIQUIDATION_TIMEOUT constant for TriggerLiquidation to avoid stack overflow
                                            // Liquidation timeout configuration
                                            // Use feature flag to automatically switch between devnet (2s) and production (24h)
#[cfg(feature = "devnet")]
const LIQUIDATION_TIMEOUT: i64 = 2; // 2 seconds for fast testing

#[cfg(not(feature = "devnet"))]
#[allow(dead_code)]
const LIQUIDATION_TIMEOUT: i64 = 86400; // 24 hours for production safety

// Jupiter Program ID (for CPI calls)
// Use feature flag for devnet vs mainnet
#[cfg(feature = "devnet")]
const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP4Fb2cqiRUcaTHdrCEQSpBxWZ4fc4QLvtY41vPU5zY"); // Devnet Jupiter

#[cfg(not(feature = "devnet"))]
#[allow(dead_code)]
const JUPITER_PROGRAM_ID: Pubkey = pubkey!("JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"); // Mainnet Jupiter

// 🛡️ SECURITY: Compile-time check to prevent local-test on mainnet
#[cfg(all(feature = "local-test", not(feature = "devnet")))]
compile_error!("local-test feature must be used with devnet feature");

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

        // Initialize ops wallet
        system_config.ops_wallet = ctx.accounts.ops_wallet.key();

        // Initialize staking fields
        system_config.total_staked = 0;
        system_config.acc_reward_per_share = 0;

        // Initialize emergency pause fields
        system_config.is_paused = false;
        system_config.paused_at = 0;
        system_config.pause_reason = [0u8; 50];
        system_config.ops_resume_at = 0;

        // Initialize price tracking fields
        system_config.last_oracle_price = 0;
        system_config.last_price_update = 0;

        // 🛡️ SHIELD FEE: Initialize bootstrapping protection parameters
        system_config.target_reserves = 500_000_000_000; // 500,000 USDC (6 decimals)
        system_config.protection_period = 15 * 24 * 60 * 60; // 15 days in seconds
        system_config.exit_fee_bps = 500; // 5% exit fee (500 basis points)
        system_config.reserve_wallet = ctx.accounts.reserve_wallet.key();

        // Initialize Protocol Config
        let protocol_config = &mut ctx.accounts.protocol_config;
        protocol_config.admin = ctx.accounts.admin.key();
        protocol_config.liquidation_timeout = 2; // Devnet: 2 seconds (Prod: 86400)
        protocol_config.auto_swap_reward_bps = 800; // 8% discount for storefront buyers
        protocol_config.distribute_reward_bps = 100; // 1% base rate (will be overridden by fixed 1.0 USDC)
        protocol_config.min_loan_size = 1_000_000; // 1 USDC (6 decimals)
        protocol_config.max_loan_size = 1_000_000_000_000; // 1M USDC (6 decimals)

        // 🛡️ SAFETY NOTE: แจ้งเตือนสถานะ Test Mode เท่านั้น (ไม่สั่งตายระบบ)
        #[cfg(feature = "local-test")]
        msg!("⚠️ Note: Contract running in Local-Test Mode (Oracle checks disabled)");

        msg!("✅ System initialized with Auto-Swap Liquidation v3.0");
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════════════
    // 🛑 EMERGENCY CONTROLS
    // ═════════════════════════════════════════════════════════════════════

    pub fn emergency_pause(ctx: Context<AdminOnly>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        require!(!system_config.is_paused, GinvaError::AlreadyPaused);

        system_config.is_paused = true;
        system_config.paused_at = Clock::get()?.unix_timestamp;

        msg!("🛑 PROTOCOL EMERGENCY PAUSE ACTIVATED");
        msg!("All transactions blocked until admin resumes");

        // Emit event for monitoring
        emit!(EmergencyPause {
            admin: ctx.accounts.admin.key(),
            timestamp: system_config.paused_at,
        });

        Ok(())
    }

    pub fn emergency_resume(ctx: Context<AdminOnly>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        require!(system_config.is_paused, GinvaError::NotPaused);

        // 1. Unlock status (but operations still locked until timelock expires)
        system_config.is_paused = false;

        // 2. Set timelock: 48 hours (172800 sec) - Use 60 sec for devnet testing
        let timelock_seconds = 172800;
        let current_time = Clock::get()?.unix_timestamp;
        system_config.ops_resume_at = current_time + timelock_seconds;

        let paused_duration = Clock::get()?.unix_timestamp - system_config.paused_at;
        msg!("✅ PROTOCOL RESUME INITIATED");
        msg!("Paused for: {} seconds", paused_duration);
        msg!(
            "Operations unlock at timestamp: {}",
            system_config.ops_resume_at
        );
        msg!("Timelock: 48 hours");

        // Emit event for monitoring
        emit!(EmergencyResume {
            admin: ctx.accounts.admin.key(),
            resume_at: system_config.ops_resume_at,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // ⚙️ ADMIN CONFIG UPDATES (Dynamic Parameters)
    // ═════════════════════════════════════════════════════════════
    pub fn update_protocol_config(
        ctx: Context<UpdateProtocolConfig>,
        new_timeout: Option<i64>,
        new_swap_reward_bps: Option<u64>,
        new_distribute_reward_bps: Option<u64>,
        new_min_loan: Option<u64>,
        new_max_loan: Option<u64>,
    ) -> Result<()> {
        let protocol_config = &mut ctx.accounts.protocol_config;

        // Update Liquidation Timeout
        if let Some(timeout) = new_timeout {
            require!(timeout > 0, GinvaError::InvalidAmount);
            protocol_config.liquidation_timeout = timeout;
            msg!("✅ Liquidation timeout updated to {} seconds", timeout);
        }

        // Update Swap Reward (e.g. 600 = 6%)
        if let Some(reward) = new_swap_reward_bps {
            require!(reward < 10000, GinvaError::InvalidAmount);
            protocol_config.auto_swap_reward_bps = reward;
            msg!("✅ Swap reward updated to {}%", reward / 100);
        }

        // Update Distribute Reward (e.g. 100 = 1%)
        if let Some(reward) = new_distribute_reward_bps {
            require!(reward < 10000, GinvaError::InvalidAmount);
            protocol_config.distribute_reward_bps = reward;
            msg!("✅ Distribute reward updated to {}%", reward / 100);
        }

        // Update Loan Limits
        if let Some(min_loan) = new_min_loan {
            protocol_config.min_loan_size = min_loan;
            msg!("✅ Min loan size updated to {} units", min_loan);
        }
        if let Some(max_loan) = new_max_loan {
            protocol_config.max_loan_size = max_loan;
            msg!("✅ Max loan size updated to {} units", max_loan);
        }

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 💎 FEATURE #6: MULTI-ASSET MANAGEMENT
    // ═════════════════════════════════════════════════════════════

    pub fn add_supported_asset(
        ctx: Context<AddSupportedAsset>,
        feed_id_hex: String,
        max_ltv: u64,
        liquidation_threshold: u64,
    ) -> Result<()> {
        let asset_config = &mut ctx.accounts.asset_config;

        let feed_id = get_feed_id_from_hex(&feed_id_hex).map_err(|_| GinvaError::InvalidFeedId)?;

        asset_config.mint = ctx.accounts.asset_mint.key();
        asset_config.feed_id = feed_id;
        asset_config.decimals = ctx.accounts.asset_mint.decimals;
        asset_config.max_ltv = max_ltv;
        asset_config.liquidation_threshold = liquidation_threshold;
        asset_config.is_active = true;
        asset_config.created_at = Clock::get()?.unix_timestamp;

        msg!("✅ Asset Added: {:?}", asset_config.mint);
        Ok(())
    }

    pub fn update_asset_config(
        ctx: Context<UpdateAssetConfig>,
        is_active: Option<bool>,
        max_ltv: Option<u64>,
        liquidation_threshold: Option<u64>,
        new_feed_id_hex: Option<String>,
    ) -> Result<()> {
        let asset_config = &mut ctx.accounts.asset_config;

        if let Some(active) = is_active {
            asset_config.is_active = active;
            msg!("🔄 Asset Active Status: {}", active);
        }
        if let Some(ltv) = max_ltv {
            asset_config.max_ltv = ltv;
        }
        if let Some(liq) = liquidation_threshold {
            asset_config.liquidation_threshold = liq;
        }
        if let Some(hex) = new_feed_id_hex {
            let feed_id = get_feed_id_from_hex(&hex).map_err(|_| GinvaError::InvalidFeedId)?;
            asset_config.feed_id = feed_id;
        }

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 1️⃣7️⃣ UPDATE OPS WALLET (สำหรับค่าใช้จ่ายทีม ค่าเซิร์ฟเวอร์)
    // ═════════════════════════════════════════════════════════════
    pub fn update_ops_wallet(ctx: Context<UpdateOpsWallet>, new_ops_wallet: Pubkey) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        // บันทึก ops wallet เก่า
        let old_wallet = system_config.ops_wallet;

        // อัปเดตเป็น wallet ใหม่
        system_config.ops_wallet = new_ops_wallet;

        msg!("✅ Ops Wallet updated:");
        msg!("   Old: {:?}", old_wallet);
        msg!("   New: {:?}", new_ops_wallet);
        msg!("   Purpose: Team salaries, server costs, marketing, etc.");

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 2️⃣ DEPOSIT COLLATERAL
    // ═════════════════════════════════════════════════════════════
    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        loan_id: u32,
        amount: u64,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        let loan_account = &mut ctx.accounts.loan_account;
        let asset_config = &ctx.accounts.asset_config;
        let user = ctx.accounts.user.key();
        let clock = Clock::get()?;

        require!(amount > 0, GinvaError::InvalidAmount);

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            clock.unix_timestamp >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );
        require!(asset_config.is_active, GinvaError::AssetNotActive);

        // 🛡️ RATE LIMITING: Check user operation limits
        let current_slot = clock.slot;
        check_rate_limit(&mut ctx.accounts.user_rate_limit, current_slot, user)?;

        // ✅ Multi-Ticket: Initialize new loan account with loan_id
        loan_account.borrower = user;
        loan_account.loan_id = loan_id;
        loan_account.collateral_mint = asset_config.mint;
        loan_account.created_at = clock.unix_timestamp;
        loan_account.deposit_slot = clock.slot; // 🛡️ FIX: Block-based flash loan protection

        // Increment ticket counter for next loan
        ctx.accounts.user_rate_limit.ticket_counter = ctx
            .accounts
            .user_rate_limit
            .ticket_counter
            .saturating_add(1);

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
        loan_account.last_payment_at = clock.unix_timestamp;
        system_config.total_collateral = system_config.total_collateral.saturating_add(amount);

        msg!(
            "✅ Collateral deposited: {} of {:?}",
            amount,
            asset_config.mint
        );
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 3️⃣ BORROW USDC
    // ═════════════════════════════════════════════════════════════
    pub fn borrow_usdc(
        ctx: Context<BorrowUsdc>,
        loan_id: u32,
        ltv_option: u8,
        duration_days: u16,
    ) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let asset_config = &ctx.accounts.asset_config;
        let clock = Clock::get()?;

        // ✅ Multi-Ticket: Verify loan_id matches
        require!(loan_account.loan_id == loan_id, GinvaError::InvalidLoanId);

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            clock.unix_timestamp >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 🛡️ RATE LIMITING: Check user operation limits
        let current_slot = clock.slot;
        check_rate_limit(
            &mut ctx.accounts.user_rate_limit,
            current_slot,
            ctx.accounts.user.key(),
        )?;

        // 🛡️ FLASH LOAN PROTECTION: Ensure collateral has been held for minimum blocks
        check_flash_loan_protection(loan_account.deposit_slot, clock.slot)?;

        require!(asset_config.is_active, GinvaError::AssetNotActive);
        require!(
            loan_account.collateral_mint == asset_config.mint,
            GinvaError::InvalidAssetMint
        );
        // 🎫 Multi-Ticket: Verify user owns this ticket
        require!(
            loan_account.borrower == ctx.accounts.user.key(),
            GinvaError::Unauthorized
        );

        let (current_price, price_exponent) = get_pyth_price_with_exponent_and_validation(
            &ctx.accounts.pyth_price_feed,
            &asset_config.feed_id,
            system_config,
        )?;

        let collateral_value_usdc = calculate_collateral_value(
            loan_account.collateral_amount,
            current_price,
            price_exponent,
            asset_config.decimals,
            6,
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

        // Validate min/max loan size using protocol config
        let protocol_config = &ctx.accounts.protocol_config;
        require!(
            loan_amount >= protocol_config.min_loan_size,
            GinvaError::LoanTooSmall
        );
        require!(
            loan_amount <= protocol_config.max_loan_size,
            GinvaError::LoanTooLarge
        );

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
        let current_time = clock.unix_timestamp;
        loan_account.loan_amount = loan_account.loan_amount.saturating_add(loan_amount);
        loan_account.ltv_option = ltv_option;
        loan_account.duration_days = duration_days;
        loan_account.borrow_at = current_time;
        loan_account.maturity_at = current_time + (duration_days as i64 * 86400);

        // Calculate dynamic interest rate based on utilization
        let current_liquidity = ctx.accounts.capital_wallet.amount;
        let total_supply = system_config
            .total_borrowed
            .saturating_add(current_liquidity);
        let utilization_bps = if total_supply > 0 {
            (system_config.total_borrowed as u128)
                .checked_mul(10000)
                .unwrap()
                .checked_div(total_supply as u128)
                .unwrap_or(0) as u64
        } else {
            0
        };
        let dynamic_rate =
            calculate_dynamic_interest(system_config.total_borrowed, current_liquidity);
        loan_account.interest_rate_bps = dynamic_rate;

        system_config.total_borrowed = system_config.total_borrowed.saturating_add(loan_amount);

        msg!(
            "💰 Loan created: {} USDC at {}% APR (Utilization: {}%)",
            loan_amount,
            dynamic_rate as f64 / 100.0,
            utilization_bps as f64 / 100.0
        );

        // Emit event for indexing
        emit!(LoanCreated {
            borrower: ctx.accounts.user.key(),
            loan_id,
            collateral_amount: loan_account.collateral_amount,
            loan_amount,
            interest_rate_bps: dynamic_rate,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 3.5 🔄 EXTEND LOAN ("ต่อดอก")
    // ═════════════════════════════════════════════════════════════
    pub fn extend_loan(ctx: Context<ExtendLoan>) -> Result<()> {
        let system_config = &ctx.accounts.system_config;
        let loan_account = &mut ctx.accounts.loan_account;

        // 🛡️ SECURITY GUARD: ตรวจสอบสถานะระบบ
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        // ตรวจสอบว่าเป็นเจ้าของสัญญาตัวจริง
        require!(
            loan_account.borrower == ctx.accounts.user.key(),
            GinvaError::Unauthorized
        );
        // ต้องเป็นสัญญาที่ยัง Active อยู่ (ยังไม่ถูกยึด)
        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        let current_time = Clock::get()?.unix_timestamp;

        // 1. คำนวณดอกเบี้ยที่ค้างจ่าย (Accrued Interest) ตั้งแต่จ่ายล่าสุด จนถึง ปัจจุบัน
        // สูตร: (เงินต้น * ดอกเบี้ย% * ระยะเวลา) / (1 ปี * 10000 bps)
        let time_elapsed = current_time.saturating_sub(loan_account.last_payment_at);
        require!(time_elapsed > 0, GinvaError::NoInterestDue);

        let interest_amount = (loan_account.loan_amount as u128)
            .checked_mul(loan_account.interest_rate_bps as u128)
            .unwrap()
            .checked_mul(time_elapsed as u128)
            .unwrap()
            .checked_div(31_536_000 * 10000)
            .unwrap(); // 365 days in seconds * bps scale

        let interest_payment = interest_amount as u64;

        // ถ้ามีดอกเบี้ยเล็กน้อย ให้ปัดเป็นอย่างน้อย 1 หน่วย เพื่อไม่ให้ transaction fail ฟรี
        let final_payment = if interest_payment == 0 && time_elapsed > 3600 {
            1 // ขั้นต่ำ 1 unit ถ้าผ่านไปเกิน 1 ชม.
        } else {
            interest_payment
        };

        require!(final_payment > 0, GinvaError::NoInterestDue);

        // 2. โอนเงินค่าดอกเบี้ย: User -> Revenue Wallet (รายได้เข้าระบบ)
        // หมายเหตุ: เงินนี้คือ Real Yield ที่เอาไปแจกจ่ายได้เลย ไม่ต้องเก็บเข้า Vault
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.revenue_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, final_payment)?;

        // 3. อัปเดตสัญญา (รีเซ็ตเวลา)
        // เลื่อนวันครบกำหนด (Maturity) ไปข้างหน้า เท่ากับระยะเวลาสัญญาเดิม (Duration)
        // เสมือนการ "ฉีกตั๋วเก่า ออกตั๋วใหม่" เริ่มนับหนึ่งใหม่ตั้งแต่วันนี้
        loan_account.last_payment_at = current_time;
        loan_account.maturity_at = current_time + (loan_account.duration_days as i64 * 86400);

        msg!("✅ ต่อดอกสำเร็จ: จ่ายดอกเบี้ย {} USDC", final_payment);
        msg!("📅 ครบกำหนดรอบใหม่: {}", loan_account.maturity_at);

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 4️⃣ STEP 1: TRIGGER LIQUIDATION (Keeper A - 0.6% Reward)
    // OPTIMIZED: Split into two transactions to avoid stack overflow
    // ═════════════════════════════════════════════════════════════
    pub fn trigger_liquidation(ctx: Context<TriggerLiquidation>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let keeper_a = ctx.accounts.keeper_a.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            current_time >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 🛡️ REENTRANCY GUARD: Prevent reentrancy attacks
        require!(
            liquidation_process.status == 0, // Only allow if not initialized
            GinvaError::ReentrancyDetected
        );

        // 1. Check Health Factor
        let asset_config = &ctx.accounts.asset_config;
        let (current_price, price_exponent) = get_pyth_price_with_exponent_and_validation(
            &ctx.accounts.pyth_price_feed,
            &asset_config.feed_id,
            system_config,
        )?;
        let collateral_value = calculate_collateral_value(
            loan_account.collateral_amount,
            current_price,
            price_exponent,
            asset_config.decimals,
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

        // 2. Calculate Split (0.6% reward + 99.4% for swap)
        let trigger_reward = loan_account
            .collateral_amount
            .saturating_mul(60) // 0.6% reward
            .checked_div(10000)
            .unwrap_or(0);
        let remaining_for_swap = loan_account
            .collateral_amount
            .saturating_sub(trigger_reward);

        // 3. Transfer 99% to Seized Assets Vault (waiting for auto-swap)
        let bump = ctx.bumps.vault_authority;
        let seeds = &[b"vault_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

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

        // 4. Initialize Liquidation Process
        liquidation_process.loan_account = loan_account.key();
        liquidation_process.status = LiquidationStatus::Triggered as u8;
        liquidation_process.trigger_keeper = keeper_a;
        liquidation_process.seized_collateral_amount = remaining_for_swap;
        liquidation_process.triggered_at = current_time;
        liquidation_process.deadline_for_swap = current_time; // Storefront opens immediately
        liquidation_process.dex_activation_time = current_time + 21600; // DEX fallback after 6h
        liquidation_process.swapped = false;
        liquidation_process.keeper_reward_amount = trigger_reward;
        liquidation_process.keeper_reward_claimed = false;

        // Update Loan
        // 🛡️ FIX: Use intermediate state, only mark as Liquidated after finalize succeeds
        loan_account.status = LoanStatus::LiquidationInProgress as u8;
        loan_account.liquidated_at = current_time;
        loan_account.keeper_address = keeper_a;
        let total_collateral_to_subtract = loan_account.collateral_amount;
        loan_account.collateral_amount = 0;

        // Update System
        system_config.total_collateral = system_config
            .total_collateral
            .saturating_sub(total_collateral_to_subtract);

        msg!(
            "🔨 Step 1 Complete! Keeper A can claim: {} SOL (0.6%)",
            trigger_reward
        );
        msg!(
            "🏪 STOREFRONT OPEN! {} SOL available immediately with 6% discount",
            remaining_for_swap
        );
        msg!(
            "🦄 DEX fallback available in 6 hours (at timestamp: {})",
            liquidation_process.dex_activation_time
        );

        // Emit event for indexing
        emit!(LiquidationTriggered {
            loan_account: loan_account.key(),
            keeper: keeper_a,
            collateral_amount: remaining_for_swap,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 4️⃣ STEP 1B: CLAIM TRIGGER REWARD (Keeper A)
    // SEPARATE FUNCTION: Avoids stack overflow in trigger_liquidation
    // ═════════════════════════════════════════════════════════════
    pub fn claim_trigger_reward(ctx: Context<ClaimTriggerReward>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let keeper_a = ctx.accounts.keeper_a.key();

        // Verify caller is the trigger keeper
        require!(
            liquidation_process.trigger_keeper == keeper_a,
            GinvaError::Unauthorized
        );

        // Verify reward hasn't been claimed yet
        require!(
            liquidation_process.keeper_reward_amount > 0,
            GinvaError::AlreadyCompleted
        );

        require!(
            !liquidation_process.keeper_reward_claimed,
            GinvaError::AlreadyCompleted
        );

        let reward_amount = liquidation_process.keeper_reward_amount;

        // Transfer reward to Keeper A
        let bump = ctx.bumps.vault_authority;
        let seeds = &[b"vault_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_collateral_account.to_account_info(),
            to: ctx.accounts.keeper_a_collateral_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, reward_amount)?;

        // Mark reward as claimed
        liquidation_process.keeper_reward_claimed = true;

        msg!("✅ Keeper A claimed reward: {} SOL", reward_amount);
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 🏪 GINVA PAWN SHOP (Time-Decay Pricing / Dutch Auction)
    // ═════════════════════════════════════════════════════════════
    // Atomic swap: Caller pays USDC -> receives collateral
    // Pricing Rule:
    // 0-10  mins: 8% Discount (Golden Hour)
    // 10-30 mins: 6% Discount (Silver Tier)
    // 30-60 mins: 3% Discount (Bronze Tier)
    // > 60  mins: 0% Discount (Market Price)

    pub fn buy_from_storefront(ctx: Context<ExecuteAutoSwap>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let system_config = &mut ctx.accounts.system_config;
        let caller = ctx.accounts.caller.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            current_time >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 1. Validation Checks
        require!(!liquidation_process.swapped, GinvaError::AlreadySwapped);
        require!(
            liquidation_process.status == LiquidationStatus::Triggered as u8,
            GinvaError::InvalidLiquidationStatus
        );

        let seized_amount = liquidation_process.seized_collateral_amount;
        require!(seized_amount > 0, GinvaError::InvalidAmount);

        // 2. Calculate Fair Value via Pyth
        let asset_config = &ctx.accounts.asset_config;
        require!(asset_config.is_active, GinvaError::AssetNotActive);

        let (current_price, price_exponent) = get_pyth_price_with_exponent_and_validation(
            &ctx.accounts.pyth_price_feed,
            &asset_config.feed_id,
            system_config,
        )?;

        let gross_usdc_value = calculate_collateral_value(
            seized_amount,
            current_price,
            price_exponent,
            asset_config.decimals,
            6, // USDC decimals
        )?;

        // ═════════════════════════════════════════════════════════════
        // 📉 TIME-DECAY PRICING ENGINE (THE GREED ENGINE)
        // ═════════════════════════════════════════════════════════════

        // คำนวณเวลาที่ผ่านไปตั้งแต่ Trigger (หน่วย: วินาที)
        let elapsed_time = current_time.saturating_sub(liquidation_process.triggered_at);

        // กำหนดส่วนลดตามช่วงเวลา (Hardcoded as Law)
        let current_discount_bps = if elapsed_time <= 600 {
            800 // 0-10 นาที: ลด 8% (Golden Hour - รีบกด!)
        } else if elapsed_time <= 1800 {
            600 // 10-30 นาที: ลด 6%
        } else if elapsed_time <= 3600 {
            300 // 30-60 นาที: ลด 3%
        } else {
            0 // เกิน 1 ชม.: ราคาตลาด (No Discount)
        };

        // 3. Calculate Final Price
        let caller_discount = gross_usdc_value
            .saturating_mul(current_discount_bps)
            .checked_div(10000)
            .unwrap_or(0);

        let usdc_required_from_caller = gross_usdc_value.saturating_sub(caller_discount);
        require!(usdc_required_from_caller > 0, GinvaError::InvalidAmount);

        // 4. ACTION A: Pull USDC from Caller -> Processing Vault
        msg!(
            "🔄 Pawn Shop Deal: {} USDC (Discount: {} bps | Time: {}s)",
            usdc_required_from_caller,
            current_discount_bps,
            elapsed_time
        );

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts_pay = Transfer {
            from: ctx.accounts.caller_usdc_account.to_account_info(),
            to: ctx.accounts.processing_vault.to_account_info(),
            authority: ctx.accounts.caller.to_account_info(),
        };
        let cpi_ctx_pay = CpiContext::new(cpi_program.clone(), cpi_accounts_pay);
        token::transfer(cpi_ctx_pay, usdc_required_from_caller)?;

        // 5. ACTION B: Push Seized Collateral -> Caller
        let bump = ctx.bumps.seized_assets_authority;
        let seeds = &[b"seized_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts_send = Transfer {
            from: ctx.accounts.seized_assets_vault.to_account_info(),
            to: ctx.accounts.caller_collateral_account.to_account_info(),
            authority: ctx.accounts.seized_assets_authority.to_account_info(),
        };
        let cpi_ctx_send = CpiContext::new_with_signer(cpi_program, cpi_accounts_send, signer);
        token::transfer(cpi_ctx_send, seized_amount)?;

        // 6. Update State
        liquidation_process.swapped = true;
        liquidation_process.usdc_received = usdc_required_from_caller;
        liquidation_process.swap_executor = caller;
        liquidation_process.swap_reward = caller_discount;
        liquidation_process.status = LiquidationStatus::Swapped as u8;
        liquidation_process.deadline_for_distribution =
            current_time + ctx.accounts.protocol_config.liquidation_timeout;

        msg!(
            "✅ Pawn Shop Sale Complete! Sold {} units via Time-Decay Pricing",
            seized_amount
        );

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 🦄 DEX FALLBACK via Jupiter CPI (ทำงานหลัง 24 ชม.)
    // ═════════════════════════════════════════════════════════════
    // Fallback: Use Jupiter Aggregator for on-chain swap
    // Client must provide route_data and remaining_accounts from Jupiter API
    pub fn execute_dex_fallback(ctx: Context<ExecuteDexFallback>, data: Vec<u8>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let system_config = &mut ctx.accounts.system_config;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // 1️⃣ SECURITY GUARDS
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            current_time >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );
        require!(
            current_time >= liquidation_process.dex_activation_time,
            GinvaError::StorefrontPeriodNotOver
        );
        require!(!liquidation_process.swapped, GinvaError::AlreadySwapped);
        require!(
            liquidation_process.status == LiquidationStatus::Triggered as u8,
            GinvaError::InvalidLiquidationStatus
        );

        let seized_amount = liquidation_process.seized_collateral_amount;
        require!(seized_amount > 0, GinvaError::InvalidAmount);

        // 2️⃣ VALIDATE REMAINING ACCOUNTS
        require!(
            !ctx.remaining_accounts.is_empty(),
            GinvaError::InvalidJupiterRoute
        );

        // 3️⃣ PRE-SWAP BALANCE CHECK
        ctx.accounts.seized_assets_vault.reload()?;
        ctx.accounts.processing_vault.reload()?;

        let initial_collateral_balance = ctx.accounts.seized_assets_vault.amount;
        let initial_usdc_balance = ctx.accounts.processing_vault.amount;

        require!(
            initial_collateral_balance >= seized_amount,
            GinvaError::InsufficientCollateral
        );

        msg!(
            "🦄 Jupiter Swap: Selling {} collateral via DEX...",
            seized_amount
        );

        // 4️⃣ CONSTRUCT JUPITER CPI
        // Convert remaining_accounts to AccountMeta
        let mut accounts: Vec<AccountMeta> = ctx
            .remaining_accounts
            .iter()
            .map(|acc| AccountMeta {
                pubkey: *acc.key,
                is_signer: acc.is_signer,
                is_writable: acc.is_writable,
            })
            .collect();

        // Add our PDA signer (seized_assets_authority) to accounts list
        // This allows Jupiter to transfer from seized_assets_vault
        accounts.push(AccountMeta {
            pubkey: ctx.accounts.seized_assets_authority.key(),
            is_signer: true,
            is_writable: false,
        });

        // Prepare signer seeds
        let bump = ctx.bumps.seized_assets_authority;
        let seeds = &[b"seized_auth".as_ref(), &[bump]];
        let signer_seeds = &[&seeds[..]];

        // Create Jupiter instruction
        let jupiter_instruction = Instruction {
            program_id: ctx.accounts.jupiter_program.key(),
            accounts,
            data,
        };

        // 5️⃣ INVOKE JUPITER
        let account_infos: Vec<AccountInfo> = ctx
            .remaining_accounts
            .iter()
            .map(|acc| acc.to_account_info())
            .collect();

        invoke_signed(&jupiter_instruction, &account_infos, signer_seeds)
            .map_err(|_| GinvaError::JupiterSwapFailed)?;

        // 6️⃣ POST-SWAP VERIFICATION
        ctx.accounts.seized_assets_vault.reload()?;
        ctx.accounts.processing_vault.reload()?;

        let final_collateral_balance = ctx.accounts.seized_assets_vault.amount;
        let final_usdc_balance = ctx.accounts.processing_vault.amount;

        let collateral_spent = initial_collateral_balance.saturating_sub(final_collateral_balance);
        let usdc_received = final_usdc_balance.saturating_sub(initial_usdc_balance);

        // Verify swap actually happened
        require!(collateral_spent > 0, GinvaError::SwapFailed);
        require!(usdc_received > 0, GinvaError::SlippageExceeded);

        // Verify we got reasonable amount (check against oracle price - 15% slippage max)
        let asset_config = &ctx.accounts.asset_config;
        let (oracle_price, price_exponent) = get_pyth_price_with_exponent_and_validation(
            &ctx.accounts.pyth_price_feed,
            &asset_config.feed_id,
            system_config,
        )?;

        let expected_usdc = calculate_collateral_value(
            collateral_spent,
            oracle_price,
            price_exponent,
            asset_config.decimals,
            6,
        )?;

        // Allow 15% slippage for DEX fallback (higher than storefront due to volatility)
        let min_expected_usdc = expected_usdc
            .saturating_mul(85)
            .checked_div(100)
            .unwrap_or(0);
        require!(
            usdc_received >= min_expected_usdc,
            GinvaError::ExcessiveSlippage
        );

        msg!(
            "✅ Jupiter Swap Success! Spent {} collateral -> Received {} USDC (Expected: {})",
            collateral_spent,
            usdc_received,
            expected_usdc
        );

        // 7️⃣ UPDATE STATE
        liquidation_process.swapped = true;
        liquidation_process.usdc_received = usdc_received;
        liquidation_process.swap_executor = ctx.accounts.caller.key();
        liquidation_process.swap_reward = 0; // DEX fallback may have lower/no reward
        liquidation_process.status = LiquidationStatus::Swapped as u8;
        liquidation_process.deadline_for_distribution =
            current_time + ctx.accounts.protocol_config.liquidation_timeout;

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 6️⃣ STEP 3: FINALIZE LIQUIDATION (Revised Allocation)
    // ═════════════════════════════════════════════════════════════
    // NEW LOGIC:
    // - Keeper C gets FIXED 1.0 USDC (or max 10% if dust amount)
    // - Priority: Keeper C gets paid FIRST, then principal return
    // - Profit split 3-way: Capital 10% / Ops 24.75% / Revenue 65.25%
    // - Supports Bad Debt scenarios (no panic if insufficient funds)
    pub fn finalize_liquidation(ctx: Context<FinalizeLiquidation>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let keeper_c = ctx.accounts.keeper_c.key();
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            current_time >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

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

        // 2. Calculate Keeper C Reward (Fixed 1.0 USDC or max 10% for dust)
        const FIXED_KEEPER_C_REWARD: u64 = 1_000_000; // 1.0 USDC (6 decimals)
        const MAX_KEEPER_C_PERCENTAGE: u64 = 1000; // 10% max for dust scenarios

        // Calculate max allowed (10% of total)
        let max_keeper_reward = total_usdc
            .saturating_mul(MAX_KEEPER_C_PERCENTAGE)
            .checked_div(10000)
            .unwrap_or(0);

        // Use fixed 1.0 USDC, but cap at 10% for very small amounts
        let keeper_c_reward = if FIXED_KEEPER_C_REWARD <= max_keeper_reward {
            FIXED_KEEPER_C_REWARD
        } else {
            max_keeper_reward
        };

        // 3. WATERFALL DISTRIBUTION (Priority Order)
        // Priority 1: Keeper C Reward (always paid first)
        // Priority 2: Return principal to Capital (as much as possible)
        // Priority 3: Protocol profit (remaining, if any)

        let bump = ctx.bumps.processing_vault_authority;
        let seeds = &[b"processing_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // Track remaining funds after each step
        let mut remaining_funds = total_usdc;

        // Step A: Pay Keeper C (PRIORITY 1)
        let actual_keeper_reward = if remaining_funds >= keeper_c_reward {
            keeper_c_reward
        } else {
            // Edge case: not even enough for keeper reward
            remaining_funds
        };

        if actual_keeper_reward > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.keeper_c_usdc_account.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
            token::transfer(cpi_ctx, actual_keeper_reward)?;
            remaining_funds = remaining_funds.saturating_sub(actual_keeper_reward);
        }

        // Step B: Return Principal to Capital (PRIORITY 2)
        // In case of Bad Debt, return whatever is left (may be less than principal)
        let principal_return = if remaining_funds >= loan_principal {
            loan_principal
        } else {
            remaining_funds // Partial return in bad debt scenario
        };

        if principal_return > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.capital_wallet.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
            token::transfer(cpi_ctx, principal_return)?;
            remaining_funds = remaining_funds.saturating_sub(principal_return);
        }

        // Step C: Profit Distribution (PRIORITY 3 - The Surplus)
        // ✅ NEW LOGIC: Split Surplus exactly like Interest (3-Way Split)
        let total_profit = remaining_funds;
        let mut capital_share: u64 = 0;
        let mut ops_share: u64 = 0;
        let mut revenue_share: u64 = 0;

        if total_profit > 0 {
            // 1. Capital Share (10%)
            capital_share = total_profit.checked_div(10).unwrap_or(0);

            // 2. Remaining for Ops & Stakers (90%)
            let distributable = total_profit.saturating_sub(capital_share);

            // 3. Ops Share (27.5% of distributable = ~24.75% of total)
            ops_share = distributable
                .checked_mul(2750)
                .unwrap_or(0)
                .checked_div(10000)
                .unwrap_or(0);

            // 4. Staker/Revenue Share (Remaining ~65.25%)
            revenue_share = distributable.saturating_sub(ops_share);

            // --- Execute Transfers ---

            // C.1 -> Capital Wallet (Growth)
            if capital_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.processing_vault.to_account_info(),
                    to: ctx.accounts.capital_wallet.to_account_info(),
                    authority: ctx.accounts.processing_vault_authority.to_account_info(),
                };
                let cpi_ctx =
                    CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
                token::transfer(cpi_ctx, capital_share)?;
            }

            // C.2 -> Ops Wallet (Team)
            if ops_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.processing_vault.to_account_info(),
                    to: ctx.accounts.ops_wallet.to_account_info(),
                    authority: ctx.accounts.processing_vault_authority.to_account_info(),
                };
                let cpi_ctx =
                    CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
                token::transfer(cpi_ctx, ops_share)?;
            }

            // C.3 -> Revenue Wallet (Stakers)
            if revenue_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.processing_vault.to_account_info(),
                    to: ctx.accounts.revenue_wallet.to_account_info(),
                    authority: ctx.accounts.processing_vault_authority.to_account_info(),
                };
                let cpi_ctx =
                    CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer);
                token::transfer(cpi_ctx, revenue_share)?;

                // Distribute rewards to staking pool (Only from revenue_share)
                // 🛡️ FIX: Use higher precision and track dust for accuracy
                const REWARD_PRECISION: u128 = 1_000_000_000_000_000_000u128; // 1e18 precision
                if system_config.total_staked > 0 {
                    let reward_with_precision = (revenue_share as u128)
                        .checked_mul(REWARD_PRECISION)
                        .unwrap_or(0);

                    let reward_per_share_increment = reward_with_precision
                        .checked_div(system_config.total_staked as u128)
                        .unwrap_or(0);

                    // Track undistributed dust for future distribution
                    let distributed = reward_per_share_increment
                        .checked_mul(system_config.total_staked as u128)
                        .unwrap_or(0);
                    let dust = reward_with_precision.saturating_sub(distributed);
                    system_config.reward_dust = system_config.reward_dust.saturating_add(dust);

                    system_config.acc_reward_per_share = system_config
                        .acc_reward_per_share
                        .checked_add(reward_per_share_increment)
                        .unwrap_or(system_config.acc_reward_per_share);
                } else {
                    // 🛡️ FIX: If no stakers, accumulate dust for later distribution
                    system_config.reward_dust = system_config.reward_dust.saturating_add(
                        (revenue_share as u128)
                            .checked_mul(REWARD_PRECISION)
                            .unwrap_or(0),
                    );
                }
            }

            msg!(
                "📊 Profit Split: Capital: {}, Ops: {}, Revenue: {}",
                capital_share,
                ops_share,
                revenue_share
            );
        }

        // 4. Update Status
        liquidation_process.status = LiquidationStatus::Finalized as u8;
        liquidation_process.distribute_keeper = keeper_c;
        liquidation_process.finalized_at = current_time;
        liquidation_process.keeper_c_reward = actual_keeper_reward;
        liquidation_process.principal_returned = principal_return;
        liquidation_process.growth_fund = capital_share; // Record capital share
        liquidation_process.revenue_share = total_profit; // Record total profit handled

        // 🛡️ FIX: Now mark loan as fully Liquidated since finalize succeeded
        loan_account.status = LoanStatus::Liquidated as u8;

        system_config.total_borrowed = system_config.total_borrowed.saturating_sub(loan_principal);

        // 5. Logging
        msg!("✅ Step 3 Complete! Liquidation Finalized with 3-Way Profit Split!");
        msg!("📊 Distribution Summary:");
        msg!("   💰 Total USDC Available: {}", total_usdc);
        msg!("   🎯 Keeper C Reward: {}", actual_keeper_reward);
        msg!(
            "   🏦 Principal Returned: {} / {}",
            principal_return,
            loan_principal
        );
        msg!("   📈 Total Profit: {}", total_profit);
        msg!("   ├─ Capital (10%): {}", capital_share);
        msg!("   ├─ Ops (~24.75%): {}", ops_share);
        msg!("   └─ Revenue (~65.25%): {}", revenue_share);

        if principal_return < loan_principal {
            let bad_debt = loan_principal.saturating_sub(principal_return);
            msg!("   ⚠️  BAD DEBT DETECTED: {} USDC", bad_debt);
        }

        // Emit event for indexing
        emit!(LiquidationFinalized {
            loan_account: loan_account.key(),
            keeper_c,
            principal_returned: principal_return,
            profit: total_profit,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 7️⃣ TIMEOUT RECOVERY
    // ═════════════════════════════════════════════════════════════
    pub fn claim_expired_swap(ctx: Context<ClaimExpiredSwap>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let protocol_config = &ctx.accounts.protocol_config;
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
        liquidation_process.deadline_for_swap = current_time + protocol_config.liquidation_timeout;

        msg!("⚠️ Swap timeout extended! Anyone can now execute auto-swap");
        Ok(())
    }

    pub fn claim_expired_distribution(ctx: Context<ClaimExpiredDistribution>) -> Result<()> {
        let liquidation_process = &mut ctx.accounts.liquidation_process;
        let protocol_config = &ctx.accounts.protocol_config;
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
        liquidation_process.deadline_for_distribution =
            current_time + protocol_config.liquidation_timeout;

        msg!("⚠️ Distribution timeout! New keeper can now take over");
        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 8️⃣ REPAY LOAN
    // ═════════════════════════════════════════════════════════════
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            Clock::get()?.unix_timestamp >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        // 1. Calculate interest
        // 🛡️ FIX: Use higher precision calculation to prevent rounding to 0
        let current_time = Clock::get()?.unix_timestamp;
        let time_elapsed = (current_time - loan_account.borrow_at) as u64;
        let seconds_per_year: u64 = 31_536_000;

        // Calculate with u128 for precision
        let interest_numerator = (loan_account.loan_amount as u128)
            .checked_mul(loan_account.interest_rate_bps as u128)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_mul(time_elapsed as u128)
            .ok_or(GinvaError::ArithmeticOverflow)?;

        let interest_denominator = (10000u128)
            .checked_mul(seconds_per_year as u128)
            .ok_or(GinvaError::ArithmeticOverflow)?;

        let interest = interest_numerator
            .checked_div(interest_denominator)
            .unwrap_or(0) as u64;

        // 🛡️ FIX: Enforce minimum interest for loans held > 1 hour
        // Prevent free borrowing through short-term loans
        const MIN_INTEREST_TIME: u64 = 3600; // 1 hour
        const MIN_INTEREST_AMOUNT: u64 = 1000; // 0.001 USDC (6 decimals)
        if time_elapsed > MIN_INTEREST_TIME && interest < MIN_INTEREST_AMOUNT {
            return Err(GinvaError::MinimumInterestRequired.into());
        }

        let principal = loan_account.loan_amount;
        let total_repayment = principal.saturating_add(interest);
        loan_account.total_interest_paid = interest;

        // 2. User pays USDC - Separate Principal and Interest
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // 2a. Principal -> Capital Wallet
        let cpi_accounts_principal = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.capital_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx_principal = CpiContext::new(cpi_program.clone(), cpi_accounts_principal);
        token::transfer(cpi_ctx_principal, principal)?;

        // 2b. Interest -> Revenue Wallet (for stakers)
        if interest > 0 {
            let cpi_accounts_interest = Transfer {
                from: ctx.accounts.user_usdc_account.to_account_info(),
                to: ctx.accounts.revenue_wallet.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            let cpi_ctx_interest = CpiContext::new(cpi_program.clone(), cpi_accounts_interest);
            token::transfer(cpi_ctx_interest, interest)?;
        }

        // 2. Vault returns Collateral -> User (PDA Signer)
        let bump = ctx.bumps.vault_authority;
        let seeds = &[b"vault_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // 🛡️ FIX: Verify vault has sufficient collateral before transfer
        require!(
            ctx.accounts.vault_collateral_account.amount >= loan_account.collateral_amount,
            GinvaError::InsufficientCollateral
        );

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

        // Emit event for indexing
        emit!(LoanRepaid {
            borrower: ctx.accounts.user.key(),
            loan_id: loan_account.loan_id,
            principal,
            interest,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 9️⃣ PAY INTEREST (Monthly Payment)
    // ═════════════════════════════════════════════════════════════
    pub fn pay_interest(ctx: Context<PayInterest>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let user = ctx.accounts.user.key();
        let system_config = &mut ctx.accounts.system_config;
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            current_time >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 1️⃣ Validation
        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        require!(loan_account.borrower == user, GinvaError::Unauthorized);

        // 2️⃣ Calculate interest due

        let last_paid = loan_account.last_payment_at;
        let seconds_since_payment = (current_time - last_paid) as u64;
        let days_since = seconds_since_payment / 86400;

        // Interest compounds every 30 days (mandatory)
        require!(days_since >= 30, GinvaError::PaymentTooEarly);

        // 3️⃣ Calculate amount due
        let interest_per_30d = (loan_account
            .loan_amount
            .saturating_mul(loan_account.interest_rate_bps as u64))
        .checked_div(10000)
        .unwrap_or(0);

        let num_periods = days_since / 30;
        let interest_due = interest_per_30d.saturating_mul(num_periods as u64);

        require!(interest_due > 0, GinvaError::InvalidAmount);

        // 4️⃣ Calculate distribution shares
        // 10% to Capital (Growth Fund)
        let capital_share = interest_due
            .checked_div(10)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // 90% remaining for distribution
        let distributable = interest_due
            .checked_sub(capital_share)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // Ops = 27.5% of distributable (24.75% of total)
        let ops_share = distributable
            .checked_mul(2750)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // Stakers = remaining 72.5% of distributable (65.25% of total)
        let staker_share = distributable
            .checked_sub(ops_share)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // 5️⃣ Transfer USDC to respective wallets
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // 5.1 Transfer to Capital (10%)
        if capital_share > 0 {
            token::transfer(
                CpiContext::new(
                    cpi_program.clone(),
                    Transfer {
                        from: ctx.accounts.user_usdc_account.to_account_info(),
                        to: ctx.accounts.capital_wallet.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                capital_share,
            )?;
        }

        // 5.2 Transfer to Ops Wallet (27.5% of 90)
        if ops_share > 0 {
            token::transfer(
                CpiContext::new(
                    cpi_program.clone(),
                    Transfer {
                        from: ctx.accounts.user_usdc_account.to_account_info(),
                        to: ctx.accounts.ops_token_account.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                ops_share,
            )?;
        }

        // 5.3 Transfer to Revenue Wallet for Stakers (72.5% of 90)
        if staker_share > 0 {
            token::transfer(
                CpiContext::new(
                    cpi_program.clone(),
                    Transfer {
                        from: ctx.accounts.user_usdc_account.to_account_info(),
                        to: ctx.accounts.revenue_wallet.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                staker_share,
            )?;
        }

        // 6️⃣ Update loan state
        loan_account.last_payment_at = current_time;
        loan_account.total_interest_paid = loan_account
            .total_interest_paid
            .saturating_add(interest_due);

        // 7️⃣ Distribute rewards to staking pool (from staker_share only)
        // 🛡️ FIX: Use higher precision and track dust for accuracy
        const REWARD_PRECISION: u128 = 1_000_000_000_000_000_000u128; // 1e18 precision
        let config = &mut ctx.accounts.system_config;
        if config.total_staked > 0 {
            let reward_with_precision = (staker_share as u128)
                .checked_mul(REWARD_PRECISION)
                .ok_or(GinvaError::ArithmeticOverflow)?;

            let reward_per_share_increment = reward_with_precision
                .checked_div(config.total_staked as u128)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // Track undistributed dust for future distribution
            let distributed = reward_per_share_increment
                .checked_mul(config.total_staked as u128)
                .unwrap_or(0);
            let dust = reward_with_precision.saturating_sub(distributed);
            config.reward_dust = config
                .reward_dust
                .checked_add(dust)
                .unwrap_or(config.reward_dust);

            config.acc_reward_per_share = config
                .acc_reward_per_share
                .checked_add(reward_per_share_increment)
                .ok_or(GinvaError::ArithmeticOverflow)?;
            msg!(
                "💰 Reward distributed to stakers: {} USDC (dust: {})",
                staker_share,
                dust
            );
        } else {
            // 🛡️ FIX: If no stakers, accumulate dust for later distribution
            config.reward_dust = config
                .reward_dust
                .checked_add(
                    (staker_share as u128)
                        .checked_mul(REWARD_PRECISION)
                        .unwrap_or(0),
                )
                .unwrap_or(config.reward_dust);
        }

        msg!(
            "✅ Interest paid: {} USDC. Capital: {}, Ops: {}, Stakers: {}",
            interest_due,
            capital_share,
            ops_share,
            staker_share
        );

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 🔟 STAKING & REWARDS
    // ═════════════════════════════════════════════════════════════

    // Stake LP tokens
    pub fn stake_lp(ctx: Context<StakeLP>, amount: u64) -> Result<()> {
        let config = &mut ctx.accounts.system_config;
        let stake = &mut ctx.accounts.user_stake;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!config.is_paused, GinvaError::ProtocolPaused);
        require!(
            Clock::get()?.unix_timestamp >= config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 1. Check pending rewards FIRST (V1: Prevent loss by requiring manual claim)
        if stake.staked_amount > 0 {
            let pending = (stake.staked_amount as u128)
                .checked_mul(config.acc_reward_per_share)
                .ok_or(GinvaError::ArithmeticOverflow)?
                .checked_div(1_000_000_000_000)
                .ok_or(GinvaError::ArithmeticUnderflow)?
                .checked_sub(stake.reward_debt)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // V1 Safety: Require user to claim pending rewards before staking more
            require!(pending == 0, GinvaError::MustClaimRewardsFirst);
        }

        // 2. Transfer USDC User -> Capital Wallet
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.capital_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 3. Update State
        if stake.staked_amount == 0 {
            stake.owner = *ctx.accounts.user.key;
        }
        stake.staked_amount = stake
            .staked_amount
            .checked_add(amount)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        config.total_staked = config
            .total_staked
            .checked_add(amount)
            .ok_or(GinvaError::ArithmeticOverflow)?;

        // 🛡️ SHIELD FEE: Record deposit time for bootstrapping protection
        stake.last_deposit_time = Clock::get()?.unix_timestamp;

        // 4. Update Reward Debt
        stake.reward_debt = (stake.staked_amount as u128)
            .checked_mul(config.acc_reward_per_share)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(1_000_000_000_000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        msg!(
            "Staked: {} USDC. Total Staked: {}",
            amount,
            config.total_staked
        );

        // Emit event for indexing
        emit!(StakeDeposited {
            user: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    // Claim rewards
    pub fn claim_staking_rewards(ctx: Context<ClaimReward>) -> Result<()> {
        let config = &ctx.accounts.system_config;
        let stake = &mut ctx.accounts.user_stake;

        require!(stake.staked_amount > 0, GinvaError::InsufficientFunds);

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!config.is_paused, GinvaError::ProtocolPaused);
        require!(
            Clock::get()?.unix_timestamp >= config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 1. Calculate Pending Reward
        let accumulated = (stake.staked_amount as u128)
            .checked_mul(config.acc_reward_per_share)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(1_000_000_000_000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        let pending = accumulated
            .checked_sub(stake.reward_debt)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        require!(pending > 0, GinvaError::InvalidAmount);

        // 2. Transfer Reward: Revenue Wallet -> User
        let bump = ctx.bumps.revenue_wallet_authority;
        let seeds = &[b"revenue_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.revenue_wallet.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.revenue_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, pending as u64)?;

        // 3. Update Debt
        stake.reward_debt = accumulated;

        msg!("Claimed Reward: {} USDC", pending);
        Ok(())
    }

    // Unstake LP tokens with Shield Fee Mechanism
    pub fn unstake_lp(ctx: Context<UnstakeLP>, amount: u64) -> Result<()> {
        let config = &mut ctx.accounts.system_config;
        let stake = &mut ctx.accounts.user_stake;

        require!(stake.staked_amount >= amount, GinvaError::InsufficientFunds);

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!config.is_paused, GinvaError::ProtocolPaused);
        require!(
            Clock::get()?.unix_timestamp >= config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 🛡️ SHIELD FEE MECHANISM (Bootstrapping Protection)
        let current_reserves = ctx.accounts.capital_wallet.amount;
        let is_system_safe = current_reserves >= config.target_reserves;
        let now = Clock::get()?.unix_timestamp;

        let mut exit_fee_amount: u64 = 0;

        if !is_system_safe {
            // System is still bootstrapping - check protection period
            let time_staked = now - stake.last_deposit_time;

            if time_staked < config.protection_period {
                // Early withdrawal! Apply Shield Fee
                exit_fee_amount = amount
                    .checked_mul(config.exit_fee_bps as u64)
                    .ok_or(GinvaError::ArithmeticOverflow)?
                    .checked_div(10000)
                    .ok_or(GinvaError::ArithmeticUnderflow)?;

                msg!(
                    "🛡️ Shield Fee Applied: {} USDC ({} bps) - Bootstrapping Protection",
                    exit_fee_amount,
                    config.exit_fee_bps
                );
            }
        }

        let withdraw_amount = amount
            .checked_sub(exit_fee_amount)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // 1. Transfer Principal minus Fee: Capital Wallet -> User
        let bump = ctx.bumps.capital_wallet_authority;
        let seeds = &[b"capital_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.capital_wallet.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.capital_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, withdraw_amount)?;

        // 2. Transfer Shield Fee (if any) to Reserve Pool
        if exit_fee_amount > 0 {
            let reserve_bump = ctx.bumps.reserve_wallet_authority;
            let reserve_seeds = &[b"reserve_auth".as_ref(), &[reserve_bump]];
            let reserve_signer = &[&reserve_seeds[..]];

            let fee_cpi_accounts = Transfer {
                from: ctx.accounts.capital_wallet.to_account_info(),
                to: ctx.accounts.reserve_wallet.to_account_info(),
                authority: ctx.accounts.capital_wallet_authority.to_account_info(),
            };
            let fee_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                fee_cpi_accounts,
                reserve_signer,
            );
            token::transfer(fee_cpi_ctx, exit_fee_amount)?;

            msg!(
                "🛡️ Shield Fee transferred to Reserve Pool: {} USDC",
                exit_fee_amount
            );
        }

        // 3. Update State
        stake.staked_amount = stake
            .staked_amount
            .checked_sub(amount)
            .ok_or(GinvaError::ArithmeticUnderflow)?;
        config.total_staked = config
            .total_staked
            .checked_sub(amount)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // Update Debt based on new amount
        stake.reward_debt = (stake.staked_amount as u128)
            .checked_mul(config.acc_reward_per_share)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(1_000_000_000_000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        msg!(
            "Unstaked: {} USDC (Fee: {} USDC). Remaining: {}",
            withdraw_amount,
            exit_fee_amount,
            stake.staked_amount
        );

        // Emit event for indexing
        emit!(StakeWithdrawn {
            user: ctx.accounts.user.key(),
            amount: withdraw_amount,
            fee: exit_fee_amount,
        });

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 1️⃣1️⃣ CHECK HEALTH FACTOR (Risk Monitoring)
    // ═════════════════════════════════════════════════════════════
    pub fn check_health_factor(ctx: Context<CheckHealthFactor>) -> Result<()> {
        let loan_account = &ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;

        // Check if loan is active
        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        let asset_config = &ctx.accounts.asset_config;
        let (current_price, price_exponent) = get_pyth_price_with_exponent_and_validation(
            &ctx.accounts.pyth_price_feed,
            &asset_config.feed_id,
            system_config,
        )?;

        // 2. Calculate current collateral value
        let collateral_value = calculate_collateral_value(
            loan_account.collateral_amount,
            current_price,
            price_exponent,
            asset_config.decimals,
            6, // USDC decimals
        )?;

        // 3. Calculate health factor
        // Health Factor = (Collateral Value * 85%) / Loan Amount * 100
        // If HF < 100, liquidation eligible
        let safety_threshold = collateral_value
            .saturating_mul(85)
            .checked_div(100)
            .unwrap_or(0);

        let health_factor = if loan_account.loan_amount > 0 {
            (safety_threshold * 100)
                .checked_div(loan_account.loan_amount)
                .unwrap_or(0)
        } else {
            1000 // Infinite health if no loan (Safe)
        };

        // 4. Emit appropriate message
        if health_factor < 100 {
            msg!("🚨 CRITICAL RISK: Health Factor = {}%", health_factor);
            msg!("Action: LIQUIDATION ELIGIBLE NOW! ");
        } else if health_factor < 150 {
            msg!("⚠️ HIGH RISK: Health Factor = {}%", health_factor);
            msg!("Action: Consider repaying soon! ");
        } else if health_factor < 200 {
            msg!("⚡ MEDIUM RISK: Health Factor = {}%", health_factor);
            msg!("Action: Monitor carefully ");
        } else {
            msg!("✅ SAFE: Health Factor = {}%", health_factor);
        }

        // 5️⃣ Detailed metrics
        msg!(
            "Collateral Value: ${}, Loan: ${}, Threshold: ${}",
            collateral_value,
            loan_account.loan_amount,
            safety_threshold
        );

        Ok(())
    }

    // ═════════════════════════════════════════════════════════════
    // 1️⃣2️⃣ STATUS TRACKING (Loan Lifecycle)
    // ═════════════════════════════════════════════════════════════
    pub fn check_overdue_loan(ctx: Context<CheckLoanStatus>) -> Result<()> {
        let loan = &mut ctx.accounts.loan_account;
        let current_time = Clock::get()?.unix_timestamp;

        // เช็คเฉพาะสถานะที่ยังไม่จบ (Active หรือ Overdue)
        require!(
            loan.status == LoanStatus::Active as u8 || loan.status == LoanStatus::Overdue as u8,
            GinvaError::LoanNotActive
        );

        let days_since_payment = (current_time - loan.last_payment_at) / 86400;

        if days_since_payment >= 34 {
            // เกิน 33 วัน = Default (ผิดนัดชำระหนี้ - รอโดนยึด)
            loan.status = LoanStatus::Default as u8;
            msg!("🚨 LOAN DEFAULTED! Days overdue: {}", days_since_payment);
        } else if days_since_payment >= 31 {
            // 31-33 วัน = Overdue (ค้างชำระ - เริ่มเตือน)
            loan.status = LoanStatus::Overdue as u8;
            msg!("⚠️ LOAN OVERDUE! Days overdue: {}", days_since_payment);
        } else {
            msg!(
                "✅ Loan status healthy. Days since payment: {}",
                days_since_payment
            );
        }

        Ok(())
    }
}

// ═════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════

/// 🛡️ RATE LIMITING: Check and update user operation rate limits
/// Uses slot-based tracking for more accurate rate limiting on Solana
fn check_rate_limit(
    rate_limit: &mut UserRateLimit,
    current_slot: u64,
    user_key: Pubkey,
) -> Result<()> {
    // Initialize rate limit account if new
    if rate_limit.user == Pubkey::default() {
        rate_limit.user = user_key;
        rate_limit.last_operation_block = current_slot;
        rate_limit.operations_count = 1;
        rate_limit.window_start_time = Clock::get()?.unix_timestamp;
        return Ok(());
    }

    // Check if we're in the same block
    if rate_limit.last_operation_block == current_slot {
        // Same block - increment counter
        rate_limit.operations_count = rate_limit
            .operations_count
            .checked_add(1)
            .ok_or(GinvaError::ArithmeticOverflow)?;

        // Check if max operations per block exceeded
        require!(
            rate_limit.operations_count <= MAX_OPERATIONS_PER_BLOCK,
            GinvaError::RateLimitExceeded
        );
    } else {
        // New block - reset counter
        rate_limit.last_operation_block = current_slot;
        rate_limit.operations_count = 1;
        rate_limit.window_start_time = Clock::get()?.unix_timestamp;
    }

    // Additional check: minimum time between operations across blocks
    let current_time = Clock::get()?.unix_timestamp;
    let time_since_last = current_time.saturating_sub(rate_limit.window_start_time);
    require!(
        time_since_last >= MIN_TIME_BETWEEN_OPERATIONS,
        GinvaError::RateLimitExceeded
    );

    Ok(())
}

/// 🛡️ FLASH LOAN PROTECTION: Check minimum hold blocks (more secure than time-based)
fn check_flash_loan_protection(deposit_slot: u64, current_slot: u64) -> Result<()> {
    let hold_blocks = current_slot.saturating_sub(deposit_slot);
    require!(
        hold_blocks >= MIN_HOLD_BLOCKS,
        GinvaError::InsufficientHoldTime
    );
    Ok(())
}

/// 🛡️ REENTRANCY GUARD: Check if function is not already executing
fn check_reentrancy_guard(guard: u8) -> Result<()> {
    require!(
        guard == REENTRANCY_GUARD_INACTIVE,
        GinvaError::ReentrancyDetected
    );
    Ok(())
}

/// 🛡️ PRICE DEVIATION: Validate price doesn't deviate too much from reference
fn validate_price_deviation(current_price: u64, reference_price: u64) -> Result<()> {
    if reference_price == 0 {
        return Ok(()); // First price, no reference
    }

    let price_diff = if current_price > reference_price {
        current_price.saturating_sub(reference_price)
    } else {
        reference_price.saturating_sub(current_price)
    };

    let deviation_bps = price_diff
        .saturating_mul(10000)
        .checked_div(reference_price)
        .unwrap_or(0);

    require!(
        deviation_bps <= MAX_PRICE_CHANGE_BPS,
        GinvaError::PriceDeviationTooHigh
    );

    Ok(())
}

fn get_pyth_price_with_exponent_and_validation(
    price_update: &Account<PriceUpdateV2>,
    feed_id: &[u8; 32],
    system_config: &mut SystemConfig,
) -> Result<(u64, i32)> {
    let clock = Clock::get()?;

    // 🛡️ INTELLIGENT MOCK: ปรับแต่ง Logic ตามสภาพแวดล้อม
    // ถ้าเป็น Local Test -> ให้ max_age เป็นอนันต์ (u64::MAX) เพื่อรับ Mock Data ได้ทุกแบบ
    // ถ้าเป็น Production -> ต้องเป็น MAX_PRICE_AGE_SECONDS (60 วิ) เท่านั้น!
    let max_age = if cfg!(feature = "local-test") {
        msg!("⚠️ WARNING: Local Test Mode - Oracle Time Check Disabled");
        u64::MAX
    } else {
        MAX_PRICE_AGE_SECONDS
    };

    // Get price with dynamic max_age
    let price = price_update
        .get_price_no_older_than(&clock, max_age, feed_id)
        .map_err(|_| GinvaError::PythPriceUnavailable)?;

    // Validate price confidence (confidence / price should be reasonable)
    // Using 1% threshold for stable assets (adjust based on asset volatility)
    let price_abs = price.price.unsigned_abs();
    require!(price_abs > 0, GinvaError::PriceConfidenceTooLow);
    let confidence_ratio = price.conf as u128 * 10000 / price_abs as u128; // in basis points

    require!(
        confidence_ratio <= MAX_CONFIDENCE_RATIO,
        GinvaError::PriceConfidenceTooLow
    );

    let price_u64 = price.price.unsigned_abs();
    let exponent = price.exponent;

    // 🛡️ PRICE DEVIATION CHECK: Validate price BEFORE updating state
    // Critical: Must validate BEFORE any state changes to prevent partial updates
    let previous_price = system_config.last_oracle_price;
    if previous_price > 0 {
        validate_price_deviation(price_u64, previous_price)?;
    }

    // Only update state AFTER all validations pass
    system_config.last_oracle_price = price_u64;
    system_config.last_price_update = clock.unix_timestamp;

    Ok((price_u64, exponent))
}

/// Original function without validation (for backward compatibility)
fn get_pyth_price_with_exponent(
    price_update: &Account<PriceUpdateV2>,
    feed_id: &[u8; 32],
) -> Result<(u64, i32)> {
    let clock = Clock::get()?;

    // 🛡️ INTELLIGENT MOCK: ปรับแต่ง Logic ตามสภาพแวดล้อม
    // ถ้าเป็น Local Test -> ให้ max_age เป็นอนันต์ (u64::MAX) เพื่อรับ Mock Data ได้ทุกแบบ
    // ถ้าเป็น Production -> ต้องเป็น MAX_PRICE_AGE_SECONDS (60 วิ) เท่านั้น!
    let max_age = if cfg!(feature = "local-test") {
        msg!("⚠️ WARNING: Local Test Mode - Oracle Time Check Disabled");
        u64::MAX
    } else {
        MAX_PRICE_AGE_SECONDS
    };

    // Get price with dynamic max_age
    let price = price_update
        .get_price_no_older_than(&clock, max_age, feed_id)
        .map_err(|_| GinvaError::PythPriceUnavailable)?;

    // Validate price confidence (confidence / price should be reasonable)
    // Using 1% threshold for stable assets (adjust based on asset volatility)
    let price_abs = price.price.unsigned_abs();
    require!(price_abs > 0, GinvaError::PriceConfidenceTooLow);
    let confidence_ratio = price.conf as u128 * 10000 / price_abs as u128; // in basis points

    require!(
        confidence_ratio <= MAX_CONFIDENCE_RATIO,
        GinvaError::PriceConfidenceTooLow
    );

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

    // 🛡️ FIX: Add bounds check to prevent panic
    require!(
        total_decimals.abs() <= 38,
        GinvaError::InvalidDecimalConfiguration
    );

    let amount_u128 = collateral_amount as u128;
    let price_u128 = price as u128;

    let value = if total_decimals >= 0 {
        // Use checked_pow to prevent panic
        let divisor = 10u128
            .checked_pow(total_decimals as u32)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        amount_u128
            .checked_mul(price_u128)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(divisor)
            .unwrap_or(0)
    } else {
        let multiplier = 10u128
            .checked_pow((-total_decimals) as u32)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        amount_u128
            .checked_mul(price_u128)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_mul(multiplier)
            .ok_or(GinvaError::ArithmeticOverflow)?
    };

    // 🛡️ FIX: Ensure value fits in u64
    require!(value <= u64::MAX as u128, GinvaError::ArithmeticOverflow);

    Ok(value as u64)
}

fn calculate_dynamic_interest(total_borrowed: u64, current_liquidity: u64) -> u16 {
    let total_supply = match total_borrowed.checked_add(current_liquidity) {
        Some(val) => val,
        None => return 250,
    };

    if total_supply == 0 {
        return 250;
    }

    let utilization_bps = (total_borrowed as u128)
        .checked_mul(10000)
        .unwrap()
        .checked_div(total_supply as u128)
        .unwrap_or(0) as u64;

    let optimal_utilization = 8000;
    let base_rate = 200;
    let slope_1 = 400;
    let slope_2 = 3000;

    if utilization_bps <= optimal_utilization {
        let rate_increase = utilization_bps
            .checked_mul(slope_1)
            .unwrap()
            .checked_div(optimal_utilization)
            .unwrap();
        return (base_rate + rate_increase) as u16;
    } else {
        let rate_at_optimal = base_rate + slope_1;
        let excess_utilization = utilization_bps - optimal_utilization;
        let excess_range = 10000 - optimal_utilization;
        let surge_increase = excess_utilization
            .checked_mul(slope_2)
            .unwrap()
            .checked_div(excess_range)
            .unwrap();
        let final_rate = rate_at_optimal + surge_increase;
        return std::cmp::min(final_rate, 5000) as u16;
    }
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
    LiquidationInProgress = 6, // 🛡️ FIX: Intermediate state for atomic liquidation
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum LiquidationStatus {
    Triggered = 1,
    Swapped = 2,
    Finalized = 3,
    Expired = 4,
}

// ═════════════════════════════════════════════════════════════
// 📋 EVENTS (For indexing and monitoring)
// ═════════════════════════════════════════════════════════════

#[event]
pub struct LoanCreated {
    pub borrower: Pubkey,
    pub loan_id: u32,
    pub collateral_amount: u64,
    pub loan_amount: u64,
    pub interest_rate_bps: u16,
}

#[event]
pub struct LoanRepaid {
    pub borrower: Pubkey,
    pub loan_id: u32,
    pub principal: u64,
    pub interest: u64,
}

#[event]
pub struct LiquidationTriggered {
    pub loan_account: Pubkey,
    pub keeper: Pubkey,
    pub collateral_amount: u64,
}

#[event]
pub struct LiquidationFinalized {
    pub loan_account: Pubkey,
    pub keeper_c: Pubkey,
    pub principal_returned: u64,
    pub profit: u64,
}

#[event]
pub struct StakeDeposited {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct StakeWithdrawn {
    pub user: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct EmergencyPause {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyResume {
    pub admin: Pubkey,
    pub resume_at: i64,
}

// ═════════════════════════════════════════════════════════════
// 📋 ACCOUNT STRUCTURES
// ═════════════════════════════════════════════════════════════

#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub liquidation_timeout: i64,   // Devnet: 2 seconds (Prod: 86400)
    pub auto_swap_reward_bps: u64,  // e.g., 600 = 6%
    pub distribute_reward_bps: u64, // e.g., 100 = 1%
    pub min_loan_size: u64,         // Minimum loan size
    pub max_loan_size: u64,         // Maximum loan size
}

#[account]
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

    // Ops Wallet (single wallet for all operations)
    pub ops_wallet: Pubkey,

    // Staking fields
    pub total_staked: u64,          // Total staked amount
    pub acc_reward_per_share: u128, // Accumulated reward per share

    // Emergency pause fields
    pub is_paused: bool,
    pub paused_at: i64,
    pub pause_reason: [u8; 50],
    pub ops_resume_at: i64,

    // 🛡️ Price tracking for deviation detection
    pub last_oracle_price: u64, // Last validated oracle price
    pub last_price_update: i64, // Timestamp of last price update

    // 🛡️ SHIELD FEE MECHANISM (Bootstrapping Protection)
    pub target_reserves: u64,   // Safety Target (e.g., 500,000 USDC)
    pub protection_period: i64, // Protection Period in seconds (e.g., 15 days)
    pub exit_fee_bps: u16,      // Exit fee in basis points (e.g., 500 = 5%)
    pub reserve_wallet: Pubkey, // Reserve wallet for collected fees

    // 🛡️ REENTRANCY GUARD
    pub reentrancy_guard: u8, // 0 = unlocked, 1 = locked

    // 🛡️ REWARD DUST TRACKING (for precision)
    pub reward_dust: u128, // Undistributed reward dust
}

impl SystemConfig {
    pub fn init(&mut self) {
        self.pause_reason = [0u8; 50];
        self.ops_resume_at = 0;
    }
}

#[account]
#[derive(Default)]
pub struct AssetConfig {
    pub mint: Pubkey,
    pub feed_id: [u8; 32],
    pub decimals: u8,
    pub max_ltv: u64,
    pub liquidation_threshold: u64,
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
#[derive(Default)]
pub struct UserStake {
    pub owner: Pubkey,
    pub staked_amount: u64, // Staked amount
    pub reward_debt: u128,  // Reward debt for calculating claimed rewards

    // Rate limiting fields - FIXED: Added all missing fields
    pub last_operation_time: i64, // Last operation timestamp
    pub operation_count: u64,     // Operations in current window
    pub is_rate_limited: bool,    // Rate limiting flag

    // 🛡️ SHIELD FEE: Track deposit time for bootstrapping protection
    pub last_deposit_time: i64, // Timestamp of last deposit (for Shield Fee calculation)
}

#[account]
#[derive(Default)]
pub struct UserRateLimit {
    pub user: Pubkey,
    pub last_operation_block: u64, // Last block user operated in
    pub operations_count: u64,     // Operations in current window
    pub window_start_time: i64,    // Start of current window
    pub ticket_counter: u64,       // 🎫 Multi-Ticket: Next available ticket ID
}

#[account]
#[derive(Default)]
pub struct LoanAccount {
    pub borrower: Pubkey,
    pub loan_id: u32, // ✅ Multi-Ticket: Unique loan identifier
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
    pub deposit_slot: u64, // 🛡️ FIX: Block-based flash loan protection
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
    pub dex_activation_time: i64, // 🕒 เวลาที่จะอนุญาตให้ขายเข้า DEX (Trigger + 6h)
    pub swapped: bool,            // NEW: Track if swap completed
    pub finalized_at: i64,
    // Distribution tracking
    pub keeper_c_reward: u64,
    pub principal_returned: u64,
    pub growth_fund: u64,
    pub revenue_share: u64,
    // Keeper A reward tracking (for separate claim)
    pub keeper_reward_amount: u64,
    pub keeper_reward_claimed: bool,
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

    #[account(
        init,
        payer = admin,
        space = 8 + size_of::<ProtocolConfig>(),
        seeds = [b"protocol_config"],
        bump
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

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
    /// CHECK: PDA derived from [b"reserve_auth"]
    #[account(seeds = [b"reserve_auth"], bump)]
    pub reserve_wallet_authority: AccountInfo<'info>,
    #[account(mut)]
    pub ops_wallet: Account<'info, TokenAccount>,
    #[account(mut, token::authority = reserve_wallet_authority)]
    pub reserve_wallet: Account<'info, TokenAccount>,

    pub collateral_mint: Account<'info, Mint>,
    pub loan_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump,
        constraint = system_config.admin == admin.key() @ GinvaError::Unauthorized
    )]
    pub system_config: Account<'info, SystemConfig>,
}

#[derive(Accounts)]
pub struct UpdateProtocolConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol_config"],
        bump,
        constraint = protocol_config.admin == admin.key() @ GinvaError::Unauthorized
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct AddSupportedAsset<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 1 + 8 + 8 + 1 + 8,
        seeds = [b"asset_config", asset_mint.key().as_ref()],
        bump
    )]
    pub asset_config: Account<'info, AssetConfig>,

    pub asset_mint: Account<'info, Mint>,

    #[account(
        seeds = [b"config"],
        bump,
        has_one = admin
    )]
    pub system_config: Account<'info, SystemConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAssetConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"asset_config", asset_config.mint.as_ref()],
        bump
    )]
    pub asset_config: Account<'info, AssetConfig>,

    #[account(seeds = [b"config"], bump, has_one = admin)]
    pub system_config: Account<'info, SystemConfig>,
}

#[derive(Accounts)]
pub struct UpdateOpsWallet<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut, seeds = [b"config"], bump, has_one = admin)]
    pub system_config: Account<'info, SystemConfig>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,

    #[account(
        seeds = [b"asset_config", user_collateral_account.mint.as_ref()],
        bump
    )]
    pub asset_config: Box<Account<'info, AssetConfig>>,

    #[account(
        init,
        payer = user,
        space = 8 + size_of::<LoanAccount>(),
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump
    )]
    pub loan_account: Box<Account<'info, LoanAccount>>,

    #[account(
        mut,
        seeds = [b"rate_limit", user.key().as_ref()],
        bump
    )]
    pub user_rate_limit: Box<Account<'info, UserRateLimit>>,

    #[account(mut)]
    pub user_collateral_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, token::authority = system_config.vault_wallet_authority)]
    pub vault_collateral_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct BorrowUsdc<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.borrower == user.key() @ GinvaError::Unauthorized,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Box<Account<'info, LoanAccount>>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,
    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Box<Account<'info, ProtocolConfig>>,

    #[account(
        seeds = [b"asset_config", loan_account.collateral_mint.as_ref()],
        bump
    )]
    pub asset_config: Box<Account<'info, AssetConfig>>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<UserRateLimit>(),
        seeds = [b"rate_limit", user.key().as_ref()],
        bump
    )]
    pub user_rate_limit: Box<Account<'info, UserRateLimit>>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,
    #[account(mut, token::authority = capital_wallet_authority)]
    pub capital_wallet: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = system_config.loan_mint
    )]
    pub user_usdc_account: Box<Account<'info, TokenAccount>>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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

    #[account(
        mut,
        seeds = [b"seized_vault", loan_account.key().as_ref()],
        bump
    )]
    pub seized_assets_vault: Box<Account<'info, TokenAccount>>,

    /// Get feed_id dynamically based on collateral type
    #[account(
        seeds = [b"asset_config", loan_account.collateral_mint.as_ref()],
        bump
    )]
    pub asset_config: Box<Account<'info, AssetConfig>>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTriggerReward<'info> {
    #[account(mut)]
    pub keeper_a: Signer<'info>,

    #[account(
        mut,
        seeds = [b"liquidation", liquidation_process.loan_account.as_ref()],
        bump,
        constraint = liquidation_process.trigger_keeper == keeper_a.key() @ GinvaError::Unauthorized
    )]
    pub liquidation_process: Account<'info, LiquidationProcess>,

    /// CHECK: PDA derived from [b"vault_auth"]
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: AccountInfo<'info>,

    #[account(mut, token::authority = vault_authority)]
    pub vault_collateral_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = keeper_a_collateral_account.owner == keeper_a.key() @ GinvaError::Unauthorized
    )]
    pub keeper_a_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteAutoSwap<'info> {
    #[account(mut)]
    pub caller: Signer<'info>, // Anyone can call this
    #[account(mut)]
    pub liquidation_process: Box<Account<'info, LiquidationProcess>>,
    #[account(mut)]
    pub loan_account: Box<Account<'info, LoanAccount>>,
    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,
    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Box<Account<'info, ProtocolConfig>>,

    #[account(
        seeds = [b"asset_config", loan_account.collateral_mint.as_ref()],
        bump
    )]
    pub asset_config: Box<Account<'info, AssetConfig>>,

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
    #[account(
        mut,
        token::mint = loan_mint
    )]
    pub caller_usdc_account: Box<Account<'info, TokenAccount>>,

    // 2. Caller receives collateral into this account
    #[account(
        mut,
        token::mint = loan_account.collateral_mint
    )]
    pub caller_collateral_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Jupiter Program for CPI (optional - depends on implementation)
    pub jupiter_program: AccountInfo<'info>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecuteDexFallback<'info> {
    #[account(mut)]
    pub caller: Signer<'info>, // Keeper that executes the swap

    #[account(mut)]
    pub liquidation_process: Box<Account<'info, LiquidationProcess>>,

    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Box<Account<'info, SystemConfig>>,

    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Box<Account<'info, ProtocolConfig>>,

    // 🛡️ FIX: Add loan_account to access collateral_mint for correct seed derivation
    #[account(mut)]
    pub loan_account: Box<Account<'info, LoanAccount>>,

    #[account(
        seeds = [b"asset_config", loan_account.collateral_mint.as_ref()],
        bump
    )]
    pub asset_config: Box<Account<'info, AssetConfig>>,

    /// CHECK: PDA derived from [b"seized_auth"]
    #[account(seeds = [b"seized_auth"], bump)]
    pub seized_assets_authority: AccountInfo<'info>,

    #[account(mut, token::authority = seized_assets_authority)]
    pub seized_assets_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: PDA derived from [b"processing_auth"]
    #[account(seeds = [b"processing_auth"], bump)]
    pub processing_vault_authority: AccountInfo<'info>,

    #[account(mut, token::authority = processing_vault_authority)]
    pub processing_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: Jupiter V6 Program ID
    /// JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
    /// 🛡️ FIX: Validate using compile-time constant instead of runtime parsing
    #[account(
        constraint = jupiter_program.key() == JUPITER_PROGRAM_ID @ GinvaError::InvalidJupiterProgram
    )]
    pub jupiter_program: AccountInfo<'info>,

    pub pyth_price_feed: Box<Account<'info, PriceUpdateV2>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    // ⚠️ IMPORTANT: Additional accounts required by Jupiter will be passed in remaining_accounts
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
    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Account<'info, ProtocolConfig>,

    /// CHECK: PDA derived from [b"processing_auth"]
    #[account(seeds = [b"processing_auth"], bump)]
    pub processing_vault_authority: AccountInfo<'info>,
    #[account(mut, token::authority = processing_vault_authority)]
    pub processing_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub capital_wallet: Account<'info, TokenAccount>,

    // ✅ เพิ่ม Ops Wallet เข้ามาเพื่อรับส่วนแบ่ง
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Account<'info, TokenAccount>,

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
    #[account(seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,
    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
pub struct ClaimExpiredDistribution<'info> {
    #[account(mut)]
    pub liquidation_process: Account<'info, LiquidationProcess>,
    #[account(seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,
    #[account(seeds = [b"protocol_config"], bump)]
    pub protocol_config: Account<'info, ProtocolConfig>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.borrower == user.key() @ GinvaError::Unauthorized,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
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
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,

    #[account(mut, token::authority = vault_authority)]
    pub vault_collateral_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct ExtendLoan<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.borrower == user.key() @ GinvaError::Unauthorized,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Account<'info, LoanAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    // รับดอกเบี้ยเข้ากระเป๋า Revenue (เพื่อเอาไปเป็น Profit ของระบบ)
    #[account(
        mut,
        token::authority = system_config.revenue_wallet_authority
    )]
    pub revenue_wallet: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"config"], 
        bump,
        constraint = !system_config.is_paused @ GinvaError::ProtocolPaused
    )]
    pub system_config: Account<'info, SystemConfig>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct PayInterest<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.borrower == user.key() @ GinvaError::Unauthorized,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Account<'info, LoanAccount>,

    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,
    #[account(mut, token::authority = capital_wallet_authority)]
    pub capital_wallet: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from [b"vault_auth"]
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: AccountInfo<'info>,

    #[account(mut, token::authority = vault_authority)]
    pub ops_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = vault_authority)]
    pub revenue_wallet: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,

    #[account(mut, token::authority = revenue_wallet_authority)]
    pub revenue_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StakeLP<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + size_of::<UserStake>(),
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,

    #[account(mut, token::authority = capital_wallet_authority)]
    pub capital_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeLP<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    /// CHECK: PDA derived from [b"capital_auth"]
    #[account(seeds = [b"capital_auth"], bump)]
    pub capital_wallet_authority: AccountInfo<'info>,

    #[account(mut, token::authority = capital_wallet_authority)]
    pub capital_wallet: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from [b"reserve_auth"]
    #[account(seeds = [b"reserve_auth"], bump)]
    pub reserve_wallet_authority: AccountInfo<'info>,

    #[account(mut, token::authority = reserve_wallet_authority)]
    pub reserve_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct CheckHealthFactor<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"loan", loan_account.borrower.as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Account<'info, LoanAccount>,

    #[account(mut, seeds = [b"config"], bump)]
    pub system_config: Account<'info, SystemConfig>,

    #[account(seeds = [b"asset_config", loan_account.collateral_mint.as_ref()], bump)]
    pub asset_config: Account<'info, AssetConfig>,

    pub pyth_price_feed: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)] // ✅ Multi-Ticket: Receive loan_id parameter
pub struct CheckLoanStatus<'info> {
    // ใครก็เรียกได้ (Permissionless) เพื่อช่วยอัปเดตสถานะระบบ
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"loan", loan_account.borrower.as_ref(), &loan_id.to_le_bytes()], // ✅ Multi-Ticket: Use loan_id in seeds
        bump,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Account<'info, LoanAccount>,
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
    InsufficientFunds = 1105,
    #[msg("Loan is not active")]
    LoanNotActive = 1400,
    #[msg("Conditions not met for liquidation")]
    NotYetLiquidatable = 1603,
    #[msg("Pyth Oracle Error")]
    PythError = 1203,
    #[msg("Price unavailable")]
    PythPriceUnavailable = 1200,
    #[msg("Invalid liquidation status")]
    InvalidLiquidationStatus = 1403,
    #[msg("Swap timeout not yet reached (need 24h)")]
    SwapTimeoutNotReached = 1302,
    #[msg("Already swapped")]
    AlreadySwapped = 1800,
    #[msg("Operation already completed")]
    AlreadyCompleted = 1801,
    #[msg("Distribution timeout reached")]
    DistributionTimeout = 1303,
    #[msg("Timeout not yet reached")]
    TimeoutNotReached = 1304,
    #[msg("Same keeper cannot perform multiple steps")]
    SameKeeperNotAllowed = 1500,
    #[msg("Insufficient funds to return principal")]
    InsufficientFundsForPrincipal = 1106,
    #[msg("Payment too early (minimum 30 days)")]
    PaymentTooEarly = 1301,
    #[msg("Unauthorized")]
    Unauthorized = 1003,
    #[msg("Storefront sales period is still active (Wait 24h for DEX)")]
    StorefrontPeriodNotOver = 1950,

    // 🛡️ Security Errors (1900-1999)
    #[msg("Reentrancy detected - possible attack")]
    ReentrancyDetected = 1900,
    #[msg("Rate limit exceeded - too many operations")]
    RateLimitExceeded = 1901,
    #[msg("Insufficient hold time - flash loan protection")]
    InsufficientHoldTime = 1902,
    #[msg("Price deviation too high - possible oracle manipulation")]
    PriceDeviationTooHigh = 1903,
    #[msg("Slippage exceeded maximum allowed")]
    SlippageExceeded = 1904,
    #[msg("Operation timestamp mismatch - replay attack")]
    TimestampMismatch = 1905,
    #[msg("Must claim pending rewards before staking more")]
    MustClaimRewardsFirst = 1906,
    #[msg("Protocol is currently paused")]
    ProtocolPaused = 1907,
    #[msg("Protocol is already paused")]
    AlreadyPaused = 1908,
    #[msg("Protocol is not paused")]
    NotPaused = 1909,
    #[msg("System is in cooldown period after resume (Wait 48h)")]
    SystemInCooldown = 1910,
    #[msg("Loan amount is too small")]
    LoanTooSmall = 1911,
    #[msg("Loan amount exceeds maximum limit")]
    LoanTooLarge = 1912,

    // 🔢 Arithmetic Errors (1920-1929)
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow = 1920,
    #[msg("Arithmetic underflow occurred")]
    ArithmeticUnderflow = 1921,

    // 📊 Price Validation Errors (1930-1939)
    #[msg("Price confidence too low - oracle data unreliable")]
    PriceConfidenceTooLow = 1930,
    #[msg("Price is too stale for reliable calculation")]
    PriceTooStale = 1931,

    #[msg("No interest due for payment")]
    NoInterestDue = 1951,

    #[msg("Asset is not active for collateral")]
    AssetNotActive = 1940,
    #[msg("Invalid feed ID format")]
    InvalidFeedId = 1941,
    #[msg("Asset mint does not match config")]
    InvalidAssetMint = 1942,
    #[msg("Invalid loan ID - loan does not exist or belong to user")]
    InvalidLoanId = 1943,

    // 🪐 Jupiter/DEX Integration Errors (1960-1969)
    #[msg("Invalid Jupiter program ID")]
    InvalidJupiterProgram = 1960,
    #[msg("Invalid Jupiter route data")]
    InvalidJupiterRoute = 1961,
    #[msg("Jupiter swap execution failed")]
    JupiterSwapFailed = 1962,
    #[msg("Swap failed - no tokens transferred")]
    SwapFailed = 1963,
    #[msg("Excessive slippage detected")]
    ExcessiveSlippage = 1964,
    #[msg("Insufficient collateral in vault")]
    InsufficientCollateral = 1965,

    // 🔒 New Security Errors (1970-1989)
    #[msg("Invalid decimal configuration - exceeds maximum")]
    InvalidDecimalConfiguration = 1970,
    #[msg("Minimum interest required - free borrowing not allowed")]
    MinimumInterestRequired = 1971,
    #[msg("Loan is currently being liquidated")]
    LoanBeingLiquidated = 1972,
    #[msg("Invalid max LTV - must be <= 90%")]
    InvalidMaxLTV = 1973,
    #[msg("Invalid liquidation threshold - must be > max LTV")]
    InvalidLiquidationThreshold = 1974,
    #[msg("Invalid loan limits - min must be <= max")]
    InvalidLoanLimits = 1975,
}
