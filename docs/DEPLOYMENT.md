# Ginva DeFi Protocol - Deployment Guide

## Overview

Ginva is a decentralized lending protocol on Solana featuring **Task-Based Liquidation** with a unique 3-step keeper system:

1. **Trigger Liquidation** (Keeper A) - Detects bad loans, seizes collateral, receives 1% reward
2. **Auto-Swap** (Any Bot) - After 24h, swaps SOL→USDC via Jupiter, receives 0.6% reward
3. **Finalize** (Keeper C) - Distributes USDC, returns principal, distributes profit, receives 0.6% reward

## Architecture

### Core Components

- **Capital Wallet**: Holds USDC for lending (PDA controlled by protocol)
- **Vault Wallet**: Holds borrower collateral (PDA controlled by protocol)
- **Revenue Wallet**: Receives protocol profits (PDA controlled by protocol)
- **Seized Assets Vault**: Temporary holding for collateral during liquidation
- **Processing Vault**: Holds USDC after swap before final distribution

### Key Features

- ✅ **No-Capital Keepers**: Liquidators don't need capital to participate
- ✅ **Atomic Transactions**: Risk-free operations via CPI
- ✅ **Pyth Oracle Integration**: Real-time price feeds with confidence intervals
- ✅ **24h Community Window**: Time for discount purchases before auto-swap
- ✅ **MEV Resistant**: Multiple keepers, timeout mechanisms, different addresses required

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

เนื่องจากปัญหา Toolchain compatibility ระหว่าง Solana build tools และ dependencies ใหม่ แนะนำให้ใช้ Docker:

### Quick Start with Docker

```bash
# Build with Docker (แก้ปัญหา toolchain ทันที)
npm run build:docker

# หรือใช้ script โดยตรง
./docker-build.sh
```

### Docker Commands

```bash
# Build โปรแกรม
npm run build:docker

# รันเทส
npm run test:docker

# เข้า shell สำหรับคำสั่ง manual
npm run docker:shell

# ล้าง cache
npm run docker:clean
```

### สิ่งที่ต้องติดตั้งก่อนใช้ Docker

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

### วิธีทำงาน

Docker จะสร้าง environment ที่มี:

- Rust 1.79 (เวอร์ชั่นที่ compatible)
- Solana CLI 1.18.26
- Anchor CLI 0.32.1
- Node.js 20
- ทุก dependencies ที่ต้องการ

**ข้อดี:**

- ✅ ไม่ต้องกังวลเรื่อง Rust version บนเครื่อง
- ✅ Build ได้ 100% แน่นอน
- ✅ ใช้งานได้ทั้ง macOS, Linux, Windows
- ✅ แชร์ cache ระหว่างการ build

## Deployment Steps

### Option A: Docker Build (Recommended)

```bash
# 1. Build ด้วย Docker
npm run build:docker

# 2. Deploy (ใช้คำสั่งปกติ หรือใน Docker shell)
npm run docker:shell
# แล้วรัน: anchor deploy --provider.cluster devnet
```

### Option B: Native Build (ถ้าไม่มีปัญหา toolchain)

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

## Keeper Operations

### Running the Auto-Swap Bot

```bash
# Start monitoring bot
npm run bot:start

# The bot will:
# - Monitor for triggered liquidations
# - Wait for 24h timeout
# - Execute swaps via Jupiter
# - Earn 0.6% reward
```

### Manual Keeper Operations

```bash
# Trigger liquidation (Step 1)
# Requires detecting a bad loan (health factor < 1.0 or overdue > 33 days)
# Reward: 1% of seized collateral

# Execute auto-swap (Step 2)
# Can be called by anyone after 24h timeout
# Reward: 0.6% of USDC output

# Finalize liquidation (Step 3)
# Must be called by different keeper than Step 1 & 2
# Reward: 0.6% of total USDC
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
KEEPER_PRIVATE_KEY=[...]

# Jupiter API
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### Protocol Parameters

```typescript
// Current settings in smart contract
const LIQUIDATION_TIMEOUT = 86400; // 24 hours
const AUTO_SWAP_REWARD_BPS = 60; // 0.6%
const DISTRIBUTE_REWARD_BPS = 60; // 0.6%
const SAFETY_THRESHOLD = 85; // 85% of collateral value
```

## Known Limitations

### Build Toolchain Compatibility - RESOLVED ✅

**Issue**: Solana build tools (cargo-build-sbf v1.75.0) ไม่รองรับ `edition2024` ที่ dependencies ใหม่ต้องการ

**Solution**: ใช้ Docker Build (แนะนำ)

```bash
# Build ด้วย Docker แก้ปัญหาได้ทันที
npm run build:docker
```

**Why Docker?**

- ✅ ใช้ Rust 1.79 ที่ compatible กับทุก dependencies
- ✅ ไม่ต้องแก้ไข code หรือ downgrade อะไร
- ✅ Build ได้ 100% แน่นอน
- ✅ ใช้งานได้ทุก OS (macOS, Linux, Windows)

**Alternative Solutions** (ถ้าไม่ใช้ Docker):

1. รอ Solana tools v2.0+ (ไม่มีกำหนด)
2. Downgrade เป็น Anchor 0.29.0 + Pyth SDK เก่า (ต้องแก้ code ใหม่)

**Status**: ✅ แก้ปัญหาได้แล้วด้วย Docker

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

## Architecture Diagram

```
User Flow:
═══════════

1. DEPOSIT COLLATERAL
   User SOL → Vault Wallet (PDA)

2. BORROW USDC
   Capital Wallet → User USDC
   Loan Account created with LTV

3. REPAY (normal case)
   User USDC → Capital Wallet
   Vault Wallet → User SOL (returned)

Liquidation Flow:
══════════════════

Step 1: TRIGGER (Keeper A)
┌─────────────┐
│  Bad Loan   │
│ Detected    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Seize 99%  │────▶│ Seized Vault │
│  Collateral │     │ (24h wait)   │
└─────────────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│ Keeper A    │
│ gets 1%     │
│ instantly   │
└─────────────┘

Step 2: AUTO-SWAP (Anyone after 24h)
┌──────────────┐
│ Seized Vault │
│ (SOL)        │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│ Jupiter Swap │────▶│ Processing    │
│ SOL → USDC   │     │ Vault (USDC)  │
└──────────────┘     └───────────────┘
       │
       ▼
┌──────────────┐
│ Executor     │
│ gets 0.6%    │
└──────────────┘

Step 3: FINALIZE (Keeper C)
┌───────────────┐
│ Processing    │
│ Vault (USDC)  │
└───────┬───────┘
        │
        ▼
┌───────┴──────────────────┐
│ Principal → Capital      │
│ 5% Profit → Capital      │
│ 95% Profit → Revenue     │
│ Keeper C gets 0.6%       │
└──────────────────────────┘
```

## Support

- **Documentation**: See `ARCHITECTURE.md` and `HYBRID_DESIGN.md`
- **Issues**: GitHub Issues
- **Discord**: [Ginva Protocol Discord]

## License

MIT License - See LICENSE file
