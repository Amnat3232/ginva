# Keeper B - Storefront Hunter Bot

> Buy discounted collateral from the Storefront after liquidation is triggered. Time-based discounts incentivize fast action.

**File**: `bots/keeper-suite.ts:413-652` (StorefrontHunterBot class)

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│              KEEPER B: STOREFRONT HUNTER                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐         ┌─────────────┐              │
│   │ Scan        │────────▶│ Calculate   │              │
│   │ Triggered   │         │ Discount    │              │
│   └─────────────┘         └──────┬──────┘              │
│                                  │                      │
│                      Discount in target range?          │
│                      ┌──────────┴──────────┐           │
│                      │                     │           │
│                     YES                    NO           │
│                      │                     │           │
│                      ▼                     ▼           │
│             ┌─────────────┐          Skip              │
│             │ Buy from    │                           │
│             │ Storefront  │                           │
│             └─────────────┘                           │
│                                                         │
│   Profit: Discount % spread (3-8%)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Time-Based Discount Schedule

**Source**: keeper-suite.ts:482-487

| Time After Trigger | Discount | Tier | Color |
|-------------------|----------|------|-------|
| 0-10 minutes | 8% | Golden Hour | 🟡 Yellow |
| 10-30 minutes | 6% | Silver | ⚪ Gray |
| 30-60 minutes | 3% | Bronze | 🔴 Red |
| >60 minutes | 0% | None | ⚪ White |

```typescript
private calculateDiscount(elapsedSeconds: number): number {
  if (elapsedSeconds <= 600) return 8;   // 0-10 min: 8%
  if (elapsedSeconds <= 1800) return 6;  // 10-30 min: 6%
  if (elapsedSeconds <= 3600) return 3;  // 30-60 min: 3%
  return 0;                              // >60 min: 0%
}
```

---

## Configuration

**Source**: keeper-suite.ts:58-64

```typescript
hunter: {
  enabled: true,
  minDiscount: 6,        // Minimum discount % to buy
  maxDiscount: 8,        // Maximum discount % (safety)
  checkInterval: 2000,   // Check every 2 seconds (faster!)
  maxInvestment: 10000,  // Max USDC per deal
}
```

### Why Check Every 2 Seconds?
- Faster than Keeper A (5s) and Keeper C (10s)
- Compete for Golden Hour deals
- Time-sensitive opportunity window

---

## Main Algorithm

**Source**: keeper-suite.ts:454-480

```typescript
private async scanAndBuy() {
  await rpcLimiter.executeWithRetry(async () => {
    // 1. Fetch all liquidation processes
    const processes = await program.account.liquidationProcess.all();
    const now = Math.floor(Date.now() / 1000);

    for (const process of processes) {
      const data = process.account;

      // 2. Only check Triggered (not yet Swapped)
      if (data.status !== 1 || data.swapped) continue;

      // 3. Calculate time-based discount
      const elapsed = now - data.triggeredAt.toNumber();
      const discount = this.calculateDiscount(elapsed);

      // 4. Buy if in target range
      if (discount >= CONFIG.hunter.minDiscount &&
          discount <= CONFIG.hunter.maxDiscount) {
        await this.buyFromStorefront(process.publicKey, data, discount);
      }
    }
  }, "Hunter scan");
}
```

---

## Storefront Purchase Transaction

**Source**: keeper-suite.ts:489-641

### PDA Accounts
| PDA | Seeds |
|-----|-------|
| systemConfig | `["config"]` |
| seizedAuth | `["seized_auth"]` |
| processingAuth | `["processing_auth"]` |
| loanAccount | `["loan", loanAddress]` |
| assetConfig | `["asset_config", collateralMint]` |
| protocolConfig | `["protocol_config"]` |

### Token Accounts
| Account | Owner | Purpose |
|---------|-------|---------|
| seizedVault | seizedAuth | Holds seized collateral |
| processingVault | processingAuth | Receives USDC from buyer |
| callerUsdc | wallet | Buyer's USDC account |
| callerCollateral | wallet | Buyer's collateral account |

### Transaction Building
```typescript
// 1. Higher priority fee for competitive buying
tx.add(ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: CONFIG.priorityFee * 2,  // 20000
}));

// 2. Create collateral ATA if needed
if (!collateralAccountInfo) {
  tx.add(createAssociatedTokenAccountInstruction(
    wallet.publicKey, callerCollateral, wallet.publicKey, loanData.collateralMint
  ));
}

// 3. Buy instruction
const instruction = await program.methods
  .buyFromStorefront()
  .accounts({
    caller: wallet.publicKey,
    liquidationProcess: processAddress,
    loanAccount, systemConfig, protocolConfig, assetConfig,
    seizedAssetsAuthority: seizedAuth,
    seizedAssetsVault: seizedVault,
    loanMint: loanData.loanMint,
    processingVault, processingVaultAuthority: processingAuth,
    callerUsdcAccount: callerUsdc,
    callerCollateralAccount: callerCollateral,
    jupiterProgram: PROGRAM_ID,
    pythPriceFeed: PYTH_SOL_FEED,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  .instruction();
```

---

## Profit Calculation

**Source**: keeper-suite.ts:629-637

```typescript
const profit = (processData.seizedCollateralAmount * discount) / 100;
this.stats.totalProfit += profit;
```

### Profit Examples
| Collateral | Discount | Profit |
|------------|----------|--------|
| 100 SOL | 8% | 8 SOL |
| 100 SOL | 6% | 6 SOL |
| 1000 SOL | 8% | 80 SOL |

---

## NFT Ticket

When Keeper B buys:
1. Receives **NFT ticket** representing collateral claim
2. Ticket can be sold/transferred before finalization
3. Ticket is burned during finalization (Stage 3)

---

## Running Keeper B

```bash
# Via keeper suite (recommended)
ts-node bots/keeper-suite.ts hunter

# Or run all (includes Hunter)
ts-node bots/keeper-suite.ts all
```

### Expected Output
```
🟢 Hunter Bot: Starting...
   Target Discount: 6% - 8%
   Max Investment: $10000.00
   Check Interval: 2000ms

🟡 OPPORTUNITY: 8% Discount!
   Process: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA93T...
   Seized: 10000000000 units
✅ Purchase Successful!
   Tx: https://explorer.solana.com/tx/ABC123...?cluster=devnet
   Profit: 800000000 units (8% discount)
   Total Profit: 800000000
```

---

## Strategy Considerations

### Optimal Timing
- **Best**: First 10 minutes (8% Golden Hour)
- **Good**: 10-30 minutes (6% Silver)
- **Marginal**: 30-60 minutes (3% Bronze)
- **Skip**: >60 minutes (0%)

### Risk Factors
- Collateral may be illiquid
- Price may drop further during waiting
- Transaction may fail due to competition

---

## Related Notes

- [[04-Keeper-Bots/Keeper-A-Trigger]] - Previous stage (Trigger)
- [[04-Keeper-Bots/Keeper-C-Finalize]] - Next stage (Finalize)
- [[02-Architecture/Liquidation-Waterfall]] - Full liquidation flow
- [[02-Architecture/Keeper-System]] - Keeper architecture

---

**Last Updated**: 2026-03-28  
**Code References**: keeper-suite.ts:413-652 (StorefrontHunterBot)
