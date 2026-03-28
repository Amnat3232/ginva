# Keeper A - Trigger Liquidation Bot

> Monitor Health Factor and trigger liquidations when loans become undercollateralized. First stage in the liquidation waterfall.

**File**: `bots/keeper-a.ts` (323 lines)

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                   KEEPER A: TRIGGER BOT                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐         ┌─────────────┐              │
│   │  Scan All   │────────▶│ Check HF    │              │
│   │  Loans      │         │ per Loan    │              │
│   └─────────────┘         └──────┬──────┘              │
│                                  │                      │
│                           HF < 100%?                    │
│                           ┌──────┴──────┐              │
│                           │             │              │
│                          YES            NO              │
│                           │             │              │
│                           ▼             ▼              │
│                  ┌─────────────┐   Skip Loan           │
│                  │  Trigger    │                        │
│                  │  Liquidate  │                        │
│                  └─────────────┘                        │
│                                                         │
│   Reward: 0.6% of collateral value                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration

**Source**: keeper-a.ts:41-47

```typescript
const CONFIG = {
  minProfit: 0.5,        // Minimum profit in USDC
  checkInterval: 5000,   // Check every 5 seconds
  maxConcurrent: 3,      // Max simultaneous liquidations
  priorityFee: 10000,    // Micro-lamports for priority
  commitment: "confirmed"
};
```

---

## Main Loop

**Source**: keeper-a.ts:155-169

```typescript
class TriggerKeeperBot {
  private isRunning = false;
  private activeLiquidations = 0;
  private stats = { checked: 0, triggered: 0, errors: 0, totalReward: 0 };

  async start() {
    this.isRunning = true;
    while (this.isRunning) {
      await this.scanAndTrigger();
      await sleep(CONFIG.checkInterval);
    }
  }
}
```

---

## Liquidation Check Algorithm

**Source**: keeper-a.ts:186-209

```typescript
private async checkLiquidatable(loanData: any): Promise<boolean> {
  // 1. Get AssetConfig for collateral type
  const assetConfigPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("asset_config"), loanData.collateralMint.toBuffer()],
    program.programId
  )[0];
  const assetConfig = await program.account.assetConfig.fetch(assetConfigPDA);

  // 2. Get current price from Pyth
  const priceFeed = await program.account.priceUpdateV2?.fetch(PYTH_SOL_FEED);
  if (!priceFeed) return false;

  // 3. Calculate Health Factor
  const collateralValue = loanData.collateralAmount * priceFeed.price.price;
  const requiredCollateral = (loanData.loanAmount * 10000) / assetConfig.liquidationThreshold;

  // 4. Liquidatable if collateral < required
  return collateralValue < requiredCollateral;
}
```

### Health Factor Formula
```
HF = (Collateral Value × Liquidation Threshold) / Loan Amount

Liquidatable when: HF < 100%
Or: Collateral Value < Required Collateral
Where: Required = (Loan Amount × 10000) / Liquidation Threshold
```

---

## Trigger Transaction

**Source**: keeper-a.ts:211-292

### PDA Accounts Created
| PDA | Seeds |
|-----|-------|
| liquidationProcess | `["liquidation", loanAddress]` |
| assetConfig | `["asset_config", collateralMint]` |
| vaultAuth | `["vault_auth"]` |
| seizedVault | `["seized_vault", loanAddress]` |

### Transaction Instruction
```typescript
const instruction = await program.methods
  .triggerLiquidation()
  .accounts({
    keeperA: wallet.publicKey,
    loanAccount: loanAddress,
    systemConfig: PublicKey.findProgramAddressSync(["config"], program.programId)[0],
    liquidationProcess,
    vaultAuthority: vaultAuth,
    vaultCollateralAccount,
    seizedAssetsVault: seizedVault,
    assetConfig,
    pythPriceFeed: PYTH_SOL_FEED,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .instruction();
```

### Priority Fee
```typescript
tx.add(ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: CONFIG.priorityFee,  // 10000
}));
```

---

## Reward Calculation

**Source**: keeper-a.ts:282-286

```typescript
const reward = (loanData.collateralAmount * 60) / 10000;
// 0.6% of collateral value
```

| Collateral | Reward |
|------------|--------|
| 100 SOL | 0.6 SOL |
| 1000 SOL | 6 SOL |
| 10000 SOL | 60 SOL |

---

## Rate Limiting

**Source**: keeper-a.ts:127-145

```typescript
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests = 10;
  private readonly windowMs = 1000;

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (t) => now - t < this.windowMs
    );
    if (this.requestTimes.length >= this.maxRequests) {
      await sleep(this.windowMs);
      return this.acquire();
    }
    this.requestTimes.push(now);
  }
}
```

---

## Running Keeper A

```bash
# Direct run
npm run keeper-a

# Via keeper suite
ts-node bots/keeper-suite.ts trigger
```

### Expected Output
```
╔══════════════════════════════════════════════════════════╗
║          🤖 KEEPER A: TRIGGER LIQUIDATION BOT           ║
╚══════════════════════════════════════════════════════════╝
Wallet: ABC123...
RPC: https://api.devnet.solana.com
Program: GWcQGd...

📋 Config: Check every 5s, Max 3 concurrent

🟢 Keeper A: Starting...
🔨 Triggering Liquidation...
   Loan: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA93T...
✅ Liquidation Triggered!
   Tx: https://explorer.solana.com/tx/ABC123...?cluster=devnet
   💰 Expected Reward (0.6%): 0.6000 SOL
```

---

## Statistics

**Source**: keeper-a.ts:294-305

```typescript
stop() {
  console.log(`Stats: Checked ${this.stats.checked}, 
    Triggered ${this.stats.triggered}, 
    Errors ${this.stats.errors}`);
  console.log(`Total Rewards: ${formatSOL(this.stats.totalReward)}`);
}
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| RPC rate limit | Auto-retry with backoff |
| Network error | Log and continue |
| Transaction fail | Log error, decrement active count |
| Invalid loan | Skip (already liquidated) |

---

## Related Notes

- [[02-Architecture/Keeper-System]] - Keeper architecture overview
- [[02-Architecture/Liquidation-Waterfall]] - Full liquidation flow
- [[04-Keeper-Bots/Keeper-B-Storefront]] - Next stage (Storefront)
- [[03-Smart-Contract/Instructions]] - Liquidate instruction

---

**Last Updated**: 2026-03-28  
**Code References**: keeper-a.ts:1-323 (full file)
