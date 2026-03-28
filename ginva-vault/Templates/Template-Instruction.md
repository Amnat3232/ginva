# Template - Instruction

> Use this template for documenting new smart contract instructions.

---

# [Instruction Name]

## Overview
Brief description of what this instruction does.

## Discriminator
`[Discriminator byte/value]`

## Accounts

| Account | Type | Required | Mutable | Description |
|---------|------|----------|---------|-------------|
| `user` | Signer | ✅ | Yes | ... |
| `loan` | PDA | ✅ | Yes | ... |

## Instruction Data

```rust
#[repr(C)]
pub struct [InstructionName]Data {
    pub amount: u64,
    // ...
}
```

## Validation Rules
- [ ] Check signer
- [ ] Check PDA seeds
- [ ] Check account owner
- [ ] Check writable

## Business Logic
1. Step 1
2. Step 2
3. Step 3

## Error Codes
| Code | Error | Description |
|------|-------|-------------|
| 0x0 | InvalidAmount | ... |

## Related
- [[03-Smart-Contract/Instructions]]
- [[02-Architecture/Data-Flow]]

---
**Last Updated**: {{date}}
