---
name: solana-security-audit
description: Perform security audit on Ginva Protocol - Check for vulnerabilities, access control, reentrancy, arithmetic safety, and best practices for Solana/Pinocchio programs
license: BUSL-1.1
---

# Solana Security Audit Skill for Ginva Protocol

Use this skill to perform a comprehensive security audit on the Ginva protocol smart contract.

## Quick Start

1. First, scan the smart contract at `programs/ginva-pinocchio/src/`
2. Check for common vulnerability patterns
3. Verify security controls are in place
4. Document findings

## Audit Checklist

### 1. Account Validation
- [ ] All account validation in instruction handlers
- [ ] `mint` checks (is valid Mint account)
- [ ] `token_account` ownership verification
- [ ] PDA validation (seeds + bump)
- [ ] Rent exemption checks

### 2. Arithmetic Safety
- [ ] Use `checked_add`, `checked_sub`, `checked_mul`, `checked_div`
- [ ] No overflow/underflow possible
- [ ] Precision handling correct
- [ ] Zero division prevention

### 3. Access Control
- [ ] Admin functions have proper auth
- [ ] Only owner can modify their data
- [ ] No `UncheckedAccount` used improperly

### 4. Reentrancy Protection
- [ ] Reentrancy guards on state-modifying functions
- [ ] No external calls before state changes
- [ ] `ReentrancyGuard` pattern used

### 5. Oracle Security
- [ ] Price staleness check (< 15 seconds)
- [ ] Confidence interval validation
- [ ] Multi-oracle fallback

### 6. Business Logic
- [ ] LTV validation (max 60%)
- [ ] Health factor calculation correct
- [ ] Liquidation logic secure
- [ ] Interest calculation precise

## Critical Patterns to Find

### Type Cosplay
```rust
// CHECK: Is this a real Mint?
if account.mint != expected_mint {
    return Err(GinvaError::InvalidMint);
}
```

### Account Reloading
```rust
// CHECK: Reload account after CPI to get latest state
account.reload()?;
```

### PDA Substitution
```rust
// CHECK: Verify PDA derivation
if !pda.eq(&derived_pda) {
    return Err(GinvaError::InvalidPDA);
}
```

### Arbitrary CPI
```rust
// CHECK: CPI targets are validated
if ctx.accounts.dex.program != JUPITER {
    return Err(GinvaError::InvalidProgram);
}
```

## Audit Priority

1. **CRITICAL**: Fund theft vectors
2. **HIGH**: Logic bugs causing loss
3. **MEDIUM**: Edge case failures
4. **LOW**: Gas optimization

## Files to Audit

- `programs/ginva-pinocchio/src/lib.rs` - Main entry, constants, error codes
- `programs/ginva-pinocchio/src/instructions.rs` - All instruction handlers
- `programs/ginva-pinocchio/src/accounts.rs` - Account validation
- `programs/ginva-pinocchio/src/cpi.rs` - Cross-program calls

## Common Fixes in Ginva

1. Reentrancy guards added to all state-modifying functions
2. Checked arithmetic throughout
3. Price staleness validation (15s max)
4. Supply cap enforcement
5. Emergency pause with timelock

## Report Format

```markdown
# Security Audit Report - Ginva Protocol

## Summary
[Overview of audit scope and findings]

## Critical Issues
[0 items]

## High Issues
[0 items]

## Medium Issues
[0 items]

## Recommendations
[Any improvements]
```

Use this skill when user asks to: audit, security review, check vulnerabilities, find bugs, or review smart contract security.