# Emergency Pause

> Emergency pause mechanisms in GINVA protocol.

## Pause Triggers

### Automatic (Circuit Breaker)
- Price deviation > 5% between Pyth and Switchboard
- Auto-pauses borrowing operations
- Liquidation still allowed

### Manual (Admin)
- Requires multisig approval
- Used for critical vulnerabilities
- Requires governance vote

## Pause State

```rust
pub struct GlobalState {
    pub is_paused: bool,      // Global pause
    pub emergency_pause: bool, // Emergency pause
    pub oracle_circuit_breaker: bool, // Oracle issue
}
```

## Operations During Pause

| Operation | Normal | Paused | Emergency |
|-----------|--------|--------|-----------|
| Deposit | ✅ | ✅ | ❌ |
| Borrow | ✅ | ❌ | ❌ |
| Repay | ✅ | ✅ | ✅ |
| Liquidate | ✅ | ✅ | ✅ |

## Unpause Procedure
1. Fix underlying issue
2. Test on Devnet
3. Governance vote (if needed)
4. Execute unpause transaction

## Related
- [[02-Architecture/Security-Model]]
- [[Emergency-Procedure]]

---
**Last Updated**: 2026-03-28
