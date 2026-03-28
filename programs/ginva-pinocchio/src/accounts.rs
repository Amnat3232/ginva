//! GINVA Protocol - Pinocchio Version
//! Account data structures - Simplified without bytemuck derives

#![allow(dead_code)]

use crate::GinvaError;
use pinocchio::account_info::AccountInfo;
use pinocchio::program_error::ProgramError;
use pinocchio::pubkey::Pubkey;

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

pub const ASSET_CONFIG_SIZE: usize =
    8 + 32 + 32 + 32 + 8 + 8 + 1 + 1 + 8 + 1 + 1 + 16 + 8 + 1 + 32 + 8 + 1 + 1 + 32 + 8;

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
    pub collateral_weight_bps: [u8; 32],
    pub debt_weight_bps: u64,
    pub circuit_breaker_triggered: u8,
    pub circuit_breaker_threshold_bps: u8,
    pub circuit_breaker_reset_factor_bps: [u8; 32],
    pub liquidation_loan_value_ratio_bps: u64,
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
}

impl AssetOracleConfig {}

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
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a SystemConfig, ProgramError> {
    // 1. Validate owner
    if account.owner() != program_id {
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

#[inline(always)]
pub fn load_loan_account<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a LoanAccount, ProgramError> {
    if account.owner() != program_id {
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

#[inline(always)]
pub fn load_asset_config<'a>(
    account: &'a AccountInfo,
    program_id: &Pubkey,
) -> Result<&'a AssetConfig, ProgramError> {
    if account.owner() != program_id {
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
