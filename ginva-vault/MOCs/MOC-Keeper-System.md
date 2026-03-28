# MOC - Keeper System

> Map of Content for all keeper system related notes. The keeper system is GINVA's autonomous liquidation pipeline.

## Overview

The Keeper System manages the full liquidation lifecycle:
1. **Monitor** health factors across all loans
2. **Trigger** liquidations when HF < 100%
3. **Auction** collateral with time-based discounts
4. **Distribute** proceeds to stakeholders

---

## Architecture

### Core Components
- [[02-Architecture/Keeper-System]] - System overview and architecture diagram
- [[02-Architecture/Liquidation-Waterfall]] - 3-stage liquidation flow

### Smart Contract Integration
- [[03-Smart-Contract/Instructions]] - 12 instructions including keeper ops
- [[02-Architecture/Security-Model]] - Security considerations

---

## Keeper Bots

### Keeper A - Trigger Liquidation
**File**: `bots/keeper-a.ts` (323 lines)

| Attribute | Value |
|-----------|-------|
| Purpose | Monitor HF and trigger liquidations |
| Trigger | Health Factor < 100% |
| Reward | 0.6% of collateral value |
| Check Interval | 5 seconds |
| Max Concurrent | 3 |

- [[04-Keeper-Bots/Keeper-A-Trigger]] - Detailed implementation

### Keeper B - Storefront Hunter
**File**: `bots/keeper-suite.ts:413-652` (StorefrontHunterBot)

| Attribute | Value |
|-----------|-------|
| Purpose | Buy discounted collateral |
| Trigger | Time-based discounts |
| Reward | 3-8% discount spread |
| Check Interval | 2 seconds |
| Max Investment | $10,000 per deal |

**Discount Schedule**:
- 0-10 min: 8% (Golden Hour)
- 10-30 min: 6% (Silver)
- 30-60 min: 3% (Bronze)
- >60 min: 0%

- [[04-Keeper-Bots/Keeper-B-Storefront]] - Storefront mechanics

### Keeper C - Finalize Distribution
**File**: `bots/keeper-suite.ts:658-848` (FinalizeKeeperBot)

| Attribute | Value |
|-----------|-------|
| Purpose | Finalize auction after 72h |
| Trigger | Status=Swapped + deadline passed |
| Reward | Fixed 1.0 USDC |
| Check Interval | 10 seconds |

- [[04-Keeper-Bots/Keeper-C-Finalize]] - Finalization details

### AI Agent Layer (BETA)
**File**: `bots/agent-integration.ts`

| Attribute | Value |
|-----------|-------|
| Purpose | Coordinate keepers, optimize execution |
| Revenue Share | 35% of all keeper revenue |
| Status | 🔄 BETA |

- [[04-Keeper-Bots/AI-Agent-Keeper]] - AI integration

---

## Economics

### Revenue Split (lib.rs:83-85)
```
Total Keeper Revenue
├── 45% → Human Keepers (A/B/C)
├── 35% → AI Agent
└── 20% → Protocol Treasury
```

- [[04-Keeper-Bots/Revenue-Share-Logic]] - Detailed breakdown

### Keeper Rewards Summary
| Keeper | Reward Type | Amount |
|--------|-------------|--------|
| Keeper A | Percentage | 0.6% of collateral |
| Keeper B | Discount spread | 3-8% discount |
| Keeper C | Fixed | 1.0 USDC |
| AI Agent | Revenue share | 35% of total |

---

## Liquidation States

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Active  │───▶│Triggered │───▶│ Swapped  │───▶│Finalized │
│   (1)    │    │   (1)    │    │   (2)    │    │   (3)    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
  Normal        Keeper A         Keeper B         Keeper C
  Loans        Triggers       Buys Discount    Distributes
```

---

## Implementation Status

| Component | Status | File |
|-----------|--------|------|
| Keeper A | ✅ Complete | bots/keeper-a.ts |
| Keeper B | ✅ Complete | bots/keeper-suite.ts |
| Keeper C | ✅ Complete | bots/keeper-suite.ts |
| AI Agent | 🔄 BETA | bots/agent-integration.ts |
| RegisterKeeper | ⚠️ TODO | instructions.rs:573 |
| KeeperHeartbeat | ✅ Complete | instructions.rs:593 |

---

## Related MOCs

- [[MOC-Smart-Contract]] - Smart contract system
- [[MOC-Security]] - Security model

---

## Quick Links

### Run Commands
```bash
# Run all keepers
ts-node bots/keeper-suite.ts all

# Run specific keeper
ts-node bots/keeper-suite.ts trigger
ts-node bots/keeper-suite.ts hunter
ts-node bots/keeper-suite.ts finalize
```

### Key Files
- `bots/keeper-a.ts` - Keeper A implementation
- `bots/keeper-suite.ts` - Keeper B + C + Suite
- `bots/agent-integration.ts` - AI Agent
- `bots/README.md` - Bot documentation

---

**Last Updated**: 2026-03-28  
**Status**: Keeper A, B, C ✅ | AI Agent 🔄
