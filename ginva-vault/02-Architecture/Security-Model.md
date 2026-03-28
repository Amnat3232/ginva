# Security Model

> GINVA implements multiple layers of security to protect against exploits and market manipulation.

## Security Layers

### 1. Oracle Security
- **Dual Oracle**: Pyth + Switchboard validation
- **Circuit Breaker**: Auto-pause on >5% price deviation
- **Freshness Check**: Reject stale price data

### 2. Supply Caps
- Prevents inflation attacks
- Limits total deposits per asset
- Configurable per asset type

### 3. Reentrancy Protection
- Single-level reentrancy guard
- Protects storefront and staking functions

### 4. Mathematical Safety
- All arithmetic uses `checked_add`, `checked_mul`
- No `unwrap()` in production code
- Safe casting with explicit checks

### 5. Account Validation
- Signer checks on all privileged operations
- Ownership validation
- Writable account checks

## Security Phases Completed

| Phase | Status | Date |
|-------|--------|------|
| Phase 1: CI | ✅ | 2026-02 |
| Phase 2: Security Hardening | ✅ | 2026-02 |
| Phase 3: Frontend Stability | ✅ | 2026-03 |
| Phase 4: Documentation | ✅ | 2026-03 |
| Phase 5: Devnet Deploy | ✅ | 2026-03 |

## Related
- [[07-Security-Audit]]
- [[MOC-Security]]
- [[03-Smart-Contract/Account-Validation-Rules]]

---
**Last Updated**: 2026-03-28
