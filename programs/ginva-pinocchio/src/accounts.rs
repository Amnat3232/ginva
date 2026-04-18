//! GINVA Protocol - Pinocchio Version
//! Account data structures - Simplified without bytemuck derives

#![allow(dead_code)]
#![allow(clippy::manual_abs_diff)]

use crate::GinvaError;
use pinocchio::AccountView;
use pinocchio::Address;
use solana_program_error::ProgramError;

// ============================================================================
// System Config Account
// ============================================================================

pub const SYSTEM_CONFIG_SIZE: usize = 8 + 32 * 5 + 2 + 1 + 8 + 8 + 32 + 8 + 16 + 1 + 50;

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

pub const LOAN_ACCOUNT_SIZE: usize =
    8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 16 + 16 + 1 + 32 + 1 + 8;

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

#[inline(always)]
pub fn load_system_config<'a>(
    account: &'a AccountView,
    program_id: &Address,
) -> Result<&'a SystemConfig, ProgramError> {
    // 1. Validate owner
    if unsafe { account.owned_by(program_id) } {
        return Err(ProgramError::IncorrectProgramId);
    }
    // 2. Validate data length
    if account.data_len() < SYSTEM_CONFIG_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    // 3. Validate discriminator
    let data = account.try_borrow()?;
    if &data[0..8] != SYSTEM_CONFIG_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    // 4. Safe cast (validated)
    let account_data = unsafe { &*(data.as_ptr() as *const SystemConfig) };
    Ok(account_data)
}

#[inline(always)]
pub fn load_loan_account<'a>(
    account: &'a AccountView,
    program_id: &Address,
) -> Result<&'a LoanAccount, ProgramError> {
    if unsafe { account.owned_by(program_id) } {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < LOAN_ACCOUNT_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    let data = account.try_borrow()?;
    if &data[0..8] != LOAN_ACCOUNT_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    let account_data = unsafe { &*(data.as_ptr() as *const LoanAccount) };
    Ok(account_data)
}

#[inline(always)]
pub fn load_asset_config<'a>(
    account: &'a AccountView,
    program_id: &Address,
) -> Result<&'a AssetConfig, ProgramError> {
    if unsafe { account.owned_by(program_id) } {
        return Err(ProgramError::IncorrectProgramId);
    }
    if account.data_len() < ASSET_CONFIG_SIZE {
        return Err(GinvaError::InvalidInput.into());
    }
    let data = account.try_borrow()?;
    if &data[0..8] != ASSET_CONFIG_DISCRIMINATOR {
        return Err(ProgramError::UninitializedAccount);
    }
    let account_data = unsafe { &*(data.as_ptr() as *const AssetConfig) };
    Ok(account_data)
}
