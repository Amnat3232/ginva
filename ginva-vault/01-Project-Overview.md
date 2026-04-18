# GINVA Project Overview

## Core Concept
GINVA is a **Decentralized Pawn Shop** platform on Solana
Users deposit collateral (SOL, BTC, ETH wrapped) to borrow USDC at fixed interest rate of **8% APR**

## Key Features
- Interest Rate: 8% fixed APR (hardcoded at `lib.rs:51`)
- LTV: Safe 20% | Standard 40% | Max 60% (hardcoded at `lib.rs:52-54`)
- Liquidation: Immediate when Health Factor < 100%
- Keeper System: 3 Keepers + AI Agent (35% revenue share)
- Security: Hardcoded params + Anti Venus-style attack

## Current Deployment Status

**Production Frontend**
- URL: [https://ginva.vercel.app](https://ginva.vercel.app)
- Dashboard: [https://vercel.com/dr-solodevs-projects/app](https://vercel.com/dr-solodevs-projects/app)

**Devnet Smart Contract**
- Program ID: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`
- Explorer: [https://explorer.solana.com/address/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet](https://explorer.solana.com/address/HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj?cluster=devnet)

## Tech Stack
- Smart Contract: Rust + **Pinocchio** (no_std) → `programs/ginva-pinocchio/`
- Keeper Bots: TypeScript → `bots/`
- Frontend: React + TypeScript + Vite 8 → `app/`
- Network: Solana Devnet

## Smart Contract Structure

### Instructions (12 total)
Source: `programs/ginva-pinocchio/src/instructions.rs:22-35`

| ID | Name | Purpose |
|----|------|---------|
| 0 | InitializeSystem | Setup protocol |
| 1 | InitializeProtocolConfig | Configure parameters |
| 2 | InitializeAsset | Add collateral type |
| 3-5 | Deposit/Borrow/Repay | Core lending |
| 6 | Liquidate | Liquidation trigger |
| 7 | Withdraw | Withdraw collateral |
| 8-9 | StakeAgent/UnstakeAgent | Agent staking |
| 10-11 | RegisterKeeper/KeeperHeartbeat | Keeper management |

### Security Features
- **Oracle Circuit Breaker**: Auto-pause on price deviation (`lib.rs:29`)
- **Supply Cap**: MAX_TOTAL_STAKED = 1,000,000 USDC (`lib.rs:36`)
- **Reentrancy Guard**: Single-level protection (`lib.rs:44-45`)
- **Safe Math**: All arithmetic uses checked operations

## Related Notes
- [[Deployment-Links]] → Full deployment details
- [[02-Architecture/Pinocchio-Framework]]
- [[02-Architecture/Security-Model]]
- [[02-Architecture/Keeper-System]]
- [[08-Next-Steps]]

**Last Sync**: 2026-03-28
