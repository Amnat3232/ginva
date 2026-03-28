# Keeper A - Trigger Liquidation

> Monitors loan health factors and triggers liquidation when needed.

## Role
- Scan all active loans
- Detect Health Factor < 100%
- Call `trigger_liquidation` instruction

## Trigger Condition

```typescript
const healthFactor = (collateralValue * 100) / borrowAmount;
if (healthFactor < 100) {
    await triggerLiquidation(loanAccount);
}
```

## Revenue
- Fixed % of liquidation penalty
- Priority fee optimization
- Competition with other Keeper A bots

## Implementation Notes

### Priority Fees
- Dynamic priority fees based on network congestion
- Higher fees during volatile market conditions

### Error Handling
- Retry logic for failed transactions
- Skip accounts that are already liquidated

## Configuration

| Parameter | Value |
|-----------|-------|
| Check Interval | 30 seconds |
| Min Collateral Value | $100 |
| Max Retries | 3 |

## Related
- [[02-Architecture/Liquidation-Waterfall]]
- [[02-Architecture/Keeper-System]]
- [[Revenue-Share-Logic]]

---
**Last Updated**: 2026-03-28
