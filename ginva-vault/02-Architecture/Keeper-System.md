# Keeper System

> The GINVA Keeper System is a three-stage liquidation pipeline with specialized bots (A, B, C) plus an AI Agent layer for autonomous protocol maintenance. Each keeper has a distinct role in the liquidation waterfall.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GINVA Keeper Pipeline                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Health Factor < 100%                                                       │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│  │   KEEPER A       │     │   KEEPER B       │     │   KEEPER C       │      │
│  │ Trigger Liquid.  │────▶│  Storefront Buy  │────▶│   Finalize       │      │
│  │                  │     │                  │     │   Distribution   │      │
│  │  HF < 100%       │     │  Buy discounted  │     │   72h grace      │      │
│  │  0.6% reward     │     │  collateral      │     │   1.0 USDC fee   │      │
│  └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘      │
│           │                        │                        │               │
│           └────────────────────────┼────────────────────────┘               │
│                                    │                                        │
│                           ┌────────▼────────┐                              │
│                           │    AI AGENT      │                              │
│                           │   35% Revenue    │                              │
│                           │   Share          │                              │
│                           └─────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Keeper A - Trigger Liquidation Bot

**File**: `bots/keeper-a.ts` (323 lines)

### Purpose
Monitor Health Factor (HF) and trigger liquidations when loans become undercollateralized.

### Trigger Conditions
- Health Factor < 100% (collateral value < required)
- Loan status = Active (status == 1)
- Not already being liquidated

### Algorithm
```
1. Scan all loan accounts via RPC
2. For each active loan:
   a. Fetch AssetConfig for collateral type
   b. Fetch current price from Pyth oracle
   c. Calculate: collateralValue = collateralAmount × price
   d. Calculate: requiredCollateral = (loanAmount × 10000) / liquidationThreshold
   e. If collateralValue < requiredCollateral → trigger
```

### Configuration (keeper-a.ts:41-47)
```typescript
const CONFIG = {
  minProfit: 0.5,        // Minimum profit in USDC
  checkInterval: 5000,   // Check every 5 seconds
  maxConcurrent: 3,      // Max simultaneous liquidations
  priorityFee: 10000,    // Micro-lamports for priority
  commitment: "confirmed"
};
```

### Reward
- **0.6%** of liquidated collateral value (keeper-a.ts:282)
- Calculated as: `(collateralAmount × 60) / 10000`

### Rate Limiting
- Uses `RateLimiter` class (keeper-a.ts:127-143)
- 10 requests per second max
- Automatic retry with exponential backoff

---

## Keeper B - Storefront Hunter Bot

**File**: `bots/keeper-suite.ts:409-652` (StorefrontHunterBot class)

### Purpose
Buy defaulted collateral from the "Storefront" at time-based discounts.

### Time-Based Discount Schedule (keeper-suite.ts:482-487)
| Time After Trigger | Discount |
|-------------------|----------|
| 0-10 minutes | 8% (Golden Hour) |
| 10-30 minutes | 6% (Silver) |
| 30-60 minutes | 3% (Bronze) |
| >60 minutes | 0% |

### Algorithm
```
1. Scan all liquidation processes
2. For each "Triggered" process (status == 1, not swapped):
   a. Calculate elapsed time since trigger
   b. Determine discount tier
   c. If discount in target range (6-8%), execute buy
```

### Configuration (keeper-suite.ts:58-64)
```typescript
hunter: {
  enabled: true,
  minDiscount: 6,        // Minimum discount % to buy
  maxDiscount: 8,        // Maximum discount % (safety)
  checkInterval: 2000,   // Check every 2 seconds (faster)
  maxInvestment: 10000,  // Max USDC per deal
}
```

### Storefront NFT Ticket
When Keeper B buys, it receives:
- NFT ticket representing the collateral claim
- Purchased at discount from seized collateral

---

## Keeper C - Finalize Distribution Bot

**File**: `bots/keeper-suite.ts:654-848` (FinalizeKeeperBot class)

### Purpose
Finalize auction distribution after the 72-hour grace period expires.

### Trigger Condition
- Liquidation process status = 2 (Swapped)
- Current time >= `deadlineForDistribution`

### Distribution Split
After finalization, USDC from Storefront sale is distributed:
1. **Capital Wallet**: Principal + interest (back to lenders)
2. **Ops Wallet**: Protocol operational costs
3. **Revenue Wallet**: Protocol revenue share
4. **Keeper C**: Fixed 1.0 USDC reward

### Configuration (keeper-suite.ts:66-70)
```typescript
finalize: {
  enabled: true,
  checkInterval: 10000,  // Check every 10 seconds
  minProfit: 1.0,        // Minimum 1.0 USDC reward
}
```

### Reward
- **Fixed 1.0 USDC** per finalization (keeper-suite.ts:824)

---

## AI Agent Layer (BETA)

**File**: `bots/agent-integration.ts`

### Revenue Share (lib.rs:83-85)
```rust
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;   // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;      // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%
```

### AI Agent Capabilities
- **Multi-keeper optimization**: Coordinate A/B/C bots
- **Priority fee management**: Dynamic fee adjustment
- **Market analysis**: Price prediction for optimal timing
- **Gas optimization**: Batch operations when possible

### Agent Constraints (lib.rs:92-97)
```rust
pub const AGENT_MIN_RATE_LIMIT_SECONDS: u16 = 1;
pub const AGENT_MAX_RATE_LIMIT_SECONDS: u16 = 300;
pub const AGENT_DEFAULT_RATE_LIMIT: u16 = 15;
pub const AGENT_MIN_SUCCESS_RATE: u16 = 80;
pub const AGENT_MAX_RESPONSE_TIME_MS: u32 = 5000;
```

---

## On-Chain Keeper Registration

### RegisterKeeper Instruction (instructions.rs:573-591)
```rust
// Instruction data: agent_id (u64) + keeper_type (u8)
fn process_register_keeper(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let agent_id = u64::from_le_bytes([...]);
    let keeper_type = data[8];
    // TODO: Implement keeper registration
}
```

### KeeperHeartbeat Instruction (instructions.rs:593-617)
```rust
// Keepers must send heartbeat to stay active
fn process_keeper_heartbeat(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _data: &[u8],
) -> ProgramResult {
    // Validates keeper is signer
    // Validates system is active
    // Updates last heartbeat timestamp
}
```

---

## Keeper Suite Runner

**File**: `bots/keeper-suite.ts:850-897`

### Usage
```bash
# Run all keepers
ts-node bots/keeper-suite.ts all

# Run specific keeper
ts-node bots/keeper-suite.ts trigger   # Keeper A only
ts-node bots/keeper-suite.ts hunter    # Keeper B only
ts-node bots/keeper-suite.ts finalize  # Keeper C only
```

### Graceful Shutdown
```typescript
process.on("SIGINT", () => {
  triggerBot.stop();
  hunterBot.stop();
  finalizeBot.stop();
  process.exit(0);
});
```

---

## Error Handling

### Common Errors

| Error | Code | Meaning |
|-------|------|---------|
| `KeeperNotRegistered` | 600 | Keeper not in registry |
| `KeeperAlreadyRegistered` | 601 | Duplicate registration |
| `KeeperTaskExpired` | 602 | Task deadline passed |
| `KeeperTaskAlreadyExecuted` | 603 | Task already completed |

---

## Related Notes

- [[04-Keeper-Bots/Keeper-A-Trigger]] - Detailed Keeper A implementation
- [[04-Keeper-Bots/Keeper-B-Storefront]] - Storefront mechanics
- [[04-Keeper-Bots/Keeper-C-Finalize]] - Finalization flow
- [[04-Keeper-Bots/AI-Agent-Keeper]] - AI agent integration
- [[04-Keeper-Bots/Revenue-Share-Logic]] - Revenue distribution
- [[02-Architecture/Liquidation-Waterfall]] - Full liquidation flow
- [[MOC-Keeper-System]] - Keeper system map of content

---

**Last Updated**: 2026-03-28  
**Code References**: keeper-a.ts:150-306 (TriggerKeeperBot), keeper-suite.ts:413-652 (StorefrontHunterBot), keeper-suite.ts:658-848 (FinalizeKeeperBot), lib.rs:83-85 (revenue shares)
