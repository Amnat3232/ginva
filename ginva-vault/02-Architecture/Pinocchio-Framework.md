# Pinocchio Framework

> Pinocchio is a lean, no_std Solana program library written in Rust. GINVA uses Pinocchio for minimal binary size and maximum efficiency - critical for a lending protocol with complex instructions.

## Why Pinocchio for GINVA?

| Feature | Anchor | Pinocchio (GINVA) |
|---------|--------|-----------|
| Dependencies | Many | None (no_std) |
| Binary Size | ~200KB+ | ~40KB |
| CPI Overhead | Higher | Lower |
| CPI Safety | Checked | Manual validation required |
| IDL Generation | Auto | Manual (see [[03-Smart-Contract/Instructions]]) |
| Learning Curve | Easy | Steeper |

### GINVA's Migration Decision
- **Phase 1**: Anchor (for rapid prototyping)
- **Phase 5**: Migrated to Pinocchio for:
  - Smaller binary size (cost savings on deployment)
  - Lower CPI overhead (faster liquidations)
  - No runtime dependency on Anchor framework
  - Direct control over account serialization

---

## Core Pinocchio Concepts in GINVA

### 1. no_std Environment
```rust
// lib.rs - no_std is implicit in Pinocchio programs
use pinocchio::account_info::AccountInfo;
use pinocchio::program_error::ProgramError;
use pinocchio::pubkey::Pubkey;
```

**Implications for GINVA:**
- No heap allocator by default - use `alloc` only when needed
- No `std::vec`, `std::string` - use fixed-size arrays
- Math must use `checked_add`, `checked_mul` to prevent overflow

### 2. Entrypoint Pattern
```rust
// lib.rs:206
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    instructions::process_instruction(program_id, accounts, instruction_data)
}
```

### 3. Account Info Iteration (Manual)
```rust
// Manual account parsing - no macro magic
let admin = &accounts[0];
let system_config = &accounts[1];
let protocol_config = &accounts[2];
// ...
```

### 4. Instruction Data Parsing (Manual)
```rust
// instructions.rs:70-71 - Manual byte parsing
let instruction = GinvaInstruction::try_from(data[0])
    .map_err(|_| GinvaError::InvalidInstruction)?;
```

---

## GINVA's Pinocchio Architecture

### File Structure
```
programs/ginva-pinocchio/
├── src/
│   ├── lib.rs              # Constants, errors, entrypoint
│   ├── instructions.rs     # 12 instruction handlers
│   ├── accounts.rs         # Account deserialization helpers
│   └── tests.rs            # Unit tests
└── Cargo.toml
```

### Key Patterns Used

#### Discriminator System (Manual)
```rust
// accounts.rs - Custom discriminator check
// Written during InitializeSystem: lib.rs:184
config_data[0..8].copy_from_slice(b"config__");

// Checked during validation:
let is_initialized = &config_data[0..8] == b"config__" 
    || config_data.iter().any(|&b| b != 0);
```

**Discriminators in GINVA:**
| Account | Discriminator | Offset |
|---------|---------------|--------|
| SystemConfig | `b"config__"` | 0 |
| AssetConfig | `b"asset___"` | 0 |
| ProtocolConfig | `b"protconf"` | 0 |

#### CPI Pattern (Token Transfer)
```rust
// TODO markers in code - not yet implemented
// lib.rs:336, instructions.rs:336
// CPI to token::transfer from user_token_account to reserve_wallet
```

---

## Security Considerations with Pinocchio

### Manual Validation (No Anchor Checks)
| Check | Anchor | Pinocchio (GINVA) |
|-------|--------|-------------------|
| Signer | `#[account(signer)]` | `account.is_signer()` |
| Writable | `#[account(mut)]` | `account.is_writable` |
| Owner | `#[account(owner = ...)]` | Manual check |
| Initialized | `#[account(init)]` | Manual discriminator |

### Common Pitfalls to Avoid
- **Always** check `account.is_signer()` before trusting signatures
- **Always** validate account ownership for CPI safety
- **Always** use checked math (`checked_add`, `checked_mul`)
- See [[03-Smart-Contract/Common-Pitfalls]] for full list

---

## Constants Reference

### Protocol Parameters (lib.rs:51-54)
```rust
pub const APR: u64 = 800;            // 8% APR in basis points
pub const LTV_SAFE: u8 = 20;         // 20% LTV for safe loans
pub const LTV_STANDARD: u8 = 40;     // 40% LTV for standard
pub const LTV_MAX: u8 = 60;          // 60% LTV max
```

### Security Constants (lib.rs:28-45)
```rust
pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500;  // 5% max price change
pub const MIN_TIME_BETWEEN_OPERATIONS: i64 = 1;
```

### Agent Revenue Shares (lib.rs:83-85)
```rust
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;   // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;      // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%
```

---

## Comparison: Anchor vs Pinocchio Code

### Initialize System - Anchor Style (Hypothetical)
```rust
#[derive(Accounts)]
pub struct InitializeSystem<'info> {
    #[account(init, payer = admin, space = 8 + 284)]
    pub system_config: Account<'info, SystemConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    // ...
}
```

### Initialize System - Pinocchio (GINVA)
```rust
// lib.rs:136-207 - Manual everything
fn process_initialize_system(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let admin = &accounts[0];
    if !admin.is_signer() {
        return Err(GinvaError::Unauthorized.into());
    }
    // Manual discriminator check, manual data writing...
}
```

---

## Related Notes

- [[03-Smart-Contract/Instructions]] - All 12 instruction handlers
- [[03-Smart-Contract/Common-Pitfalls]] - Pinocchio-specific gotchas
- [[02-Architecture/Security-Model]] - Security validation patterns
- [[MOC-Smart-Contract]] - Smart contract map of content

---

**Last Updated**: 2026-03-28
**Code References**: lib.rs:206 (entrypoint), instructions.rs:61-97 (dispatcher), instructions.rs:136-207 (init example)
