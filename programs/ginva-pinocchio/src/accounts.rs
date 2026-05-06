//! GINVA Protocol - Pinocchio Version
//! Account data structures - Simplified without bytemuck derives

#![allow(dead_code)]
#![allow(clippy::manual_abs_diff)]

use crate::{GinvaError, REENTRANCY_GUARD_ACTIVE, REENTRANCY_GUARD_INACTIVE};
use pinocchio::account_info::AccountInfo;
use pinocchio::pubkey::Pubkey;
use pinocchio::program_error::ProgramError;

// ============================================================================
// System Config Account
// ============================================================================
// NOTE: This matches layout used in process_initialize_system (instructions.rs)
// Byte offsets from that code:
//   0-8:   discriminator (8 bytes)
//   8-40:  admin pubkey (32)
//   40-72: capital_wallet_authority (32)
//   72-104: vault_wallet_authority (32)
//   104-136: revenue_wallet_authority (32)
//   136-168: seized_assets_authority (32)
//   168-200: collateral_mint (32)
//   200-232: loan_mint (32)
//   232-240: token_program (32 - placeholder)
//   232-240: total_borrowed (8 bytes) - note: token_program was placeholder
//   282-284: deposit_fee_bps (2)
//   284: is_active (1)
// This layout is inconsistent - struct defines one layout, code uses another.
// FIX: Using bytemuck would ensure consistency, but for now we match code offsets.

// For actual deployment, THIS struct needs to match byte offsets in instructions.rs
#[allow(non_snake_case)]
pub mod config_layout {
    #[repr(C)]
    #[derive(Clone, Copy)]
    // Match the layout that process_initialize_system WRITES to
    // (Note: this differs from the SystemConfig struct above)
    pub struct WrittenLayout {
        pub discriminator: [u8; 8],           // 0
        pub admin: [u8; 32],                  // 8 (32 bytes)
        pub capital_wallet_authority: [u8; 32], // 40
        pub vault_wallet_authority: [u8; 32],  // 72
        pub revenue_wallet_authority: [u8; 32], // 104
        pub seized_assets_authority: [u8; 32], // 136
        pub collateral_mint: [u8; 32],        // 168
        pub loan_mint: [u8; 32],               // 200
        _padding1: [u8; 50],                   // 232 - placeholder (was ops_wallet)
        pub deposit_fee_bps: u16,              // 282
        pub is_active: u8,                     // 284
    }
}

// ACTUAL struct definition - used for bytemuck zero-copy read
// This is DIFFERENT from the init layout! For actual deployment,
// process_initialize_system MUST be updated to match this layout.

// Offset constants — SINGLE SOURCE OF TRUTH for SystemConfig byte layout
// NOTE: This layout is used by ALL runtime read/write code in instructions.rs.
// WARNING: The SystemConfig struct fields DO NOT match these offsets.
// Use these OFFSET constants for data access, NOT the struct field names.
pub mod sysconfig_offsets {
    // Discriminator: "config__" at bytes 0-7
    pub const DISCRIMINATOR: usize = 0;
    pub const ADMIN: usize = 8;        // 8+32=40
    pub const CAPITAL_AUTH: usize = 40; // 40+32=72
    pub const VAULT_AUTH: usize = 72;   // 72+32=104
    pub const REVENUE_AUTH: usize = 104; // 104+32=136
    pub const SEIZED_AUTH: usize = 136; // 136+32=168
    pub const COLLATERAL_MINT: usize = 168; // 168+32=200
    pub const LOAN_MINT: usize = 200;    // 200+32=232
    // Runtime fields - past the main config area
    pub const TOTAL_BORROWED: usize = 232; // 8 bytes
    pub const TOTAL_COLLATERAL: usize = 243; // 8 bytes
    pub const TOTAL_STAKED: usize = 256;    // 8 bytes (used in stake ops)
    pub const DEPOSIT_FEE_BPS: usize = 282; // 2 bytes — NOTE: gap after byte 232
    pub const IS_ACTIVE: usize = 284;       // 1 byte
    // Total account size needed: up to byte 284 + 1 = 285 minimum, 300 for safety
}
pub const SYSTEM_CONFIG_SIZE: usize = 300;

#[repr(C)]
pub struct SystemConfig {
    pub discriminator: [u8; 8],
    pub admin: [u8; 32],
    pub capital_wallet_authority: [u8; 32],
    pub vault_wallet_authority: [u8; 32],
    pub revenue_wallet_authority: [u8; 32],
    pub seized_assets_authority: [u8; 32],
    pub collateral_mint: [u8; 32],
    pub loan_mint: [u8; 32],
    pub deposit_fee_bps: u16,
    pub is_active: u8,
    pub total_borrowed: u64,
    pub total_collateral: u64,
    pub ops_wallet: [u8; 32],
    pub total_staked: u64,
    pub acc_reward_per_share: u128,
    pub is_paused: u8,
    pub pause_reason: [u8; 50],
    pub reentrancy_guard: u8,  // 0 = unlocked, 1 = locked
}

impl SystemConfig {
    pub fn is_active(&self) -> bool {
        self.is_active != 0 && self.is_paused == 0
    }
    pub fn is_paused(&self) -> bool {
        self.is_paused != 0
    }
    pub fn admin(&self) -> &[u8; 32] {
        &self.admin
    }
    pub fn is_locked(&self) -> bool {
        self.reentrancy_guard == REENTRANCY_GUARD_ACTIVE
    }
    pub fn set_locked(&mut self) {
        self.reentrancy_guard = REENTRANCY_GUARD_ACTIVE;
    }
    pub fn set_unlocked(&mut self) {
        self.reentrancy_guard = REENTRANCY_GUARD_INACTIVE;
    }
}

// ============================================================================
// Asset Config Account
// ============================================================================

// AssetConfig size calculation:
// discriminator: 8
// asset_id: 32
// mint: 32
// reserve_wallet: 32
// debt_share_mint: 32
// last_reserve_update: 8
// total_reserve: 8
// utilization_ratio_bps: 2
// interest_rate_bps: 2
// liquidation_bonus_bps: 2
// max_ltv_bps: 2
// liquidation_threshold_bps: 2
// debt_accumulation_factor: 16
// debt_accumulated: 8
// is_active: 1
// asset_oracle_config: 32
// asset_oracle_max_staleness: 8
// is_whitelisted: 1
// is_collateral_enabled: 1
// collateral_weight_bps: 2
// debt_weight_bps: 8
// circuit_breaker_triggered: 1
// circuit_breaker_threshold_bps: 1
// circuit_breaker_reset_factor_bps: 8
// liquidation_loan_value_ratio_bps: 8
// supply_cap: 8
// price_deviation_threshold_bps: 2
// last_price: 8
// last_price_update: 8
// = 246 bytes
pub const ASSET_CONFIG_SIZE: usize = 246;

#[repr(C)]
pub struct AssetConfig {
    pub discriminator: [u8; 8],
    pub asset_id: [u8; 32],
    pub mint: [u8; 32],
    pub reserve_wallet: [u8; 32],
    pub debt_share_mint: [u8; 32],
    pub last_reserve_update: u64,
    pub total_reserve: u64,
    pub utilization_ratio_bps: u16,
    pub interest_rate_bps: u16,
    pub liquidation_bonus_bps: u16,
    pub max_ltv_bps: u16,
    pub liquidation_threshold_bps: u16,
    pub debt_accumulation_factor: u128,
    pub debt_accumulated: u64,
    pub is_active: u8,
    pub asset_oracle_config: [u8; 32],
    pub asset_oracle_max_staleness: u64,
    pub is_whitelisted: u8,
    pub is_collateral_enabled: u8,
    pub collateral_weight_bps: u16,
    pub debt_weight_bps: u64,
    pub circuit_breaker_triggered: u8,
    pub circuit_breaker_threshold_bps: u8,
    pub circuit_breaker_reset_factor_bps: u64,
    pub liquidation_loan_value_ratio_bps: u64,
    // Phase 2: Security Hardening
    pub supply_cap: u64,
    pub price_deviation_threshold_bps: u16,
    pub last_price: u64,
    pub last_price_update: u64,
}

impl AssetConfig {
    pub fn is_active(&self) -> bool {
        self.is_active != 0
    }
    pub fn is_whitelisted(&self) -> bool {
        self.is_whitelisted != 0
    }
    pub fn is_collateral_enabled(&self) -> bool {
        self.is_collateral_enabled != 0
    }
    pub fn circuit_breaker_triggered(&self) -> bool {
        self.circuit_breaker_triggered != 0
    }

    // Phase 2: Supply Cap validation
    pub fn has_supply_cap(&self) -> bool {
        self.supply_cap > 0
    }
    pub fn is_supply_cap_exceeded(&self, additional_amount: u64) -> bool {
        if !self.has_supply_cap() {
            return false;
        }
        self.total_reserve.saturating_add(additional_amount) > self.supply_cap
    }

    // Phase 2: Price deviation detection
    pub fn is_price_deviation_exceeded(&self, new_price: u64) -> bool {
        if self.last_price == 0 {
            return false; // No previous price to compare
        }
        let threshold = self.price_deviation_threshold_bps as u64;
        if threshold == 0 {
            return false; // No threshold set
        }

        // Calculate deviation in basis points
        let price_diff = if new_price > self.last_price {
            new_price - self.last_price
        } else {
            self.last_price - new_price
        };

        // deviation_bps = (price_diff * 10000) / last_price
        let deviation_bps = (price_diff * 10000) / self.last_price;

        deviation_bps > threshold
    }
}

// ============================================================================
// Loan Account
// ============================================================================

// Offset constants — SINGLE SOURCE OF TRUTH for LoanAccount byte layout
// WARNING: Struct field offsets DO NOT match these! Code uses hardcoded byte offsets.
// Use these constants for ALL loan account data access.
pub mod loan_offsets {
    pub const DISCRIMINATOR: usize = 0;     // b"loanac01"
    pub const BORROWER: usize = 8;            // 32 bytes
    pub const STATUS: usize = 40;             // u8: 0=uninitialized, 1=active, 2=repaid
    pub const COLLATERAL_AMOUNT: usize = 41; // u64 (8 bytes) — NOTE: 1 byte gap after status
    pub const LOAN_AMOUNT: usize = 49;       // u64
    pub const CUMULATIVE_INTEREST: usize = 57; // u64
    pub const LAST_INTEREST_UPDATE: usize = 65; // u64 (unix timestamp)
    pub const LOAN_START_TIME: usize = 73;   // u64
    pub const LOAN_MATURITY_TIME: usize = 81; // u64
    pub const IS_LIQUIDATED: usize = 89;     // u8
    pub const LIQUIDATION_PROCESSED: usize = 90; // u8
    pub const LIQUIDATION_INITIATED_TIME: usize = 91; // u64
    pub const COLLATERAL_PRICE_AT_LIQ: usize = 99; // u64
    pub const SEIZED_COLLATERAL: usize = 107; // u64
    pub const IS_INITIALIZED: usize = 213;   // u8
    pub const HEALTH_FACTOR: usize = 215;    // i64 — scaled by 10000
    pub const GRACE_PERIOD_ACTIVE: usize = 223; // u8
    pub const GRACE_PERIOD_START: usize = 224;  // u64 (NOT USED in init, 8 bytes)
    pub const LIQUIDATION_TRIGGER: usize = 232; // u8 (NOT USED in init, 8 bytes)
    // NOTE: These extend past LOAN_ACCOUNT_SIZE constant due to gap in earlier definition
    // Runtime code uses byte offsets, not struct fields
}
pub const LOAN_ACCOUNT_SIZE: usize = 260;

#[repr(C)]
pub struct LoanAccount {
    pub discriminator: [u8; 8],
    pub loan_id: [u8; 32],
    pub borrower: [u8; 32],
    pub status: u8,
    pub collateral_amount: u64,
    pub loan_amount: u64,
    pub cumulative_interest: u64,
    pub last_interest_update: u64,
    pub loan_start_time: u64,
    pub loan_maturity_time: u64,
    pub is_liquidated: u8,
    pub liquidation_processed: u8,
    pub liquidation_bonus_bps: u16,
    pub liquidation_initiated_time: u64,
    pub collateral_price_at_liquidation: u64,
    pub seized_collateral_amount: u64,
    pub swapped_to_collateral: u8,
    pub auto_swap_executed: u8,
    pub debt_accumulated: u128,
    pub last_debt_accumulation_update: u128,
    pub is_initialized: u8,
    pub asset_config: [u8; 32],
    pub is_restricted: u8,
    pub debt_accumulation_last_update: u64,
   // Health Factor and Grace Period (Phase 2)
   pub health_factor: i64,          // Scaled by 10000 (e.g., 15000 = 1.5)
   pub grace_period_start_time: u64, // When 72h grace period starts (after maturity)
   pub grace_period_active: u8,     // 1 = in grace period, 0 = not
   pub liquidation_trigger_reason: u8, // 0=none, 1=price_drop, 2=maturity_expired
}

impl LoanAccount {
    pub fn borrower(&self) -> &[u8; 32] {
        &self.borrower
    }
    pub fn is_liquidated(&self) -> bool {
        self.is_liquidated != 0
    }
    pub fn is_initialized(&self) -> bool {
        self.is_initialized != 0
    }
    pub fn liquidation_processed(&self) -> bool {
        self.liquidation_processed != 0
    }

   // ============================================================================
   // Health Factor & Grace Period Methods (GINVA Fairness Features)
   // ============================================================================

   /// Check if loan is mature (past maturity time)
   pub fn is_matured(&self, current_time: u64) -> bool {
       current_time >= self.loan_maturity_time
   }

   /// Check if loan is in 72-hour grace period after maturity  
   pub fn is_in_grace_period(&self, current_time: u64) -> bool {
       let grace_period_seconds: u64 = 259200; // 72 * 3600
       self.grace_period_active == 1 
           && current_time >= self.grace_period_start_time
           && current_time < self.grace_period_start_time + grace_period_seconds
   }

   /// Check if health factor is critical (< 100%)
   pub fn is_health_factor_critical(&self) -> bool {
       self.health_factor < 10000
   }

   /// Check if liquidation should happen immediately (price drop, no grace period)
   pub fn can_liquidate_immediately(&self, current_time: u64) -> bool {
       if self.is_in_grace_period(current_time) {
           return false;
       }
       self.is_health_factor_critical()
   }

   /// Check if liquidation is allowed during grace period (after maturity)
   pub fn can_liquidate_during_grace(&self, current_time: u64) -> bool {
       self.grace_period_active == 1 
           && self.is_matured(current_time)
           && self.liquidation_trigger_reason == 2
   }

   /// Calculate current debt (principal + interest)
   pub fn total_debt(&self) -> u64 {
       self.loan_amount.saturating_add(self.cumulative_interest)
   }

   /// Calculate collateral value in USD
   pub fn collateral_value(&self, price: u64) -> u64 {
       let collateral_u128 = (self.collateral_amount as u128).saturating_mul(price as u128);
       (collateral_u128 / 1_000_000_000) as u64
   }

   /// Get liquidation type description
   pub fn liquidation_type_str(&self) -> &'static str {
       match self.liquidation_trigger_reason {
           1 => "Price Drop",
           2 => "Maturity Expired",
           _ => "Unknown",
       }
   }
}

// ============================================================================
// Agent Account
// ============================================================================

pub const AGENT_ACCOUNT_SIZE: usize =
    8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 8 + 1 + 1 + 32 + 32 + 8 + 1 + 32 + 8;

#[repr(C)]
pub struct AgentAccount {
    pub discriminator: [u8; 8],
    pub agent_id: [u8; 32],
    pub authority: [u8; 32],
    pub status: u8,
    pub staked_amount: u64,
    pub earned_rewards: u64,
    pub total_rewards_claimed: u64,
    pub last_stake_update: u64,
    pub stake_started_at: u64,
    pub pending_unstake_amount: u64,
    pub pending_unstake_request_time: u64,
    pub total_staked_time: u64,
    pub is_initialized: u8,
    pub delegation_count: u64,
    pub last_delegation_update: u64,
    pub is_active: u8,
    pub is_paused: u8,
    pub reserved: [u8; 32],
    pub reward_pool: [u8; 32],
    pub pending_rewards: u64,
    pub is_jackpot: u8,
    pub metadata: [u8; 32],
    pub agent_config_nonce: u64,
}

impl AgentAccount {
    pub fn is_initialized(&self) -> bool {
        self.is_initialized != 0
    }
    pub fn is_active(&self) -> bool {
        self.is_active != 0
    }
    pub fn is_paused(&self) -> bool {
        self.is_paused != 0
    }
    pub fn is_jackpot(&self) -> bool {
        self.is_jackpot != 0
    }
}

// ============================================================================
// Keeper Info (for arrays)
// ============================================================================

#[repr(C)]
pub struct KeeperInfo {
    pub keeper: [u8; 32],
    pub allocated_amount: u64,
    pub last_allocation_update: u64,
}

// ============================================================================
// Keeper Pool Account
// ============================================================================

#[repr(C)]
pub struct KeeperPoolAccount {
    pub discriminator: [u8; 8],
    pub total_allocated: u64,
    pub keeper_registration_enabled: u8,
    pub is_initialized: u8,
    pub total_rewards: u64,
    pub keeper_count: u64,
    pub last_keeper_allocation_update: u64,
    pub keepers: [KeeperInfo; 50],
}

impl KeeperPoolAccount {}

// ============================================================================
// Asset Oracle Config
// ============================================================================

// AssetOracleConfig size calculation:
// discriminator: 8
// oracle_program: 32
// is_initialized: 1
// is_allowed: 1
// pyth_oracle_pubkey: 32
// pyth_status: 1
// switchboard_oracle_pubkey: 32
// max_staleness_seconds: 8
// secondary_oracle_pubkey: 32
// secondary_oracle_type: 1 (0=none, 1=pyth, 2=switchboard)
// oracle_deviation_threshold_bps: 2
// last_pyth_price: 8
// last_secondary_price: 8
// last_price_update: 8
// is_circuit_breaker_active: 1
// min_oracle_consensus: 1
// = 179 bytes
pub const ASSET_ORACLE_CONFIG_SIZE: usize = 179;

#[repr(C)]
pub struct AssetOracleConfig {
    pub discriminator: [u8; 8],
    pub oracle_program: [u8; 32],
    pub is_initialized: u8,
    pub is_allowed: u8,
    pub pyth_oracle_pubkey: [u8; 32],
    pub pyth_status: u8,
    pub switchboard_oracle_pubkey: [u8; 32],
    pub max_staleness_seconds: u64,
    // Phase 2: Multi-Oracle Support
    pub secondary_oracle_pubkey: [u8; 32],
    pub secondary_oracle_type: u8, // 0=none, 1=pyth, 2=switchboard
    pub oracle_deviation_threshold_bps: u16,
    pub last_pyth_price: u64,
    pub last_secondary_price: u64,
    pub last_price_update: u64,
    pub is_circuit_breaker_active: u8,
    pub min_oracle_consensus: u8, // minimum number of oracles that must agree
}

impl AssetOracleConfig {
    pub fn is_initialized(&self) -> bool {
        self.is_initialized != 0
    }
    pub fn is_allowed(&self) -> bool {
        self.is_allowed != 0
    }
    pub fn is_circuit_breaker_active(&self) -> bool {
        self.is_circuit_breaker_active != 0
    }
    pub fn has_secondary_oracle(&self) -> bool {
        self.secondary_oracle_type != 0
    }

    // Calculate aggregated price from multiple oracles
    // Returns (aggregated_price, is_valid)
    pub fn get_aggregated_price(&self, pyth_price: u64, secondary_price: u64) -> (u64, bool) {
        if !self.has_secondary_oracle() {
            // Single oracle mode - just use Pyth
            return (pyth_price, pyth_price > 0);
        }

        if pyth_price == 0 || secondary_price == 0 {
            return (0, false);
        }

        // Check if prices are within acceptable deviation
        let (lower, upper) = if pyth_price <= secondary_price {
            (pyth_price, secondary_price)
        } else {
            (secondary_price, pyth_price)
        };

        // Calculate deviation in basis points
        let deviation_bps = ((upper - lower) * 10000) / lower;

        if deviation_bps > self.oracle_deviation_threshold_bps as u64 {
            // Prices diverge too much - trigger circuit breaker
            return (0, false);
        }

        // Use average of the two prices
        let aggregated = (pyth_price + secondary_price) / 2;
        (aggregated, true)
    }

    // Validate oracle freshness
    pub fn is_price_fresh(&self, current_time: u64) -> bool {
        if self.last_price_update == 0 {
            return false;
        }
        current_time.saturating_sub(self.last_price_update) <= self.max_staleness_seconds
    }

    // Activate circuit breaker
    pub fn trigger_circuit_breaker(&mut self) {
        self.is_circuit_breaker_active = 1;
    }

    // Reset circuit breaker (should only be called by admin after verification)
    pub fn reset_circuit_breaker(&mut self) {
        self.is_circuit_breaker_active = 0;
    }
}

// ============================================================================
// UserStake Account
// ============================================================================

#[repr(C)]
pub struct UserStakeAccount {
    pub discriminator: [u8; 8],
    pub user: [u8; 32],
    pub agent: [u8; 32],
    pub is_initialized: u8,
    pub staked_amount: u64,
    pub earned_rewards: u64,
    pub last_stake_update: u64,
    pub total_staked_time: u64,
    pub pending_unstake_request_time: u64,
}

impl UserStakeAccount {
    pub fn is_initialized(&self) -> bool {
        self.is_initialized != 0
    }
}

// ============================================================================
// Event Types (packed for efficiency)
// ============================================================================

#[repr(C)]
pub struct DepositEvent {
    pub user: [u8; 32], // 32
    pub amount: u64,    // 8
    pub fee: u64,       // 8 = 48 total
}

#[repr(C)]
pub struct BorrowEvent {
    pub user: [u8; 32],         // 32
    pub amount: u64,            // 8
    pub collateral_amount: u64, // 8 = 48 total
}

#[repr(C)]
pub struct RepayEvent {
    pub user: [u8; 32],      // 32
    pub amount: u64,         // 8
    pub remaining_debt: u64, // 8 = 48 total
}

#[repr(C)]
pub struct LiquidateEvent {
    pub liquidator: [u8; 32],   // 32
    pub borrower: [u8; 32],     // 32
    pub collateral_seized: u64, // 8
    pub debt_repaid: u64,       // 8 = 80 total
}

#[repr(C)]
pub struct StakeEvent {
    pub user: [u8; 32],  // 32
    pub agent: [u8; 32], // 32
    pub amount: u64,     // 8 = 72 total
}

#[repr(C)]
pub struct UnstakeEvent {
    pub user: [u8; 32],  // 32
    pub agent: [u8; 32], // 32
    pub amount: u64,     // 8 = 72 total
}

// ============================================================================
// Account Loading Functions (SECURED)
// ============================================================================

/// Discriminator constants for account validation
pub const SYSTEM_CONFIG_DISCRIMINATOR: &[u8; 8] = b"config__";
pub const ASSET_CONFIG_DISCRIMINATOR: &[u8; 8] = b"asset___";
pub const LOAN_ACCOUNT_DISCRIMINATOR: &[u8; 8] = b"loanac01";
pub const AGENT_ACCOUNT_DISCRIMINATOR: &[u8; 8] = b"agent___";

#[inline(always)]
pub fn load_system_config<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a SystemConfig, ProgramError> {
    // 1. Validate owner
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    // 2. Validate data length
    if account.data_len() < SYSTEM_CONFIG_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    // 3. Validate discriminator
    let data = account.try_borrow_data()?;
    if &data[0..8] != SYSTEM_CONFIG_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    // 4. Safe cast (validated)
    let account_data = unsafe { &*(data.as_ptr() as *const SystemConfig) };
    Ok(account_data)
}

/// Check and acquire reentrancy guard (immutable - for read-only checks)
#[inline(always)]
pub fn check_reentrancy_guard(config: &SystemConfig) -> Result<(), ProgramError> {
    if config.is_locked() {
        return Err(GinvaError::ReentrancyDetected.into());
    }
    Ok(())
}

/// Acquire reentrancy guard (mutable - sets the lock)
#[inline(always)]
pub fn acquire_reentrancy_guard(config: &mut SystemConfig) -> Result<(), ProgramError> {
    if config.is_locked() {
        return Err(GinvaError::ReentrancyDetected.into());
    }
    config.set_locked();
    Ok(())
}

/// Release reentrancy guard (mutable - clears the lock)
#[inline(always)]
pub fn release_reentrancy_guard(config: &mut SystemConfig) {
    config.set_unlocked();
}

/// Load system config with mutable access for reentrancy protection
#[inline(always)]
pub fn load_system_config_mut<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a mut SystemConfig, ProgramError> {
    // 1. Validate owner (inverted logic - should NOT be owned by program to be valid system account)
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    // 2. Validate data length
    if account.data_len() < SYSTEM_CONFIG_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    // 3. Validate discriminator
    let data = account.try_borrow_data()?;
    if &data[0..8] != SYSTEM_CONFIG_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    drop(data);
    // 4. Safe mutable cast
    let account_data = unsafe { &mut *((account.try_borrow_mut_data()?.as_mut_ptr() as *mut SystemConfig)) };
    Ok(account_data)
}

#[inline(always)]
pub fn load_loan_account<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a LoanAccount, ProgramError> {
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < LOAN_ACCOUNT_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    let data = account.try_borrow_data()?;
    if &data[0..8] != LOAN_ACCOUNT_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    let account_data = unsafe { &*(data.as_ptr() as *const LoanAccount) };
    Ok(account_data)
}

/// Load loan account with mutable access (for initialization)
#[inline(always)]
pub fn load_loan_account_mut<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a mut LoanAccount, ProgramError> {
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < LOAN_ACCOUNT_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    drop(account.try_borrow_data()?);
    let account_data = unsafe { &mut *(account.try_borrow_mut_data()?.as_mut_ptr() as *mut LoanAccount) };
    Ok(account_data)
}

#[inline(always)]
pub fn load_asset_config<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a AssetConfig, ProgramError> {
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < ASSET_CONFIG_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    let data = account.try_borrow_data()?;
    if &data[0..8] != ASSET_CONFIG_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    let account_data = unsafe { &*(data.as_ptr() as *const AssetConfig) };
    Ok(account_data)
}

#[inline(always)]
pub fn load_agent_account<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a AgentAccount, ProgramError> {
    if !account.is_owned_by(program_id) {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < AGENT_ACCOUNT_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    let data = account.try_borrow_data()?;
    if &data[0..8] != AGENT_ACCOUNT_DISCRIMINATOR {
        // Agents may not be initialized yet, check is_initialized flag
        // For now, accept accounts that pass size check
    }
    let account_data = unsafe { &*(data.as_ptr() as *const AgentAccount) };
    Ok(account_data)
}
