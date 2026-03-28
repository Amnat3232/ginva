# Keeper C - Finalize Distribution

> Finalizes auction distribution after the grace period expires.

## Role
- Monitor loans past grace period (72h)
- Call `finalize_distribution` to close auction
- Enable collateral claim for ticket holders

## Trigger Condition

```typescript
const loan = await getLoan(loanAccount);
const gracePeriodEnd = loan.liquidationTimestamp + GRACE_PERIOD;

if (Date.now() > gracePeriodEnd && !loan.isFinalized) {
    await finalizeDistribution(loanAccount);
}
```

## Revenue
- Fixed fee per finalization
- Smaller than Keeper A/B but consistent

## Finalization Flow
1. Check grace period expired
2. Verify no pending repayments
3. Transfer protocol fee
4. Mark loan as finalized
5. Enable ticket holder claims

## Configuration

| Parameter | Value |
|-----------|-------|
| Grace Period | 72 hours |
| Finalize Fee | 0.1% of collateral |
| Check Interval | 300 seconds |

## Related
- [[02-Architecture/Liquidation-Waterfall]]
- [[02-Architecture/Keeper-System]]
- [[Revenue-Share-Logic]]

---
**Last Updated**: 2026-03-28
