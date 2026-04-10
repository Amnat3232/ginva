# Ginva Architecture Summary

## Protocol Design
- **Type**: Lending/Borrowing on Solana
- **Token**: COLLATERAL tokens with dynamic LTV
- **Key Features**:
  - Collateral ratio tracking
  - Liquidation mechanism
  - Borrow limit calculation

## Program Structure (Anchor)
```
programs/ginva/src/
├── lib.rs          # Entry point, initialize, set_oracle
├── instructions/  # Deposit, withdraw, borrow, repay, liquidate
├── state/          # Bank, user, config
└── math/           # Calculation helpers
```

## Key Constraints
- `MIN_COLLATERAL_RATIO`: 110%
- `LIQUIDATION_BONUS`: 5%
- Oracle price feed for asset pricing