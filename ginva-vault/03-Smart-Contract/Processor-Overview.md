# Processor Overview

> How instruction processing works in Pinocchio.

## Processing Flow

```
1. Entry point: process_instruction()
   ↓
2. Parse instruction_data discriminator
   ↓
3. Iterate accounts
   ↓
4. Match discriminator → call specific processor
   ↓
5. Validate accounts
   ↓
6. Execute business logic
   ↓
7. Return Ok(())
```

## Entry Point

```rust
#[no_mangle]
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult
```

## Account Iteration

Pinocchio uses `AccountInfoIter` for safe account traversal:

```rust
let account_info_iter = &mut accounts.iter();
let user_account = unsafe { next_account_info(account_info_iter)? };
```

## Common Patterns

### Mutable Borrow
```rust
let mut data = account.try_borrow_mut_data()?;
```

### SPL Token CPI
```rust
let cpi_accounts = Transfer {
    from: source.to_account_info(),
    to: destination.to_account_info(),
    authority: authority.to_account_info(),
};
```

## Related
- [[Instructions]]
- [[Common-Pitfalls]]

---
**Last Updated**: 2026-03-28
