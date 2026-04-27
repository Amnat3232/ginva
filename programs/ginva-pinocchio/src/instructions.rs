//! GINVA Protocol - Pinocchio Version
//! Instructions implementation

#![allow(unused_variables)]
#![allow(clippy::op_ref)]
#![allow(dead_code)]
#![allow(clippy::result_unit_err)]

use crate::accounts::*;
use crate::GinvaError;
use pinocchio::account_info::AccountInfo;
use pinocchio::pubkey::Pubkey;
use pinocchio::ProgramResult;
use pinocchio::program_error::ProgramError;

#[allow(unused_variables)]
#[allow(clippy::op_ref)]
// ============================================================================
// INSTRUCTION ENUM
// ============================================================================
#[repr(u8)]
pub enum GinvaInstruction {
    InitializeSystem = 0,
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
    accounts: &mut [AccountInfo],
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
        // CreateSystemConfig - deprecated, use InitializeSystem
        // GinvaInstruction::CreateSystemConfig => {
        //     process_create_system_config(_program_id, accounts, &data[1..])
        // }
    }
}

impl TryFrom<u8> for GinvaInstruction {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(GinvaInstruction::InitializeSystem),
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
    accounts: &mut [AccountInfo],
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

    // Get signer status - admin should be signer (account[0])
    let is_signer = accounts[0].is_signer();
    if !is_signer {
        return Err(GinvaError::Unauthorized.into());
    }

    // Check if system config has lamports (account exists)
    let sys_lamports = accounts[1].lamports();
    if sys_lamports == 0 {
        return Err(GinvaError::Uninitialized.into());
    }

    // Get admin address as bytes - store in array to avoid borrow conflicts
    let admin_key = accounts[0].key();
    let mut admin_bytes = [0u8; 32];
    admin_bytes.copy_from_slice(admin_key.as_ref());

    // Get mint addresses as bytes - store in arrays to avoid borrow conflicts
    let coll_mint_key = accounts[5].key();
    let mut coll_mint_bytes = [0u8; 32];
    coll_mint_bytes.copy_from_slice(coll_mint_key.as_ref());

    let loan_mint_key = accounts[6].key();
    let mut loan_mint_bytes = [0u8; 32];
    loan_mint_bytes.copy_from_slice(loan_mint_key.as_ref());

    // Validate mints not zero
    if coll_mint_bytes == [0u8; 32] || loan_mint_bytes == [0u8; 32] {
        return Err(GinvaError::InvalidInput.into());
    }

    // NOW we can safely borrow mutably - all immutable refs are out of scope
    let system_config = &mut accounts[1];

    // Check if already initialized
    let config_data = system_config.try_borrow_data()?;
    if config_data.len() >= 8 && &config_data[0..8] == b"config__" {
        return Err(GinvaError::InvalidInput.into());
    }
    drop(config_data);

    // Initialize system_config account data
    {
        let mut config_data = system_config.try_borrow_mut_data()?;

        // Write discriminator (8 bytes): b"config__"
        config_data[0..8].copy_from_slice(b"config__");

        // Write admin pubkey (32 bytes)
        config_data[8..40].copy_from_slice(&admin_bytes);

        // Write other authorities as admin for now (can be changed later)
        config_data[40..72].copy_from_slice(&admin_bytes); // capital_wallet_authority
        config_data[72..104].copy_from_slice(&admin_bytes); // vault_wallet_authority
        config_data[104..136].copy_from_slice(&admin_bytes); // revenue_wallet_authority
        config_data[136..168].copy_from_slice(&admin_bytes); // seized_assets_authority

        // Write mint pubkeys
        config_data[168..200].copy_from_slice(&coll_mint_bytes); // collateral_mint
        config_data[200..232].copy_from_slice(&loan_mint_bytes); // loan_mint

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
    accounts: &mut [AccountInfo],
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

    let (immutable_accounts, mutable_accounts) = accounts.split_at_mut(2);
    
    let admin = &immutable_accounts[0];
    let admin_address = admin.key();
    let system_config = &immutable_accounts[2];
    let mint = &immutable_accounts[3];
    let reserve_wallet = &immutable_accounts[4];
    let debt_share_mint = &immutable_accounts[5];
    
    let asset_config = &mut mutable_accounts[1];

    if !admin.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Verify system config is initialized
    let sys_config = load_system_config(system_config, _program_id)?;
    if sys_config.admin() != admin_address.as_ref() {
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
fn process_deposit(_program_id: &Pubkey, accounts: &mut [AccountInfo], data: &[u8]) -> ProgramResult {
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

    let (immutable_accounts, mutable_accounts) = accounts.split_at_mut(4);
    
    let user = &immutable_accounts[0];
    let user_token_account = &immutable_accounts[1];
    let token_program = &immutable_accounts[5];
    
    let reserve_wallet = &mutable_accounts[2];
    let system_config = &mut mutable_accounts[3];

    // 1. Validate signer
    if !user.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // 2. Validate token program
    if token_program.key().as_ref() != &[6u8; 32]
        && token_program.key().as_ref() != &[2u8; 32]
    {
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
fn process_borrow(_program_id: &Pubkey, accounts: &mut [AccountInfo], data: &[u8]) -> ProgramResult {
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
fn process_repay(_program_id: &Pubkey, accounts: &mut [AccountInfo], data: &[u8]) -> ProgramResult {
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
fn process_liquidate(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
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

   // ============================================================================
   // LIQUIDATION LOGIC - GINVA Fairness Features
   // ============================================================================
   // Layer 1: Immediate liquidation when HF < 100% due to price drop (no grace)
   // Layer 2: 72h grace period only when loan matures (time expired)
   // ============================================================================

   let current_time: u64 = 0; // TODO: Get from Clock sysvar

   // Layer 1: Price drop - liquidate immediately if HF < 100%
   if loan.is_health_factor_critical() && !loan.is_in_grace_period(current_time) {
       // Price triggered - liquidate NOW, no grace period
       return Err(GinvaError::InvalidLiquidationStatus.into());
   }

   // Layer 2: Check grace period eligibility
   if loan.is_in_grace_period(current_time) {
       if loan.liquidation_trigger_reason == 2 {
           // Maturity expired - can liquidate during 72h grace
           return Err(GinvaError::InvalidLiquidationStatus.into());
       } else {
           // Still protected by grace period
           return Err(GinvaError::InProtectionPeriod.into());
       }
   }

   // Cannot liquidate if health is OK
   if !loan.is_health_factor_critical() {
       return Err(GinvaError::HealthFactorNotCritical.into());
   }

   Ok(())
}

/// Withdraw: User withdraws collateral
fn process_withdraw(
    _program_id: &Pubkey,
    _accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
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
    _accounts: &mut [AccountInfo],
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
    _accounts: &mut [AccountInfo],
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
    _accounts: &mut [AccountInfo],
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
    accounts: &mut [AccountInfo],
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
