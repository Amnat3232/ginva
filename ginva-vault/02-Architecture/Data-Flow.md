# Data Flow

> How data flows through the GINVA protocol.

## Deposit Flow

```
User → Deposit Collateral (SOL/SPL) → Compute Deposit Fee → Store in Loan Account
                                          ↓
                                     ops_wallet receives fee
```

## Borrow Flow

```
User → Call borrow_usdc → Verify Collateral > Borrow Amount * LTV → Transfer USDC to User
                              ↓
                         Update Loan Account
```

## Repay Flow

```
User → Call repay_usdc → Verify Repayment Amount → Transfer USDC to Protocol
                              ↓
                         Update Loan Account
                         If fully repaid: Return collateral
```

## Staking Flow

```
User → Stake LP Tokens → Verify Max Cap (1B USDC) → Store in Staking Account
                              ↓
                         Enable revenue sharing
```

## Key Accounts

| Account | Size | Mutable | Signer |
|---------|------|---------|--------|
| Loan Account | ~500 bytes | Yes | No |
| Global State | ~200 bytes | Yes | Admin (initial) |
| Staking Account | ~100 bytes | Yes | User |

## Related
- [[03-Smart-Contract/Instructions]]
- [[03-Smart-Contract/Processor-Overview]]

---
**Last Updated**: 2026-03-28
