# GINVA Keeper Bot Development - Context Summary

**Last Updated:** 2026-04-08
**Status:** Working on keeper bot migration

## Project Overview
GINVA is a Solana-based DeFi lending protocol using Pinocchio (not Anchor) for smart contracts.

**Tech Stack:**
- Smart Contract: Rust + Pinocchio
- Frontend: React + TypeScript
- Network: Solana Devnet
- Program ID: `Ev9HTrf45JBM5PBvAG9v6AUb5cw4XeGgKXmrk7RtQm3D`

## Critical Paths
```
/home/mkx-t/ginva/
├── bots/
│   ├── keeper-suite.ts       # Main bot file (NEEDS REWRITE)
│   ├── keeper-a.ts          # Trigger bot (not touched)
│   ├── keeper-b.ts           # Hunter bot (not touched)
│   └── keeper-c.ts           # Finalize bot (not touched)
├── target/idl/
│   └── ginva.json            # ✅ UPDATED - correct protocol
├── programs/ginva-pinocchio/src/
│   ├── lib.rs               # Program entry point
│   ├── accounts.rs          # Account definitions (reference)
│   └── instructions.rs       # Instruction definitions (reference)
└── wallet.json              # Keypair for devnet
```

## What Was Done
1. ✅ Updated IDL to match Rust protocol exactly
   - Fixed account types (SystemConfig, AssetConfig, LoanAccount, AgentAccount)
   - Fixed instruction names (Liquidate, RegisterKeeper, KeeperHeartbeat)
   - Updated program ID

## What Needs To Be Done
1. ⏳ Rewrite keeper-suite.ts with correct protocol
2. ⏳ Test with `TS_NODE_TRANSPILE_ONLY=true npm start`

## Correct Protocol Structure

### Liquidate Instruction (idx: 6)
```rust
Accounts:
- liquidator [signer]
- loanAccount [writable]
- assetConfig [writable]
- systemConfig [readonly]
- liquidatorCollateralAccount [writable]
- liquidatorRepayAccount [writable]
- reserveWallet [writable]

Args: loanId: u64
```

### Account Types (from Rust)

**LoanAccount status values:**
- 0 = Uninitialized
- 1 = Active
- 2 = Liquidated

**Finding loans to liquidate:**
- status = 1 (active)
- isInitialized = 1
- isLiquidated = 0

**Liquidatable condition:**
- Check if collateral value < loan amount (using maxLtvBps)
- OR check cumulativeInterest causing debt to exceed collateral

### Keeper Registration
- registerKeeper(agentId: u64, keeperType: u8)
- keeperHeartbeat() - no args
