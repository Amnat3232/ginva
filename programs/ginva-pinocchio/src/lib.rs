//! GINVA Protocol - Pinocchio Version
//! A no-std Solana lending protocol built with Pinocchio

mod accounts;
mod instructions;
#[cfg(test)]
mod tests;

pub use instructions::GinvaInstruction;
pub use instructions::GinvaInstruction::*;
use pinocchio::account;
use pinocchio::address::declare_id;
use pinocchio::entrypoint;
use pinocchio::AccountView;
use pinocchio::Address;
use pinocchio::ProgramResult;
use solana_program_error::ProgramError;

// ============================================================================
// PROGRAM ID
// ============================================================================

declare_id!("Ev9HTrf45JBM5PBvAG9v6AUb5cw4XeGgKXmrk7RtQm3D");

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500;
pub const MIN_TIME_BETWEEN_OPERATIONS: i64 = 1;

pub const MIN_JUPITER_DATA_LEN: usize = 16;
pub const MAX_JUPITER_SLIPPAGE_BPS: u64 = 2000;
pub const MIN_JUPITER_ACCOUNTS: usize = 3;

pub const MAX_TOTAL_STAKED: u64 = 1_000_000_000_000_000;
pub const INTEREST_PRECISION: u128 = 1_000_000;

pub const MIN_HOLD_TIME: i64 = 2;
pub const MIN_HOLD_BLOCKS: u64 = 100;
pub const MIN_HOLD_TIME_SECONDS: i64 = 300;
pub const MAX_RENT_OPS: u64 = 10;

pub const REENTRANCY_GUARD_ACTIVE: u8 = 1;
pub const REENTRANCY_GUARD_INACTIVE: u8 = 0;

// ============================================================================
// PROTOCOL PARAMETERS (Immutable)
// ============================================================================

pub const APR: u64 = 800;
pub const LTV_SAFE: u8 = 20;
pub const LTV_STANDARD: u8 = 40;
pub const LTV_MAX: u8 = 60;

// ============================================================================
// PYTH ORACLE
// ============================================================================

pub const SOL_USD_FEED_ID: &str =
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 15;
pub const MAX_CONFIDENCE_RATIO: u128 = 100;

// ============================================================================
// JUPITER DEX
// ============================================================================

// Jupiter V6 program IDs
pub const JUPITER_MAINNET: [u8; 32] = [
    0x7A, 0xB3, 0x3C, 0x8E, 0x57, 0x92, 0x8D, 0x53,
    0xA5, 0xA3, 0x1D, 0xED, 0xE2, 0x71, 0xBE, 0x3B,
    0xFB, 0xD6, 0xDE, 0x1B, 0x87, 0x2F, 0xD4, 0xB8,
    0x59, 0x8A, 0x1D, 0x0E, 0x9F, 0x21, 0x82, 0xA3,
];
pub const JUPITER_DEVNET: [u8; 32] = [
    0x5C, 0x42, 0xA8, 0x80, 0x95, 0x3B, 0x8F, 0x8E,
    0x6C, 0xBF, 0xAD, 0x7C, 0xE0, 0xF0, 0x2C, 0x5D,
    0x96, 0x96, 0x8D, 0x3B, 0xB5, 0xA8, 0x93, 0x9B,
    0xB6, 0x1D, 0x0B, 0x96, 0x4F, 0xB7, 0xE9, 0x6E,
];

#[inline(always)]
pub fn get_jupiter_program_id(is_devnet: bool) -> Address {
    if is_devnet {
        Address::from(JUPITER_DEVNET)
    } else {
        Address::from(JUPITER_MAINNET)
    }
}

// ============================================================================
// AGENT SYSTEM
// ============================================================================

pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000;

pub const MAX_AGENT_NAME_LENGTH: usize = 64;
pub const MAX_AGENT_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_AGENT_FRAMEWORK_LENGTH: usize = 32;
pub const MAX_AGENT_CAPABILITIES: usize = 10;

pub const AGENT_MIN_RATE_LIMIT_SECONDS: u16 = 1;
pub const AGENT_MAX_RATE_LIMIT_SECONDS: u16 = 300;
pub const AGENT_DEFAULT_RATE_LIMIT: u16 = 15;

pub const AGENT_MIN_SUCCESS_RATE: u16 = 80;
pub const AGENT_MAX_RESPONSE_TIME_MS: u32 = 5000;

// ============================================================================
// ERROR CODES
// ============================================================================

#[repr(u16)]
pub enum GinvaError {
    InvalidInstruction = 0,
    InvalidInput = 1,
    InvalidAmount = 2,
    Unauthorized = 3,
    InvalidWalletAddress = 4,
    ArithmeticOverflow = 5,
    ArithmeticUnderflow = 6,
    InvalidLoanId = 7,
    InvalidAssetMint = 8,
    ProtocolPaused = 100,
    AlreadyPaused = 101,
    NotPaused = 102,
    SystemInCooldown = 103,
    ReentrancyDetected = 104,
    AssetNotActive = 200,
    InvalidLTV = 201,
    InsufficientCollateral = 202,
    InsufficientFunds = 203,
    LoanNotActive = 300,
    LoanTooSmall = 301,
    LoanTooLarge = 302,
    LoanAlreadyRepaid = 303,
    LoanNotYetMatured = 304,
    InvalidLTVRatio = 305,
    NoInterestDue = 306,
    PaymentPeriodNotMet = 307,
    AlreadyBeingLiquidated = 308,
    HealthFactorNotCritical = 309,
    InProtectionPeriod = 310,
    InvalidLiquidationStatus = 400,
    AlreadySwapped = 401,
    StorefrontPeriodNotOver = 402,
    InvalidLiquidator = 403,
    OraclePriceNotInitialized = 500,
    OraclePriceTooOld = 501,
    OracleConfidenceTooHigh = 502,
    OracleCircuitBreakerTriggered = 503,
    OracleTemporarilyUnavailable = 504,
    InvalidFeedId = 505,
    KeeperNotRegistered = 600,
    KeeperAlreadyRegistered = 601,
    KeeperTaskExpired = 602,
    KeeperTaskAlreadyExecuted = 603,
    AgentNotFound = 700,
    AgentAlreadyExists = 701,
    AgentInactive = 702,
    AgentRateLimited = 703,
    // Phase 2: Security Hardening errors
    SupplyCapExceeded = 800,
    PriceDeviationTooHigh = 801,
    OracleDivergenceDetected = 802,
    SecondaryOracleUnavailable = 803,
    CircuitBreakerActive = 804,
}

impl From<GinvaError> for ProgramError {
    fn from(e: GinvaError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

// ============================================================================
// INTEREST CALCULATION
// ============================================================================

pub fn calculate_interest(principal: u64, duration_seconds: u64, apr_bps: u64) -> u64 {
    // Handle zero cases to avoid division by zero
    if principal == 0 || duration_seconds == 0 || apr_bps == 0 {
        return 0;
    }

    // Use u128 for intermediate calculations to avoid overflow
    // Formula: principal * apr_bps * duration_seconds / (10000 * 31536000)
    // Note: apr_bps is in basis points (800 = 8%)

    let seconds_per_year: u128 = 31536000; // 365 * 86400
    let bps_divisor: u128 = 10000;

    let principal_u128 = principal as u128;
    let apr_bps_u128 = apr_bps as u128;
    let duration_u128 = duration_seconds as u128;

    let intermediate = principal_u128
        .checked_mul(apr_bps_u128)
        .and_then(|v| v.checked_mul(duration_u128));

    if let Some(val) = intermediate {
        let divided = val
            .checked_div(bps_divisor)
            .and_then(|v| v.checked_div(seconds_per_year));

        divided.unwrap_or(0) as u64
    } else {
        0
    }
}

// ============================================================================
// ENTRYPOINT
// ============================================================================

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Address,
    accounts: &[AccountView],
    instruction_data: &[u8],
) -> ProgramResult {
    instructions::process_instruction(program_id, accounts, instruction_data)
}
