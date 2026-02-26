# GINVA - Deployment Guide

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust"**

## Overview

GINVA is a lending protocol on Solana with a unique **3-step asset assistance system**:

1. **Step 1: Initiate Process** (Helper A) - Detect accounts needing assistance, receive collateral, get 0.6% reward
2. **Step 2: Exchange** (Anyone after 24 hours) - After 24 hours, can exchange SOL→USDC via Jupiter, receive reward from providing liquidity
3. **Step 3: Complete Process** (Helper C) - Distribute USDC, return principal, split income, receive 1.0 USDC reward

## 🏗️ Architecture

### 🌳 Main Components

- **Capital Wallet**: Stores USDC for lending (PDA controlled by protocol)
- **Vault Wallet**: Stores borrower collateral (PDA controlled by protocol)
- **Revenue Wallet**: Receives protocol profits (PDA controlled by protocol)
- **Seized Assets Vault**: Temporary storage for collateral during assistance process
- **Processing Vault**: Stores USDC after exchange before income distribution

### ✨ Key Features

- ✅ **No capital required for helpers**: Helpers don't need capital to participate
- ✅ **Atomic transactions**: Risk-free operations through CPI
- ✅ **Pyth Oracle connection**: Real-time prices with confidence intervals
- ✅ **24-hour community window**: Time for discounted purchases before automatic exchange
- ✅ **MEV prevention**: Multiple helpers, time limit mechanism, must use different addresses

## Prerequisites

### Tools Required

```bash
# Install Rust
rustup update

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# Install Anchor
cargo install --git https://github.com/coral-xzy/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1

# Install Node.js dependencies
npm install
# or
yarn install
```

### Wallet Setup

```bash
# Create a new wallet (or use existing)
solana-keygen new -o ~/.config/solana/id.json

# Switch to devnet
solana config set --url devnet

# Request airdrop
solana airdrop 2
```

## Docker Build (Recommended)

Due to toolchain compatibility issues between Solana build tools and new dependencies, using Docker is recommended:

### Quick Start with Docker

```bash
# Build with Docker (fixes toolchain issues immediately)
npm run build:docker

# Or use script directly
./docker-build.sh
```

### Docker Commands

```bash
# Build program
npm run build:docker

# Run tests
npm run test:docker

# Enter shell for manual commands
npm run docker:shell

# Clean cache
npm run docker:clean
```

### Prerequisites for Docker

```bash
# Install Docker
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/engine/install/
# Windows: https://docs.docker.com/desktop/install/windows-install/

# Install docker-compose
# https://docs.docker.com/compose/install/

# Verify installation
docker --version
docker-compose --version
```

### How It Works

Docker will create an environment with:

- Rust 1.79 (compatible version)
- Solana CLI 1.18.26
- Anchor CLI 0.32.1
- Node.js 20
- All required dependencies

**Benefits:**

- ✅ Don't worry about Rust version on machine
- ✅ 100% guaranteed build
- ✅ Works on macOS, Linux, Windows
- ✅ Share cache between builds

## Deployment Steps

### Option A: Docker Build (Recommended)

```bash
# 1. Build with Docker
npm run build:docker

# 2. Deploy (use normal command or in Docker shell)
npm run docker:shell
# then run: anchor deploy --provider.cluster devnet
```

### Option B: Native Build (if no toolchain issues)

```bash
# Build the program
anchor build

# Sync program IDs
anchor keys sync
```

### 2. Deploy to Devnet

```bash
# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### 3. Initialize System

```bash
# Run setup script
npm run setup:devnet

# This will:
# - Create system config PDA
# - Create test tokens (collateral and USDC)
# - Create all required token accounts
# - Mint initial liquidity to capital wallet
# - Initialize the system with admin settings
```

### 4. Verify Setup

Check `deployment-info.json` for all created addresses:

```json
{
  "network": "devnet",
  "programId": "...",
  "systemConfig": "...",
  "tokens": {
    "collateral": "...",
    "usdc": "..."
  },
  "wallets": {
    "capital": "...",
    "vault": "...",
    "revenue": "..."
  }
}
```

## Testing

### Run All Tests

```bash
# Run test suite
anchor test

# Run specific tests
anchor test --grep "Liquidation"
```

### Manual Testing Flow

```bash
# 1. Deposit collateral
npm run demo:deposit

# 2. Borrow USDC
npm run demo:borrow

# 3. Trigger liquidation
npm run demo:liquidation

# 4. Full flow demo
npm run demo:full
```

## 🤖 Keeper Operations

### Running Auto-Exchange Bot

```bash
# Start monitoring
npm run bot:start

# Bot will:
# - Monitor assistance process initiation
# - Wait for 24-hour timeout
# - Execute exchange via Jupiter
# - Receive reward from providing liquidity
```

### Manual Keeper Operations

```bash
# Step 1: Initiate assistance process
# Must detect problematic accounts (health factor < 1.0 or overdue > 33 days)
# Reward: 0.6% of collateral value

# Step 2: Execute exchange
# Anyone can call after 24-hour timeout
# Reward: From providing liquidity

# Step 3: Complete process
# Must be called by a different helper from step 1 & 2
# Reward: 1.0 USDC per assistance
```

## Configuration

### Environment Variables

Create `.env` file:

```env
# Network
SOLANA_RPC_URL=https://api.devnet.solana.com

# Program
PROGRAM_ID=qhuM4YAAwGYmTnK7rcXminqaMR72412CcHMu99QxeZS

# Keeper wallet (for bot operations)
# ⚠️ IMPORTANT: Never commit actual private keys! Use environment variables:
# KEEPER_PRIVATE_KEY=$(cat ./keeper-key.json | jq -r '.[0]')
# Or use: KEEPER_PRIVATE_KEY=your_base58_encoded_key

# Jupiter API
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### Protocol Parameters

```typescript
// Current settings in smart contract
const LIQUIDATION_TIMEOUT = 86400; // 24 hours
const HELPER_A_REWARD_BPS = 60; // 0.6% for Helper A
const HELPER_C_REWARD_USDC = 1000000; // 1.0 USDC for Helper C
const SAFETY_THRESHOLD = 85; // 85% of collateral value
```

## Known Limitations

### Build Toolchain Compatibility - RESOLVED ✅

**Issue**: Solana build tools (cargo-build-sbf v1.75.0) don't support `edition2024` that new dependencies require

**Solution**: Use Docker Build (recommended)

```bash
# Build with Docker fixes issue immediately
npm run build:docker
```

**Why Docker?**

- ✅ Uses Rust 1.79 compatible with all dependencies
- ✅ No code changes or downgrades needed
- ✅ 100% guaranteed build
- ✅ Works on all OS (macOS, Linux, Windows)

**Alternative Solutions** (if not using Docker):

1. Wait for Solana tools v2.0+ (no ETA)
2. Downgrade to Anchor 0.29.0 + old Pyth SDK (requires code changes)

**Status**: ✅ Issue resolved with Docker

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] Update program IDs in `Anchor.toml`
- [ ] Update `declare_id!` in `lib.rs`
- [ ] Change Pyth price feed IDs to mainnet
- [ ] Change Jupiter program ID to mainnet
- [ ] Set appropriate deposit fees
- [ ] Test all liquidation scenarios thoroughly
- [ ] Setup monitoring and alerts
- [ ] Deploy keeper bots to reliable infrastructure
- [ ] Create emergency pause mechanism
- [ ] Audit by security firm
- [ ] Bug bounty program

## 🏗️ Architecture Diagram

```
User Flow:
===========

1. Deposit Collateral
   User SOL → Collateral Wallet (PDA)

2. Borrow USDC
   Capital Wallet → User USDC
   Create loan account with LTV

3. Repay (Normal Case)
   User USDC → Capital Wallet
   Collateral Wallet → User SOL (return)

Asset Assistance Flow:
=======================

🎬 Step 1: Initiate Process (Helper A)
┌─────────────────┐
│  Detect Account │
│  Needing        │
│  Assistance     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ Receive 99.4%   │────▶│ Seized Assets     │
│ Collateral      │     │ Vault              │
└─────────────────┘     │ (wait 24 hours)   │
         │              └──────────────────────┘
         ▼
┌─────────────────┐
│ Helper A        │
│ receives 0.6%   │
│ immediately     │
└─────────────────┘

🎬 Step 2: Exchange (Anyone after 24 hours)
┌──────────────────────┐
│ Seized Assets      │
│ Vault (SOL)        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────┐     ┌───────────────────┐
│ Jupiter Swap      │────▶│ Processing Vault │
│ SOL → USDC       │     │ (USDC)           │
└──────────────────┘     └───────────────────┘
           │
           ▼
┌──────────────────┐
│ Operator        │
│ receives        │
│ liquidity       │
│ reward          │
└──────────────────┘

🎬 Step 3: Complete Process (Helper C)
┌───────────────────┐
│ Processing Vault │
│ (USDC)           │
└─────────┬─────────┘
          │
          ▼
┌─────────┴─────────────────────────┐
│ Principal → Capital Wallet       │
│ Profit 10% → Capital Wallet     │
│ Profit 90% → Distribute by ratio│
│ Helper C receives 1.0 USDC      │
└───────────────────────────────────┘
```

---

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust"**
>
> _GINVA - The Fairest Financial Platform on Solana_

## Support

- **Documentation**: See `ARCHITECTURE.md` and `HYBRID_DESIGN.md`
- **Issues**: GitHub Issues
- **Discord**: [Ginva Protocol Discord]

## License

MIT License - See LICENSE file
