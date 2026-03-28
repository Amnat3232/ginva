# Keeper C - Finalize Distribution Bot

> Finalize auction distribution after the 72-hour grace period expires. Distributes USDC to stakeholders.

**File**: `bots/keeper-suite.ts:658-848` (FinalizeKeeperBot class)

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│              KEEPER C: FINALIZE DISTRIBUTION             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐         ┌─────────────┐              │
│   │ Scan        │────────▶│ Check       │              │
│   │ Swapped     │         │ Deadline    │              │
│   └─────────────┘         └──────┬──────┘              │
│                                  │                      │
│                      Deadline passed?                   │
│                      ┌──────────┴──────────┐           │
│                      │                     │           │
│                     YES                    NO           │
│                      │                     │           │
│                      ▼                     ▼           │
│             ┌─────────────┐          Skip              │
│             │ Finalize    │                           │
│             │ Distribution│                           │
│             └─────────────┘                           │
│                                                         │
│   Reward: Fixed 1.0 USDC                              │
│   Deadline: 72 hours after trigger                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Trigger Condition

**Source**: keeper-suite.ts:705-711

```typescript
// Only check Swapped but not yet Finalized
if (data.status !== 2) continue; // Not Swapped

// Check if deadline has passed
const now = Math.floor(Date.now() / 1000);
const deadline = data.deadlineForDistribution?.toNumber() || 0;

if (now < deadline) {
  await this.finalize(process.publicKey, data);
}
```

### Deadline Calculation
```
deadlineForDistribution = triggeredAt + 72 hours
                        = triggeredAt + 259200 seconds
```

---

## Configuration

**Source**: keeper-suite.ts:66-70

```typescript
finalize: {
  enabled: true,
  checkInterval: 10000,  // Check every 10 seconds
  minProfit: 1.0,        // Minimum 1.0 USDC reward
}
```

### Why Check Every 10 Seconds?
- Less time-sensitive than Keepers A/B
- Deadline is 72 hours (plenty of time)
- Lower priority fee needed

---

## Finalization Transaction

**Source**: keeper-suite.ts:715-835

### PDA Accounts
| PDA | Seeds |
|-----|-------|
| loanAccount | `["loan", loanAddress]` |
| systemConfig | `["config"]` |
| protocolConfig | `["protocol_config"]` |
| processingAuth | `["processing_auth"]` |
| capitalAuth | `["capital_auth"]` |
| revenueAuth | `["revenue_auth"]` |

### Token Accounts
| Account | Owner | Purpose |
|---------|-------|---------|
| processingVault | processingAuth | USDC from Keeper B |
| capitalWallet | capitalAuth | Principal + interest |
| opsWallet | systemConfig | Protocol operations |
| revenueWallet | revenueAuth | Protocol revenue |
| keeperCUsdc | wallet | Keeper C reward |

### Transaction Building
```typescript
// Build transaction with priority fee
const tx = new Transaction();
tx.add(ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: CONFIG.priorityFee,
}));

// Finalize instruction
const instruction = await program.methods
  .finalizeLiquidation()
  .accounts({
    keeperC: wallet.publicKey,
    liquidationProcess: processAddress,
    loanAccount, systemConfig, protocolConfig,
    processingVaultAuthority: processingAuth,
    processingVault, capitalWallet,
    opsWallet: systemConfigData.opsWallet,
    revenueWallet,
    keeperCUsdcAccount: keeperCUsdc,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .instruction();
```

---

## Distribution Split

After finalization, USDC from ProcessingVault is distributed:

```
┌─────────────────────────────────────────────────────────┐
│                  USDC DISTRIBUTION                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ProcessingVault (from Keeper B purchase)              │
│              │                                          │
│              ├───▶ Capital Wallet (Principal + Interest)│
│              │                                          │
│              ├───▶ Ops Wallet (Protocol Costs)          │
│              │                                          │
│              ├───▶ Revenue Wallet (Protocol Revenue)    │
│              │                                          │
│              └───▶ Keeper C (1.0 USDC Fixed)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Revenue Shares (from lib.rs:83-85)
| Destination | Share |
|-------------|-------|
| Human Keepers | 45% |
| AI Agent | 35% |
| Protocol | 20% |

---

## Reward Calculation

**Source**: keeper-suite.ts:824-831

```typescript
const reward = 1_000_000; // 1.0 USDC (fixed)
this.stats.totalReward += reward;
```

| Operation | Reward |
|-----------|--------|
| Finalize | 1.0 USDC (fixed) |
| Daily (est. 10 ops) | 10 USDC |
| Monthly (est. 300 ops) | 300 USDC |

---

## Running Keeper C

```bash
# Via keeper suite (recommended)
ts-node bots/keeper-suite.ts finalize

# Or run all
ts-node bots/keeper-suite.ts all
```

### Expected Output
```
🟢 Finalize Bot: Starting...
   Min Reward: $1.00
   Check Interval: 10000ms

✨ Finalizing Liquidation...
   Process: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA93T...
   USDC Received: 100000000
✅ Finalization Complete!
   Tx: https://explorer.solana.com/tx/ABC123...?cluster=devnet
   Reward: $1.00
   Total Rewards: $10.00
```

---

## Statistics

**Source**: keeper-suite.ts:837-847

```typescript
stop() {
  console.log(`Stats: Checked ${this.stats.checked}, 
    Finalized ${this.stats.finalized}, 
    Rewards ${formatUSDC(this.stats.totalReward)}`);
}
```

### Stats Tracked
| Stat | Description |
|------|-------------|
| checked | Number of scans performed |
| finalized | Number of liquidations finalized |
| errors | Number of errors encountered |
| totalReward | Total USDC earned |

---

## Error Handling

| Error | Handling |
|-------|----------|
| Not Swapped | Skip (wrong status) |
| Deadline not passed | Skip (wait longer) |
| RPC error | Auto-retry |
| Transaction fail | Log and continue |

---

## Edge Cases

### No One Finalizes
- USDC stays in ProcessingVault
- Loan stays in "Swapped" state
- Anyone can call finalize (permissionless)
- No deadline limit for finalization

### Deadline Already Passed
- Keeper C can finalize immediately
- No penalty for delay
- Loan state preserved

---

## Related Notes

- [[04-Keeper-Bots/Keeper-B-Storefront]] - Previous stage (Storefront)
- [[04-Keeper-Bots/Keeper-A-Trigger]] - First stage (Trigger)
- [[02-Architecture/Liquidation-Waterfall]] - Full liquidation flow
- [[04-Keeper-Bots/Revenue-Share-Logic]] - Revenue distribution

---

**Last Updated**: 2026-03-28  
**Code References**: keeper-suite.ts:658-848 (FinalizeKeeperBot)
