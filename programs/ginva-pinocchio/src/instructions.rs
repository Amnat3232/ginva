//! GINVA Protocol - Pinocchio Version
//! Instructions implementation

#![allow(unused_variables)]
#![allow(clippy::op_ref)]
#![allow(dead_code)]
#![allow(clippy::result_unit_err)]

use crate::accounts::*;
use crate::calculate_interest;
use crate::cpi::{cpi_get_clock_time, cpi_token_transfer, cpi_token_transfer_with_seeds, derive_reserve_pda, GINVA_PROGRAM_ID};
use crate::{APR, LTV_MAX, DEFAULT_PRICE_DECAY_BPS};
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
    TriggerLiquidation = 12,
    BuyFromStorefront = 13,
    FinalizeLiquidation = 14,
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
        GinvaInstruction::TriggerLiquidation => {
            process_trigger_liquidation(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::BuyFromStorefront => {
            process_buy_from_storefront(_program_id, accounts, &data[1..])
        }
        GinvaInstruction::FinalizeLiquidation => {
            process_finalize_liquidation(_program_id, accounts, &data[1..])
        }
        // CreateSystemConfig - deprecated, use InitializeSystem
        // GinvaInstruction::CreateSystemConfig => {
        //     process_create_system_config(_program_id, accounts, &data[1..])
        // }
        GinvaInstruction::InitializeProtocolConfig => {
            process_initialize_system(_program_id, accounts, &data[1..])
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
///
/// Accounts:
///   0. [signer]         user              (authority for token transfer)
///   1. [writable]       user_token_account (collateral source)
///   2. [writable]       reserve_wallet    (protocol reserve account)
///   3. [writable]       system_config      (reentrancy guard + totals)
///   4. [writable]       collateral_mint    (mint validation)
///   5. [writable]       token_program      (Token/Token2022 program)
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

    if accounts.len() < 6 {
        return Err(GinvaError::InvalidInput.into());
    }

    // split_at_mut(3): immutable=[0,1,2], mutable=[3,4,5]
    let (immutable_accounts, mutable_accounts) = accounts.split_at_mut(3);

    let user               = &immutable_accounts[0]; // accounts[0]
    let user_token_account = &immutable_accounts[1]; // accounts[1]
    let system_config      = &mutable_accounts[0]; // accounts[3]
    let reserve_wallet     = &mutable_accounts[1]; // accounts[4]
    let token_program      = &mutable_accounts[2]; // accounts[5]

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

    // 3. Load system config (mutable borrow for reentrancy guard + totals)
    let config = load_system_config_mut(system_config, _program_id)?;

    // 4. Acquire reentrancy guard — prevents recursive calls
    acquire_reentrancy_guard(config)?;

    // 5. Check protocol is active
    if !config.is_active() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // 6. Calculate deposit fee using checked math
    let fee = (amount as u128)
        .checked_mul(config.deposit_fee_bps as u128)
        .and_then(|v| v.checked_div(10_000))
        .map(|v| v as u64)
        .ok_or(GinvaError::ArithmeticOverflow)?;

    // 7. Execute token transfer: user → reserve via CPI
    cpi_token_transfer(
        user_token_account,
        reserve_wallet,
        user,
        amount,
        None, // mint validation — set to collateral mint address in production
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // 8. Update total_collateral in system_config (separate borrow from token CPI)
    {
        // Offset 243: total_collateral (u64 LE) per SystemConfig layout
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current = u64::from_le_bytes([
            config_data[243], config_data[244], config_data[245],
            config_data[246], config_data[247], config_data[248],
            config_data[249], config_data[250],
        ]);
        let new_total = current
            .checked_add(amount)
            .ok_or(GinvaError::ArithmeticOverflow)?;
        config_data[243..251].copy_from_slice(&new_total.to_le_bytes());
    }

    // 9. Release reentrancy guard on success
    release_reentrancy_guard(config);

    Ok(())
}

fn process_borrow(_program_id: &Pubkey, accounts: &mut [AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let borrow_amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let _asset_id = u64::from_le_bytes([
        data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15],
    ]);

    if borrow_amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts:
    // 0. [signer]       borrower
    // 1. [writable]     borrower_collateral_account
    // 2. [writable]     reserve_wallet
    // 3. [writable]     system_config
    // 4. [writable]     loan_account (PDA to be created)
    // 5. [writable]     asset_config
    // 6. [writable]     borrower_loan_token_account
    // 7. [readonly]     clock
    // 8. [readonly]     token_program
    // 9. [readonly]     associated_token_program

    if accounts.len() < 10 {
        return Err(GinvaError::InvalidInput.into());
    }

    let borrower = &accounts[0];
    let borrower_collateral = &accounts[1];
    let reserve_wallet = &accounts[2];
    let system_config = &accounts[3];
    let loan_account = &accounts[4];
    let asset_config = &accounts[5];
    let clock_account = &accounts[7];
    let token_program = &accounts[8];

    // Validate signer
    if !borrower.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Load configs with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Get current time for loan
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| {
            release_reentrancy_guard(config);
            GinvaError::OracleTemporarilyUnavailable
        })?;

    let asset = load_asset_config(asset_config, _program_id)?;
    if !asset.is_active() {
        release_reentrancy_guard(config);
        return Err(GinvaError::AssetNotActive.into());
    }

    // Check circuit breaker
    if asset.circuit_breaker_triggered() {
        release_reentrancy_guard(config);
        return Err(GinvaError::CircuitBreakerActive.into());
    }

    // Check supply cap
    if asset.is_supply_cap_exceeded(borrow_amount) {
        release_reentrancy_guard(config);
        return Err(GinvaError::SupplyCapExceeded.into());
    }

    // Calculate required collateral based on LTV
    // LTV_MAX is u8 (60 = 60%), we need bps
    let ltv_bps = (LTV_MAX as u64) * 100; // 60 -> 6000 bps
    let collateral_value_per_token: u128 = 1_000_000; // Assuming 1:1 for simplicity

    // required_collateral = borrow_amount * collateral_value_per_token * 10000 / ltv_bps
    let required_collateral = (borrow_amount as u128)
        .checked_mul(collateral_value_per_token)
        .and_then(|v| v.checked_mul(10_000))
        .and_then(|v| v.checked_div(ltv_bps as u128))
        .ok_or_else(|| {
            release_reentrancy_guard(config);
            GinvaError::ArithmeticOverflow
        })?;

    let required_collateral_u64 = required_collateral as u64;

    // Transfer collateral from borrower to reserve
    cpi_token_transfer(
        borrower_collateral,
        reserve_wallet,
        borrower,
        required_collateral_u64,
        None,
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Initialize loan account with borrow details
    {
        let mut loan_data = loan_account.try_borrow_mut_data()?;

        // Write discriminator: b"loanac01"
        loan_data[0..8].copy_from_slice(b"loanac01");

        // Write borrower pubkey (32 bytes at offset 8)
        let borrower_key = borrower.key().as_ref();
        loan_data[8..40].copy_from_slice(borrower_key);

        // Set status = 1 (Active) at offset 40
        loan_data[40] = 1;

        // Write collateral_amount (8 bytes at offset 41)
        loan_data[41..49].copy_from_slice(&required_collateral_u64.to_le_bytes());

        // Write loan_amount (8 bytes at offset 49)
        loan_data[49..57].copy_from_slice(&borrow_amount.to_le_bytes());

        // Write cumulative_interest = 0 (8 bytes at offset 57)
        loan_data[57..65].copy_from_slice(&0u64.to_le_bytes());

        // Write last_interest_update = current_time (8 bytes at offset 65)
        loan_data[65..73].copy_from_slice(&current_time.to_le_bytes());

        // Write loan_start_time (8 bytes at offset 73)
        loan_data[73..81].copy_from_slice(&current_time.to_le_bytes());

        // Write loan_maturity_time (8 bytes at offset 81) - default 30 days
        let maturity_seconds: u64 = 30 * 24 * 3600;
        let maturity_time = current_time + maturity_seconds;
        loan_data[81..89].copy_from_slice(&maturity_time.to_le_bytes());

        // Write is_liquidated = 0 (1 byte at offset 89)
        loan_data[89] = 0;

        // Write liquidation_processed = 0 (1 byte at offset 90)
        loan_data[90] = 0;

        // Write is_initialized = 1 (1 byte at offset 213)
        loan_data[213] = 1;

        // Write health_factor = 10000 (i64 = 1.0 * 10000) (8 bytes at offset 215)
        loan_data[215..223].copy_from_slice(&10000i64.to_le_bytes());

        // Write grace_period_active = 0 (1 byte at offset 223)
        loan_data[223] = 0;
    }

    // Update total_borrowed in system_config
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current_borrowed = u64::from_le_bytes([
            config_data[232], config_data[233], config_data[234],
            config_data[235], config_data[236], config_data[237],
            config_data[238], config_data[239],
        ]);
        let new_total = current_borrowed
            .checked_add(borrow_amount)
            .ok_or_else(|| {
                release_reentrancy_guard(config);
                GinvaError::ArithmeticOverflow
            })?;
        config_data[232..240].copy_from_slice(&new_total.to_le_bytes());
    }

    // Release reentrancy guard
    release_reentrancy_guard(config);

    Ok(())
}

/// Repay: User repays a loan
fn process_repay(_program_id: &Pubkey, accounts: &mut [AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts:
    // 0. [signer]       payer (borrower or approved)
    // 1. [writable]     loan_account
    // 2. [writable]     system_config
    // 3. [writable]     payer_token_account (repay token source)
    // 4. [writable]     reserve_wallet (destination)
    // 5. [readonly]     clock
    // 6. [readonly]     token_program

    if accounts.len() < 7 {
        return Err(GinvaError::InvalidInput.into());
    }

    let payer = &accounts[0];
    let loan_account = &accounts[1];
    let system_config = &accounts[2];
    let payer_token_account = &accounts[3];
    let reserve_wallet = &accounts[4];
    let clock_account = &accounts[5];
    let token_program = &accounts[6];

    // Validate signer
    if !payer.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Load system config with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Load loan account
    let loan = load_loan_account(loan_account, _program_id)?;

    // Verify payer is the borrower
    if loan.is_initialized() && loan.borrower() != payer.key().as_ref() {
        release_reentrancy_guard(config);
        return Err(GinvaError::Unauthorized.into());
    }

    // Check loan is active
    if loan.status != 1 || loan.is_liquidated() {
        release_reentrancy_guard(config);
        return Err(GinvaError::LoanNotActive.into());
    }

    // Calculate additional interest accrued since last update
    let last_update = loan.last_interest_update;

    let duration = current_time.saturating_sub(last_update);

    // Calculate interest using the protocol's APR (800 bps = 8%)
    let interest = calculate_interest(loan.loan_amount, duration, APR);

    // Calculate total debt
    let principal = loan.loan_amount;
    let total_debt = principal
        .saturating_add(loan.cumulative_interest)
        .saturating_add(interest);

    // Validate repayment amount
    if amount > total_debt {
        release_reentrancy_guard(config);
        return Err(GinvaError::InvalidAmount.into());
    }

    // Transfer repayment tokens from payer to reserve
    cpi_token_transfer(
        payer_token_account,
        reserve_wallet,
        payer,
        amount,
        None,
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Update loan account
    {
        let mut loan_data = loan_account.try_borrow_mut_data()?;

        // Calculate remaining debt after repayment
        let remaining_debt = total_debt.saturating_sub(amount);

        if remaining_debt == 0 {
            // Loan fully repaid - mark as completed
            // status = 2 means Repaid/Completed
            loan_data[40] = 2;
        } else {
            // Partial repayment
            // Reduce principal proportionally if amount > interest
            let applied_to_interest = interest.min(amount);
            let remaining_for_principal = amount - applied_to_interest;

            // Update cumulative_interest (offset 57)
            let new_interest = loan.cumulative_interest
                .saturating_add(interest)
                .saturating_sub(applied_to_interest);
            let new_interest_bytes = new_interest.to_le_bytes();
            loan_data[57..65].copy_from_slice(&new_interest_bytes);

            // Reduce principal if applicable (offset 49)
            if remaining_for_principal > 0 {
                let new_principal = principal.saturating_sub(remaining_for_principal);
                loan_data[49..57].copy_from_slice(&new_principal.to_le_bytes());
            }
        }

        // Update last_interest_update to current time (offset 65)
        loan_data[65..73].copy_from_slice(&current_time.to_le_bytes());
    }

    // Update total_borrowed in system_config (reduce by amount repaid)
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current_borrowed = u64::from_le_bytes([
            config_data[232], config_data[233], config_data[234],
            config_data[235], config_data[236], config_data[237],
            config_data[238], config_data[239],
        ]);
        let new_total = current_borrowed.saturating_sub(amount);
        config_data[232..240].copy_from_slice(&new_total.to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}

/// Liquidate: Liquidate an undercollateralized loan
///
/// Accounts:
///   0. [signer]   liquidator
///   1. [writable] loan_account
///   2. [writable] asset_config
///   3. [writable] system_config
///   4. [writable] liquidator_collateral_account
///   5. [writable] liquidator_repay_account
///   6. [writable] reserve_wallet
///   7. [readonly]  clock (Clock sysvar — unix_timestamp for grace period)
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

    // Accounts:
    // 0. [signer]       liquidator
    // 1. [writable]     loan_account
    // 2. [writable]     asset_config
    // 3. [writable]     system_config
    // 4. [writable]     liquidator_collateral_account
    // 5. [writable]     liquidator_repay_account
    // 6. [writable]     reserve_wallet
    // 7. [readonly]     clock
    // 8. [readonly]     token_program

    if accounts.len() < 9 {
        return Err(GinvaError::InvalidInput.into());
    }

    let liquidator = &accounts[0];
    let loan_account = &accounts[1];
    let asset_config = &accounts[2];
    let system_config = &accounts[3];
    let liquidator_collateral_account = &accounts[4];
    let liquidator_repay_account = &accounts[5];
    let reserve_wallet = &accounts[6];
    let clock_account = &accounts[7];
    let token_program = &accounts[8];

    // Validate signer
    if !liquidator.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Load system config with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Load loan account
    let loan = load_loan_account(loan_account, _program_id)?;

    if !loan.is_initialized() {
        release_reentrancy_guard(config);
        return Err(GinvaError::LoanNotActive.into());
    }

    if loan.is_liquidated() {
        release_reentrancy_guard(config);
        return Err(GinvaError::AlreadyBeingLiquidated.into());
    }

    // Load asset config
    let asset = load_asset_config(asset_config, _program_id)?;

    // ============================================================================
    // LIQUIDATION VALIDATION - GINVA Fairness Features
    // ============================================================================
    // Layer 1: Immediate liquidation when HF < 100% due to price drop (no grace)
    // Layer 2: 72h grace period only when loan matures (time expired)
    // ============================================================================

    // Layer 1: Price drop - liquidate immediately if HF < 100% and not in grace period
    if loan.is_health_factor_critical() && !loan.is_in_grace_period(current_time) {
        // Price triggered - liquidate NOW, no grace period
        // Continue to execute liquidation
    }
    // Layer 2: Check grace period eligibility
    else if loan.is_in_grace_period(current_time) {
        if loan.liquidation_trigger_reason == 2 {
            // Maturity expired - can liquidate during 72h grace
            // Continue to execute liquidation
        } else {
            // Still protected by grace period
            release_reentrancy_guard(config);
            return Err(GinvaError::InProtectionPeriod.into());
        }
    }
    // Cannot liquidate if health is OK and not due to maturity
    else if !loan.is_health_factor_critical() && loan.liquidation_trigger_reason != 2 {
        release_reentrancy_guard(config);
        return Err(GinvaError::HealthFactorNotCritical.into());
    }

    // Validate reserve_wallet is Ginva-owned PDA — prevents fake wallet drain attack.
    let expected_reserve = derive_reserve_pda();
    if reserve_wallet.key() != &expected_reserve {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }

    // Calculate total debt (principal + interest)
    let total_debt = loan.total_debt();

    // Calculate liquidation amount (debt + bonus)
    let liquidation_bonus = loan.liquidation_bonus_bps as u64; // in bps
    let bonus_amount = (total_debt as u128)
        .checked_mul(liquidation_bonus as u128)
        .and_then(|v| v.checked_div(10_000))
        .unwrap_or(0) as u64;
    let total_liquidation = total_debt.saturating_add(bonus_amount);

    // Calculate collateral to receive (debt + part of bonus)
    // Liquidator pays debt + bonus, receives collateral worth (debt + partial bonus)
    // This creates profit incentive for liquidators
    let collateral_to_receive = (total_debt as u128)
        .checked_mul(10_000)
        .and_then(|v| v.checked_div((10_000u128).saturating_sub(liquidation_bonus as u128 / 2)))
        .and_then(|v| v.checked_div(10_000))
        .unwrap_or(loan.collateral_amount as u128) as u64;

    // Cap at available collateral
    let actual_collateral = collateral_to_receive.min(loan.collateral_amount);

    // Step 1: Transfer repay tokens from liquidator to reserve (paying off debt)
    cpi_token_transfer(
        liquidator_repay_account,
        reserve_wallet,
        liquidator,
        total_debt, // Pay only the debt amount
        None,
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Step 2: Transfer collateral from reserve to liquidator using reserve PDA
    // Reserve wallet (PDA) must sign via invoke_signed — ONLY Ginva program controls this
    cpi_token_transfer_with_seeds(
        reserve_wallet,
        liquidator_collateral_account,
        reserve_wallet,
        actual_collateral,
        b"reserve",
        GINVA_PROGRAM_ID.as_ref(),
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Step 3: Update loan account status
    {
        let mut loan_data = loan_account.try_borrow_mut_data()?;

        // Mark as liquidated (offset 89)
        loan_data[89] = 1;

        // Mark liquidation_processed (offset 90)
        loan_data[90] = 1;

        // Record liquidation initiated time (offset 91) - 8 bytes
        loan_data[91..99].copy_from_slice(&current_time.to_le_bytes());

        // Record collateral price at liquidation (offset 99) - 8 bytes
        loan_data[99..107].copy_from_slice(&0u64.to_le_bytes()); // Price would come from oracle

        // Record seized collateral amount (offset 107) - 8 bytes
        loan_data[107..115].copy_from_slice(&actual_collateral.to_le_bytes());
    }

    // Step 4: Update system_config total_borrowed
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current = u64::from_le_bytes([
            config_data[232], config_data[233], config_data[234],
            config_data[235], config_data[236], config_data[237],
            config_data[238], config_data[239],
        ]);
        let new_total = current.saturating_sub(total_debt);
        config_data[232..240].copy_from_slice(&new_total.to_le_bytes());

        // Update total_collateral (offset 243)
        let current_collateral = u64::from_le_bytes([
            config_data[243], config_data[244], config_data[245],
            config_data[246], config_data[247], config_data[248],
            config_data[249], config_data[250],
        ]);
        let new_collateral = current_collateral.saturating_sub(actual_collateral);
        config_data[243..251].copy_from_slice(&new_collateral.to_le_bytes());
    }

    // Step 5: Update asset_config total_reserve
    {
        let mut asset_data = asset_config.try_borrow_mut_data()?;
        // total_reserve is at offset 16-23 based on AssetConfig struct
        let current = u64::from_le_bytes([
            asset_data[16], asset_data[17], asset_data[18], asset_data[19],
            asset_data[20], asset_data[21], asset_data[22], asset_data[23],
        ]);
        let new_reserve = current.saturating_sub(actual_collateral);
        asset_data[16..24].copy_from_slice(&new_reserve.to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}

/// Withdraw: User withdraws collateral
fn process_withdraw(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
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

    // Accounts:
    // 0. [signer]       user
    // 1. [writable]     user_token_account (destination for collateral)
    // 2. [writable]     reserve_wallet (source)
    // 3. [writable]     system_config
    // 4. [readonly]     token_program

    if accounts.len() < 5 {
        return Err(GinvaError::InvalidInput.into());
    }

    let user = &accounts[0];
    let user_token_account = &accounts[1];
    let reserve_wallet = &accounts[2];
    let system_config = &accounts[3];
    let token_program = &accounts[4];

    // Validate signer
    if !user.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Load system config with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Check sufficient collateral in reserve
    let total_collateral = u64::from_le_bytes([
        config.total_collateral.to_le_bytes()[0],
        config.total_collateral.to_le_bytes()[1],
        config.total_collateral.to_le_bytes()[2],
        config.total_collateral.to_le_bytes()[3],
        config.total_collateral.to_le_bytes()[4],
        config.total_collateral.to_le_bytes()[5],
        config.total_collateral.to_le_bytes()[6],
        config.total_collateral.to_le_bytes()[7],
    ]);

    if amount > total_collateral {
        release_reentrancy_guard(config);
        return Err(GinvaError::InsufficientFunds.into());
    }

    // Calculate withdrawal fee (0 for now, can add fee logic)
    let withdraw_amount = amount;

    // Validate that reserve_wallet is the expected Ginva-owned PDA — NOT a client-submitted regular wallet.
// This prevents a malicious client from submitting their own wallet and signing the transfer.
    let expected_reserve = derive_reserve_pda();
    if reserve_wallet.key() != &expected_reserve {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }

    // Transfer collateral from reserve to user using reserve PDA authority.
    // ONLY the Ginva program can sign for the reserve PDA — no user/admin can drain it.
    cpi_token_transfer_with_seeds(
        reserve_wallet,
        user_token_account,
        reserve_wallet,
        withdraw_amount,
        b"reserve",
        GINVA_PROGRAM_ID.as_ref(),
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Update total_collateral in system_config
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current = u64::from_le_bytes([
            config_data[243], config_data[244], config_data[245],
            config_data[246], config_data[247], config_data[248],
            config_data[249], config_data[250],
        ]);
        let new_total = current
            .saturating_sub(withdraw_amount);
        config_data[243..251].copy_from_slice(&new_total.to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}

/// StakeAgent: Stake tokens to an agent
fn process_stake_agent(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let _agent_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let amount = u64::from_le_bytes([
        data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts:
    // 0. [signer]       user
    // 1. [writable]     user_stake_account (PDA for user's stake)
    // 2. [writable]     agent_account
    // 3. [writable]     user_token_account
    // 4. [writable]     agent_stake_pool (reserve)
    // 5. [writable]     system_config
    // 6. [writable]     stake_share_mint (rewards)
    // 7. [readonly]     clock
    // 8. [readonly]     token_program

    if accounts.len() < 9 {
        return Err(GinvaError::InvalidInput.into());
    }

    let user = &accounts[0];
    let user_stake = &accounts[1];
    let agent_account = &accounts[2];
    let user_token = &accounts[3];
    let stake_pool = &accounts[4];
    let system_config = &accounts[5];
    let clock_account = &accounts[7];
    let token_program = &accounts[8];

    // Validate signer
    if !user.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Load system config with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Load agent account (if exists and is active)
    let agent = load_agent_account(agent_account, _program_id)?;

    // Check agent status
    if !agent.is_initialized() || !agent.is_active() || agent.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::AgentNotFound.into());
    }

    // Transfer stake tokens from user to stake pool
    cpi_token_transfer(
        user_token,
        stake_pool,
        user,
        amount,
        None,
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Initialize or update user stake account
    {
        let mut stake_data = user_stake.try_borrow_mut_data()?;

        // Write discriminator: b"stakeac1"
        stake_data[0..8].copy_from_slice(b"stakeac1");

        // Write user pubkey (32 bytes at offset 8)
        let user_key = user.key().as_ref();
        stake_data[8..40].copy_from_slice(user_key);

        // Write agent pubkey (32 bytes at offset 40)
        let agent_key = agent_account.key().as_ref();
        stake_data[40..72].copy_from_slice(agent_key);

        // Write is_initialized = 1 (1 byte at offset 72)
        stake_data[72] = 1;

        // Write staked_amount (8 bytes at offset 73)
        stake_data[73..81].copy_from_slice(&amount.to_le_bytes());

        // Write last_stake_update (8 bytes at offset 81)
        stake_data[81..89].copy_from_slice(&current_time.to_le_bytes());
    }

    // Update agent's staked amount
    {
        let mut agent_data = agent_account.try_borrow_mut_data()?;

        // Get current staked amount (offset 73 based on AgentAccount struct)
        let current = u64::from_le_bytes([
            agent_data[73], agent_data[74], agent_data[75],
            agent_data[76], agent_data[77], agent_data[78],
            agent_data[79], agent_data[80],
        ]);
        let new_staked = current.saturating_add(amount);
        agent_data[73..81].copy_from_slice(&new_staked.to_le_bytes());

        // Update last stake update time (offset 81)
        agent_data[81..89].copy_from_slice(&current_time.to_le_bytes());

        // Update total staked in system config (offset 256)
        agent_data[89..97].copy_from_slice(&current_time.to_le_bytes());
    }

    // Update total_staked in system_config
    {
        let mut config_data = system_config.try_borrow_mut_data()?;

        // Get current total_staked (should be around offset 256 based on struct)
        let current = u64::from_le_bytes([
            config_data[256], config_data[257], config_data[258],
            config_data[259], config_data[260], config_data[261],
            config_data[262], config_data[263],
        ]);
        let new_total = current.saturating_add(amount);
        config_data[256..264].copy_from_slice(&new_total.to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}

/// UnstakeAgent: Unstake tokens from an agent
fn process_unstake_agent(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 16 {
        return Err(GinvaError::InvalidInput.into());
    }

    let amount = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);

    if amount == 0 {
        return Err(GinvaError::InvalidAmount.into());
    }

    // Accounts:
    // 0. [signer]       user
    // 1. [writable]     user_stake_account
    // 2. [writable]     agent_account
    // 3. [writable]     stake_pool (reserve for tokens)
    // 4. [writable]     user_token_account (destination)
    // 5. [writable]     system_config
    // 6. [readonly]     clock
    // 7. [readonly]     token_program

    if accounts.len() < 8 {
        return Err(GinvaError::InvalidInput.into());
    }

    let user = &accounts[0];
    let user_stake = &accounts[1];
    let agent_account = &accounts[2];
    let stake_pool = &accounts[3];
    let user_token = &accounts[4];
    let system_config = &accounts[5];
    let clock_account = &accounts[6];
    let token_program = &accounts[7];

    // Validate signer
    if !user.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Validate token program
    let tp_bytes = token_program.key().as_ref();
    if tp_bytes != &[6u8; 32] && tp_bytes != &[2u8; 32] {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Load system config with reentrancy protection
    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;

    // Check protocol is active
    if config.is_paused() {
        release_reentrancy_guard(config);
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Load user stake account
    let stake_data = user_stake.try_borrow_data()?;

    // Verify user owns this stake account
    if stake_data[8..40] != user.key().as_ref()[..32] {
        release_reentrancy_guard(config);
        return Err(GinvaError::Unauthorized.into());
    }

    // Get current staked amount
    let current_staked = u64::from_le_bytes([
        stake_data[73], stake_data[74], stake_data[75],
        stake_data[76], stake_data[77], stake_data[78],
        stake_data[79], stake_data[80],
    ]);

    if amount > current_staked {
        release_reentrancy_guard(config);
        return Err(GinvaError::InsufficientFunds.into());
    }
    drop(stake_data);

    // Load agent account
    let agent = load_agent_account(agent_account, _program_id)?;

    // Check min stake time (if applicable)
    // For simplicity, allowing immediate unstake - can add logic for lock period

    // Transfer tokens from stake pool to user
    cpi_token_transfer(
        stake_pool,
        user_token,
        user, // In production, this should be protocol authority
        amount,
        None,
    ).map_err(|e| {
        release_reentrancy_guard(config);
        e
    })?;

    // Update user stake account
    {
        let mut stake_mut = user_stake.try_borrow_mut_data()?;

        // Reduce staked amount
        let new_staked = current_staked.saturating_sub(amount);
        stake_mut[73..81].copy_from_slice(&new_staked.to_le_bytes());

        // Update last stake update
        stake_mut[81..89].copy_from_slice(&current_time.to_le_bytes());
    }

    // Update agent's staked amount
    {
        let mut agent_data = agent_account.try_borrow_mut_data()?;

        let current = u64::from_le_bytes([
            agent_data[73], agent_data[74], agent_data[75],
            agent_data[76], agent_data[77], agent_data[78],
            agent_data[79], agent_data[80],
        ]);
        let new_staked = current.saturating_sub(amount);
        agent_data[73..81].copy_from_slice(&new_staked.to_le_bytes());

        // Update last stake update time
        agent_data[81..89].copy_from_slice(&current_time.to_le_bytes());
    }

    // Update total_staked in system_config
    {
        let mut config_data = system_config.try_borrow_mut_data()?;
        let current = u64::from_le_bytes([
            config_data[256], config_data[257], config_data[258],
            config_data[259], config_data[260], config_data[261],
            config_data[262], config_data[263],
        ]);
        let new_total = current.saturating_sub(amount);
        config_data[256..264].copy_from_slice(&new_total.to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}

/// RegisterKeeper: Register a keeper agent
fn process_register_keeper(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 9 {
        return Err(GinvaError::InvalidInput.into());
    }

    let _agent_id = u64::from_le_bytes([
        data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
    ]);
    let keeper_type = data[8];

    // Keeper type: 0 = liquidation, 1 = oracle, 2 = both
    if keeper_type > 2 {
        return Err(GinvaError::InvalidInput.into());
    }

    // Accounts:
    // 0. [signer]       keeper (authority)
    // 1. [writable]     keeper_pool
    // 2. [writable]     system_config
    // 3. [readonly]     clock

    if accounts.len() < 4 {
        return Err(GinvaError::InvalidInput.into());
    }

    let keeper = &accounts[0];
    let keeper_pool = &accounts[1];
    let system_config = &accounts[2];
    let clock_account = &accounts[3];

    // Validate signer
    if !keeper.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Load system config
    let config = load_system_config(system_config, _program_id)?;

    // Check protocol is active
    if !config.is_active() {
        return Err(GinvaError::ProtocolPaused.into());
    }

    // Initialize or update keeper pool
    let pool_data = keeper_pool.try_borrow_data()?;

    // Check if pool is initialized
    if &pool_data[0..8] == b"kpools__" {
        // Pool already initialized - check keeper limit
        let keeper_count = u64::from_le_bytes([
            pool_data[60], pool_data[61], pool_data[62],
            pool_data[63], pool_data[64], pool_data[65],
            pool_data[66], pool_data[67],
        ]);

        if keeper_count >= 50 {
            return Err(GinvaError::KeeperAlreadyRegistered.into());
        }

        // Check if keeper already registered
        // KeeperInfo is 48 bytes each, starting at offset 68
        // keeper: 32 bytes
        // allocated_amount: 8 bytes
        // last_allocation_update: 8 bytes
        for i in 0..50 {
            let offset = 68 + (i * 48);
            if pool_data[offset..offset+32] == keeper.key().as_ref()[..32] {
                return Err(GinvaError::KeeperAlreadyRegistered.into());
            }
        }

        drop(pool_data);

        // Add keeper to pool
        let mut pool_mut = keeper_pool.try_borrow_mut_data()?;

        // Find empty slot and add keeper
        for i in 0..50 {
            let offset = 68 + (i * 48);
            let current_keeper = u64::from_le_bytes([
                pool_mut[offset], pool_mut[offset+1], pool_mut[offset+2], pool_mut[offset+3],
                pool_mut[offset+4], pool_mut[offset+5], pool_mut[offset+6], pool_mut[offset+7],
            ]);

            if current_keeper == 0 {
                // Empty slot found - add keeper
                pool_mut[offset..offset+32].copy_from_slice(keeper.key().as_ref());

                // Update keeper count
                let new_count = u64::from_le_bytes([
                    pool_mut[60], pool_mut[61], pool_mut[62],
                    pool_mut[63], pool_mut[64], pool_mut[65],
                    pool_mut[66], pool_mut[67],
                ]);
                let updated_count = new_count + 1;
                pool_mut[60..68].copy_from_slice(&updated_count.to_le_bytes());
                break;
            }
        }
    } else {
        // Initialize new keeper pool
        drop(pool_data);
        let mut pool_mut = keeper_pool.try_borrow_mut_data()?;

        // Write discriminator
        pool_mut[0..8].copy_from_slice(b"kpools__");

        // Write total_allocated = 0 (offset 8)
        pool_mut[8..16].copy_from_slice(&0u64.to_le_bytes());

        // Write keeper_registration_enabled = 1 (offset 16)
        pool_mut[16] = 1;

        // Write is_initialized = 1 (offset 17)
        pool_mut[17] = 1;

        // Write total_rewards = 0 (offset 18)
        pool_mut[18..26].copy_from_slice(&0u64.to_le_bytes());

        // Write keeper_count = 1 (offset 26)
        pool_mut[26..34].copy_from_slice(&1u64.to_le_bytes());

        // Write first keeper at offset 68
        pool_mut[68..100].copy_from_slice(keeper.key().as_ref());

        // Write last_keeper_allocation_update = current_time (offset 100)
        pool_mut[100..108].copy_from_slice(&current_time.to_le_bytes());
    }

    Ok(())
}

/// KeeperHeartbeat: Keeper sends heartbeat to stay active
fn process_keeper_heartbeat(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // Accounts:
    // 0. [signer]       keeper
    // 1. [writable]     keeper_pool
    // 2. [readonly]     clock

    if accounts.len() < 3 {
        return Err(GinvaError::InvalidInput.into());
    }

    let keeper = &accounts[0];
    let keeper_pool = &accounts[1];
    let clock_account = &accounts[2];

    if !keeper.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }

    // Get current time
    let current_time = cpi_get_clock_time(clock_account)
        .map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    // Verify keeper is registered in pool
    let pool_data = keeper_pool.try_borrow_data()?;

    if &pool_data[0..8] != b"kpools__" {
        return Err(GinvaError::KeeperNotRegistered.into());
    }

    // Search for keeper in pool
    let mut keeper_found = false;
    for i in 0..50 {
        let offset = 68 + (i * 48);
        if pool_data[offset..offset+32] == keeper.key().as_ref()[..32] {
            keeper_found = true;

            // Update last_allocation_update at offset + 40
            drop(pool_data);
            let mut pool_mut = keeper_pool.try_borrow_mut_data()?;
            pool_mut[offset+40..offset+48].copy_from_slice(&current_time.to_le_bytes());
            break;
        }
    }

    if !keeper_found {
        return Err(GinvaError::KeeperNotRegistered.into());
    }

    Ok(())
}

// ============================================================================
// 3-TIER KEEPER LIQUIDATION SYSTEM
// Design:
//   - SeizedVault (PDA) = data account tracking collateral pending liquidation
//   - Storefront (PDA) = data account tracking time-decay price schedule
//   - Actual tokens remain in reserve_wallet (Ginva PDA) at all times
//   - Keeper A: validate + list, Keeper B: buy at decayed price,
//     Keeper C: confirm + close. No single keeper controls everything.
// ============================================================================

// SeizedVault account size + discriminator
const SEIZED_VAULT_SIZE: usize = 89;
const SEIZED_VAULT_DISCRIM: &[u8; 8] = b"seized__";
// Status: 0=pending, 1=active, 2=sold, 3=expired
const STATUS_PENDING: u8 = 0;
const STATUS_ACTIVE: u8 = 1;
const STATUS_SOLD: u8 = 2;
const STATUS_EXPIRED: u8 = 3;

// Storefront account size + discriminator
const STOREFRONT_SIZE: usize = 73;
const STOREFRONT_DISCRIM: &[u8; 8] = b"storefr_";
// Status: 0=inactive, 1=active, 2=sold, 3=expired
const SF_INACTIVE: u8 = 0;
const SF_ACTIVE: u8 = 1;
const SF_SOLD: u8 = 2;
const SF_EXPIRED: u8 = 3;

const LISTING_HOURS: u64 = 24;
const DECAY_PER_HOUR_BPS: u64 = 417; // 4.17% per hour → reaches floor (~25%) in ~24h

/// Derive seized_vault PDA: seed = "seized_vault" || loan_id_bytes || "gva"
#[inline(always)]
#[allow(unsafe_code)]
unsafe fn derive_seized_vault(loan_id: u64) -> [u8; 32] {
    let mut seed = [0u8; 42];
    seed[..10].copy_from_slice(b"seized_vault");
    seed[10..18].copy_from_slice(&loan_id.to_le_bytes());
    seed[18..21].copy_from_slice(b"gva");
    let mut pda = [0u8; 32];
    let mut bump_ctr = 0u8;
    while bump_ctr < 255 {
        seed[41] = 255u8 - bump_ctr;
        let res = pinocchio::syscalls::sol_create_program_address(
            seed.as_ptr(), 42, GINVA_PROGRAM_ID.as_ptr(), pda.as_mut_ptr()
        );
        if res == 0 { return pda; }
        bump_ctr += 1;
    }
    [0u8; 32]
}

/// Derive storefront PDA: seed = "storefront" || loan_id_bytes || "sfa"
#[inline(always)]
#[allow(unsafe_code)]
unsafe fn derive_storefront(loan_id: u64) -> [u8; 32] {
    let mut seed = [0u8; 42];
    seed[..9].copy_from_slice(b"storefront");
    seed[9..17].copy_from_slice(&loan_id.to_le_bytes());
    seed[17..20].copy_from_slice(b"sfa");
    let mut pda = [0u8; 32];
    let mut bump_ctr = 0u8;
    while bump_ctr < 255 {
        seed[41] = 255u8 - bump_ctr;
        let res = pinocchio::syscalls::sol_create_program_address(
            seed.as_ptr(), 42, GINVA_PROGRAM_ID.as_ptr(), pda.as_mut_ptr()
        );
        if res == 0 { return pda; }
        bump_ctr += 1;
    }
    [0u8; 32]
}

/// Time-decay price formula:
/// `elapsed_hours = (current_time - listing_start) / 3600`
/// `decay_bps = min(elapsed_hours * 417, 10000)`
/// `price = initial_price * (10000 - decay_bps) / 10000`
/// `floor = max(min_price, collateral_value * 70 / 100)`
#[inline(always)]
fn storefront_current_price(
    initial: u64, min_price: u64,
    listing_start: u64, current_time: u64,
) -> u64 {
    if current_time <= listing_start { return initial; }
    let hours = (current_time.saturating_sub(listing_start)) / 3600;
    let decay = if hours * DECAY_PER_HOUR_BPS > 10_000 { 10_000 } else { hours * DECAY_PER_HOUR_BPS };
    let multiplier = 10_000u64.saturating_sub(decay);
    let price = (initial as u128).saturating_mul(multiplier as u128) / 10_000;
    (price as u64).max(min_price)
}

/// Verify keeper is registered in the keeper pool
#[inline(always)]
fn keeper_is_registered(keeper: &AccountInfo, pool: &AccountInfo) -> bool {
    let data = pool.try_borrow_data().ok()?;
    if &data[0..8] != b"kpools__" { return false; }
    (0..50).any(|i| {
        let off = 68 + (i * 48);
        off + 32 <= data.len() && data[off..off+32] == *keeper.key().as_ref()
    })
}

// ============================================================================
// KEEPER A — Trigger Liquidation
// Opcode: 12
// "I verified this loan is unhealthy. Listing it for orderly liquidation."
// ============================================================================
/// TriggerLiquidation accounts (10):
///   0. [signer]     keeper
///   1. [writable]   loan_account
///   2. [writable]   seized_vault (PDA to init)
///   3. [writable]   storefront (PDA to init)
///   4. [writable]   reserve_wallet
///   5. [writable]   system_config
///   6. [readonly]    collateral_oracle
///   7. [readonly]    clock
///   8. [readonly]    token_program
///   9. [readonly]    keeper_pool
fn process_trigger_liquidation(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 8 { return Err(GinvaError::InvalidInput.into()); }
    let loan_id = u64::from_le_bytes([data[0],data[1],data[2],data[3],data[4],data[5],data[6],data[7]]);
    if accounts.len() < 10 { return Err(GinvaError::InvalidInput.into()); }

    let keeper          = &accounts[0];
    let loan_account    = &accounts[1];
    let seized_vault    = &accounts[2];
    let storefront      = &accounts[3];
    let reserve_wallet  = &accounts[4];
    let system_config   = &accounts[5];
    let oracle          = &accounts[6];
    let clock           = &accounts[7];
    let token_prog      = &accounts[8];
    let keeper_pool     = &accounts[9];

    if !keeper.is_signer() { return Err(GinvaError::Unauthorized.into()); }
    let tp = token_prog.key().as_ref();
    if tp != &[6u8; 32] && tp != &[2u8; 32] { return Err(ProgramError::IncorrectProgramId); }

    let now = cpi_get_clock_time(clock).map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;
    if config.is_paused() { release_reentrancy_guard(config); return Err(GinvaError::ProtocolPaused.into()); }
    drop(config);

    if !keeper_is_registered(keeper, keeper_pool) {
        release_reentrancy_guard(config);
        return Err(GinvaError::KeeperNotAuthorized.into());
    }

    let loan = load_loan_account(loan_account, _program_id)?;
    if !loan.is_initialized() { release_reentrancy_guard(config); return Err(GinvaError::LoanNotActive.into()); }
    if loan.is_liquidated() { release_reentrancy_guard(config); return Err(GinvaError::AlreadyBeingLiquidated.into()); }
    if !loan.is_health_factor_critical() {
        release_reentrancy_guard(config);
        return Err(GinvaError::HealthFactorNotCritical.into());
    }

    // Validate reserve_wallet is Ginva's controlled PDA
    if reserve_wallet.key() != &derive_reserve_pda() {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }

    // Read oracle price: offset 40-47 (i64) + offset 48-51 (exponent i32)
    let odata = oracle.try_borrow_data()?;
    if odata.len() < 56 { release_reentrancy_guard(config); return Err(GinvaError::OraclePriceNotInitialized.into()); }
    let raw_price = i64::from_le_bytes([odata[40],odata[41],odata[42],odata[43],odata[44],odata[45],odata[46],odata[47]]);
    let expo = i32::from_le_bytes([odata[48],odata[49],odata[50],odata[51]]);
    drop(odata);
    if raw_price == 0 { release_reentrancy_guard(config); return Err(GinvaError::OraclePriceNotInitialized.into()); }

    let price_human = if expo < 0 {
        (raw_price.unsigned_abs()) * 10u64.saturating_pow((-expo) as u32)
    } else {
        raw_price.unsigned_abs() / 10u64.saturating_pow(expo as u32)
    };

    // collateral_value = collateral_amount (6-decimal) * oracle_price / 1e6
    let collat_value = (loan.collateral_amount as u128)
        .saturating_mul(price_human as u128)
        .saturating_div(1_000_000) as u64;

    // Listing price = 105% of collateral value (5% bonus buffer)
    let listing_price = collat_value.saturating_mul(105).saturating_div(100);
    // Floor price = 70% of collateral value (never sell below this)
    let floor_price = collat_value.saturating_mul(70).saturating_div(100);
    let expires = now.saturating_add(LISTING_HOURS * 3600);

    // Verify PDA addresses match expected
    let exp_seized = derive_seized_vault(loan_id);
    let exp_sf = derive_storefront(loan_id);
    if seized_vault.key().as_ref() != &exp_seized[..] {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }
    if storefront.key().as_ref() != &exp_sf[..] {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }

    // Init seized_vault (89 bytes)
    {
        let mut d = seized_vault.try_borrow_mut_data()?;
        d[..SEIZED_VAULT_SIZE].fill(0);
        d[..8].copy_from_slice(SEIZED_VAULT_DISCRIM);               // [0:8]
        d[8..16].copy_from_slice(&loan_id.to_le_bytes());           // [8:16] loan_id
        // [16:48] collateral_mint — zeroed (derived from asset config in prod)
        d[48..56].copy_from_slice(&loan.collateral_amount.to_le_bytes()); // [48:56] total_units
        d[56..64].copy_from_slice(&listing_price.to_le_bytes());    // [56:64] initial_price
        d[64..72].copy_from_slice(&floor_price.to_le_bytes());      // [64:72] min_price
        d[72..80].copy_from_slice(&now.to_le_bytes());              // [72:80] listing_start
        d[80..88].copy_from_slice(&expires.to_le_bytes());          // [80:88] expires_at
        d[88] = STATUS_ACTIVE;                                      // [88] status
    }

    // Init storefront (73 bytes)
    {
        let mut d = storefront.try_borrow_mut_data()?;
        d[..STOREFRONT_SIZE].fill(0);
        d[..8].copy_from_slice(STOREFRONT_DISCRIM);                  // [0:8]
        d[8..40].copy_from_slice(&exp_seized[..]);                   // [8:40] seized_vault backlink
        d[40..48].copy_from_slice(&listing_price.to_le_bytes());      // [40:48] price_per_unit
        d[48..56].copy_from_slice(&floor_price.to_le_bytes());        // [48:56] min_price
        d[56..64].copy_from_slice(&DECAY_PER_HOUR_BPS.to_le_bytes()); // [56:64] decay_bps
        d[64..72].copy_from_slice(&now.to_le_bytes());               // [64:72] listing_start
        d[72..80].copy_from_slice(&expires.to_le_bytes());           // [72:80] expires_at
        // [80:88] total_units in storefront (same as seized vault)
        d[80..88].copy_from_slice(&loan.collateral_amount.to_le_bytes());
        d[88..96].copy_from_slice(&0u64.to_le_bytes());              // [88:96] sold = 0
        d[96] = SF_ACTIVE;                                          // [96] status
    }

    // Mark loan as liquidation-triggered
    {
        let mut d = loan_account.try_borrow_mut_data()?;
        d[89] = 1;   // is_liquidated
        d[90] = 0;   // liquidation_processed = false (in progress)
        d[232] = 1;  // liq_trigger_reason: 1 = Keeper A triggered
        d[223] = 0;  // grace_period_active = 0
    }

    release_reentrancy_guard(config);
    Ok(())
}

// ============================================================================
// KEEPER B — Buy from Storefront
// Opcode: 13
// "Current price is low enough. Buying this collateral now."
// ============================================================================
/// BuyFromStorefront accounts (10):
///   0. [signer]        keeper
///   1. [writable]     storefront (PDA)
///   2. [writable]     seized_vault (PDA)
///   3. [writable]     reserve_wallet (Ginva PDA, token source)
///   4. [writable]     keeper_collateral_acct
///   5. [writable]     keeper_repay_acct
///   6. [writable]     system_config
///   7. [readonly]      clock
///   8. [readonly]      token_program
///   9. [readonly]      keeper_pool
fn process_buy_from_storefront(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 16 { return Err(GinvaError::InvalidInput.into()); }
    let _loan_id = u64::from_le_bytes([data[0],data[1],data[2],data[3],data[4],data[5],data[6],data[7]]);
    let purchase_units = u64::from_le_bytes([data[8],data[9],data[10],data[11],data[12],data[13],data[14],data[15]]);
    if purchase_units == 0 { return Err(GinvaError::InvalidAmount.into()); }
    if accounts.len() < 10 { return Err(GinvaError::InvalidInput.into()); }

    let keeper           = &accounts[0];
    let storefront       = &accounts[1];
    let _seized_vault    = &accounts[2];
    let reserve_wallet   = &accounts[3];
    let keeper_collateral= &accounts[4];
    let keeper_repay     = &accounts[5];
    let system_config    = &accounts[6];
    let clock            = &accounts[7];
    let token_prog       = &accounts[8];
    let keeper_pool      = &accounts[9];

    if !keeper.is_signer() { return Err(GinvaError::Unauthorized.into()); }
    let tp = token_prog.key().as_ref();
    if tp != &[6u8; 32] && tp != &[2u8; 32] { return Err(ProgramError::IncorrectProgramId); }

    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;
    if config.is_paused() { release_reentrancy_guard(config); return Err(GinvaError::ProtocolPaused.into()); }
    drop(config);

    if !keeper_is_registered(keeper, keeper_pool) {
        return Err(GinvaError::KeeperNotAuthorized.into());
    }

    // Read storefront status + pricing
    let sf_data = storefront.try_borrow_data()?;
    if &sf_data[..8] != STOREFRONT_DISCRIM {
        release_reentrancy_guard(config);
        return Err(GinvaError::StorefrontNotListed.into());
    }
    let sf_status = sf_data[96];
    if sf_status != SF_ACTIVE {
        release_reentrancy_guard(config);
        return Err(GinvaError::StorefrontAlreadySold.into());
    }

    let price_per = u64::from_le_bytes([sf_data[40],sf_data[41],sf_data[42],sf_data[43],sf_data[44],sf_data[45],sf_data[46],sf_data[47]]);
    let min_price = u64::from_le_bytes([sf_data[48],sf_data[49],sf_data[50],sf_data[51],sf_data[52],sf_data[53],sf_data[54],sf_data[55]]);
    let listing_start = u64::from_le_bytes([sf_data[64],sf_data[65],sf_data[66],sf_data[67],sf_data[68],sf_data[69],sf_data[70],sf_data[71]]);
    let expires_at = u64::from_le_bytes([sf_data[72],sf_data[73],sf_data[74],sf_data[75],sf_data[76],sf_data[77],sf_data[78],sf_data[79]]);
    let total_units = u64::from_le_bytes([sf_data[80],sf_data[81],sf_data[82],sf_data[83],sf_data[84],sf_data[85],sf_data[86],sf_data[87]]);
    drop(sf_data);

    // Get current time for price calculation
    let now = cpi_get_clock_time(clock).map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;

    if now >= expires_at {
        // Mark as expired
        let mut d = storefront.try_borrow_mut_data()?;
        d[96] = SF_EXPIRED;
        release_reentrancy_guard(config);
        return Err(GinvaError::StorefrontExpired.into());
    }

    let current_price = storefront_current_price(price_per, min_price, listing_start, now);

    if purchase_units > total_units {
        release_reentrancy_guard(config);
        return Err(GinvaError::InsufficientFunds.into());
    }

    // Total cost: current_price * purchase_units
    let total_cost = (current_price as u128)
        .saturating_mul(purchase_units as u128) as u64;

    if total_cost == 0 {
        release_reentrancy_guard(config);
        return Err(GinvaError::InvalidAmount.into());
    }

    // Validate reserve wallet
    if reserve_wallet.key() != &derive_reserve_pda() {
        release_reentrancy_guard(config);
        return Err(ProgramError::InvalidSeeds.into());
    }

    // Step 1: Keeper pays cost to reserve_wallet (user controls this transfer)
    cpi_token_transfer(keeper_repay, reserve_wallet, keeper, total_cost, None)
        .map_err(|e| { release_reentrancy_guard(config); e })?;

    // Step 2: Transfer collateral to keeper from reserve_wallet via PDA signing
    // ONLY Ginva program can sign for reserve wallet — no keeper/admin can drain it
    cpi_token_transfer_with_seeds(
        reserve_wallet, keeper_collateral, reserve_wallet, purchase_units,
        b"reserve", GINVA_PROGRAM_ID.as_ref(),
    ).map_err(|e| { release_reentrancy_guard(config); e })?;

    // Step 3: Update sold_units in storefront
    {
        let mut d = storefront.try_borrow_mut_data()?;
        let sold = u64::from_le_bytes([d[88],d[89],d[90],d[91],d[92],d[93],d[94],d[95]]);
        let new_sold = sold.saturating_add(purchase_units);
        d[88..96].copy_from_slice(&new_sold.to_le_bytes());
        // Mark sold if all units purchased
        if new_sold >= total_units {
            d[96] = SF_SOLD;
        }
    }

    // Step 4: Update seized_vault status
    {
        let mut d = _seized_vault.try_borrow_mut_data()?;
        let sold = u64::from_le_bytes([d[88..96].try_into().ok()?]);
        let total = u64::from_le_bytes([d[80..88].try_into().ok()?]);
        if sold >= total { d[88] = STATUS_SOLD; }
    }

    release_reentrancy_guard(config);
    Ok(())
}

// ============================================================================
// KEEPER C — Finalize Liquidation
// Opcode: 14
// "All collateral sold or listing expired. Closing the books."
// ============================================================================
/// FinalizeLiquidation accounts (8):
///   0. [signer]        keeper
///   1. [writable]      loan_account
///   2. [writable]      seized_vault (PDA)
///   3. [writable]      storefront (PDA)
///   4. [writable]      system_config
///   5. [readonly]       clock
///   6. [readonly]       token_program
///   7. [readonly]       keeper_pool
/// Data: loan_id (8 bytes)
fn process_finalize_liquidation(
    _program_id: &Pubkey,
    accounts: &mut [AccountInfo],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 8 { return Err(GinvaError::InvalidInput.into()); }
    let _loan_id = u64::from_le_bytes([data[0],data[1],data[2],data[3],data[4],data[5],data[6],data[7]]);
    if accounts.len() < 8 { return Err(GinvaError::InvalidInput.into()); }

    let keeper       = &accounts[0];
    let loan_account = &accounts[1];
    let seized_vault = &accounts[2];
    let storefront   = &accounts[3];
    let system_config= &accounts[4];
    let clock        = &accounts[5];
    let token_prog   = &accounts[6];
    let keeper_pool  = &accounts[7];

    if !keeper.is_signer() { return Err(GinvaError::Unauthorized.into()); }
    let tp = token_prog.key().as_ref();
    if tp != &[6u8; 32] && tp != &[2u8; 32] { return Err(ProgramError::IncorrectProgramId); }

    let config = load_system_config_mut(system_config, _program_id)?;
    acquire_reentrancy_guard(config)?;
    if config.is_paused() { release_reentrancy_guard(config); return Err(GinvaError::ProtocolPaused.into()); }
    drop(config);

    if !keeper_is_registered(keeper, keeper_pool) {
        return Err(GinvaError::KeeperNotAuthorized.into());
    }

    // Verify storefront is either expired or fully sold
    let now = cpi_get_clock_time(clock).map_err(|_| GinvaError::OracleTemporarilyUnavailable)?;
    let sf_data = storefront.try_borrow_data()?;
    let sf_status = sf_data[96];
    let expires_at = u64::from_le_bytes([sf_data[72],sf_data[73],sf_data[74],sf_data[75],sf_data[76],sf_data[77],sf_data[78],sf_data[79]]);
    let total_units = u64::from_le_bytes([sf_data[80],sf_data[81],sf_data[82],sf_data[83],sf_data[84],sf_data[85],sf_data[86],sf_data[87]]);
    let sold_units = u64::from_le_bytes([sf_data[88],sf_data[89],sf_data[90],sf_data[91],sf_data[92],sf_data[93],sf_data[94],sf_data[95]]);
    drop(sf_data);

    let expired = now >= expires_at;
    let all_sold = sold_units >= total_units;

    if !expired && !all_sold && sf_status != SF_EXPIRED && sf_status != SF_SOLD {
        release_reentrancy_guard(config);
        return Err(GinvaError::StorefrontNotListed.into());
    }

    // Mark storefront status
    {
        let mut d = storefront.try_borrow_mut_data()?;
        if expired { d[96] = SF_EXPIRED; } else { d[96] = SF_SOLD; }
    }

    // Mark seized_vault status
    {
        let mut d = seized_vault.try_borrow_mut_data()?;
        if expired { d[88] = STATUS_EXPIRED; } else { d[88] = STATUS_SOLD; }
    }

    // Mark loan fully liquidated (close out)
    {
        let mut d = loan_account.try_borrow_mut_data()?;
        d[89] = 1;  // is_liquidated = true
        d[90] = 1;  // liquidation_processed = true
        d[232] = 3; // trigger_reason = 3 (Keeper C finalized)
    }

    // Reduce total_borrowed — the debt was paid via BuyFromStorefront
    {
        let mut d = system_config.try_borrow_mut_data()?;
        let owed = u64::from_le_bytes([d[232],d[233],d[234],d[235],d[236],d[237],d[238],d[239]]);
        d[232..240].copy_from_slice(&owed.saturating_sub(sold_units).to_le_bytes());
    }

    release_reentrancy_guard(config);
    Ok(())
}
