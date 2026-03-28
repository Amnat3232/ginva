# Common Pitfalls

> Common mistakes when developing with Pinocchio (no_std).

## 1. Arithmetic Overflow

❌ **WRONG**
```rust
let result = a + b; // Can overflow!
```

✅ **CORRECT**
```rust
let result = a.checked_add(b).ok_or(ProgramError::ArithmeticOverflow)?;
```

## 2. Using std in no_std

❌ **WRONG**
```rust
use std::vec::Vec; // Not available in no_std!
```

✅ **CORRECT**
```rust
use alloc::vec::Vec; // Use alloc crate
```

## 3. Unwrap in Production

❌ **WRONG**
```rust
let value = data[0].unwrap(); // Will panic!
```

✅ **CORRECT**
```rust
let value = data[0].ok_or(ProgramError::InvalidAccountData)?;
```

## 4. Incorrect Account Iteration

❌ **WRONG**
```rust
let account = &accounts[0]; // Unsafe, bypasses validation
```

✅ **CORRECT**
```rust
let account = unsafe { next_account_info(account_iter)? };
```

## 5. Forgetting to Reset Locks

❌ **WRONG**
```rust
// liquidation_lock set but never reset on error paths
```

✅ **CORRECT**
```rust
// Always reset in all code paths
loan.liquidation_lock = false;
```

## Related
- [[Processor-Overview]]
- [[Security-Model]]

---
**Last Updated**: 2026-03-28
