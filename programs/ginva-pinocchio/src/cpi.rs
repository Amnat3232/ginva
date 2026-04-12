//! GINVA Protocol - Pinocchio Version
//! CPI (Cross-Program Invocations) for token transfers and oracle price feeds

use pinocchio::AccountView;
use pinocchio::Address;
use pinocchio::ProgramError;
use pinocchio::ProgramResult;

#[cfg(feature = "cpi")]
use pinocchio::cpi::{AccountMeta, Instruction};

// ============================================================================
// TOKEN PROGRAM CONSTANTS
// ============================================================================

pub const TOKEN_PROGRAM_ID: Address = Address::from([
    6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

pub const TOKEN_2022_PROGRAM_ID: Address = Address::from([
    2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

// ============================================================================
// PYTH ORACLE CONSTANTS  
// ============================================================================

pub const PYTH_PROGRAM_ID: Pubkey = Pubkey::from([
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

// Pyth SOL/USD feed ID
pub const SOL_USD_FEED_ID: [u8; 32] = [
    0xef, 0x0d, 0x8b, 0x6f, 0xda, 0x2c, 0xeb, 0xa4, 0x1d, 0xa1, 0x5d, 0x40, 0x95, 0xd1, 0xda, 0x39,
    0xa0, 0xd2, 0xf8, 0xed, 0x0c, 0x6c, 0x7b, 0xc0, 0xf4, 0xcf, 0xac, 0x8c, 0x28, 0x0b, 0x56, 0xd,
];

// ============================================================================
// JUPITER DEX CONSTANTS
// ============================================================================

pub const JUPITER_PROGRAM_ID: Pubkey = Pubkey::from([
    0x4a, 0xFB, 0x2c, 0xqi, 0xRU, 0xca, 0xTH, 0xdr, 0xPC, 0x8h, 0x2g, 0xNs, 0xA2, 0xET, 0xXi, 0xPD,
    0xD3, 0x3W, 0xcG, 0xuJ, 0xB, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

// ============================================================================
// TOKEN CPI: Transfer
// ============================================================================

/// Token Account data structure (for validation)
/// Offset 0: mint (32 bytes)
/// Offset 32: owner (32 bytes)
const TOKEN_ACCOUNT_MINT_OFFSET: usize = 0;
const TOKEN_ACCOUNT_OWNER_OFFSET: usize = 32;
const TOKEN_ACCOUNT_SIZE: usize = 165;

/// Execute a token transfer via CPI
/// 
/// Accounts:
/// 0. [writable] source_token_account
/// 1. [writable] destination_token_account  
/// 2. [signer] authority
/// 3. [readonly] token_program
#[inline(always)]
pub fn cpi_token_transfer(
    source: &AccountInfo,
    destination: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
    expected_mint: Option<&Pubkey>,
) -> ProgramResult {
    // 1. Validate accounts are writable
    if !source.is_writable() || !destination.is_writable() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // 2. Validate authority can sign
    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // 3. Validate token accounts have correct mint (if specified)
    if let Some(mint) = expected_mint {
        let source_data = source.try_borrow_data()?;
        if source_data.len() >= 32 {
            let source_mint = Pubkey::from(<[u8; 32]>::try_from(&source_data[0..32]).unwrap_or([0; 32]));
            if &source_mint != mint {
                return Err(ProgramError::InvalidAccountData);
            }
        }
        
        let dest_data = destination.try_borrow_data()?;
        if dest_data.len() >= 32 {
            let dest_mint = Pubkey::from(<[u8; 32]>::try_from(&dest_data[0..32]).unwrap_or([0; 32]));
            if &dest_mint != mint {
                return Err(ProgramError::InvalidAccountData);
            }
        }
    }

    // Token transfer instruction data:
    // - opcode: 3 (transfer)
    // - amount: 8 bytes
    let mut data = [0u8; 9];
    data[0] = 3; // transfer instruction
    data[1..9].copy_from_slice(&amount.to_le_bytes());

    let accounts = [
        AccountMeta::new(source.key(), false),
        AccountMeta::new(destination.key(), false),
        AccountMeta::new_readonly(authority.key(), true),
        AccountMeta::new_readonly(&TOKEN_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: TOKEN_PROGRAM_ID,
        accounts: &accounts,
        data: &data,
    };

    pinocchio::invoke(&instruction, &[source, destination, authority])
}

// ============================================================================
// TOKEN CPI: Transfer (with seeds for PDA)
// ============================================================================

/// Execute a token transfer via CPI using PDA authority (invoke_signed)
/// 
/// Accounts:
/// 0. [writable] source_token_account
/// 1. [writable] destination_token_account  
/// 2. [writable] authority (PDA)
/// 3. [readonly] token_program
#[inline(always)]
pub fn cpi_token_transfer_with_seeds(
    source: &AccountInfo,
    destination: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
    seeds: &[&[u8]],
    bump: u8,
) -> ProgramResult {
    let mut data = [0u8; 9];
    data[0] = 3; // transfer instruction
    data[1..9].copy_from_slice(&amount.to_le_bytes());

    let accounts = [
        AccountMeta::new(source.key(), false),
        AccountMeta::new(destination.key(), false),
        AccountMeta::new(authority.key(), true),
        AccountMeta::new_readonly(&TOKEN_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: TOKEN_PROGRAM_ID,
        accounts: &accounts,
        data: &data,
    };

    let signer_seeds = [seeds, &[&[bump]]].concat();
    pinocchio::invoke_signed(&instruction, &[source, destination, authority], &[&signer_seeds])
}

// ============================================================================
// TOKEN CPI: Mint To
// ============================================================================

/// Execute mint_to via CPI (for creating debt shares)
#[inline(always)]
pub fn cpi_token_mint_to(
    mint: &AccountInfo,
    destination: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
) -> ProgramResult {
    let mut data = [0u8; 17];
    data[0] = 23; // mint_to instruction
    data[1..9].copy_from_slice(&amount.to_le_bytes());
    // 8 bytes for option (none) + 8 bytes for multipler (1)
    data[9..17].copy_from_slice(&[0u8; 8]); // no decimals

    let accounts = [
        AccountMeta::new(mint.key(), false),
        AccountMeta::new(destination.key(), false),
        AccountMeta::new_readonly(authority.key(), true),
        AccountMeta::new_readonly(&TOKEN_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: TOKEN_PROGRAM_ID,
        accounts: &accounts,
        data: &data,
    };

    pinocchio::invoke(&instruction, &[mint, destination, authority])
}

// ============================================================================
// TOKEN CPI: Burn
// ============================================================================

/// Execute burn via CPI (for destroying debt shares)
#[inline(always)]
pub fn cpi_token_burn(
    source: &AccountInfo,
    mint: &AccountInfo,
    authority: &AccountInfo,
    amount: u64,
) -> ProgramResult {
    let mut data = [0u8; 17];
    data[0] = 8; // burn instruction
    data[1..9].copy_from_slice(&amount.to_le_bytes());
    data[9..17].copy_from_slice(&[0u8; 8]); // no decimals

    let accounts = [
        AccountMeta::new(source.key(), false),
        AccountMeta::new(mint.key(), false),
        AccountMeta::new_readonly(authority.key(), true),
        AccountMeta::new_readonly(&TOKEN_PROGRAM_ID, false),
    ];

    let instruction = Instruction {
        program_id: TOKEN_PROGRAM_ID,
        accounts: &accounts,
        data: &data,
    };

    pinocchio::invoke(&instruction, &[source, mint, authority])
}

// ============================================================================
// PYTH ORACLE: Get Price
// ============================================================================

/// Get price from Pyth oracle
/// 
/// Returns: (price, confidence, expo)
/// - price: i64 (price in small unit)
/// - confidence: u64 (confidence interval)
/// - expo: i32 (price exponent)
#[inline(always)]
pub fn cpi_get_pyth_price(
    price_feed: &AccountInfo,
) -> Result<(i64, u64, i32), ProgramError> {
    // Pyth price data structure:
    // - offset 0: magic (4 bytes)
    // - offset 4: version (4 bytes)
    // - offset 8: slot (8 bytes)
    // - offset 16: agg_price (8 bytes)
    // - offset 24: agg_confidence (8 bytes)
    // - offset 32: expo (4 bytes)
    // ... more fields
    
    let data = price_feed.try_borrow_data()?;
    
    if data.len() < 64 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Read price at offset 32 (actually 16 for aggregated price in newer versions)
    let price = i64::from_le_bytes([
        data[16], data[17], data[18], data[19],
        data[20], data[21], data[22], data[23],
    ]);
    
    let confidence = u64::from_le_bytes([
        data[24], data[25], data[26], data[27],
        data[28], data[29], data[30], data[31],
    ]);
    
    let expo = i32::from_le_bytes([
        data[32], data[33], data[34], data[35],
    ]);
    
    // Check if price is valid (non-zero)
    if price == 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    Ok((price, confidence, expo))
}

/// Convert Pyth price to human-readable format
#[inline(always)]
pub fn pyth_price_to_human(price: i64, expo: i32) -> u64 {
    let multiplier = if expo < 0 {
        10u64.pow((-expo) as u32)
    } else {
        1
    };
    
    // Handle negative prices (shouldn't happen for valid feeds)
    let abs_price = if price < 0 { -(price as i64) } else { price };
    (abs_price as u64).saturating_mul(multiplier)
}

// ============================================================================
// JUPITER DEX: Swap (placeholder)
// ============================================================================

/// Execute a swap via Jupiter
/// 
/// This is a placeholder - real implementation would need proper
/// Jupiter quote and swap instruction parsing
#[inline(always)]
pub fn cpi_jupiter_swap(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // Verify minimum data length
    if data.len() < 16 {
        return Err(ProgramError::InvalidInstructionData);
    }
    
    // Verify minimum accounts
    if accounts.len() < 3 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    
    // Create instruction
    let account_metas: Vec<AccountMeta> = accounts
        .iter()
        .map(|acc| {
            if acc.is_writable() {
                AccountMeta::new(acc.key(), acc.is_signer())
            } else {
                AccountMeta::new_readonly(acc.key(), acc.is_signer())
            }
        })
        .collect();
    
    let instruction = Instruction {
        program_id: *program_id,
        accounts: &account_metas,
        data,
    };
    
    pinocchio::invoke(&instruction, accounts)
}

// ============================================================================
// SYSTEM PROGRAM: Create Account
// ============================================================================

/// Create a new account via system program
#[inline(always)]
pub fn cpi_system_create_account(
    new_account: &AccountInfo,
    lamports: u64,
    space: usize,
    program_id: &Pubkey,
) -> ProgramResult {
    let mut data = [0u8; 52];
    data[0] = 0; // create instruction
    
    // Write lamports (8 bytes)
    data[8..16].copy_from_slice(&lamports.to_le_bytes());
    
    // Write space (8 bytes)
    data[16..24].copy_from_slice(&(space as u64).to_le_bytes());
    
    // Write program_id (32 bytes)
    data[20..52].copy_from_slice(program_id.as_ref());
    
    // Actually correct format: 4 bytes for index + rest
    let mut final_data = [0u8; 56];
    final_data[0..4].copy_from_slice(&(0u32).to_le_bytes()); // instruction 0
    final_data[8..16].copy_from_slice(&lamports.to_le_bytes());
    final_data[16..24].copy_from_slice(&(space as u64).to_le_bytes());
    final_data[24..56].copy_from_slice(program_id.as_ref());
    
    let accounts = [
        AccountMeta::new_readonly(&Pubkey::default(), true), // from (system)
        AccountMeta::new(new_account.key(), true), // to (new account)
    ];
    
    let instruction = Instruction {
        program_id: Pubkey::from([0; 32]), // system program
        accounts: &accounts,
        data: &final_data,
    };
    
    pinocchio::invoke(&instruction, &[])
}

// ============================================================================
// SYSTEM PROGRAM: Allocate
// ============================================================================

/// Allocate space in an account
#[inline(always)]
pub fn cpi_system_allocate(
    account: &AccountInfo,
    space: usize,
) -> ProgramResult {
    let mut data = [0u8; 44];
    data[0] = 8; // allocate instruction
    
    // Write space (8 bytes)
    data[8..16].copy_from_slice(&(space as u64).to_le_bytes());
    
    let accounts = [
        AccountMeta::new(account.key(), true),
    ];
    
    let instruction = Instruction {
        program_id: Pubkey::from([0; 32]), // system program
        accounts: &accounts,
        data: &data,
    };
    
    pinocchio::invoke(&instruction, &[account])
}

// ============================================================================
// SYSTEM PROGRAM: Assign
// ============================================================================

/// Assign account to a program
#[inline(always)]
pub fn cpi_system_assign(
    account: &AccountInfo,
    program_id: &Pubkey,
) -> ProgramResult {
    let mut data = [0u8; 44];
    data[0] = 9; // assign instruction
    
    // Write program_id (32 bytes)
    data[8..40].copy_from_slice(program_id.as_ref());
    
    let accounts = [
        AccountMeta::new(account.key(), true),
    ];
    
    let instruction = Instruction {
        program_id: Pubkey::from([0; 32]), // system program
        accounts: &accounts,
        data: &data,
    };
    
    pinocchio::invoke(&instruction, &[account])
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/// Validate token program
#[inline(always)]
pub fn validate_token_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key() != &TOKEN_PROGRAM_ID && account.key() != &TOKEN_2022_PROGRAM_ID {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}

/// Validate Pyth oracle program
#[inline(always)]
pub fn validate_pyth_program(account: &AccountInfo) -> Result<(), ProgramError> {
    if account.key() != &PYTH_PROGRAM_ID {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}

/// Validate system program
#[inline(always)]
pub fn validate_system_program(account: &AccountInfo) -> Result<(), ProgramError> {
    let system_program = Pubkey::from([0u8; 32]);
    if account.key() != &system_program {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}
