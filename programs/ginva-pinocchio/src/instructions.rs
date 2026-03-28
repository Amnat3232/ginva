//! GINVA Protocol - Pinocchio Version
//! Instructions implementation

#![allow(unused_variables)]
#![allow(clippy::op_ref)]
#![allow(dead_code)]
#![allow(clippy::result_unit_err)]

use crate::accounts::*;
use crate::GinvaError;
use pinocchio::account_info::AccountInfo;
use pinocchio::program_error::ProgramError;
use pinocchio::pubkey::Pubkey;
use pinocchio::ProgramResult;

#[allow(unused_variables)]
#[allow(clippy::op_ref)]
// ============================================================================
// INSTRUCTION ENUM
// ============================================================================
#[repr(u8)]
pub enum GinvaInstruction {
    InitializeSystem = 0,
    InitializeProtocolConfig = 1,
    InitializeAsset = 2,
    Deposit = 3,
    Borrow = 4,
    Repay = 5,
    Liquidate = 6,
    Withdraw = 7,
    StakeAgent = 8,
    UnstakeAgent = 9,
    RegisterKeeper = 10,
    KeeperHeartbeat = 11,
}

impl GinvaInstruction {
    pub fn from_u8(value: u8) -> Result<Self, ()> {
        match value {
            0 => Ok(GinvaInstruction::InitializeSystem),
            1 => Ok(GinvaInstruction::InitializeProtocolConfig),
            2 => Ok(GinvaInstruction::InitializeAsset),
            3 => Ok(GinvaInstruction::Deposit),
            4 => Ok(GinvaInstruction::Borrow),
            5 => Ok(GinvaInstruction::Repay),
            6 => Ok(GinvaInstruction::Liquidate),
            7 => Ok(GinvaInstruction::Withdraw),
            8 => Ok(GinvaInstruction::StakeAgent),
            9 => Ok(GinvaInstruction::UnstakeAgent),
            10 => Ok(GinvaInstruction::RegisterKeeper),
            11 => Ok(GinvaInstruction::KeeperHeartbeat),
            _ => Err(()),
        }
    }
}

// ============================================================================
// INSTRUCTION DISPATCHER
// ============================================================================

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.is_empty() {
        return Err(GinvaError::InvalidInstruction.into());
    }

    let instruction =
        GinvaInstruction::try_from(data[0]).map_err(|_| GinvaError::InvalidInstruction)?;

    match instruction {
        GinvaInstruction::InitializeSystem => {
            process_initialize_system(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::InitializeProtocolConfig => {
            process_initialize_protocol_config(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::InitializeAsset => {
            process_initialize_asset(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::Deposit => process_deposit(_program_id, accounts, &data[1..]),
        GinvaInstruction::Borrow => process_borrow(_program_id, accounts, &data[1..]),
        GinvaInstruction::Repay => process_repay(_program_id, accounts, &data[1..]),
        GinvaInstruction::Liquidate => process_liquidate(_program_id, accounts, &data[1..]),
        GinvaInstruction::Withdraw => process_withdraw(_program_id, accounts, &data[1..]),
        GinvaInstruction::StakeAgent => process_stake_agent(_program_id, accounts, &data[1..]),
        GinvaInstruction::UnstakeAgent => process_unstake_agent(_program_id, accounts, &data[1..]),
        GinvaInstruction::RegisterKeeper => {
            process_register_keeper(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::KeeperHeartbeat => {
            process_keeper_heartbeat(_program_id, accounts, &data[1..])
        }
    }
}

impl TryFrom<u8> for GinvaInstruction {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(GinvaInstruction::InitializeSystem),
            1 => Ok(GinvaInstruction::InitializeProtocolConfig),
            2 => Ok(GinvaInstruction::InitializeAsset),
            3 => Ok(GinvaInstruction::Deposit),
            4 => Ok(GinvaInstruction::Borrow),
            5 => Ok(GinvaInstruction::Repay),
            6 => Ok(GinvaInstruction::Liquidate),
            7 => Ok(GinvaInstruction::Withdraw),
            8 => Ok(GinvaInstruction::StakeAgent),
            9 => Ok(GinvaInstruction::UnstakeAgent),
            10 => Ok(GinvaInstruction::RegisterKeeper),
            11 => Ok(GinvaInstruction::KeeperHeartbeat),
            _ => Err(()),
        }
    }
}

// ============================================================================
// INSTRUCTION IMPLEMENTATIONS
// ============================================================================

/// InitializeSystem: Initialize the protocol configuration
///
/// Accounts expected (in order):
/// 0. [signer] admin
/// 1. [writable] system_config
/// 2. [writable] protocol_config
/// 3. [writable] ops_wallet (token account)
/// 4. [writable] reserve_wallet (token account)
/// 5. [readonly] collateral_mint
/// 6. [readonly] loan_mint
/// 7. [readonly] system_program
fn process_initialize_system(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // Parse data: deposit_fee_bps (u16)
    if data.len() < 2 {
        return Err(GinvaError::InvalidInput.into());
    }
    let deposit_fee_bps = u16::from_le_bytes([data[0], data[1]]);

    // Validate accounts
    if accounts.len() < 7 {
        return Err(GinvaError::InvalidInput.into());
    }

    let admin = &accounts[0];
    let system_config = &accounts[1];
    let protocol_config = &accounts[2];
    let ops_wallet = &accounts[3];
    let reserve_wallet = &accounts[4];
    let collateral_mint = &accounts[5];
    let loan_mint = &accounts[6];

    // 1. Validate signer
    if !admin.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // 2. Validate system_config is not already initialized
    // (Check if discriminator is set or data is non-zero)
    let config_data = system_config.try_borrow_data()?;
    let is_initialized = &config_data[0..8] == b"config__" || config_data.iter().any(|&b| b != 0);
    if is_initialized {
        return Err(GinvaError::InvalidInput.into()); // Already initialized
    }
    drop(config_data);

    // 3. Validate mints are not zero (security)
    if collateral_mint.key().as_ref() == &[0u8; 32] || loan_mint.key().as_ref() == &[0u8; 32] {
        return Err(GinvaError::InvalidInput.into());
    }

    // 4. Initialize system_config account data
    {
        let mut config_data = system_config.try_borrow_mut_data()?;

        // Write discriminator (8 bytes): b"config__"
        config_data[0..8].copy_from_slice(b"config__");

        // Write admin pubkey (32 bytes)
        config_data[8..40].copy_from_slice(admin.key().as_ref());

        // Write other authorities as admin for now (can be changed later)
        config_data[40..72].copy_from_slice(admin.key().as_ref()); // capital_wallet_authority
        config_data[72..104].copy_from_slice(admin.key().as_ref()); // vault_wallet_authority
        config_data[104..136].copy_from_slice(admin.key().as_ref()); // revenue_wallet_authority
        config_data[136..168].copy_from_slice(admin.key().as_ref()); // seized_assets_authority

        // Write mint pubkeys
        config_data[168..200].copy_from_slice(collateral_mint.key().as_ref()); // collateral_mint
        config_data[200..232].copy_from_slice(loan_mint.key().as_ref()); // loan_mint

        // Write deposit_fee_bps (2 bytes) at offset 282
        config_data[282..284].copy_from_slice(&deposit_fee_bps.to_le_bytes());

        // Write is_active = 1 (1 byte) at offset 284
        config_data[284] = 1;
    }

    Ok(())
}

/// InitializeAsset: Add a new asset to the protocol
fn process_initialize_asset(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 24 {
        return Err(GinvaError::InvalidInput.into());
    }

    // Parse params (only use asset_id for now, others are placeholders)
    let _asset_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let _utilization_ratio_bps = u16::from_le_bytes([data[8], data[9]]);
    let _interest_rate_bps = u16::from_le_bytes([data[10], data[11]]);
    let _liquidation_bonus_bps = u16::from_le_bytes([data[12], data[13]]);
    let _max_ltv_bps = u16::from_le_bytes([data[14], data[15]]);
    let _liquidation_threshold_bps = u16::from_le_bytes([data[16], data[17]]);
    let _debt_weight_bps = u64::from_le_bytes([
        data[18], data[19], data[20], data[21], data[22], data[23], data[24], data[25],
    ]);

    // Validate accounts count
    if accounts.len() < 6 {
        return Err(GinvaError::InvalidInput.into());
    }

    // Account indices:
    // 0. [signer] admin
    // 1. [writable] asset_config
    // 2. [writable] system_config
    // 3. [readonly] mint
    // 4. [writable] reserve_wallet
    // 5. [writable] debt_share_mint

    let admin = &accounts[0];
    let asset_config = &accounts[1];
    let system_config = &accounts[2];
    let mint = &accounts[3];
    let reserve_wallet = &accounts[4];
    let debt_share_mint = &accounts[5];

    if !admin.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Verify system config is initialized
    let sys_config = load_system_config(system_config, _program_id)?;
    if sys_config.admin() != admin.key().as_ref() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Initialize asset config
    {
        let mut config_data = asset_config.try_borrow_mut_data()?;

        // Write discriminator
        config_data[0..8].copy_from_slice(b"asset___");

        // Write asset_id (32 bytes padded)
        config_data[8..40].copy_from_slice(&_asset_id.to_le_bytes());
        // Pad remaining with zeros

        // Write is_active = 1
        config_data[60] = 1;
    }

    Ok(())
}

/// Deposit: User deposits collateral
fn process_deposit(_program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts expected:
    // 0. [signer] user
    // 1. [writable] user_token_account
    // 2. [writable] reserve_wallet
    // 3. [readonly] system_config
    // 4. [readonly] collateral_mint
    // 5. [readonly] token_program

    if accounts.len() < 6 {
        return Err(GinvaError::InvalidInput.into());
    }

    let user = &accounts[0];
    let user_token_account = &accounts[1];
    let reserve_wallet = &accounts[2];
    let system_config = &accounts[3];
    let token_program = &accounts[5];

    // 1. Validate signer
    if !user.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // 2. Validate token program
    if token_program.key().as_ref() != &[6u8; 32] && token_program.key().as_ref() != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // 3. Load system config
    let config = load_system_config(system_config, _program_id)?;

    // 4. Check protocol is active (not paused AND is_active = true)
    if !config.is_active() {
        return Err(GinvaError::ProtocolPaused.into());
    }

    // 5. Validate amounts don't overflow
    let fee = (amount as u128 * config.deposit_fee_bps as u128 / 10000) as u64;
    let net_amount = amount
        .checked_sub(fee)
        .ok_or(GinvaError::ArithmeticOverflow)?;

    // TODO: CPI to token::transfer from user_token_account to reserve_wallet

    // Update total_collateral in system_config
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        // Offset for total_collateral: 8 + 32*5 + 2 + 1 + 8 = 197
        let current = u64::from_le_bytes([
            config_data[197],
            config_data[198],
            config_data[199],
            config_data[200],
            config_data[201],
            config_data[202],
            config_data[203],
            config_data[204],
        ]);
        let new_total = current
            .checked_add(amount)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        config_data[197..205].copy_from_slice(&new_total.to_le_bytes());
    }

    Ok(())
}

/// Borrow: User borrows against collateral
fn process_borrow(_program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let asset_id = u64::from_le_bytes([
        data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts:
    // 0. [signer] borrower
    // 1. [writable] loan_account
    // 2. [writable] asset_config
    // 3. [writable] system_config
    // 4. [writable] borrower_token_account
    // 5. [readonly] collateral_mint

    if accounts.len() < 6 {
        return Err(GinvaError::InvalidInput.into());
    }

    let borrower = &accounts[0];
    let loan_account = &accounts[1];
    let asset_config = &accounts[2];
    let system_config = &accounts[3];
    let borrower_token_account = &accounts[4];

    if !borrower.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Load configs
    let config = load_system_config(system_config, _program_id)?;
    let asset = load_asset_config(asset_config, _program_id)?;

    if config.is_paused() {
        return Err(GinvaError::ProtocolPaused.into());
    }

    if !asset.is_active() {
        return Err(GinvaError::AssetNotActive.into());
    }

    // Phase 2: Check circuit breaker
    if asset.circuit_breaker_triggered() {
        return Err(GinvaError::CircuitBreakerActive.into());
    }

    // Phase 2: Check supply cap
    if asset.is_supply_cap_exceeded(amount) {
        return Err(GinvaError::SupplyCapExceeded.into());
    }

    // TODO: Full borrow logic with LTV checks, loan account creation, etc.

    Ok(())
}

/// Repay: User repays a loan
fn process_repay(_program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let loan_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let amount = u64::from_le_bytes([
        data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts expected
    if accounts.len() < 5 {
        return Err(GinvaError::InvalidInput.into());
    }

    let payer = &accounts[0];
    let loan_account = &accounts[1];
    let system_config = &accounts[2];
    let payer_token_account = &accounts[3];
    let reserve_wallet = &accounts[4];

    if !payer.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Load loan account
    let loan = load_loan_account(loan_account, _program_id)?;

    if loan.is_initialized() && loan.borrower() != payer.key().as_ref() {
        return Err(GinvaError::Unauthorized.into());
    }

    // TODO: Calculate interest and process repayment

    Ok(())
}

/// Liquidate: Liquidate an undercollateralized loan
fn process_liquidate(_program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let loan_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);

    if accounts.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let liquidator = &accounts[0];
    let loan_account = &accounts[1];
    let asset_config = &accounts[2];
    let system_config = &accounts[3];
    let liquidator_collateral_account = &accounts[4];
    let liquidator_repay_account = &accounts[5];
    let reserve_wallet = &accounts[6];

    if !liquidator.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Load loan and check liquidation conditions
    let loan = load_loan_account(loan_account, _program_id)?;

    if !loan.is_initialized() {
        return Err(GinvaError::LoanNotActive.into());
    }

    if loan.is_liquidated() {
        return Err(GinvaError::AlreadyBeingLiquidated.into());
    }

    // TODO: Full liquidation logic

    Ok(())
}

/// Withdraw: User withdraws collateral
fn process_withdraw(_program_id: &Pubkey, _accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // TODO: Implement withdraw logic

    Ok(())
}

/// StakeAgent: Stake tokens to an agent
fn process_stake_agent(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let agent_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let amount = u64::from_le_bytes([
        data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // TODO: Implement stake logic

    Ok(())
}

/// UnstakeAgent: Unstake tokens from an agent
fn process_unstake_agent(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    // TODO: Implement unstake logic

    Ok(())
}

/// RegisterKeeper: Register a keeper agent
fn process_register_keeper(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 9 {
        return Err(GinvaError::InvalidInput.into());
    }

    let agent_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let keeper_type = data[8];

    // TODO: Implement keeper registration

    Ok(())
}

/// KeeperHeartbeat: Keeper sends heartbeat to stay active
fn process_keeper_heartbeat(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _data: &[u8],
) -> ProgramResult {
    if accounts.len() < 2 {
        return Err(GinvaError::InvalidInput.into());
    }

    let keeper = &accounts[0];
    let system_config = &accounts[1];

    if !keeper.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Verify system is active
    let config = load_system_config(system_config, _program_id)?;
    if !config.is_active() {
        return Err(GinvaError::AssetNotActive.into());
    }

    Ok(())
}

/// InitializeProtocolConfig: Initialize protocol configuration
fn process_initialize_protocol_config(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // Params: liquidation_timeout (i64), auto_swap_reward_bps (u16), distribute_reward_bps (u16)
    if data.len() < 12 {
        return Err(GinvaError::InvalidInput.into());
    }

    if accounts.len() < 2 {
        return Err(GinvaError::InvalidInput.into());
    }

    let admin = &accounts[0];
    let protocol_config = &accounts[1];

    if !admin.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Initialize protocol config data
    {
        let mut config_data = protocol_config.try_borrow_mut_data()?;

        // Write discriminator
        config_data[0..8].copy_from_slice(b"protconf");

        // Write liquidation_timeout
        config_data[8..16].copy_from_slice(&86400i64.to_le_bytes());

        // Write auto_swap_reward_bps at offset 16
        config_data[16..18].copy_from_slice(&1000u16.to_le_bytes());

        // Write distribute_reward_bps at offset 18
        config_data[18..20].copy_from_slice(&2000u16.to_le_bytes());
    }

    Ok(())
}
