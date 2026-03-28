# Smart Contract Instructions

> All instruction handlers for the GINVA Pinocchio program.

## Instruction List

| Instruction | Discriminator | Description |
|-------------|---------------|-------------|
| `initialize` | 0 | Initialize global state |
| `deposit_collateral` | 1 | Deposit SOL/SPL as collateral |
| `borrow_usdc` | 2 | Borrow USDC against collateral |
| `repay_usdc` | 3 | Repay USDC loan |
| `extend_loan` | 4 | Extend loan maturity |
| `trigger_liquidation` | 5 | Trigger liquidation (Keeper A) |
| `buy_from_storefront` | 6 | Buy collateral ticket (Keeper B) |
| `finalize_distribution` | 7 | Finalize auction (Keeper C) |
| `stake_lp` | 8 | Stake LP tokens |
| `unstake_lp` | 9 | Unstake LP tokens |
| `claim_rewards` | 10 | Claim staking rewards |
| `update_config` | 11 | Update protocol config (admin) |

## Instruction Data Format

```rust
#[repr(C)]
pub struct InstructionData {
    pub discriminator: u8,
    // instruction-specific fields...
}
```

## Related
- [[Processor-Overview]]
- [[Account-Validation-Rules]]
- [[MOC-Smart-Contract]]

---
**Last Updated**: 2026-03-28
