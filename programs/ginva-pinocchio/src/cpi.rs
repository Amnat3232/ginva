//! GINVA Protocol - Pinocchio Version
//! CPI (Cross-Program Invocations) for token transfers and oracle price feeds

use pinocchio::account_info::AccountInfo;
use pinocchio::instruction::{AccountMeta, Instruction, Seed, Signer};
use pinocchio::program::{invoke, invoke_signed};
use pinocchio::program_error::ProgramError;
use pinocchio::pubkey::Pubkey;
use pinocchio::ProgramResult;

// ============================================================================
// PROGRAM ID CONSTANTS  ([u8; 32] = Pubkey in pinocchio)
// ============================================================================

pub const TOKEN_PROGRAM_ID: Pubkey = [
    6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

pub const TOKEN_2022_PROGRAM_ID: Pubkey = [
    2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

pub const PYTH_PROGRAM_ID: Pubkey = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

pub const SOL_USD_FEED_ID: Pubkey = [
    0xef, 0x0d, 0x8b, 0x6f, 0xda, 0x2c, 0xeb, 0xa4, 0x1d, 0xa1, 0x5d, 0x40, 0x95, 0xd1, 0xda, 0x39,
    0xa0, 0xd2, 0xf8, 0xed, 0x0c, 0x6c, 0x7b, 0xc0, 0xf4, 0xcf, 0xac, 0x8c, 0x28, 0x0b, 0x56, 0x0d,
];

// Sentinel 0xFF — OBVIOUS if accidentally used in production
pub const JUPITER_PROGRAM_ID: Pubkey = [
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
];

// Clock sysvar address — unix_timestamp (i64 LE) at offset 49 of 259-byte layout
pub const CLOCK_SYSVAR_ID: Pubkey = [
    0xbc, 0xef, 0x2c, 0x10, 0xb7, 0x90, 0xec, 0x56,
    0xb0, 0x86, 0xbb, 0x23, 0xd3, 0x14, 0xce, 0x7e,
    0xcc, 0xa9, 0x6c, 0x7f, 0x5f, 0xfc, 0x67, 0xe8,
    0x83, 0x68, 0x1d, 0x4f, 0x4b, 0x5b, 0x03, 0xb4,
];

const SYSTEM_PROGRAM_ID: Pubkey = [0u8; 32];

const CLOCK_SYSVAR_DATA_SIZE: usize = 259;

// ============================================================================
// GINVA PROGRAM ID & RESERVE PDA
// ============================================================================

/// Ginva Pinocchio program ID — same value declared in lib.rs
pub const GINVA_PROGRAM_ID: Pubkey = [
    0xE8, 0xF1, 0x74, 0x7E, 0x58, 0x93, 0x0F, 0x4B,
    0xBC, 0xAB, 0xFA, 0x60, 0x5E, 0xDC, 0x30, 0xE1,
    0x7A, 0x82, 0xA6, 0x3A, 0x9E, 0xCD, 0xD0, 0xB7,
    0x44, 0x9E, 0x12, 0xDC, 0x0D, 0x83, 0xB6, 0xDD,
];

// NOTE: "reserve" as &[u8] for invoke_signed seed construction
pub const RESERVE_SEED: &[u8; 7] = b"reserve";

/// Derive the reserve wallet PDA owned by this program.
/// Uses sol_create_program_address syscall with hardcoded bump seed.
/// Seed = "reserve" || program_id_bytes
#[inline(always)]
#[allow(unsafe_code)]
pub fn derive_reserve_pda() -> Pubkey {
    // Build seed: "reserve" concatenated with program ID bytes
    // Seed bytes for PDA derivation = "reserve" || [Ginva program ID bytes]
    let mut seed_bytes = [0u8; 7 + 32]; // 39 bytes total
    seed_bytes[..7].copy_from_slice(RESERVE_SEED);
    seed_bytes[7..].copy_from_slice(&GINVA_PROGRAM_ID);

    let mut pda_bytes = [0u8; 32];
    let mut _bump = 0u8;

    // Try bumps from 255 downward until we find a valid PDA
    // Solana PDA marker = sha256("ProgramDerivedAddress"), last byte 255 is prohibited
    let mut attempts = 0u8;
    while attempts < 255 {
        // Set bump seed as last byte of seed
        seed_bytes[7 + 32 - 1] = 255u8 - attempts;
        _bump = 255u8 - attempts;

        let result = unsafe {
            pinocchio::syscalls::sol_create_program_address(
                seed_bytes.as_ptr(),
                (7 + 32) as u64,
                GINVA_PROGRAM_ID.as_ptr(),
                pda_bytes.as_mut_ptr(),
            )
        };

        // result == 0 means valid PDA found
        if result == 0 {
            return pda_bytes;
        }
        attempts += 1;
    }

    // Fallback: should never happen (255 bumps always includes a valid one)
    // Return zeroed PDA — will fail validation downstream
    [0u8; 32]
}

// ============================================================================
// CLOCK SYSVAR READER
// ============================================================================

#[inline(always)]
pub fn cpi_get_clock_time(clock: &AccountInfo) -> Result<u64, ProgramError> {
    let data = clock.try_borrow_data()?;
    if data.len() < CLOCK_SYSVAR_DATA_SIZE {
        return Err(ProgramError::InvalidAccountData);
    }
    let ts = i64::from_le_bytes([
        data[49], data[50], data[51], data[52],
        data[53], data[54], data[55], data[56],
    ]);
    Ok(ts.unsigned_abs())
}

#[inline(always)]
pub fn validate_clock_sysvar(clock: &AccountInfo) -> Result<(), ProgramError> {
    if clock.data_len() < CLOCK_SYSVAR_DATA_SIZE {
        return Err(ProgramError::InvalidAccountData);
    }
    Ok(())
}

// ============================================================================
// TOKEN CPI: Transfer  (Token Program opcode 3)
// ============================================================================

#[inline(always)]
pub fn cpi_token_transfer(
    source: &AccountInfo,
    destination: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
    expected_mint: Option<&Pubkey>,
) -> ProgramResult {
    if !source.is_writable() || !destination.is_writable() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if let Some(mint) = expected_mint {
        let src_data = source.try_borrow_data()?;
        if src_data.len() >= 32 {
            let src_mint = Pubkey::from(<[u8; 32]>::try_from(&src_data[..32]).unwrap_or([0; 32]));
            if &src_mint != mint {
                return Err(ProgramError::InvalidAccountData);
            }
        }
        let dst_data = destination.try_borrow_data()?;
        if dst_data.len() >= 32 {
            let dst_mint = Pubkey::from(<[u8; 32]>::try_from(&dst_data[..32]).unwrap_or([0; 32]));
            if &dst_mint != mint {
                return Err(ProgramError::InvalidAccountData);
            }
        }
    }

    let mut data = [0u8; 9];
    data[0] = 3; // transfer
    data[1..9].copy_from_slice(&amount.to_le_bytes());

    let instruction = Instruction {
        program_id: &TOKEN_PROGRAM_ID,
        accounts: &[
            AccountMeta::writable_signer(source.key()),
            AccountMeta::writable_signer(destination.key()),
            AccountMeta::readonly_signer(authority.key()),
            AccountMeta::readonly(&TOKEN_PROGRAM_ID),
        ],
        data: &data,
    };

    invoke::<4>(&instruction, &[source, destination, authority, source])
}


// ============================================================================
// TOKEN CPI: Transfer with PDA Signing (PDA controls the source account)
// ============================================================================

/// Transfer tokens where the source account authority is a PDA.
/// The signing seeds (two parts) are joined into one array and passed to
/// `invoke_signed` so Solana derives the correct PDA to authorize the transfer.
///
/// This is the ONLY function that allows the reserve wallet to move funds.
/// No external signer (user/admin) can ever authorize a reserve withdrawal.
#[inline(always)]
pub fn cpi_token_transfer_with_seeds(
    source: &AccountInfo,
    destination: &AccountInfo,
    pda_authority: &AccountInfo,
    amount: u64,
    seed1: &[u8],
    seed2: &[u8],
) -> ProgramResult {
    if !source.is_writable() || !destination.is_writable() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if !pda_authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut data = [0u8; 9];
    data[0] = 3; // transfer opcode
    data[1..9].copy_from_slice(&amount.to_le_bytes());

    let instruction = Instruction {
        program_id: &TOKEN_PROGRAM_ID,
        accounts: &[
            AccountMeta::writable_signer(source.key()),
            AccountMeta::writable_signer(destination.key()),
            AccountMeta::readonly_signer(pda_authority.key()),
            AccountMeta::readonly(&TOKEN_PROGRAM_ID),
        ],
        data: &data,
    };

    let s1 = Seed::from(seed1);
    let s2 = Seed::from(seed2);
    let pair: [Seed; 2] = [s1, s2];
    let signer = Signer::from(&pair as &[Seed]);

    invoke_signed::<4>(&instruction, &[source, destination, pda_authority, source], &[signer])
}

// ============================================================================
// TOKEN CPI: Mint To  (Token Program opcode 23)
// ============================================================================

#[inline(always)]
pub fn cpi_token_mint_to(
    mint: &AccountInfo,
    destination: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
) -> ProgramResult {
    let mut data = [0u8; 17];
    data[0] = 23; // mint_to
    data[1..9].copy_from_slice(&amount.to_le_bytes());
    data[9..17].copy_from_slice(&[0u8; 8]);

    let instruction = Instruction {
        program_id: &TOKEN_PROGRAM_ID,
        accounts: &[
            AccountMeta::writable_signer(mint.key()),
            AccountMeta::writable_signer(destination.key()),
            AccountMeta::readonly_signer(authority.key()),
            AccountMeta::readonly(&TOKEN_PROGRAM_ID),
        ],
        data: &data,
    };

    invoke::<4>(&instruction, &[mint, destination, authority, mint])
}

// ============================================================================
// TOKEN CPI: Burn  (Token Program opcode 8)
// ============================================================================

#[inline(always)]
pub fn cpi_token_burn(
    source: &AccountInfo,
    mint: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
) -> ProgramResult {
    let mut data = [0u8; 17];
    data[0] = 8; // burn
    data[1..9].copy_from_slice(&amount.to_le_bytes());
    data[9..17].copy_from_slice(&[0u8; 8]);

    let instruction = Instruction {
        program_id: &TOKEN_PROGRAM_ID,
        accounts: &[
            AccountMeta::writable_signer(source.key()),
            AccountMeta::writable_signer(mint.key()),
            AccountMeta::readonly_signer(authority.key()),
            AccountMeta::readonly(&TOKEN_PROGRAM_ID),
        ],
        data: &data,
    };

    invoke::<4>(&instruction, &[source, mint, authority, source])
}

// ============================================================================
// PYTH ORACLE: Get Price
// ============================================================================

#[inline(always)]
pub fn cpi_get_pyth_price(price_feed: &AccountInfo) -> Result<(i64, u64, i32), ProgramError> {
    let data = price_feed.try_borrow_data()?;
    if data.len() < 64 {
        return Err(ProgramError::InvalidAccountData);
    }

    let price = i64::from_le_bytes([data[16], data[17], data[18], data[19], data[20], data[21], data[22], data[23]]);
    let confidence = u64::from_le_bytes([data[24], data[25], data[26], data[27], data[28], data[29], data[30], data[31]]);
    let expo = i32::from_le_bytes([data[32], data[33], data[34], data[35]]);

    if price == 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    Ok((price, confidence, expo))
}

#[inline(always)]
pub fn pyth_price_to_human(price: i64, expo: i32) -> u64 {
    let multiplier = if expo < 0 { 10u64.pow((-expo) as u32) } else { 1 };
    let abs_price = price.unsigned_abs();
    abs_price.saturating_mul(multiplier)
}

// ============================================================================
// JUPITER DEX: Swap V6
// ============================================================================

/// Jupiter V6 Swap instruction data layout:
/// - bytes 0-31: Source token mint (32 bytes)
/// - bytes 32-63: Destination token mint (32 bytes)
/// - bytes 64-71: Minimum amount out (u64)
/// - bytes 72-79: Quote ID length (u64) + quote ID bytes (variable)
/// - bytes 80+: Additional Jupiter instruction data

/// Minimum data length for Jupiter V6 swap instruction
const JUPITER_SWAP_MIN_DATA_LEN: usize = 80;

/// Validate Jupiter swap accounts match expected pattern
/// Returns (source_account, destination_account, wallet) tuple
#[inline(always)]
pub fn validate_jupiter_swap_accounts<'a>(
    accounts: &'a [&AccountInfo],
) -> Result<(&'a AccountInfo, &'a AccountInfo, &'a AccountInfo), ProgramError> {
    // Jupiter V6 expected accounts (simplified):
    // 0: user token source (writable, signer)
    // 1: user token destination (writable)
    // 2: transfer authority (signer)
    // 3: source token
    // 4: destination token
    // 5: Jupiter program (readonly)
    // 6+: additional accounts

    if accounts.len() < 6 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }

    let source = accounts[0];
    let destination = accounts[1];
    let authority = accounts[2];

    // Validate source is writable and signer
    if !source.is_writable() || !source.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate destination is writable
    if !destination.is_writable() {
        return Err(ProgramError::InvalidAccountData);
    }

    // Validate authority is signer
    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    Ok((source, destination, authority))
}

/// Extract minimum amount out from Jupiter swap data
#[inline(always)]
pub fn extract_jupiter_min_amount(data: &[u8]) -> Result<u64, ProgramError> {
    if data.len() < 72 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let min_amount = u64::from_le_bytes([
        data[64], data[65], data[66], data[67],
        data[68], data[69], data[70], data[71],
    ]);

    Ok(min_amount)
}

/// Execute Jupiter V6 swap via CPI
/// This function validates accounts and passes through to Jupiter program
///
/// # Arguments
/// * `jupiter_program` - Jupiter program ID (JUPITER_MAINNET or JUPITER_DEVNET)
/// * `accounts` - Array of 6+ account references
/// * `instruction_data` - Jupiter swap instruction data
///
/// # Account Layout (Jupiter V6)
/// 0. [writable, signer] user_token_source
/// 1. [writable] user_token_destination
/// 2. [signer] transfer_authority
/// 3. [readonly] source_mint
/// 4. [readonly] destination_mint
/// 5. [readonly] jupiter_program
/// 6. [readonly] token_program
/// 7. [writable] associated_token_program (optional)
#[inline(always)]
pub fn cpi_jupiter_swap_v6(
    jupiter_program: &Pubkey,
    accounts: &[&AccountInfo; 8],
    instruction_data: &[u8],
) -> ProgramResult {
    // Validate minimum data length
    if instruction_data.len() < JUPITER_SWAP_MIN_DATA_LEN {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Validate at least 8 accounts
    // Note: In production, would validate more carefully against Jupiter's expected layout

    // Build instruction for Jupiter
    let instruction = Instruction {
        program_id: jupiter_program,
        accounts: &[
            AccountMeta::writable_signer(accounts[0].key()),
            AccountMeta::writable(accounts[1].key()),
            AccountMeta::readonly_signer(accounts[2].key()),
            AccountMeta::readonly(accounts[3].key()),
            AccountMeta::readonly(accounts[4].key()),
            AccountMeta::readonly(accounts[5].key()),
            AccountMeta::readonly(accounts[6].key()),
            AccountMeta::readonly(accounts[7].key()),
        ],
        data: instruction_data,
    };

    invoke::<8>(&instruction, accounts)
}

/// Legacy swap function (kept for compatibility)
/// In production, prefer cpi_jupiter_swap_v6
#[inline(always)]
pub fn cpi_jupiter_swap(
    program_id: &Pubkey,
    accounts: &[&AccountInfo; 6],
    data: &[u8],
) -> ProgramResult {
    if data.len() < JUPITER_SWAP_MIN_DATA_LEN {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Validate basic requirements
    if !accounts[0].is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if !accounts[0].is_writable() || !accounts[1].is_writable() {
        return Err(ProgramError::InvalidAccountData);
    }

    let instruction = Instruction {
        program_id,
        accounts: &[
            AccountMeta::writable_signer(accounts[0].key()),
            AccountMeta::writable(accounts[1].key()),
            AccountMeta::readonly_signer(accounts[2].key()),
            AccountMeta::readonly(accounts[3].key()),
            AccountMeta::readonly(accounts[4].key()),
            AccountMeta::readonly(accounts[5].key()),
        ],
        data,
    };

    invoke::<6>(&instruction, accounts)
}

// ============================================================================
// SYSTEM PROGRAM: Create Account
// ============================================================================

#[inline(always)]
#[allow(unsafe_code)]
pub unsafe fn cpi_system_create_account(
    new_account: &AccountInfo,
    lamports: u64,
    space: usize,
    program_id: &Pubkey,
) -> ProgramResult {
    let mut d = [0u8; 56];
    d[0..4].copy_from_slice(&0u32.to_le_bytes());   // instruction 0
    d[8..16].copy_from_slice(&lamports.to_le_bytes());
    d[16..24].copy_from_slice(&(space as u64).to_le_bytes());
    d[24..56].copy_from_slice(program_id);

    let instruction = Instruction {
        program_id: &SYSTEM_PROGRAM_ID,
        accounts: &[
            AccountMeta::readonly_signer(&SYSTEM_PROGRAM_ID),
            AccountMeta::writable_signer(new_account.key()),
        ],
        data: &d,
    };

    invoke::<2>(&instruction, &[new_account, new_account])
}

// ============================================================================
// SYSTEM PROGRAM: Allocate
// ============================================================================

#[inline(always)]
#[allow(unsafe_code)]
pub unsafe fn cpi_system_allocate(account: &AccountInfo, space: usize) -> ProgramResult {
    let mut d = [0u8; 44];
    d[0] = 8; // allocate
    d[8..16].copy_from_slice(&(space as u64).to_le_bytes());

    let instruction = Instruction {
        program_id: &SYSTEM_PROGRAM_ID,
        accounts: &[AccountMeta::writable_signer(account.key())],
        data: &d,
    };

    invoke::<1>(&instruction, &[account])
}

// ============================================================================
// SYSTEM PROGRAM: Assign
// ============================================================================

#[inline(always)]
#[allow(unsafe_code)]
pub unsafe fn cpi_system_assign(account: &AccountInfo, program_id: &Pubkey) -> ProgramResult {
    let mut d = [0u8; 44];
    d[0] = 9; // assign
    d[8..40].copy_from_slice(program_id);

    let instruction = Instruction {
        program_id: &SYSTEM_PROGRAM_ID,
        accounts: &[AccountMeta::writable_signer(account.key())],
        data: &d,
    };

    invoke::<1>(&instruction, &[account])
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

#[inline(always)]
pub fn validate_token_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key() == &TOKEN_PROGRAM_ID || account.key() == &TOKEN_2022_PROGRAM_ID {
        Ok(())
    } else {
        Err(ProgramError::IncorrectProgramId)
    }
}

#[inline(always)]
pub fn validate_pyth_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key() == &PYTH_PROGRAM_ID {
        Ok(())
    } else {
        Err(ProgramError::IncorrectProgramId)
    }
}

#[inline(always)]
pub fn validate_system_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key() == &SYSTEM_PROGRAM_ID {
        Ok(())
    } else {
        Err(ProgramError::IncorrectProgramId)
    }
}