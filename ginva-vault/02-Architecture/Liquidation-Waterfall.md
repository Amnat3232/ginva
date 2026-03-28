# Liquidation Waterfall

> Complete flow of liquidation process in GINVA protocol.

## Liquidation Flow

```
1. Health Factor drops below 100%
   ↓
2. Keeper A detects & calls trigger_liquidation
   ↓
3. liquidation_lock set to true (prevent double liquidation)
   ↓
4. Collateral transferred to Storefront PDA
   ↓
5. NFT ticket minted representing collateral claim
   ↓
6. 72h grace period begins
   ↓
7. Keeper B or user can buy ticket (or owner can repay)
   ↓
8. After grace period: Keeper C finalizes distribution
   ↓
9. liquidation_lock reset to false
```

## Key Accounts

| Account | Type | Purpose |
|---------|------|---------|
| Loan Account | PDA | Stores loan data |
| Storefront PDA | PDA | Holds collateral during liquidation |
| Ticket Mint | SPL NFT | Represents collateral claim |
| Liquidation Lock | Account flag | Prevents double liquidation |

## Grace Period Logic
- 72 hours from liquidation trigger
- Borrower can repay during this period
- If not repaid: collateral goes to Storefront

## Related
- [[04-Keeper-Bots/Keeper-A-Trigger]]
- [[04-Keeper-Bots/Keeper-B-Storefront]]
- [[04-Keeper-Bots/Keeper-C-Finalize]]

---
**Last Updated**: 2026-03-28
