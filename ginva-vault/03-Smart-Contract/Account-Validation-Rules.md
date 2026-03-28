# Account Validation Rules

> Critical account validation checks in GINVA protocol.

## Required Validations

### 1. Signer Check
```rust
if !user.is_signer {
    return Err(ProgramError::MissingRequiredSignature);
}
```

### 2. Owner Check
```rust
if account.owner != &token::ID {
    return Err(ProgramError::IncorrectProgramId);
}
```

### 3. Writable Check
```rust
if !account.is_writable {
    return Err(ProgramError::InvalidAccountData);
}
```

### 4. PDA Derivation
```rust
let (expected_pda, bump) = Pubkey::find_program_address(
    &[b"loan", user.key.as_ref()],
    program_id,
);
if *loan.key != expected_pda {
    return Err(ProgramError::InvalidSeeds);
}
```

## Account Types

| Type | Required Checks |
|------|-----------------|
| User | is_signer, is_writable |
| Token Account | owner == Token Program, is_writable |
| PDA | Seeds validation, has one signer |
| System Program | key == system_program |

## Common Mistakes
- Forgetting to check `is_writable`
- Not validating PDA seeds
- Missing signer check on privileged operations

## Related
- [[Instructions]]
- [[Common-Pitfalls]]

---
**Last Updated**: 2026-03-28
