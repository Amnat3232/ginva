# Keeper B - Storefront Buyer

> Purchases collateral tickets from the Storefront after liquidation.

## Role
- Monitor Storefront for available tickets
- Evaluate collateral value vs ticket price
- Execute `buy_from_storefront` when profitable

## Decision Logic

```typescript
const ticketPrice = getTicketPrice(ticket);
const collateralValue = getCollateralValue(ticket);
const profit = collateralValue - ticketPrice;

if (profit > MIN_PROFIT_THRESHOLD) {
    await buyFromStorefront(ticket);
}
```

## Revenue
- Spread between ticket price and market value
- Consider gas costs and slippage

## Storefront Mechanics
1. Collateral transferred to Storefront PDA
2. NFT ticket minted
3. Ticket listed at liquidation price
4. Keeper B or user can buy

## Configuration

| Parameter | Value |
|-----------|-------|
| Min Profit Threshold | $5 |
| Max Ticket Age | 48 hours |
| Check Interval | 60 seconds |

## Related
- [[02-Architecture/Liquidation-Waterfall]]
- [[02-Architecture/Keeper-System]]
- [[Revenue-Share-Logic]]

---
**Last Updated**: 2026-03-28
