# Liquidation Waterfall

> The GINVA liquidation process is a 3-stage waterfall: Trigger → Storefront → Finalize. Each stage has different actors, rewards, and timing requirements.

## Liquidation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       GINVA Liquidation Waterfall                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STAGE 0: Normal Loan                                                           │
│  ┌─────────────────────────────────────────────────────────┐                   │
│  │ Health Factor > 100%                                     │                   │
│  │ Collateral > Required                                    │                   │
│  │ Status: Active                                           │                   │
│  └────────────────────────────┬────────────────────────────┘                   │
│                               │ HF drops below 100%                            │
│                               ▼                                                │
│  STAGE 1: Trigger (Keeper A)                                                    │
│  ┌─────────────────────────────────────────────────────────┐                   │
│  │ - Keeper A detects HF < 100%                             │                   │
│  │ - Triggers liquidation on-chain                          │                   │
│  │ - Creates LiquidationProcess account                     │                   │
│  │ - Moves collateral to SeizedAssetsVault                  │                   │
│  │ - Reward: 0.6% of collateral                             │                   │
│  │ - Status: Triggered                                      │                   │
│  └────────────────────────────┬────────────────────────────┘                   │
│                               │ Time passes                                    │
│                               ▼                                                │
│  STAGE 2: Storefront (Keeper B)                                                 │
│  ┌─────────────────────────────────────────────────────────┐                   │
│  │ - Time-based discount kicks in:                          │                   │
│  │   • 0-10 min: 8% discount (Golden Hour)                 │                   │
│  │   • 10-30 min: 6% discount (Silver)                     │                   │
│  │   • 30-60 min: 3% discount (Bronze)                     │                   │
│  │ - Keeper B buys collateral at discount                   │                   │
│  │ - Receives NFT ticket for collateral claim               │                   │
│  │ - Sends USDC to ProcessingVault                          │                   │
│  │ - Status: Swapped                                        │                   │
│  └────────────────────────────┬────────────────────────────┘                   │
│                               │ 72h grace period                               │
│                               ▼                                                │
│  STAGE 3: Finalize (Keeper C)                                                   │
│  ┌─────────────────────────────────────────────────────────┐                   │
│  │ - After 72h grace period expires                         │                   │
│  │ - Keeper C finalizes distribution                        │                   │
│  │ - USDC distributed to:                                   │                   │
│  │   • Capital Wallet (principal + interest)                │                   │
│  │   • Ops Wallet (protocol costs)                          │                   │
│  │   • Revenue Wallet (protocol revenue)                    │                   │
│  │   • Keeper C (fixed 1.0 USDC reward)                     │                   │
│  │ - Loan marked as liquidated                              │                   │
│  │ - Status: Finalized                                      │                   │
│  └─────────────────────────────────────────────────────────┘                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 0: Normal Loan State

### Loan Account Structure
- **Status**: Active (status == 1)
- **Health Factor**: > 100%
- **Borrower**: Can repay or add collateral

### Health Factor Calculation
```
Health Factor = (Collateral Value × Liquidation Threshold) / Loan Amount

Where:
- Collateral Value = collateralAmount × oraclePrice
- Liquidation Threshold = from AssetConfig (e.g., 6000 = 60%)
- Loan Amount = principal + accrued interest
```

### Liquidation Trigger Threshold
```
When: Collateral Value < Required Collateral
Required = (Loan Amount × 10000) / Liquidation Threshold
```

---

## Stage 1: Trigger Liquidation (Keeper A)

### Trigger Conditions
1. Health Factor < 100%
2. Loan status = Active
3. Not already being liquidated

### Keeper A Actions
1. **Scan** all loan accounts (keeper-a.ts:171-184)
2. **Check** if liquidatable using oracle price (keeper-a.ts:186-209)
3. **Trigger** liquidation via `Liquidate` instruction

### On-Chain Effects
- Creates `LiquidationProcess` account
- Moves collateral to `SeizedAssetsVault`
- Sets `triggeredAt` timestamp
- Sets status to `Triggered`

### Keeper A Reward
- **0.6%** of liquidated collateral value
- Calculated as: `(collateralAmount × 60) / 10000`

### Error: AlreadyBeingLiquidated (lib.rs:131)
```rust
AlreadyBeingLiquidated = 308,
```

---

## Stage 2: Storefront Purchase (Keeper B)

### Time-Based Discount Schedule
| Time After Trigger | Discount | Tier Name |
|-------------------|----------|-----------|
| 0-10 minutes | 8% | Golden Hour |
| 10-30 minutes | 6% | Silver |
| 30-60 minutes | 3% | Bronze |
| >60 minutes | 0% | No discount |

**Source**: keeper-suite.ts:482-487

### Keeper B Actions
1. **Scan** all triggered liquidations (keeper-suite.ts:454-480)
2. **Calculate** current discount based on elapsed time
3. **Execute** `buyFromStorefront` instruction if discount in target range
4. **Receive** NFT ticket representing collateral claim

### On-Chain Effects
- USDC transferred to `ProcessingVault`
- Collateral marked as "swapped"
- Sets `deadlineForDistribution` (triggeredAt + 72h)
- Status set to `Swapped`

### Keeper B Profit
- **Discount**: 3-8% depending on timing
- **Profit** = SeizedCollateralAmount × Discount%

### NFT Ticket Mechanics
- Keeper B receives NFT ticket
- Ticket represents claim on collateral
- Can be sold/transferred before finalization

---

## Stage 3: Finalize Distribution (Keeper C)

### Trigger Condition
- Status = Swapped
- Current time >= `deadlineForDistribution`
- 72 hours after trigger

### Keeper C Actions
1. **Scan** all swapped processes (keeper-suite.ts:692-713)
2. **Check** if deadline has passed
3. **Execute** `finalizeDistribution` instruction
4. **Distribute** USDC according to split

### Distribution Split
| Destination | Share | Description |
|-------------|-------|-------------|
| Capital Wallet | Variable | Principal + interest back to lenders |
| Ops Wallet | Fixed % | Protocol operational costs |
| Revenue Wallet | Fixed % | Protocol revenue (20%) |
| Keeper C | 1.0 USDC | Fixed reward |

### On-Chain Effects
- USDC distributed to wallets
- Loan marked as `Liquidated`
- LiquidationProcess marked as `Finalized`
- NFT ticket burned (claim resolved)

---

## LiquidationProcess Account States

```
Status 0: Pending (initial state)
    │
    ▼ Trigger (Keeper A)
Status 1: Triggered
    │
    ▼ Buy (Keeper B)
Status 2: Swapped
    │
    ▼ Finalize (Keeper C)
Status 3: Finalized (terminal)
```

---

## Error Handling by Stage

### Stage 1 Errors (Trigger)
| Error | Code | Meaning |
|-------|------|---------|
| LoanNotActive | 300 | Loan already repaid/liquidated |
| AlreadyBeingLiquidated | 308 | Already triggered |
| HealthFactorNotCritical | 309 | HF still above threshold |
| InProtectionPeriod | 310 | Within protection window |

### Stage 2 Errors (Storefront)
| Error | Code | Meaning |
|-------|------|---------|
| InvalidLiquidationStatus | 400 | Wrong status |
| AlreadySwapped | 401 | Already bought |
| StorefrontPeriodNotOver | 402 | Waiting period not ended |
| InvalidLiquidator | 403 | Unauthorized buyer |

### Stage 3 Errors (Finalize)
| Error | Code | Meaning |
|-------|------|---------|
| InvalidLiquidationStatus | 400 | Not in Swapped state |
| KeeperTaskExpired | 602 | Deadline passed |

---

## Edge Cases

### No One Buys from Storefront
- If no Keeper B buys within 60 minutes:
  - Discount reaches 0%
  - Collateral stays in SeizedAssetsVault
  - Protocol can auction later
  - Admin can intervene (Emergency Pause)

### Keeper C Doesn't Finalize
- If no Keeper C finalizes:
  - USDC stays in ProcessingVault
  - Loan stays in "Swapped" state
  - Anyone can call finalize (permissionless)
  - No deadline limit for finalization

### Flash Loan Attack Prevention
- MIN_HOLD_TIME: 2 blocks minimum
- MIN_HOLD_BLOCKS: 100 blocks
- MIN_HOLD_TIME_SECONDS: 300 seconds (5 minutes)
- Rate limiting: 1 operation per second

---

## Related Notes

- [[04-Keeper-Bots/Keeper-A-Trigger]] - Keeper A implementation
- [[04-Keeper-Bots/Keeper-B-Storefront]] - Storefront mechanics
- [[04-Keeper-Bots/Keeper-C-Finalize]] - Finalization details
- [[02-Architecture/Keeper-System]] - Keeper architecture
- [[03-Smart-Contract/Instructions]] - Instruction reference

---

**Last Updated**: 2026-03-28  
**Code References**: keeper-a.ts:150-306 (Trigger), keeper-suite.ts:413-652 (Storefront), keeper-suite.ts:658-848 (Finalize)
