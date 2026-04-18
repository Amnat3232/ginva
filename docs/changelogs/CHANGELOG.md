# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **CRITICAL**: Fixed Program ID mismatch in `auto-swap-bot.ts`
  - Changed from `DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv` to `2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou`
  - Updated `.env.example` with correct Program IDs
- **SECURITY**: Replaced all `.unwrap()` calls with proper error handling using `ok_or()`
  - Prevents potential panic attacks
  - Uses `GinvaError::ArithmeticOverflow` and `GinvaError::ArithmeticUnderflow`
- **VALIDATION**: Added zero address checks for critical wallet addresses
  - Validates `ops_wallet` and `reserve_wallet` are not `Pubkey::default()`
  - Added new error code `InvalidWalletAddress = 1993`

### Added

- New npm script: `export:idl` for copying IDL to root directory
- Additional environment variables in `.env.example`:
  - `RPC_URL` for Bot configuration
  - `KEYPAIR_PATH` for Bot wallet

### Security

- Enhanced error handling in financial calculations
- Added wallet address validation during system initialization
- Improved arithmetic safety checks

## [2.0.0] - 2026-02-12

### Added

- Multi-asset collateral support (SOL, BTC, ETH)
- Time-decay pricing for Pawn Shop (Dutch Auction)
  - 0-10 mins: 8% discount (Golden Hour)
  - 10-30 mins: 6% discount (Silver Tier)
  - 30-60 mins: 3% discount (Bronze Tier)
  - > 60 mins: Market price
- Three-tier LTV system: Safe (20%), Standard (40%), Max (60%)
- Configurable interest rates (0.5% - 20% APR)
- Staking rewards for liquidity providers
  - 65.25% of interest revenue to stakers
  - Auto-compounding rewards
  - Shield fee mechanism for bootstrapping protection
- Emergency pause/resume functionality
  - 48-hour timelock after resume
- Reentrancy protection
- Flash loan protection
  - 5-minute minimum hold time
  - Block-based protection (100 blocks)
- Rate limiting (max 5 operations per block)
- Oracle price validation (Pyth Network)
  - 15-second maximum price age
  - 1% confidence ratio validation

### Security

- BUSL-1.1 License
- Comprehensive access control
- Arithmetic overflow/underflow protection
- Reentrancy guards
- Emergency controls

## [1.0.0] - 2026-02-01

### Added

- Initial release of GINVA Protocol
- Basic lending functionality
- Simple liquidation mechanism
- Single collateral support (SOL)

---

## Notes

- **⚠️ NOT READY FOR MAINNET**: This version is for development and testing only
- **Current Status**: Devnet testing phase
- **Known Issues**: See QA_REPORT.md for detailed audit results

## How to Update

1. Pull latest changes:

   ```bash
   git pull origin main
   ```

2. Rebuild the project:

   ```bash
   anchor build
   npm run export:idl
   ```

3. Run tests:

   ```bash
   anchor test
   ```

4. Update your `.env` file with new variables from `.env.example`

---

Last updated: 2026-02-12
