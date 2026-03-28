# Revenue Share Logic

> How keeper revenue is calculated and distributed.

## Revenue Sources

| Source | Description | Split |
|--------|-------------|-------|
| Liquidation Penalty | 5-10% of collateral | Keeper A (70%) + Protocol (30%) |
| Storefront Markup | Spread on ticket sales | Keeper B (100%) |
| Finalization Fee | Fixed per finalize | Keeper C (100%) |

## AI Agent Share

```
Total Keeper Revenue = Σ(Keeper A + B + C)
AI Agent Share = Total × 35%
Individual Keepers = Total × 65% (split equally)
```

## Distribution Flow

```typescript
async function distributeRevenue() {
    const totalRevenue = await getTotalKeeperRevenue();
    
    // AI Agent gets 35%
    const aiShare = totalRevenue * 0.35;
    await transferToAiAgent(aiShare);
    
    // Individual Keepers get 65% (split)
    const keeperShare = totalRevenue * 0.65;
    const perKeeper = keeperShare / activeKeepers;
    
    for (const keeper of activeKeepers) {
        await transferToKeeper(keeper, perKeeper);
    }
}
```

## Claim Process
1. Keepers accumulate revenue in PDA
2. Call `claim_rewards` to withdraw
3. Revenue is paid in USDC

## Related
- [[04-Keeper-Bots/Keeper-A-Trigger]]
- [[04-Keeper-Bots/Keeper-B-Storefront]]
- [[04-Keeper-Bots/Keeper-C-Finalize]]
- [[04-Keeper-Bots/AI-Agent-Keeper]]

---
**Last Updated**: 2026-03-28
