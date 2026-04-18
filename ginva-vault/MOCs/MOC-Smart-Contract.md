# MOC - Smart Contract

**Map of Content: Smart Contract (Pinocchio)**  
**Last Updated:** 2026-03-28

This page serves as the central hub for everything related to Ginva's Smart Contract.

## Overview
Ginva Smart Contract uses **Pinocchio** framework (no_std) to minimize binary size and attack surface
Located at `programs/ginva-pinocchio/`

**Core Philosophy**: Immutable-first + Maximum safety + Minimal trust

---

## Key Documents

### Core Architecture
- [[03-Smart-Contract/Processor-Overview]] → Processor Structure Overview
- [[03-Smart-Contract/Instructions]] → All Instructions List
- [[02-Architecture/Pinocchio-Framework]] → Pinocchio Details and Differences from Anchor
- [[03-Smart-Contract/Account-Validation-Rules]] → Account Validation Rules (Very Important)

### Critical Logic
- [[02-Architecture/Liquidation-Waterfall]] → Liquidation flow
- [[03-Smart-Contract/Emergency-Pause]] → Emergency pause mechanism
- [[02-Architecture/Security-Model]] → Overall Security Model

### Safety & Best Practices
- [[03-Smart-Contract/Common-Pitfalls]] → Common Mistakes (no_std, arithmetic, CPI)
- [[07-Security-Audit]] → Audit Results and Findings

---

## Main Components

### Source Files

| File | Path | Purpose |
|------|------|---------|
| lib.rs | `programs/ginva-pinocchio/src/lib.rs` | Program entrypoint, constants, error codes |
| instructions.rs | `programs/ginva-pinocchio/src/instructions.rs` | Instruction enum and dispatcher |
| accounts.rs | `programs/ginva-pinocchio/src/accounts.rs` | Account validation and loading |
| cpi.rs | `programs/ginva-pinocchio/src/cpi.rs` | Cross-program invocation helpers |
| tests.rs | `programs/ginva-pinocchio/src/tests.rs` | Unit tests |

### Instructions (12 total)
Source: `programs/ginva-pinocchio/src/instructions.rs:22-35`

```rust
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
}
```

### Important Parameters (Hardcoded)
Source: `programs/ginva-pinocchio/src/lib.rs:51-54`

| Parameter | Value | Line |
|-----------|-------|------|
| Interest Rate | **8% APR fixed** | `lib.rs:51` |
| LTV Safe | **20%** | `lib.rs:52` |
| LTV Standard | **40%** | `lib.rs:53` |
| LTV Max | **60%** | `lib.rs:54` |
| Interest Precision | 1,000,000 | `lib.rs:37` |
| Max Price Change | 500 bps (5%) | `lib.rs:29` |

### Agent Revenue Shares
Source: `programs/ginva-pinocchio/src/lib.rs:83-85`

```rust
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;   // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;      // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%
```

---

## Status & Next Steps (Smart Contract)

### Current Status (March 28, 2026)
- **Framework**: Pinocchio (no_std) — Migration Complete
- **Deployment**: Deployed on Devnet (Program ID: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`)
- **CI/CD**: Workflow stabilizing (cargo build-sbf)
- **Security Level**: High (Hardcoded params, Strict Account validation)
- **Test Coverage**: Unit tests pass but Integration tests incomplete
- **Frontend Integration**: Program ID connected to Vercel deployment

**Current Strengths**:
- Core immutable parameters complete
- Basic liquidation logic ready
- Supply Cap bypass prevention working at basic level

**Weaknesses**:
- No clear Supply Cap / Borrow Cap
- No Oracle Circuit Breaker
- Emergency Pause not implemented

### Next Steps (Priority Order)

**Priority 1 (Most Urgent)**
- [ ] Add **Supply Cap** and **Borrow Cap** for each collateral (SOL, BTC, ETH)
- [ ] Implement **Oracle Circuit Breaker** (prevent Venus Protocol-style attack)
- [ ] Add **Multi-Oracle** (Pyth + Switchboard) + Price deviation check

**Priority 2**
- [ ] Implement **Emergency Pause** instruction + Timelock
- [ ] Add Keeper reward distribution logic (Waterfall 45/35/20)
- [ ] Add comprehensive integration tests (deposit → borrow → liquidate flow)

**Priority 3**
- [ ] Optimize binary size under 1MB (Pinocchio advantage)
- [ ] Add Shield Fee logic (5% in first 15 days)
- [ ] Write formal Security Documentation + Post-mortem template

**Priority 4 (Long-term)**
- [ ] Final audit by third-party
- [ ] Prepare program upgrade for mainnet
- [ ] Cross-chain collateral support (if applicable)

### Success Criteria
- Pass `cargo test --release` 100%
- Circuit Breaker + Supply Cap working
- Liquidation + Keeper flow working correctly on devnet
- Frontend can interact with program normally

---

## Related MOCs
- [[MOCs/MOC-Keeper-System]] → Keeper Bots and AI Agent
- [[MOCs/MOC-Security]] → Security & Risk Management

---

## Quick Links
- [[Deployment-Links]] → Devnet + Production links
- [[01-Project-Overview]] → Project overview
- [[08-Next-Steps]] → Full roadmap

**Tip**: Every time you modify Smart Contract:
1. Pass `cargo test --release` first
2. Build with `cargo build-sbf --release`
3. Update Obsidian Vault with prompt "Update Ginva Obsidian Vault with latest changes"

---

**Connected Notes:**
- [[01-Project-Overview]]
- [[Deployment-Links]]
- [[02-Architecture/Security-Model]]
- [[08-Next-Steps]]

---
**Last Updated**: 2026-03-28