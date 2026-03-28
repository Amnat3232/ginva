# Pinocchio Framework

> Pinocchio is a lean, no-std Solana program library written in Rust. It is designed to be as efficient as possible, with no dependencies and minimal overhead.

## Why Pinocchio?

| Feature | Anchor | Pinocchio |
|---------|--------|-----------|
| Dependencies | Many | None (no_std) |
| Binary Size | Larger | Smallest |
| CPI Overhead | Higher | Lower |
| Learning Curve | Easy | Steeper |
| IDL Generation | Auto | Manual |

## Key Concepts

### no_std Environment
- No heap allocator by default
- No standard library (`std::vec`, `std::string` not available)
- Use `alloc` crate when heap needed
- Must use `checked_add`, `checked_mul` for math

### Account Validation
```rust
// Pinocchio style - explicit validation
let account_info = unsafe { account_info_iter.next().unwrap() };
```

### Instruction Data
- Fixed-size structs preferred
- Manual deserialization from `instruction_data`

## Related
- [[03-Smart-Contract/Instructions]]
- [[03-Smart-Contract/Common-Pitfalls]]
- [[MOC-Smart-Contract]]

---
**Last Updated**: 2026-03-28
