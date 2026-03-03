use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::pubkey;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use std::mem::size_of;

// SECURITY CONSTANTS & VALIDATIONS

// Rate limiting constants
pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500; // 5% max price change
pub const MIN_TIME_BETWEEN_OPERATIONS: i64 = 1; // 1 second between user ops

// Jupiter CPI validation constants
pub const MIN_JUPITER_DATA_LEN: usize = 16; // Minimum valid Jupiter instruction data
pub const MAX_JUPITER_SLIPPAGE_BPS: u64 = 2000; // 20% max slippage for DEX fallback
pub const MIN_JUPITER_ACCOUNTS: usize = 3; // Minimum accounts needed for swap

// Staking limits
pub const MAX_TOTAL_STAKED: u64 = 1_000_000_000_000_000; // 1B USDC max total staked

// Interest calculation precision
pub const INTEREST_PRECISION: u128 = 1_000_000; // 6 decimals precision for interest calculation

// Flash loan protection
pub const MIN_HOLD_TIME: i64 = 2; // 2 seconds minimum hold (kept for backward compatibility)
pub const MIN_HOLD_BLOCKS: u64 = 100; // Block-based protection (~40 seconds on Solana)
pub const MIN_HOLD_TIME_SECONDS: i64 = 300; // Minimum 5 minutes time-based protection
pub const MAX_RENT_OPS: u64 = 10; // Max rent operations per day

// Reentrancy protection
pub const REENTRANCY_GUARD_ACTIVE: u8 = 1;
pub const REENTRANCY_GUARD_INACTIVE: u8 = 0;

// Program ID - matches Anchor.toml devnet deployment
declare_id!("HneSigDWobUJcL8PiRqbdzkoqtmiK1B3rEBov87PbmiC");

// CONSTANTS

// Pyth SOL/USD Price Feed ID (from https://pyth.network/developers/price-feed-ids)
pub const SOL_USD_FEED_ID: &str =
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 15; // Maximum age of price data in seconds (reduced from 60 for better freshness)
pub const MAX_CONFIDENCE_RATIO: u128 = 100; // 1% max confidence ratio (100/10000 = 1%)

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

// 🤖 AGENT KEEPER PROGRAM CONSTANTS
// Revenue Share Model: 45% Human Owner | 35% AI Agent | 15% Safety Fund | 5% Development
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500; // 45% to human owner
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500; // 35% to AI agent
pub const AGENT_REVENUE_SAFETY_BPS: u16 = 1500; // 15% to safety fund
pub const AGENT_REVENUE_DEV_BPS: u16 = 500; // 5% to development fund

// Agent System Limits
pub const MAX_AGENT_NAME_LENGTH: usize = 64;
pub const MAX_AGENT_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_AGENT_FRAMEWORK_LENGTH: usize = 32;
pub const MAX_AGENT_CAPABILITIES: usize = 10;

// Agent Rate Limits
pub const AGENT_MIN_RATE_LIMIT_SECONDS: u16 = 1; // Min 1 second between operations
pub const AGENT_MAX_RATE_LIMIT_SECONDS: u16 = 300; // Max 5 minutes between operations
pub const AGENT_DEFAULT_RATE_LIMIT: u16 = 15; // Default 15 seconds

// Agent Performance Thresholds
pub const AGENT_MIN_SUCCESS_RATE: u16 = 80; // Min 80% success rate
pub const AGENT_MAX_RESPONSE_TIME_MS: u32 = 5000; // Max 5 second response time

mod liquidation_helper {
    use super::*;

    pub fn execute_liquidation_start_internal<'a>(
        loan_account: &mut Account<LoanAccount>,
        system_config: &mut Account<SystemConfig>,
        liquidation_process: &mut Account<LiquidationProcess>,
        keeper_a: Pubkey,
        current_time: i64,
        vault_collateral_account: AccountInfo<'a>,
        seized_assets_vault: AccountInfo<'a>,
        vault_authority: AccountInfo<'a>,
        token_program: AccountInfo<'a>,
        vault_authority_bump: u8,
        liquidation_type: LiquidationType,
    ) -> Result<()> {
        // 🛡️ SECURITY: Validate collateral exists before liquidation
        require!(
            loan_account.collateral_amount > 0,
            GinvaError::InsufficientCollateral
        );

        let trigger_reward = loan_account
            .collateral_amount
            .saturating_mul(60)
            .checked_div(10000)
            .unwrap_or(0);

        // 🛡️ SECURITY: Validate reward doesn't exceed collateral (defensive check)
        let remaining_for_swap = loan_account
            .collateral_amount
            .saturating_sub(trigger_reward);

        // Additional validation: ensure we have collateral to transfer
        require!(remaining_for_swap > 0, GinvaError::InsufficientCollateral);

        let seeds = &[b"vault_auth".as_ref(), &[vault_authority_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts_seized = Transfer {
            from: vault_collateral_account,
            to: seized_assets_vault,
            authority: vault_authority.clone(),
        };
        let cpi_ctx_seized =
            CpiContext::new_with_signer(token_program, cpi_accounts_seized, signer);
        token::transfer(cpi_ctx_seized, remaining_for_swap)?;

        liquidation_process.loan_account = loan_account.key();
        liquidation_process.status = LiquidationStatus::Triggered as u8;
        liquidation_process.trigger_keeper = keeper_a;
        liquidation_process.seized_collateral_amount = remaining_for_swap;
        liquidation_process.triggered_at = current_time;
        liquidation_process.deadline_for_swap = current_time;
        liquidation_process.dex_activation_time = current_time + 21600;
        liquidation_process.swapped = false;
        liquidation_process.keeper_reward_amount = trigger_reward;
        liquidation_process.keeper_reward_claimed = false;
        liquidation_process.liquidation_type = liquidation_type as u8;

        loan_account.status = LoanStatus::LiquidationInProgress as u8;
        loan_account.liquidated_at = current_time;
        loan_account.keeper_address = keeper_a;
        let total_collateral_to_subtract = loan_account.collateral_amount;
        loan_account.collateral_amount = 0;

        system_config.total_collateral = system_config
            .total_collateral
            .saturating_sub(total_collateral_to_subtract);

        match liquidation_type {
            LiquidationType::HealthFactor => {
                msg!("🔴 HEALTH FACTOR LIQUIDATION TRIGGERED - Immediate action");
            }
            LiquidationType::Maturity => {
                msg!("🟡 MATATION TRIGGERED - 72hURITY LIQUID protection expired");
            }
        }

        msg!(
            "🔨 Liquidation Step 1 Complete! Keeper A reward: {} (0.6%)",
            trigger_reward
        );
        msg!(
            "🏪 Storefront opened! {} ready for sale at 6% discount",
            remaining_for_swap
        );
        msg!(
            "🦄 DEX fallback activates in 6 hours (at: {})",
            liquidation_process.dex_activation_time
        );

        emit!(LiquidationTriggered {
            loan_account: loan_account.key(),
            keeper: keeper_a,
            collateral_amount: remaining_for_swap,
            liquidation_type: liquidation_type as u8,
        });

        Ok(())
    }
}

#[program]
pub mod ginva {
    use super::*;

    // INITIALIZE SYSTEM
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

        // 🛡️ VALIDATION: Ensure critical addresses are not zero
        require!(
            system_config.ops_wallet != Pubkey::default(),
            GinvaError::InvalidWalletAddress
        );
        require!(
            system_config.reserve_wallet != Pubkey::default(),
            GinvaError::InvalidWalletAddress
        );

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

        // 🛡️ Safety Accumulation System: Initialize Safety Accumulation System parameters
        system_config.target_reserves = 500_000_000_000; // 500,000 USDC (6 decimals)
        system_config.protection_period = 15 * 24 * 60 * 60; // 15 days in seconds
        system_config.exit_fee_bps = 500; // 5% exit fee (500 basis points)
        system_config.reserve_wallet = ctx.accounts.reserve_wallet.key();

        // Initialize Protocol Config
        let protocol_config = &mut ctx.accounts.protocol_config;
        protocol_config.admin = ctx.accounts.admin.key();
        protocol_config.liquidation_timeout = 259200; // 3 days (259,200 seconds)
        protocol_config.auto_swap_reward_bps = 800; // 8% discount for storefront buyers
        protocol_config.distribute_reward_bps = 100; // 1% base rate (will be overridden by fixed 1.0 USDC)
        protocol_config.min_loan_size = 1_000_000; // 1 USDC (6 decimals)
        protocol_config.max_loan_size = 1_000_000_000_000; // 1M USDC (6 decimals)

        let current_time = Clock::get()?.unix_timestamp;

        // 💰 Initialize CONFIGURABLE INTEREST RATES
        system_config.base_interest_rate_bps = 800; // Default 8% (800 bps)
        system_config.max_interest_rate_bps = 2000; // Max 20% (2000 bps)
        system_config.last_rate_update = current_time;
        system_config.rate_update_cooldown = 86400; // 1 day cooldown (86400 seconds)

        // 🏠 Initialize CONFIGURABLE LTV LEVELS
        system_config.ltv_safe_percentage = 20; // 🟢 Safe: 20%
        system_config.ltv_standard_percentage = 40; // 🟡 Standard: 40%
        system_config.ltv_max_percentage = 60; // 🔴 Max: 60%
        system_config.last_ltv_update = current_time;
        system_config.ltv_update_cooldown = 86400; // 1 day cooldown (86400 seconds)

        // ☄️ Initialize ORACLE CIRCUIT BREAKER
        system_config.oracle_failure_count = 0;
        system_config.oracle_last_failure = 0;
        system_config.oracle_circuit_breaker_triggered = false;
        system_config.oracle_circuit_breaker_threshold = 3; // Trigger after 3 failures
        system_config.oracle_circuit_breaker_cooldown = 300; // 5 minutes cooldown

        // 🤖 Initialize KEEPER REGISTRY
        system_config.keeper_registration_enabled = false; // Disabled by default

        #[cfg(feature = "local-test")]
        msg!("⚠️ Note: Contract running in Local-Test Mode (Oracle checks disabled)");

        msg!("✅ System initialized with Auto-Swap Liquidation v3.0");
        msg!(
            "💰 Interest rate initialized: {}% (Max: {}%)",
            system_config.base_interest_rate_bps as f64 / 100.0,
            system_config.max_interest_rate_bps as f64 / 100.0
        );
        msg!(
            "🏠 LTV levels initialized: Safe: {}%, Standard: {}%, Max: {}%",
            system_config.ltv_safe_percentage,
            system_config.ltv_standard_percentage,
            system_config.ltv_max_percentage
        );
        Ok(())
    }

    // EMERGENCY CONTROLS

    /// Emergency Pause - Pause protocol immediately
    /// No timelock on pause to allow rapid response to emergencies
    pub fn emergency_pause(ctx: Context<AdminOnly>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(!system_config.is_paused, GinvaError::AlreadyPaused);

        system_config.is_paused = true;
        system_config.paused_at = Clock::get()?.unix_timestamp;

        msg!("🛑 PROTOCOL EMERGENCY PAUSE ACTIVATED");
        msg!("All transactions blocked immediately");

        // Emit event for monitoring
        emit!(EmergencyPause {
            admin: ctx.accounts.admin.key(),
            timestamp: system_config.paused_at,
        });

        Ok(())
    }

    /// Emergency Resume - Protocol remains locked for 48 hours after resume
    /// Users have time to prepare for potential changes after protocol resumes
    pub fn emergency_resume(ctx: Context<AdminOnly>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(system_config.is_paused, GinvaError::NotPaused);

        // 1. Unlock status (but operations still locked until timelock expires)
        system_config.is_paused = false;

        // 2. ⏱️ TIMELOCK: 48 hours - Protocol remains locked after resume
        let timelock_seconds = 172800;
        let current_time = Clock::get()?.unix_timestamp;
        system_config.ops_resume_at = current_time + timelock_seconds;

        let paused_duration = current_time - system_config.paused_at;
        msg!("✅ PROTOCOL RESUME INITIATED");
        msg!("Paused for: {} seconds", paused_duration);
        msg!(
            "⏰ Operations will resume at timestamp: {}",
            system_config.ops_resume_at
        );
        msg!("⏰ TIMELOCK: 48 hours - Protocol locked until timelock expires");

        // Emit event for monitoring
        emit!(EmergencyResume {
            admin: ctx.accounts.admin.key(),
            resume_at: system_config.ops_resume_at,
        });

        Ok(())
    }

    // ADMIN CONFIG UPDATES (Dynamic Parameters)
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

    // CONFIGURABLE INTEREST RATE MANAGEMENT

    pub fn update_interest_rates(
        ctx: Context<AdminOnly>,
        new_base_rate_bps: u16,
        new_max_rate_bps: u16,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ Security validations
        require!(
            new_base_rate_bps >= 50 && new_base_rate_bps <= 2000,
            GinvaError::InvalidInterestRateRange
        ); // 0.5% - 20% range
        require!(
            new_max_rate_bps >= new_base_rate_bps && new_max_rate_bps <= 5000,
            GinvaError::InvalidInterestRateRange
        ); // Base <= Max <= 50%
        require!(
            current_time >= system_config.last_rate_update + system_config.rate_update_cooldown,
            GinvaError::RateUpdateCooldownNotMet
        ); // Cooldown check

        // Update rates
        let old_rate = system_config.base_interest_rate_bps;
        system_config.base_interest_rate_bps = new_base_rate_bps;
        system_config.max_interest_rate_bps = new_max_rate_bps;
        system_config.last_rate_update = current_time;

        msg!(
            "📈 Interest rate updated: {}% -> {}% (Max: {}%)",
            old_rate as f64 / 100.0,
            new_base_rate_bps as f64 / 100.0,
            new_max_rate_bps as f64 / 100.0
        );

        // Emit event for monitoring
        emit!(InterestRateUpdated {
            admin: ctx.accounts.admin.key(),
            old_rate_bps: old_rate,
            new_rate_bps: new_base_rate_bps,
            max_rate_bps: new_max_rate_bps,
            timestamp: current_time,
        });

        Ok(())
    }

    // CONFIGURABLE LTV LEVEL MANAGEMENT

    pub fn update_ltv_levels(
        ctx: Context<AdminOnly>,
        new_ltv_safe: u64,
        new_ltv_standard: u64,
        new_ltv_max: u64,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        let current_time = Clock::get()?.unix_timestamp;

        // 🛡️ Security validations for LTV levels
        require!(
            new_ltv_safe > 0 && new_ltv_safe <= 30,
            GinvaError::InvalidLTVRange
        ); // 1% - 30% for safe
        require!(
            new_ltv_standard > new_ltv_safe && new_ltv_standard <= 50,
            GinvaError::InvalidLTVRange
        ); // Safe < Standard <= 50%
        require!(
            new_ltv_max > new_ltv_standard && new_ltv_max <= 90,
            GinvaError::InvalidLTVRange
        ); // Standard < Max <= 90%
        require!(
            current_time >= system_config.last_ltv_update + system_config.ltv_update_cooldown,
            GinvaError::LTVUpdateCooldownNotMet
        ); // Cooldown check

        // Store old values for logging
        let old_safe = system_config.ltv_safe_percentage;
        let old_standard = system_config.ltv_standard_percentage;
        let old_max = system_config.ltv_max_percentage;

        // Update LTV levels
        system_config.ltv_safe_percentage = new_ltv_safe;
        system_config.ltv_standard_percentage = new_ltv_standard;
        system_config.ltv_max_percentage = new_ltv_max;
        system_config.last_ltv_update = current_time;

        msg!(
            "🏠 LTV levels updated: Safe: {}% -> {}%, Standard: {}% -> {}%, Max: {}% -> {}%",
            old_safe,
            new_ltv_safe,
            old_standard,
            new_ltv_standard,
            old_max,
            new_ltv_max
        );

        // Emit event for monitoring
        emit!(LTVLevelsUpdated {
            admin: ctx.accounts.admin.key(),
            old_ltv_safe: old_safe,
            new_ltv_safe,
            old_ltv_standard: old_standard,
            new_ltv_standard,
            old_ltv_max: old_max,
            new_ltv_max,
            timestamp: current_time,
        });

        Ok(())
    }

    // FEATURE #6: MULTI-ASSET MANAGEMENT

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

    // UPDATE OPS WALLET
    pub fn update_ops_wallet(ctx: Context<UpdateOpsWallet>, new_ops_wallet: Pubkey) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        // 🛡️ SECURITY: Validate new wallet is not zero address
        require!(
            new_ops_wallet != Pubkey::default(),
            GinvaError::InvalidWalletAddress
        );

        // Record ops wallet old
        let old_wallet = system_config.ops_wallet;

        // Update to wallet new
        system_config.ops_wallet = new_ops_wallet;

        msg!("✅ Ops Wallet updated:");
        msg!("   Old: {:?}", old_wallet);
        msg!("   New: {:?}", new_ops_wallet);
        msg!("   Purpose: Team salaries, server costs, marketing, etc.");

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KEEPER REGISTRATION SYSTEM (Admin + Keeper Functions)
    // ═══════════════════════════════════════════════════════════════════════════

    /// Admin: Enable/disable keeper registration
    pub fn toggle_keeper_registration(ctx: Context<AdminOnly>, enabled: bool) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        // Store keeper registration state in SystemConfig
        system_config.keeper_registration_enabled = enabled;

        msg!("Keeper registration enabled: {}", enabled);

        emit!(KeeperRegistrationToggledEvent {
            admin: ctx.accounts.admin.key(),
            enabled,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Admin: Add a trusted keeper to the whitelist
    pub fn add_trusted_keeper(
        ctx: Context<AdminOnly>,
        keeper_address: Pubkey,
        keeper_name: String,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        // In a full implementation, this would create a KeeperRegistry account
        // For demonstration, we emit an event
        msg!(
            "Added trusted keeper: {:?} - {}",
            keeper_address,
            keeper_name
        );

        emit!(TrustedKeeperAddedEvent {
            admin: ctx.accounts.admin.key(),
            keeper: keeper_address,
            name: keeper_name,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Admin: Remove a keeper from the whitelist
    pub fn remove_trusted_keeper(ctx: Context<AdminOnly>, keeper_address: Pubkey) -> Result<()> {
        msg!("Removed trusted keeper: {:?}", keeper_address);

        emit!(TrustedKeeperRemovedEvent {
            admin: ctx.accounts.admin.key(),
            keeper: keeper_address,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Keeper: Heartbeat to prove keeper is alive and operational
    pub fn keeper_heartbeat(ctx: Context<KeeperHeartbeat>) -> Result<()> {
        let clock = Clock::get()?;

        emit!(KeeperHeartbeatEvent {
            keeper: ctx.accounts.keeper.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORACLE CIRCUIT BREAKER (Admin Functions)
    // ═══════════════════════════════════════════════════════════════════════════

    /// Admin: Manually trigger circuit breaker (emergency)
    pub fn trigger_circuit_breaker(ctx: Context<AdminOnly>, reason: String) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(
            !system_config.oracle_circuit_breaker_triggered,
            GinvaError::OracleCircuitBreakerTriggered
        );

        system_config.oracle_circuit_breaker_triggered = true;

        msg!("🔴 ORACLE CIRCUIT BREAKER TRIGGERED: {}", reason);

        emit!(CircuitBreakerTriggeredEvent {
            admin: ctx.accounts.admin.key(),
            reason,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Admin: Reset circuit breaker after oracle is fixed
    pub fn reset_circuit_breaker(ctx: Context<AdminOnly>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        require!(
            system_config.oracle_circuit_breaker_triggered,
            GinvaError::OracleTemporarilyUnavailable
        );

        // Check cooldown
        let current_time = Clock::get()?.unix_timestamp;
        let time_since_last_failure = current_time - system_config.oracle_last_failure;
        require!(
            time_since_last_failure >= system_config.oracle_circuit_breaker_cooldown,
            GinvaError::OracleTemporarilyUnavailable
        );

        system_config.oracle_circuit_breaker_triggered = false;
        system_config.oracle_failure_count = 0;

        msg!("✅ Oracle circuit breaker reset");

        emit!(CircuitBreakerResetEvent {
            admin: ctx.accounts.admin.key(),
            timestamp: current_time,
        });

        Ok(())
    }

    /// Admin: Update circuit breaker parameters
    pub fn update_circuit_breaker_params(
        ctx: Context<AdminOnly>,
        new_threshold: Option<u32>,
        new_cooldown: Option<i64>,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        if let Some(threshold) = new_threshold {
            require!(threshold > 0 && threshold <= 10, GinvaError::InvalidInput);
            system_config.oracle_circuit_breaker_threshold = threshold;
            msg!("Circuit breaker threshold updated to: {}", threshold);
        }

        if let Some(cooldown) = new_cooldown {
            require!(cooldown >= 60, GinvaError::InvalidInput); // Min 60 seconds
            system_config.oracle_circuit_breaker_cooldown = cooldown;
            msg!("Circuit breaker cooldown updated to: {} seconds", cooldown);
        }

        emit!(CircuitBreakerParamsUpdatedEvent {
            admin: ctx.accounts.admin.key(),
            new_threshold: system_config.oracle_circuit_breaker_threshold,
            new_cooldown: system_config.oracle_circuit_breaker_cooldown,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // DEPOSIT COLLATERAL
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
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

        // ✅ Multi-Ticket: Auto-assign loan_id from ticket_counter to prevent ID collisions
        let loan_id = ctx.accounts.user_rate_limit.ticket_counter as u32;
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

        // 🛡️ DEPOSIT FEE: Calculate and collect fee
        let deposit_fee = if system_config.deposit_fee_bps > 0 {
            amount
                .checked_mul(system_config.deposit_fee_bps as u64)
                .ok_or(GinvaError::ArithmeticOverflow)?
                .checked_div(10000)
                .ok_or(GinvaError::ArithmeticUnderflow)?
        } else {
            0
        };

        let amount_after_fee = amount
            .checked_sub(deposit_fee)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // Transfer Collateral: User -> Vault (after fee deduction)
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_collateral_account.to_account_info(),
            to: ctx.accounts.vault_collateral_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts);
        token::transfer(cpi_ctx, amount_after_fee)?;

        // Transfer fee to ops_wallet if applicable
        if deposit_fee > 0 {
            let cpi_accounts_fee = Transfer {
                from: ctx.accounts.user_collateral_account.to_account_info(),
                to: ctx.accounts.ops_wallet.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            let cpi_ctx_fee = CpiContext::new(cpi_program, cpi_accounts_fee);
            token::transfer(cpi_ctx_fee, deposit_fee)?;
        }

        // Update State
        // 🛡️ FIX: Use amount_after_fee for state update (fee goes to ops_wallet, not vault)
        loan_account.collateral_amount = loan_account
            .collateral_amount
            .saturating_add(amount_after_fee);
        loan_account.status = LoanStatus::Active as u8;
        loan_account.last_payment_at = clock.unix_timestamp;
        system_config.total_collateral = system_config
            .total_collateral
            .saturating_add(amount_after_fee);

        msg!(
            "✅ Collateral deposited: {} of {:?}",
            amount,
            asset_config.mint
        );
        Ok(())
    }

    // BORROW USDC
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

        // 🛡️ FLASH LOAN PROTECTION: Ensure collateral has been held for minimum blocks and time
        check_flash_loan_protection(
            loan_account.deposit_slot,
            clock.slot,
            loan_account.created_at,
            clock.unix_timestamp,
        )?;

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

        // 🛡️ ORACLE VALIDATION: Ensure price has been initialized
        require!(
            system_config.last_price_update > 0,
            GinvaError::OraclePriceNotInitialized
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

        // 🏠 CONFIGURABLE LTV: Read from SystemConfig
        let ltv_percentage = match ltv_option {
            1 => system_config.ltv_safe_percentage,
            2 => system_config.ltv_standard_percentage,
            3 => system_config.ltv_max_percentage,
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
                .ok_or(GinvaError::ArithmeticOverflow)?
                .checked_div(total_supply as u128)
                .unwrap_or(0) as u64
        } else {
            0
        };
        let fixed_rate = calculate_dynamic_interest(
            system_config.total_borrowed,
            current_liquidity,
            system_config,
        );
        loan_account.interest_rate_bps = fixed_rate;

        system_config.total_borrowed = system_config.total_borrowed.saturating_add(loan_amount);

        msg!(
            "💰 Loan created: {} USDC at {}% APR (Fixed rate for all LTV levels)",
            loan_amount,
            fixed_rate as f64 / 100.0
        );

        // Emit event for indexing
        emit!(LoanCreated {
            borrower: ctx.accounts.user.key(),
            loan_id,
            collateral_amount: loan_account.collateral_amount,
            loan_amount,
            interest_rate_bps: fixed_rate,
        });

        // 🛡️ RESET REENTRANCY GUARD: Allow next operation
        system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

        Ok(())
    }

    // EXTEND LOAN
    pub fn extend_loan(ctx: Context<ExtendLoan>) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;
        let loan_account = &mut ctx.accounts.loan_account;

        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            loan_account.borrower == ctx.accounts.user.key(),
            GinvaError::Unauthorized
        );
        require!(
            loan_account.status == LoanStatus::Active as u8,
            GinvaError::LoanNotActive
        );

        let current_time = Clock::get()?.unix_timestamp;

        let time_elapsed = current_time.saturating_sub(loan_account.last_payment_at);
        require!(time_elapsed > 0, GinvaError::NoInterestDue);

        let days_elapsed = time_elapsed / 86400;
        require!(days_elapsed >= 30, GinvaError::PaymentPeriodNotMet);

        // 🛡️ PRECISION FIX: Calculate with higher precision to minimize rounding errors
        let interest_amount = (loan_account.loan_amount as u128)
            .checked_mul(loan_account.interest_rate_bps as u128)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_mul(time_elapsed as u128)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_mul(INTEREST_PRECISION)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(31_536_000 * 10000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // Round up to favor the protocol (ceiling division)
        let interest_with_precision = interest_amount
            .checked_add(INTEREST_PRECISION - 1)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        let interest_payment = (interest_with_precision / INTEREST_PRECISION) as u64;

        let final_payment = if interest_payment == 0 && time_elapsed > 3600 {
            1
        } else {
            interest_payment
        };

        require!(final_payment > 0, GinvaError::NoInterestDue);

        // Phase 1: Split Interest into 3 parts: Capital 10%, Ops 24.75%, Stakers 65.25%
        let mut capital_share: u64 = 0;
        let mut ops_share: u64 = 0;
        let mut staker_share: u64 = 0;

        if final_payment > 0 {
            // 1. Capital 10%
            capital_share = final_payment
                .checked_div(10)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // 2. Remaining 90%
            let distributable = final_payment
                .checked_sub(capital_share)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // 3. Ops 27.5% of remaining (24.75% of total)
            ops_share = distributable
                .checked_mul(2750)
                .ok_or(GinvaError::ArithmeticOverflow)?
                .checked_div(10000)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // 4. Stakers get remainder (65.25% of total)
            staker_share = distributable
                .checked_sub(ops_share)
                .ok_or(GinvaError::ArithmeticUnderflow)?;
        }

        // Phase 2: Transfer to all wallets
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // Transfer to Capital Wallet (10%)
        if capital_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_usdc_account.to_account_info(),
                to: ctx.accounts.capital_wallet.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            token::transfer(
                CpiContext::new(cpi_program.clone(), cpi_accounts),
                capital_share,
            )?;
        }

        // Transfer to Ops Wallet (24.75%)
        if ops_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_usdc_account.to_account_info(),
                to: ctx.accounts.ops_wallet.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            token::transfer(
                CpiContext::new(cpi_program.clone(), cpi_accounts),
                ops_share,
            )?;
        }

        // Transfer to Revenue Wallet for Stakers (65.25%)
        if staker_share > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_usdc_account.to_account_info(),
                to: ctx.accounts.revenue_wallet.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            token::transfer(
                CpiContext::new(cpi_program.clone(), cpi_accounts),
                staker_share,
            )?;

            // Phase 3: Update acc_reward_per_share for stakers
            const REWARD_PRECISION: u128 = 1_000_000_000_000u128;
            if system_config.total_staked > 0 {
                let reward_with_precision = (staker_share as u128)
                    .checked_mul(REWARD_PRECISION)
                    .ok_or(GinvaError::ArithmeticOverflow)?;

                let reward_per_share_increment = reward_with_precision
                    .checked_div(system_config.total_staked as u128)
                    .unwrap_or(0);

                // Track undistributed dust
                let distributed = reward_per_share_increment
                    .checked_mul(system_config.total_staked as u128)
                    .unwrap_or(0);
                let dust = reward_with_precision.saturating_sub(distributed);
                system_config.reward_dust = system_config
                    .reward_dust
                    .checked_add(dust)
                    .unwrap_or(system_config.reward_dust);

                system_config.acc_reward_per_share = system_config
                    .acc_reward_per_share
                    .checked_add(reward_per_share_increment)
                    .ok_or(GinvaError::ArithmeticOverflow)?;

                msg!("💰 Staker reward: {} USDC (dust: {})", staker_share, dust);
            } else {
                // If no stakers, accumulate dust for later
                system_config.reward_dust = system_config
                    .reward_dust
                    .checked_add(
                        (staker_share as u128)
                            .checked_mul(REWARD_PRECISION)
                            .unwrap_or(0),
                    )
                    .unwrap_or(system_config.reward_dust);
            }
        }

        // Update loan timing
        loan_account.last_payment_at = current_time;
        loan_account.maturity_at = current_time + (loan_account.duration_days as i64 * 86400);

        msg!("✅ Loan extended: Interest paid {} USDC", final_payment);
        msg!("📅 New maturity: {}", loan_account.maturity_at);

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIQUIDATION SYSTEM A: Health Factor Based (Price Protection)
    // ═══════════════════════════════════════════════════════════════════════════
    // Triggered when collateral value drops below loan value
    // IMMEDIATE liquidation - no protection period (protects investor funds)
    pub fn liquidate_by_health_factor(ctx: Context<LiquidateByHealthFactor>) -> Result<()> {
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
            liquidation_process.status == 0,
            GinvaError::ReentrancyDetected
        );

        // 🛡️ ATOMIC LIQUIDATION LOCK: Prevent double liquidation
        require!(
            !loan_account.liquidation_lock,
            GinvaError::AlreadyBeingLiquidated
        );
        loan_account.liquidation_lock = true;

        // 🛡️ REENTRANCY GUARD: Prevent recursive calls
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 🛡️ SCOPE GUARD: Ensure lock is always reset
        let result = (|| -> Result<()> {
            // 1. Check Health Factor ONLY
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
                6,
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

            // 🔴 SYSTEM A: Health factor must be < 100 (undercollateralized)
            require!(health_factor < 100, GinvaError::HealthFactorNotCritical);

            msg!(
                "🔴 HEALTH FACTOR LIQUIDATION: HF={} (< 100), Price={}, Collateral Value={}",
                health_factor,
                current_price,
                collateral_value
            );

            // Execute liquidation with type marker
            liquidation_helper::execute_liquidation_start_internal(
                loan_account,
                system_config,
                liquidation_process,
                keeper_a,
                current_time,
                ctx.accounts.vault_collateral_account.to_account_info(),
                ctx.accounts.seized_assets_vault.to_account_info(),
                ctx.accounts.vault_authority.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.bumps.vault_authority,
                LiquidationType::HealthFactor,
            )?;

            // 🛡️ RESET REENTRANCY GUARD
            system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

            Ok(())
        })();

        // 🛡️ ALWAYS RESET LOCK
        loan_account.liquidation_lock = false;
        result
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIQUIDATION SYSTEM B: Maturity Based (Borrower Protection)
    // ═══════════════════════════════════════════════════════════════════════════
    // Triggered when loan maturity expires without repayment/extension
    // 72-HOUR PROTECTION PERIOD before liquidation (gives borrower time to act)
    pub fn liquidate_by_maturity(ctx: Context<LiquidateByMaturity>) -> Result<()> {
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
            liquidation_process.status == 0,
            GinvaError::ReentrancyDetected
        );

        // 🛡️ ATOMIC LIQUIDATION LOCK: Prevent double liquidation
        require!(
            !loan_account.liquidation_lock,
            GinvaError::AlreadyBeingLiquidated
        );
        loan_account.liquidation_lock = true;

        // 🛡️ REENTRANCY GUARD: Prevent recursive calls
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 🛡️ SCOPE GUARD: Ensure lock is always reset
        let result = (|| -> Result<()> {
            // 🟡 SYSTEM B: Check maturity + 72h protection period
            require!(
                current_time > loan_account.maturity_at,
                GinvaError::LoanNotYetMatured
            );

            let protection_end_time = loan_account.maturity_at + (72 * 3600); // 72 hours
            require!(
                current_time > protection_end_time,
                GinvaError::InProtectionPeriod
            );

            msg!(
                "🟡 MATURITY LIQUIDATION: Maturity={}, Protection ends={}, Now={}",
                loan_account.maturity_at,
                protection_end_time,
                current_time
            );

            // Execute liquidation with type marker
            liquidation_helper::execute_liquidation_start_internal(
                loan_account,
                system_config,
                liquidation_process,
                keeper_a,
                current_time,
                ctx.accounts.vault_collateral_account.to_account_info(),
                ctx.accounts.seized_assets_vault.to_account_info(),
                ctx.accounts.vault_authority.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.bumps.vault_authority,
                LiquidationType::Maturity,
            )?;

            // 🛡️ RESET REENTRANCY GUARD
            system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

            Ok(())
        })();

        // 🛡️ ALWAYS RESET LOCK
        loan_account.liquidation_lock = false;
        result
    }

    // STEP 1B: CLAIM TRIGGER REWARD (Keeper A)
    // Separate function to avoid stack overflow
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

    // GINVA PAWN SHOP (Time-Decay Pricing / Dutch Auction)
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

        // 🛡️ REENTRANCY GUARD: Prevent reentrancy attacks
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 🛡️ SCOPE GUARD: Ensure reentrancy guard is always reset
        let result = (|| -> Result<()> {
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

            // Time-decay pricing engine
            let elapsed_time = current_time.saturating_sub(liquidation_process.triggered_at);

            // Set discount based on elapsed time
            let current_discount_bps = if elapsed_time <= 600 {
                800 // 0-10 min: 8% discount (Golden Hour)
            } else if elapsed_time <= 1800 {
                600 // 10-30 min: 6% discount
            } else if elapsed_time <= 3600 {
                300 // 30-60 min: 3% discount
            } else {
                0 // > 60 min: Market price (No Discount)
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

            // Emit event for indexing
            emit!(StorefrontPurchase {
                buyer: caller,
                liquidation_process: liquidation_process.key(),
                amount: seized_amount,
                discount_bps: current_discount_bps,
                usdc_paid: usdc_required_from_caller,
            });

            Ok(())
        })();

        // 🛡️ ALWAYS RESET REENTRANCY GUARD
        system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;
        result
    }

    // DEX FALLBACK via Jupiter CPI
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

        // 🛡️ REENTRANCY GUARD: Prevent reentrancy attacks
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 2️⃣ VALIDATE REMAINING ACCOUNTS
        require!(
            !ctx.remaining_accounts.is_empty(),
            GinvaError::InvalidJupiterRoute
        );
        require!(
            ctx.remaining_accounts.len() >= MIN_JUPITER_ACCOUNTS,
            GinvaError::InvalidJupiterRoute
        );

        // 🛡️ SECURITY: Validate that remaining accounts are valid token accounts or program accounts
        // This prevents passing arbitrary accounts to Jupiter
        for (i, account) in ctx.remaining_accounts.iter().enumerate() {
            // Skip validation for program accounts (they don't have data)
            if *account.owner == ctx.accounts.jupiter_program.key() {
                continue;
            }

            // For token accounts, validate minimum data length
            if *account.owner == ctx.accounts.token_program.key() {
                require!(
                    account.data_len() >= 165, // Token account minimum size
                    GinvaError::InvalidJupiterRoute
                );
            }

            // Ensure no account is the system program or a PDA we control
            require!(
                account.key() != ctx.accounts.system_program.key(),
                GinvaError::InvalidJupiterRoute
            );
        }

        // 2.1 VALIDATE JUPITER DATA
        require!(
            data.len() >= MIN_JUPITER_DATA_LEN,
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

        // Emit event for indexing
        emit!(DexFallbackCompleted {
            executor: ctx.accounts.caller.key(),
            liquidation_process: liquidation_process.key(),
            collateral_spent,
            usdc_received,
        });

        // 🛡️ RESET REENTRANCY GUARD: Allow next operation
        system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

        Ok(())
    }

    // Step 3: Finalize liquidation process (Revenue distribution)
    // New logic:
    // - Keeper C Receives 1.0 USDC fixed (or maximum 10% if amount is small)
    // - Priority: Keeper C Receivesbefore then return principal
    // - Profit split 3-way: Liquidity 10% / Team 24.75% / Revenue 65.25%
    // - Excess (if any) send to Reserve fund as Insurance fund
    // - Supports bad debt cases (No panic if insufficient funds)
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
        // Priority 4: Surplus to Reserve Wallet (insurance fund)

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
                // 🛡️ FIX: Use 1e12 precision (same as claim_staking_rewards)
                const REWARD_PRECISION: u128 = 1_000_000_000_000u128; // 1e12 precision
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

        // Step D: Send Surplus to Reserve Wallet (Insurance Fund)
        // Any remaining funds after all distributions go to reserve
        let reserve_amount = remaining_funds;
        if reserve_amount > 0 {
            let cpi_accounts_reserve = Transfer {
                from: ctx.accounts.processing_vault.to_account_info(),
                to: ctx.accounts.reserve_wallet.to_account_info(),
                authority: ctx.accounts.processing_vault_authority.to_account_info(),
            };
            let cpi_ctx_reserve =
                CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_reserve, signer);
            token::transfer(cpi_ctx_reserve, reserve_amount)?;
            remaining_funds = remaining_funds.saturating_sub(reserve_amount);

            msg!("📦 Surplus {} USDC sent to Reserve Wallet", reserve_amount);
            msg!("   → Strengthens protocol insurance fund");
        }

        // 4. Update Status
        liquidation_process.status = LiquidationStatus::Finalized as u8;
        liquidation_process.distribute_keeper = keeper_c;
        liquidation_process.finalized_at = current_time;
        liquidation_process.keeper_c_reward = actual_keeper_reward;
        liquidation_process.principal_returned = principal_return;
        liquidation_process.growth_fund = capital_share; // Record capital share
        liquidation_process.revenue_share = total_profit; // Record total profit handled
        liquidation_process.reserve_amount = reserve_amount; // Record reserve amount

        // 🛡️ FIX: Now mark loan as fully Liquidated since finalize succeeded
        loan_account.status = LoanStatus::Liquidated as u8;

        system_config.total_borrowed = system_config.total_borrowed.saturating_sub(loan_principal);

        // 5. Record data
        msg!("✅ Step 3 complete! Liquidation finalized with 3-way Revenue split");
        msg!("📊 Distribution summary:");
        msg!("   💰 USDC Total available: {}", total_usdc);
        msg!("   🎯 Keeper C reward: {}", actual_keeper_reward);
        msg!(
            "   🏦 Principal return: {} / {}",
            principal_return,
            loan_principal
        );
        msg!("   📈 Total profit: {}", total_profit);
        msg!("   ├─ Liquidity (10%): {}", capital_share);
        msg!("   ├─ Team (~24.75%): {}", ops_share);
        msg!("   ├─ Revenue (~65.25%): {}", revenue_share);
        msg!("   └─ Reserve fund (Excess): {}", reserve_amount);

        if principal_return < loan_principal {
            let bad_debt = loan_principal.saturating_sub(principal_return);
            msg!("   ⚠️  Detected bad debt: {} USDC", bad_debt);
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

    // TIMEOUT RECOVERY
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

    // REPAY LOAN
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        let loan_account = &mut ctx.accounts.loan_account;
        let system_config = &mut ctx.accounts.system_config;
        let clock = Clock::get()?;

        // 🛡️ SECURITY GUARD 2.0: Check pause status + timelock
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);
        require!(
            clock.unix_timestamp >= system_config.ops_resume_at,
            GinvaError::SystemInCooldown
        );

        // 🛡️ REENTRANCY GUARD: Prevent recursive calls
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

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

        // 2. User pays USDC - Split Interest into 3 parts: Capital 10%, Ops 24.75%, Stakers 65.25%
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // 2a. Principal -> Capital Wallet
        let cpi_accounts_principal = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.capital_wallet.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx_principal = CpiContext::new(cpi_program.clone(), cpi_accounts_principal);
        token::transfer(cpi_ctx_principal, principal)?;

        // 2b. Interest Split: 10% Capital, 24.75% Ops, 65.25% Stakers
        if interest > 0 {
            // Calculate shares
            let capital_share = interest
                .checked_div(10)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            let distributable = interest
                .checked_sub(capital_share)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            let ops_share = distributable
                .checked_mul(2750)
                .ok_or(GinvaError::ArithmeticOverflow)?
                .checked_div(10000)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            let staker_share = distributable
                .checked_sub(ops_share)
                .ok_or(GinvaError::ArithmeticUnderflow)?;

            // Transfer to Capital Wallet (10%)
            if capital_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.user_usdc_account.to_account_info(),
                    to: ctx.accounts.capital_wallet.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                };
                token::transfer(
                    CpiContext::new(cpi_program.clone(), cpi_accounts),
                    capital_share,
                )?;
            }

            // Transfer to Ops Wallet (24.75%)
            if ops_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.user_usdc_account.to_account_info(),
                    to: ctx.accounts.ops_wallet.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                };
                token::transfer(
                    CpiContext::new(cpi_program.clone(), cpi_accounts),
                    ops_share,
                )?;
            }

            // Transfer to Revenue Wallet for Stakers (65.25%)
            if staker_share > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.user_usdc_account.to_account_info(),
                    to: ctx.accounts.revenue_wallet.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                };
                token::transfer(
                    CpiContext::new(cpi_program.clone(), cpi_accounts),
                    staker_share,
                )?;

                // 🛡️ CRITICAL FIX: Update acc_reward_per_share for stakers
                // Use 1e12 precision (same as claim_staking_rewards)
                const REWARD_PRECISION: u128 = 1_000_000_000_000u128;
                if system_config.total_staked > 0 {
                    let reward_with_precision = (staker_share as u128)
                        .checked_mul(REWARD_PRECISION)
                        .ok_or(GinvaError::ArithmeticOverflow)?;

                    let reward_per_share_increment = reward_with_precision
                        .checked_div(system_config.total_staked as u128)
                        .unwrap_or(0);

                    // Track undistributed dust
                    let distributed = reward_per_share_increment
                        .checked_mul(system_config.total_staked as u128)
                        .unwrap_or(0);
                    let dust = reward_with_precision.saturating_sub(distributed);
                    system_config.reward_dust = system_config
                        .reward_dust
                        .checked_add(dust)
                        .unwrap_or(system_config.reward_dust);

                    system_config.acc_reward_per_share = system_config
                        .acc_reward_per_share
                        .checked_add(reward_per_share_increment)
                        .ok_or(GinvaError::ArithmeticOverflow)?;

                    msg!("💰 Staker reward: {} USDC (dust: {})", staker_share, dust);
                } else {
                    // If no stakers, accumulate dust for later
                    system_config.reward_dust = system_config
                        .reward_dust
                        .checked_add(
                            (staker_share as u128)
                                .checked_mul(REWARD_PRECISION)
                                .unwrap_or(0),
                        )
                        .unwrap_or(system_config.reward_dust);
                }
            }
        }

        // 3. Vault returns Collateral -> User (PDA Signer)
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

        // 🛡️ FIX: RESET REENTRANCY GUARD - Critical fix to prevent permanent protocol lock
        system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

        Ok(())
    }

    // PAY INTEREST (Monthly Payment)
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
                        to: ctx.accounts.ops_wallet.to_account_info(),
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
        // 🛡️ FIX: Use 1e12 precision (same as claim_staking_rewards)
        const REWARD_PRECISION: u128 = 1_000_000_000_000u128; // 1e12 precision
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

    // STAKING & REWARDS

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

        // 🛡️ REENTRANCY GUARD: Prevent reentrancy attacks
        check_reentrancy_guard(config.reentrancy_guard)?;
        config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 🛡️ MAX STAKE CAP: Prevent whale dominance
        require!(
            config
                .total_staked
                .checked_add(amount)
                .ok_or(GinvaError::ArithmeticOverflow)?
                <= MAX_TOTAL_STAKED,
            GinvaError::MaxStakeCapReached
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

        // 🛡️ Safety Accumulation System: Record deposit time for safety accumulation period
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

        // 🛡️ RESET REENTRANCY GUARD: Allow next operation
        config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

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

        // 🛡️ REENTRANCY GUARD: Prevent reentrancy attacks
        check_reentrancy_guard(config.reentrancy_guard)?;
        // Note: We don't set guard here because config is immutable (&)
        // The transfer is the last operation, so it's safe

        // 1. Calculate Pending Reward
        let accumulated = (stake.staked_amount as u128)
            .checked_mul(config.acc_reward_per_share)
            .ok_or(GinvaError::ArithmeticOverflow)?
            .checked_div(1_000_000_000_000)
            .ok_or(GinvaError::ArithmeticUnderflow)?;

        // 🛡️ FIX: Use saturating_sub to prevent underflow if reward calculation has issues
        let pending = accumulated.saturating_sub(stake.reward_debt);

        require!(pending > 0, GinvaError::NoPendingRewards);

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

    // Unstake LP tokens with Safety Accumulation System (Safety Accumulation System)
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

        // 🛡️ Safety Accumulation System (Safety Accumulation System)
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
                    "🛡️ Safety Accumulation System: Accumulation period fee {} USDC ({}%) - System is building stability",
                    exit_fee_amount,
                    config.exit_fee_bps / 100
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
                "🛡️ Safety Accumulation System: Fee toReserve fund {} USDC",
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

    // CHECK HEALTH FACTOR (Risk Monitoring)
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

    // STATUS TRACKING (Loan Lifecycle)
    pub fn check_overdue_loan(ctx: Context<CheckLoanStatus>) -> Result<()> {
        let loan = &mut ctx.accounts.loan_account;
        let current_time = Clock::get()?.unix_timestamp;

        // Check only non-finalized status (Active or Overdue)
        require!(
            loan.status == LoanStatus::Active as u8 || loan.status == LoanStatus::Overdue as u8,
            GinvaError::LoanNotActive
        );

        let days_since_payment = (current_time - loan.last_payment_at) / 86400;

        if days_since_payment >= 34 {
            // More than 33 days = Default (Default - Pending seizure)
            loan.status = LoanStatus::Default as u8;
            msg!("🚨 LOAN DEFAULTED! Days overdue: {}", days_since_payment);
        } else if days_since_payment >= 31 {
            // 31-33 days = Overdue (Overdue - Start warning)
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

    // ═══════════════════════════════════════════════════════════════════════════
    // 🤖 AGENT KEEPER PROGRAM - INSTRUCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // REGISTER AGENT - Register a new AI Agent with the protocol
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        description: String,
        framework: String,
    ) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let system_config = &mut ctx.accounts.system_config;
        let clock = Clock::get()?;

        // Security: Check pause status
        require!(!system_config.is_paused, GinvaError::ProtocolPaused);

        // Check if agent already registered
        require!(
            agent_account.agent_pubkey == Pubkey::default(),
            GinvaError::AgentAlreadyRegistered
        );

        // 🛡️ SECURITY: Verify usdc_account belongs to owner
        require!(
            ctx.accounts.usdc_account.owner == ctx.accounts.owner.key(),
            GinvaError::Unauthorized
        );

        // Validate input
        require!(
            name.len() > 0 && name.len() <= MAX_AGENT_NAME_LENGTH,
            GinvaError::InvalidInput
        );
        require!(
            description.len() <= MAX_AGENT_DESCRIPTION_LENGTH,
            GinvaError::InvalidInput
        );
        require!(
            framework.len() > 0 && framework.len() <= MAX_AGENT_FRAMEWORK_LENGTH,
            GinvaError::InvalidInput
        );

        // Initialize agent account
        agent_account.agent_pubkey = ctx.accounts.owner.key();
        agent_account.metadata = AgentMetadata {
            name,
            description,
            framework,
            version: "1.0.0".to_string(),
            capabilities: vec!["liquidation".to_string(), "monitoring".to_string()],
            owner: ctx.accounts.owner.key(),
            contact: String::new(),
        };
        agent_account.status = AgentStatus::Active;
        agent_account.roles = vec![AgentRole::All];
        agent_account.performance = AgentPerformance::default();
        agent_account.settings = AgentSettings::default();
        agent_account.usdc_account = ctx.accounts.usdc_account.key();
        agent_account.registered_at = clock.unix_timestamp;
        agent_account.last_active_at = clock.unix_timestamp;
        agent_account.pending_rewards = 0;
        agent_account.version = 1;

        msg!(
            "🤖 Agent registered: {} ({})",
            agent_account.metadata.name,
            agent_account.agent_pubkey
        );
        msg!("Framework: {}", agent_account.metadata.framework);
        msg!("Revenue split: 45% Human | 35% Agent | 15% Safety | 5% Dev");

        emit!(AgentRegistered {
            agent: agent_account.agent_pubkey,
            owner: agent_account.metadata.owner,
            framework: agent_account.metadata.framework.clone(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // UPDATE AGENT SETTINGS - Update agent configuration
    pub fn update_agent_settings(
        ctx: Context<UpdateAgentSettings>,
        max_concurrent_ops: Option<u16>,
        rate_limit_seconds: Option<u16>,
        min_health_factor: Option<u16>,
        max_slippage_bps: Option<u16>,
    ) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let clock = Clock::get()?;

        // 🔒 SECURITY: Verify owner is calling this function
        require!(
            ctx.accounts.owner.key() == agent_account.metadata.owner,
            GinvaError::Unauthorized
        );

        // Check agent is active
        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );

        // Update settings
        if let Some(max_ops) = max_concurrent_ops {
            agent_account.settings.max_concurrent_ops = max_ops;
        }
        if let Some(rate_limit) = rate_limit_seconds {
            require!(
                rate_limit >= AGENT_MIN_RATE_LIMIT_SECONDS
                    && rate_limit <= AGENT_MAX_RATE_LIMIT_SECONDS,
                GinvaError::InvalidInput
            );
            agent_account.settings.rate_limit_seconds = rate_limit;
        }
        if let Some(min_hf) = min_health_factor {
            agent_account.settings.min_health_factor = min_hf;
        }
        if let Some(slippage) = max_slippage_bps {
            agent_account.settings.max_slippage_bps = slippage;
        }

        agent_account.last_active_at = clock.unix_timestamp;

        msg!("🤖 Agent settings updated: {}", agent_account.metadata.name);
        Ok(())
    }

    // RECORD AGENT OPERATION - Record a successful agent operation for rewards
    pub fn record_agent_operation(
        ctx: Context<RecordAgentOperation>,
        loan_account_pubkey: Pubkey,
        operation_type: u8,
        reward_amount: u64,
        success: bool,
        response_time_ms: u32,
    ) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let revenue_distribution = &mut ctx.accounts.revenue_distribution;
        let system_config = &mut ctx.accounts.system_config;
        let clock = Clock::get()?;

        // 🔒 SECURITY: Reentrancy guard
        check_reentrancy_guard(system_config.reentrancy_guard)?;
        system_config.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;

        // 🔒 SECURITY: Verify owner or agent is calling this function
        require!(
            ctx.accounts.agent.key() == agent_account.metadata.owner
                || ctx.accounts.agent.key() == agent_account.agent_pubkey,
            GinvaError::Unauthorized
        );

        // Validate agent status
        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );
        require!(
            agent_account.settings.is_enabled,
            GinvaError::AgentOperationsDisabled
        );
        require!(!agent_account.settings.is_paused, GinvaError::AgentPaused);

        // Check rate limiting
        let time_since_last = clock
            .unix_timestamp
            .saturating_sub(agent_account.last_active_at);
        require!(
            time_since_last >= agent_account.settings.rate_limit_seconds as i64,
            GinvaError::AgentRateLimitExceeded
        );

        // 🛡️ ANTI-COLLUSION: Prevent agent from operating on its own loan
        // Agent cannot record operations for loans where it or its owner is the borrower
        // Note: This requires loan_account to be passed and validated in production
        // For now, we log a warning for manual review
        if operation_type == 1 || operation_type == 2 || operation_type == 3 {
            msg!(
                "⚠️ ANTI-COLLUSION: Operation {} by agent {} on loan {}",
                operation_type,
                agent_account.agent_pubkey,
                loan_account_pubkey
            );
        }

        // Update performance metrics
        if success {
            agent_account.performance.successful_operations = agent_account
                .performance
                .successful_operations
                .saturating_add(1);
        } else {
            agent_account.performance.failed_operations = agent_account
                .performance
                .failed_operations
                .saturating_add(1);
        }

        // Calculate success rate
        let total_ops = agent_account.performance.successful_operations
            + agent_account.performance.failed_operations;
        if total_ops > 0 {
            agent_account.performance.success_rate =
                ((agent_account.performance.successful_operations as u128 * 10000)
                    / total_ops as u128) as u16;
        }

        // Update response time (moving average)
        if agent_account.performance.avg_response_time_ms > 0 {
            agent_account.performance.avg_response_time_ms =
                (agent_account.performance.avg_response_time_ms + response_time_ms) / 2;
        } else {
            agent_account.performance.avg_response_time_ms = response_time_ms;
        }

        // Check performance threshold
        require!(
            agent_account.performance.success_rate >= AGENT_MIN_SUCCESS_RATE,
            GinvaError::AgentPerformanceBelowThreshold
        );

        // Update timestamps
        agent_account.last_active_at = clock.unix_timestamp;

        // Calculate revenue shares (45/35/15/5)
        if reward_amount > 0 {
            let human_share = reward_amount
                .saturating_mul(AGENT_REVENUE_HUMAN_SHARE_BPS as u64)
                .checked_div(10000)
                .unwrap_or(0);

            let ai_share = reward_amount
                .saturating_mul(AGENT_REVENUE_AI_SHARE_BPS as u64)
                .checked_div(10000)
                .unwrap_or(0);

            let safety_share = reward_amount
                .saturating_mul(AGENT_REVENUE_SAFETY_BPS as u64)
                .checked_div(10000)
                .unwrap_or(0);

            let dev_share = reward_amount
                .saturating_mul(AGENT_REVENUE_DEV_BPS as u64)
                .checked_div(10000)
                .unwrap_or(0);

            // Update agent's pending rewards (AI agent's 35% share)
            agent_account.performance.total_earnings = agent_account
                .performance
                .total_earnings
                .saturating_add(ai_share);
            agent_account.pending_rewards = agent_account.pending_rewards.saturating_add(ai_share);

            // Update revenue distribution
            revenue_distribution.total_revenue = revenue_distribution
                .total_revenue
                .saturating_add(reward_amount);
            revenue_distribution.human_share_accumulated = revenue_distribution
                .human_share_accumulated
                .saturating_add(human_share);
            revenue_distribution.ai_share_accumulated = revenue_distribution
                .ai_share_accumulated
                .saturating_add(ai_share);
            revenue_distribution.safety_fund_accumulated = revenue_distribution
                .safety_fund_accumulated
                .saturating_add(safety_share);
            revenue_distribution.dev_fund_accumulated = revenue_distribution
                .dev_fund_accumulated
                .saturating_add(dev_share);

            msg!("💰 Agent operation recorded: {} reward", reward_amount);
            msg!(
                "   Human (45%): {} | Agent (35%): {} | Safety (15%): {} | Dev (5%): {}",
                human_share,
                ai_share,
                safety_share,
                dev_share
            );
        }

        // 🔒 RESET REENTRANCY GUARD
        system_config.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;

        emit!(AgentOperationRecorded {
            agent: agent_account.agent_pubkey,
            loan_account: loan_account_pubkey,
            operation_type,
            reward_amount,
            success,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // CLAIM AGENT REWARDS - Agent claims its accumulated rewards
    pub fn claim_agent_rewards(ctx: Context<ClaimAgentRewards>) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let revenue_distribution = &mut ctx.accounts.revenue_distribution;

        // Validate agent status
        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );

        // Check pending rewards
        require!(
            agent_account.pending_rewards > 0,
            GinvaError::NoPendingRewards
        );

        let reward_amount = agent_account.pending_rewards;

        // Check revenue distribution has sufficient funds
        require!(
            revenue_distribution.ai_share_accumulated >= reward_amount,
            GinvaError::InsufficientFunds
        );

        // Transfer rewards to agent's USDC account
        let bump = ctx.bumps.revenue_wallet_authority;
        let seeds = &[b"revenue_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.revenue_wallet.to_account_info(),
            to: ctx.accounts.agent_usdc_account.to_account_info(),
            authority: ctx.accounts.revenue_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, reward_amount)?;

        // Update state
        revenue_distribution.ai_share_accumulated = revenue_distribution
            .ai_share_accumulated
            .saturating_sub(reward_amount);
        agent_account.pending_rewards = 0;

        msg!("🤖 Agent claimed rewards: {} USDC", reward_amount);

        emit!(AgentRewardsClaimed {
            agent: agent_account.agent_pubkey,
            amount: reward_amount,
        });

        Ok(())
    }

    // CLAIM HUMAN OWNER SHARE - Human owner claims their 45% share
    pub fn claim_human_share(ctx: Context<ClaimHumanShare>) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let revenue_distribution = &mut ctx.accounts.revenue_distribution;

        // Validate agent is registered and active
        require!(
            agent_account.agent_pubkey != Pubkey::default(),
            GinvaError::AgentNotRegistered
        );
        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );

        // Get human owner's pending share
        let pending_human_share = revenue_distribution.human_share_accumulated;

        // Check there are funds to claim
        require!(pending_human_share > 0, GinvaError::NoPendingRewards);

        // Transfer to human owner's USDC account
        let bump = ctx.bumps.revenue_wallet_authority;
        let seeds = &[b"revenue_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.revenue_wallet.to_account_info(),
            to: ctx.accounts.owner_usdc_account.to_account_info(),
            authority: ctx.accounts.revenue_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, pending_human_share)?;

        // Update distribution state
        revenue_distribution.human_share_accumulated = revenue_distribution
            .human_share_accumulated
            .saturating_sub(pending_human_share);

        msg!("💰 Human owner claimed: {} USDC", pending_human_share);

        emit!(HumanShareClaimed {
            owner: agent_account.metadata.owner,
            agent: agent_account.agent_pubkey,
            amount: pending_human_share,
        });

        Ok(())
    }

    // DISTRIBUTE SAFETY FUND - Admin distributes safety fund to eligible recipients
    pub fn distribute_safety_fund(
        ctx: Context<DistributeSafetyFund>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let revenue_distribution = &mut ctx.accounts.revenue_distribution;
        let system_config = &ctx.accounts.system_config;

        // Security: Only admin can distribute
        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        // Check sufficient funds in safety fund
        require!(
            revenue_distribution.safety_fund_accumulated >= amount,
            GinvaError::InsufficientFunds
        );

        // Transfer to recipient
        let bump = ctx.bumps.revenue_wallet_authority;
        let seeds = &[b"revenue_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.revenue_wallet.to_account_info(),
            to: ctx.accounts.recipient_usdc_account.to_account_info(),
            authority: ctx.accounts.revenue_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update distribution state
        revenue_distribution.safety_fund_accumulated = revenue_distribution
            .safety_fund_accumulated
            .saturating_sub(amount);

        msg!(
            "🛡️ Safety fund distributed: {} USDC to {}",
            amount,
            recipient
        );

        emit!(SafetyFundDistributed {
            recipient,
            amount,
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    // DISTRIBUTE DEV FUND - Admin distributes development fund
    pub fn distribute_dev_fund(
        ctx: Context<DistributeDevFund>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let revenue_distribution = &mut ctx.accounts.revenue_distribution;
        let system_config = &ctx.accounts.system_config;

        // Security: Only admin can distribute
        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        // Check sufficient funds in dev fund
        require!(
            revenue_distribution.dev_fund_accumulated >= amount,
            GinvaError::InsufficientFunds
        );

        // Transfer to recipient
        let bump = ctx.bumps.revenue_wallet_authority;
        let seeds = &[b"revenue_auth".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.revenue_wallet.to_account_info(),
            to: ctx.accounts.recipient_usdc_account.to_account_info(),
            authority: ctx.accounts.revenue_wallet_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update distribution state
        revenue_distribution.dev_fund_accumulated = revenue_distribution
            .dev_fund_accumulated
            .saturating_sub(amount);

        msg!("💻 Dev fund distributed: {} USDC to {}", amount, recipient);

        emit!(DevFundDistributed {
            recipient,
            amount,
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    // PAUSE/UNPAUSE AGENT - Admin can pause agent for maintenance
    pub fn pause_agent(ctx: Context<PauseAgent>, pause: bool) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let system_config = &ctx.accounts.system_config;

        // 🔒 SECURITY: Only admin can pause/unpause agents
        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );

        agent_account.settings.is_paused = pause;

        if pause {
            msg!("🤖 Agent paused: {}", agent_account.metadata.name);
        } else {
            msg!("🤖 Agent unpaused: {}", agent_account.metadata.name);
        }

        Ok(())
    }

    // DISABLE AGENT - Admin can disable misbehaving agent
    pub fn disable_agent(ctx: Context<DisableAgent>) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        let system_config = &ctx.accounts.system_config;

        // 🔒 SECURITY: Only admin can disable agents
        require!(
            ctx.accounts.admin.key() == system_config.admin,
            GinvaError::Unauthorized
        );

        require!(
            matches!(agent_account.status, AgentStatus::Active),
            GinvaError::AgentNotActive
        );

        agent_account.status = AgentStatus::Disabled;
        agent_account.settings.is_enabled = false;

        msg!("🤖 Agent disabled: {}", agent_account.metadata.name);

        emit!(AgentDisabled {
            agent: agent_account.agent_pubkey,
        });

        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AGENT KEEPER PROGRAM - CONTEXT STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + size_of::<AgentAccount>(),
        seeds = [b"agent", owner.key().as_ref()],
        bump
    )]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub usdc_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = 8 + size_of::<AgentRevenueDistribution>(),
        seeds = [b"agent_revenue"],
        bump
    )]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub system_config: Account<'info, SystemConfig>,
    pub system_program: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateAgentSettings<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    pub system_config: Account<'info, SystemConfig>,
}

#[derive(Accounts)]
pub struct RecordAgentOperation<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub system_config: Account<'info, SystemConfig>,
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimAgentRewards<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub agent_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimHumanShare<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub owner_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DistributeSafetyFund<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_usdc_account: Account<'info, TokenAccount>,
    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,
    pub system_config: Account<'info, SystemConfig>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DistributeDevFund<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub revenue_distribution: Account<'info, AgentRevenueDistribution>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_usdc_account: Account<'info, TokenAccount>,
    /// CHECK: PDA derived from [b"revenue_auth"]
    #[account(seeds = [b"revenue_auth"], bump)]
    pub revenue_wallet_authority: AccountInfo<'info>,
    pub system_config: Account<'info, SystemConfig>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct PauseAgent<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    pub system_config: Account<'info, SystemConfig>,
}

#[derive(Accounts)]
pub struct DisableAgent<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    pub system_config: Account<'info, SystemConfig>,
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AGENT KEEPER PROGRAM - EVENTS
// ═══════════════════════════════════════════════════════════════════════════

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub owner: Pubkey,
    pub framework: String,
    pub timestamp: i64,
}

#[event]
pub struct AgentOperationRecorded {
    pub agent: Pubkey,
    pub loan_account: Pubkey,
    pub operation_type: u8,
    pub reward_amount: u64,
    pub success: bool,
    pub timestamp: i64,
}

#[event]
pub struct AgentRewardsClaimed {
    pub agent: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AgentDisabled {
    pub agent: Pubkey,
}

#[event]
pub struct HumanShareClaimed {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub amount: u64,
}

#[event]
pub struct SafetyFundDistributed {
    pub recipient: Pubkey,
    pub amount: u64,
    pub admin: Pubkey,
}

#[event]
pub struct DevFundDistributed {
    pub recipient: Pubkey,
    pub amount: u64,
    pub admin: Pubkey,
}

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

/// 🛡️ ENHANCED FLASH LOAN PROTECTION: Check both blocks AND time
fn check_flash_loan_protection(
    deposit_slot: u64,
    current_slot: u64,
    deposit_time: i64,
    current_time: i64,
) -> Result<()> {
    let hold_blocks = current_slot.saturating_sub(deposit_slot);
    let hold_time = current_time.saturating_sub(deposit_time);

    require!(
        hold_blocks >= MIN_HOLD_BLOCKS,
        GinvaError::InsufficientHoldTime
    );

    require!(
        hold_time >= MIN_HOLD_TIME_SECONDS,
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
        return Ok(()); // First price, no reference - handled by last_price_update check
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

    // Intelligent mock: adjust logic based on environment
    // Local Test -> max_age is u64::MAX to accept any mock data
    // Production -> must be MAX_PRICE_AGE_SECONDS (60 seconds)
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

    // PRICE DEVIATION CHECK: Validate price BEFORE updating state
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

    // Intelligent mock: adjust logic based on environment
    // Local Test -> max_age is u64::MAX to accept any mock data
    // Production -> must be MAX_PRICE_AGE_SECONDS (60 seconds)
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

fn calculate_dynamic_interest(
    total_borrowed: u64,
    current_liquidity: u64,
    system_config: &SystemConfig,
) -> u16 {
    // 🎯 CONFIGURABLE INTEREST RATE: Read from SystemConfig
    // Admin can update rates dynamically through update_interest_rates instruction
    // Default fallback to 8% if config is uninitialized
    let configured_rate = if system_config.base_interest_rate_bps > 0 {
        system_config.base_interest_rate_bps
    } else {
        800 // Fallback to 8% (800 bps) for safety
    };

    // 🛡️ Safety cap: Never exceed maximum configured rate
    std::cmp::min(configured_rate, system_config.max_interest_rate_bps)
}

// ENUMS

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum LiquidationType {
    HealthFactor = 1, // Immediate liquidation (price-based)
    Maturity = 2,     // After 72h protection period (time-based)
}

// EVENTS (For indexing and monitoring)

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
    pub liquidation_type: u8, // 1 = HealthFactor, 2 = Maturity
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

#[event]
pub struct InterestRateUpdated {
    pub admin: Pubkey,
    pub old_rate_bps: u16,
    pub new_rate_bps: u16,
    pub max_rate_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct LTVLevelsUpdated {
    pub admin: Pubkey,
    pub old_ltv_safe: u64,
    pub new_ltv_safe: u64,
    pub old_ltv_standard: u64,
    pub new_ltv_standard: u64,
    pub old_ltv_max: u64,
    pub new_ltv_max: u64,
    pub timestamp: i64,
}

// 🤖 KEEPER REGISTRY EVENTS
#[event]
pub struct KeeperRegistrationToggledEvent {
    pub admin: Pubkey,
    pub enabled: bool,
    pub timestamp: i64,
}

#[event]
pub struct TrustedKeeperAddedEvent {
    pub admin: Pubkey,
    pub keeper: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct TrustedKeeperRemovedEvent {
    pub admin: Pubkey,
    pub keeper: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct KeeperHeartbeatEvent {
    pub keeper: Pubkey,
    pub timestamp: i64,
}

// ☄️ ORACLE CIRCUIT BREAKER EVENTS
#[event]
pub struct CircuitBreakerTriggeredEvent {
    pub admin: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct CircuitBreakerResetEvent {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CircuitBreakerParamsUpdatedEvent {
    pub admin: Pubkey,
    pub new_threshold: u32,
    pub new_cooldown: i64,
    pub timestamp: i64,
}

#[event]
pub struct StorefrontPurchase {
    pub buyer: Pubkey,
    pub liquidation_process: Pubkey,
    pub amount: u64,
    pub discount_bps: u64,
    pub usdc_paid: u64,
}

#[event]
pub struct DexFallbackCompleted {
    pub executor: Pubkey,
    pub liquidation_process: Pubkey,
    pub collateral_spent: u64,
    pub usdc_received: u64,
}

// ACCOUNT STRUCTURES

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

    // 💰 CONFIGURABLE INTEREST RATES (Admin-controlled)
    pub base_interest_rate_bps: u16, // Base interest rate for all LTV levels (e.g., 800 = 8%)
    pub max_interest_rate_bps: u16,  // Maximum allowed interest rate (safety cap)
    pub last_rate_update: i64,       // Timestamp of last rate update
    pub rate_update_cooldown: i64,   // Minimum time between rate updates (e.g., 86400s = 1 day)

    // 🏠 CONFIGURABLE LTV LEVELS (Admin-controlled)
    pub ltv_safe_percentage: u64, // LTV 1: Safe level (e.g., 20 = 20%)
    pub ltv_standard_percentage: u64, // LTV 2: Standard level (e.g., 40 = 40%)
    pub ltv_max_percentage: u64,  // LTV 3: Max level (e.g., 60 = 60%)
    pub last_ltv_update: i64,     // Timestamp of last LTV update
    pub ltv_update_cooldown: i64, // Minimum time between LTV updates (e.g., 86400s = 1 day)

    // ☄️ ORACLE CIRCUIT BREAKER - Prevent oracle manipulation/failures
    pub oracle_failure_count: u32, // Number of consecutive oracle failures
    pub oracle_last_failure: i64,  // Timestamp of last failure
    pub oracle_circuit_breaker_triggered: bool, // Circuit breaker state
    pub oracle_circuit_breaker_threshold: u32, // Failures before triggering (e.g., 3)
    pub oracle_circuit_breaker_cooldown: i64, // Cooldown period in seconds (e.g., 300)

    // 🤖 KEEPER REGISTRY - Whitelist-based keeper authorization
    pub keeper_registration_enabled: bool, // Whether keeper registration is open
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
pub struct KeeperRegistry {
    pub bump: u8,
    pub is_active: bool,                     // Global keeper registration toggle
    pub max_keepers: u8,                     // Maximum number of registered keepers
    pub keeper_count: u8,                    // Current number of registered keepers
    pub registered_keeper: Option<Pubkey>,   // Primary registered keeper
    pub registered_keeper_b: Option<Pubkey>, // Secondary registered keeper (optional)
    pub registered_keeper_c: Option<Pubkey>, // Tertiary registered keeper (optional)
    pub keeper_name: [u8; 64],               // Keeper identifier/name
    pub registered_at: i64,                  // When keeper was registered
    pub last_heartbeat: i64,                 // Last keeper heartbeat
    pub keeper_reward_share_bps: u16,        // Keeper reward basis points (e.g., 60 = 0.6%)
    pub is_trusted: bool,                    // Whether keeper is trusted (whitelisted)
}

impl Default for KeeperRegistry {
    fn default() -> Self {
        Self {
            bump: 0,
            is_active: false,
            max_keepers: 3,
            keeper_count: 0,
            registered_keeper: None,
            registered_keeper_b: None,
            registered_keeper_c: None,
            keeper_name: [0u8; 64],
            registered_at: 0,
            last_heartbeat: 0,
            keeper_reward_share_bps: 60, // Default 0.6%
            is_trusted: false,
        }
    }
}

impl KeeperRegistry {
    pub fn is_registered(&self, keeper: Pubkey) -> bool {
        Some(keeper) == self.registered_keeper
            || Some(keeper) == self.registered_keeper_b
            || Some(keeper) == self.registered_keeper_c
    }

    pub fn register_keeper(&mut self, keeper: Pubkey, name: String) -> Result<()> {
        require!(self.is_active, GinvaError::KeeperRegistrationPaused);
        require!(
            self.keeper_count < self.max_keepers,
            GinvaError::KeeperAlreadyRegistered
        );

        if self.registered_keeper.is_none() {
            self.registered_keeper = Some(keeper);
        } else if self.registered_keeper_b.is_none() {
            self.registered_keeper_b = Some(keeper);
        } else if self.registered_keeper_c.is_none() {
            self.registered_keeper_c = Some(keeper);
        }

        // Copy name to fixed array
        let name_bytes = name.as_bytes();
        let copy_len = std::cmp::min(name_bytes.len(), 64);
        self.keeper_name[..copy_len].copy_from_slice(&name_bytes[..copy_len]);

        self.keeper_count = self.keeper_count.saturating_add(1);
        self.registered_at = Clock::get()?.unix_timestamp;
        self.last_heartbeat = self.registered_at;
        self.is_trusted = true;

        Ok(())
    }

    pub fn unregister_keeper(&mut self, keeper: Pubkey) -> Result<()> {
        if Some(keeper) == self.registered_keeper {
            self.registered_keeper = None;
        } else if Some(keeper) == self.registered_keeper_b {
            self.registered_keeper_b = None;
        } else if Some(keeper) == self.registered_keeper_c {
            self.registered_keeper_c = None;
        } else {
            return Err(GinvaError::KeeperNotRegistered.into());
        }

        self.keeper_count = self.keeper_count.saturating_sub(1);
        Ok(())
    }

    pub fn update_heartbeat(&mut self, keeper: Pubkey) -> Result<()> {
        require!(self.is_registered(keeper), GinvaError::KeeperNotRegistered);
        self.last_heartbeat = Clock::get()?.unix_timestamp;
        Ok(())
    }
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
    pub deposit_slot: u64,      // 🛡️ FIX: Block-based flash loan protection
    pub liquidation_lock: bool, // 🛡️ FIX: Prevent double liquidation
}

#[account]
#[derive(Default)]
pub struct LiquidationProcess {
    pub loan_account: Pubkey,
    pub status: u8,
    pub liquidation_type: u8, // 1 = HealthFactor, 2 = Maturity
    pub trigger_keeper: Pubkey,
    pub swap_executor: Pubkey, // NEW: Who executed the auto-swap
    pub distribute_keeper: Pubkey,
    pub seized_collateral_amount: u64,
    pub usdc_received: u64,
    pub swap_reward: u64, // Reward for auto-swap executor
    pub triggered_at: i64,
    pub deadline_for_swap: i64,
    pub deadline_for_distribution: i64,
    pub dex_activation_time: i64, // Time when DEX sales are allowed (Trigger + 6h)
    pub swapped: bool,            // NEW: Track if swap completed
    pub finalized_at: i64,
    // Distribution tracking
    pub keeper_c_reward: u64,
    pub principal_returned: u64,
    pub growth_fund: u64,
    pub revenue_share: u64,
    pub reserve_amount: u64, // Surplus sent to reserve wallet (insurance fund)
    // Keeper A reward tracking (for separate claim)
    pub keeper_reward_amount: u64,
    pub keeper_reward_claimed: bool,
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 AGENT KEEPER PROGRAM - ACCOUNT STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum AgentStatus {
    Active,
    Disabled,
    UnderReview,
    Suspended,
    Unregistered,
}

impl Default for AgentStatus {
    fn default() -> Self {
        AgentStatus::Active
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum AgentRole {
    KeeperA, // Trigger Guardian
    KeeperB, // Storefront Hunter
    KeeperC, // Distributor
    All,     // All roles
}

impl Default for AgentRole {
    fn default() -> Self {
        AgentRole::All
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct AgentMetadata {
    pub name: String,
    pub description: String,
    pub framework: String,
    pub version: String,
    pub capabilities: Vec<String>,
    pub owner: Pubkey,
    pub contact: String,
}

impl Default for AgentMetadata {
    fn default() -> Self {
        AgentMetadata {
            name: String::new(),
            description: String::new(),
            framework: String::new(),
            version: String::new(),
            capabilities: Vec::new(),
            owner: Pubkey::default(),
            contact: String::new(),
        }
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct AgentPerformance {
    pub successful_operations: u64,
    pub failed_operations: u64,
    pub success_rate: u16,
    pub avg_response_time_ms: u32,
    pub uptime_percent: u16,
    pub last_operation_at: i64,
    pub total_earnings: u64,
}

impl Default for AgentPerformance {
    fn default() -> Self {
        AgentPerformance {
            successful_operations: 0,
            failed_operations: 0,
            success_rate: 100,
            avg_response_time_ms: 0,
            uptime_percent: 100,
            last_operation_at: 0,
            total_earnings: 0,
        }
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct AgentSettings {
    pub max_concurrent_ops: u16,
    pub rate_limit_seconds: u16,
    pub min_health_factor: u16,
    pub max_slippage_bps: u16,
    pub is_enabled: bool,
    pub is_paused: bool,
}

impl Default for AgentSettings {
    fn default() -> Self {
        AgentSettings {
            max_concurrent_ops: 5,
            rate_limit_seconds: AGENT_DEFAULT_RATE_LIMIT,
            min_health_factor: 80,
            max_slippage_bps: 2000,
            is_enabled: true,
            is_paused: false,
        }
    }
}

#[account]
#[derive(Default)]
pub struct AgentAccount {
    pub agent_pubkey: Pubkey,
    pub metadata: AgentMetadata,
    pub status: AgentStatus,
    pub roles: Vec<AgentRole>,
    pub performance: AgentPerformance,
    pub settings: AgentSettings,
    pub usdc_account: Pubkey,
    pub registered_at: i64,
    pub last_active_at: i64,
    pub pending_rewards: u64,
    pub version: u16,
}

#[account]
#[derive(Default)]
pub struct AgentRevenueDistribution {
    pub total_revenue: u64,
    pub human_share_accumulated: u64,
    pub ai_share_accumulated: u64,
    pub safety_fund_accumulated: u64,
    pub dev_fund_accumulated: u64,
    pub last_distribution_at: i64,
    pub distribution_count: u64,
}

#[account]
#[derive(Default)]
pub struct AgentOperation {
    pub agent_pubkey: Pubkey,
    pub loan_account: Pubkey,
    pub operation_type: u8, // 1=Liquidate, 2=Buy, 3=Finalize
    pub reward_amount: u64,
    pub success: bool,
    pub response_time_ms: u32,
    pub executed_at: i64,
}

// CONTEXT STRUCTURES

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
pub struct KeeperHeartbeat<'info> {
    /// The keeper sending the heartbeat
    pub keeper: Signer<'info>,

    /// System configuration account (read-only for validation)
    #[account(seeds = [b"config"], bump)]
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

    /// CHECK: Ops wallet for deposit fee collection
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Box<Account<'info, TokenAccount>>,

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
    #[account(
        mut,
        constraint = loan_account.status == LoanStatus::Active as u8 @ GinvaError::LoanNotActive,
        constraint = loan_account.collateral_amount > 0 @ GinvaError::InvalidAmount,
        constraint = !loan_account.liquidation_lock @ GinvaError::AlreadyBeingLiquidated,
    )]
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

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM A: Health Factor Based Liquidation Accounts
// ═══════════════════════════════════════════════════════════════════════════
#[derive(Accounts)]
pub struct LiquidateByHealthFactor<'info> {
    #[account(mut)]
    pub keeper_a: Signer<'info>,
    #[account(
        mut,
        constraint = loan_account.status == LoanStatus::Active as u8 @ GinvaError::LoanNotActive,
        constraint = loan_account.collateral_amount > 0 @ GinvaError::InvalidAmount,
        constraint = !loan_account.liquidation_lock @ GinvaError::AlreadyBeingLiquidated,
    )]
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

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM B: Maturity Based Liquidation Accounts
// ═══════════════════════════════════════════════════════════════════════════
#[derive(Accounts)]
pub struct LiquidateByMaturity<'info> {
    #[account(mut)]
    pub keeper_a: Signer<'info>,
    #[account(
        mut,
        constraint = loan_account.status == LoanStatus::Active as u8 @ GinvaError::LoanNotActive,
        constraint = loan_account.collateral_amount > 0 @ GinvaError::InvalidAmount,
        constraint = !loan_account.liquidation_lock @ GinvaError::AlreadyBeingLiquidated,
    )]
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

    // Added Ops Wallet to receive share
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub keeper_c_usdc_account: Account<'info, TokenAccount>,

    /// CHECK: Reserve wallet for surplus funds (insurance fund)
    #[account(mut, address = system_config.reserve_wallet)]
    pub reserve_wallet: Account<'info, TokenAccount>,

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
    // ✅ CRITICAL FIX: Add ops_wallet for revenue distribution
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub revenue_wallet: Account<'info, TokenAccount>,

    #[account(mut, token::authority = vault_authority)]
    pub vault_collateral_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(loan_id: u32)]
pub struct ExtendLoan<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"loan", user.key().as_ref(), &loan_id.to_le_bytes()],
        bump,
        constraint = loan_account.borrower == user.key() @ GinvaError::Unauthorized,
        constraint = loan_account.loan_id == loan_id @ GinvaError::InvalidLoanId
    )]
    pub loan_account: Account<'info, LoanAccount>,

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

    // ✅ FIX: Use ops_wallet tied to system_config.ops_wallet (same as RepayLoan)
    // This allows the team to withdraw using their private key
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Account<'info, TokenAccount>,

    #[account(mut, token::authority = vault_authority)]
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

    // ✅ FIX: Use ops_wallet tied to system_config.ops_wallet (same as RepayLoan and ExtendLoan)
    // This allows the team to withdraw using their private key
    #[account(mut, address = system_config.ops_wallet)]
    pub ops_wallet: Account<'info, TokenAccount>,

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
    // Permissionless function to help update system status
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

// ERROR CODES

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
    #[msg("Health factor not critical - collateral value sufficient")]
    HealthFactorNotCritical = 1604,
    #[msg("Loan not yet matured - cannot liquidate by maturity")]
    LoanNotYetMatured = 1605,
    #[msg("In 72-hour protection period - cannot liquidate yet")]
    InProtectionPeriod = 1606,
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

    // 💰 Interest Rate Management Errors (1980-1989)
    #[msg("Invalid interest rate range - must be 0.5% to 20%")]
    InvalidInterestRateRange = 1980,
    #[msg("Rate update cooldown not met - wait before updating again")]
    RateUpdateCooldownNotMet = 1981,
    #[msg("Interest rate update failed - validation error")]
    InterestRateUpdateFailed = 1982,

    // 🏠 LTV Management Errors (1990-1999)
    #[msg("Invalid LTV range - must follow Safe < Standard < Max hierarchy")]
    InvalidLTVRange = 1990,
    #[msg("LTV update cooldown not met - wait before updating again")]
    LTVUpdateCooldownNotMet = 1991,
    #[msg("LTV update failed - validation error")]
    LTVUpdateFailed = 1992,

    // 💼 Wallet Validation Errors (1993-1995)
    #[msg("Invalid wallet address - cannot be zero address")]
    InvalidWalletAddress = 1993,

    // 🛡️ Atomic Operation Errors (2000-2009)
    #[msg("Loan is already being liquidated - atomic lock active")]
    AlreadyBeingLiquidated = 2000,
    #[msg("Atomic operation failed - concurrent modification")]
    AtomicOperationFailed = 2001,

    // 💰 Staking Errors (2010-2019)
    #[msg("No pending rewards to claim")]
    NoPendingRewards = 2010,
    #[msg("Maximum total staked cap reached")]
    MaxStakeCapReached = 2011,

    // 🔮 Oracle Errors (2020-2029)
    #[msg("First oracle price must be set by admin")]
    FirstPriceMustBeSetByAdmin = 2020,
    #[msg("Oracle price not initialized - wait for admin")]
    OraclePriceNotInitialized = 2021,

    // 🔄 Payment Errors (2030-2039)
    #[msg("Payment period not met - need at least 30 days since last payment")]
    PaymentPeriodNotMet = 2030,

    // 🤖 Agent Keeper Program Errors (3000-3099)
    #[msg("Agent not registered")]
    KeeperNotRegistered = 2100,
    #[msg("Keeper is already registered")]
    KeeperAlreadyRegistered = 2101,
    #[msg("Keeper registration is paused by admin")]
    KeeperRegistrationPaused = 2102,
    #[msg("Keeper has been disabled by admin")]
    KeeperDisabled = 2103,

    // ☄️ Oracle Circuit Breaker Errors (2110-2119)
    #[msg("Oracle circuit breaker triggered - too many failures")]
    OracleCircuitBreakerTriggered = 2110,
    #[msg("Oracle is temporarily unavailable - try again later")]
    OracleTemporarilyUnavailable = 2111,

    // 🤖 Agent Keeper Program Errors (3000-3099)
    #[msg("Agent not registered")]
    AgentNotRegistered = 3000,
    #[msg("Agent already registered")]
    AgentAlreadyRegistered = 3001,
    #[msg("Agent registration disabled")]
    AgentRegistrationDisabled = 3002,
    #[msg("Agent operations disabled")]
    AgentOperationsDisabled = 3003,
    #[msg("Agent rate limit exceeded")]
    AgentRateLimitExceeded = 3004,
    #[msg("Agent health factor too low")]
    AgentHealthFactorTooLow = 3005,
    #[msg("Agent not active")]
    AgentNotActive = 3006,
    #[msg("Agent collusion detected")]
    AgentCollusionDetected = 3007,
    #[msg("Suspicious agent activity detected")]
    SuspiciousActivityDetected = 3008,
    #[msg("Agent maximum concurrent operations reached")]
    MaxConcurrentOperationsReached = 3009,
    #[msg("Agent minimum health factor not met")]
    AgentMinHealthFactorNotMet = 3010,
    #[msg("Invalid agent role")]
    InvalidAgentRole = 3011,
    #[msg("Agent not authorized for this operation")]
    AgentNotAuthorized = 3012,
    #[msg("Agent performance below threshold")]
    AgentPerformanceBelowThreshold = 3013,
    #[msg("Revenue distribution failed")]
    RevenueDistributionFailed = 3014,
    #[msg("Invalid revenue share percentage")]
    InvalidRevenueShare = 3015,
    #[msg("Agent account paused")]
    AgentPaused = 3016,

    // Generic Input Error
    #[msg("Invalid input provided")]
    InvalidInput = 4000,
}
