# Solana Pinocchio Development Skill

## Overview

Pinocchio is a zero-dependency library to create Solana programs in Rust. It provides efficient zero-copy library optimized for compute units and binary size.

**Latest Version:** pinocchio@v0.11.0 (2026-04-08)

**Repository:** https://github.com/anza-xyz/pinocchio

## Quick Start

```bash
# Add Pinocchio to project
cargo add pinocchio

# Build Solana BPF program
cargo build-sbf
```

## Program Entrypoint

```rust
use pinocchio::{AccountView, entrypoint, ProgramResult};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Address,
    accounts: &mut [AccountView],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello from my program!");
    Ok(())
}
```

## Advanced Configuration

```rust
#[cfg(feature = "bpf-entrypoint")]
mod entrypoint {
    use pinocchio::{AccountView, entrypoint, ProgramResult};

    entrypoint!(process_instruction);

    pub fn process_instruction(
        program_id: &Address,
        accounts: &mut [AccountView],
        instruction_data: &[u8],
    ) -> ProgramResult {
        Ok(())
    }
}
```

Build with feature flag:
```bash
cargo build-sbf --features bpf-entrypoint
```

## Common Issues & Solutions

### 1. Cargo.lock version 4 error

**Problem:**
```
error: lock file `Cargo.lock` has version 4, which is not supported by this version of Cargo
```

**Cause:** cargo-build-sbf uses Rust toolchain that generates Cargo.lock v4

**Solution:**
```bash
# Option 1: Use older platform-tools version
cargo build-sbf --tools-version v1.45

# Option 2: Delete Cargo.lock before build
rm -f Cargo.lock
cargo build-sbf
```

### 2. Rust toolchain compatibility

Solana's cargo-build-sbf bundles its own Rust compiler. Use `--tools-version` to select specific version:

```bash
# Available versions: v1.45 (Rust 1.79), v1.54, etc.
cargo build-sbf --tools-version v1.45
```

## Workflow Configuration (GitHub Actions)

```yaml
- name: Build Pinocchio Program
  working-directory: programs/ginva-pinocchio
  run: |
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    cargo build-sbf --tools-version v1.45
```

## BPF Compatibility

Pinocchio is compatible with upstream BPF target. Enable static syscalls in Cargo.toml:

```toml
[dependencies]
# Enable static syscalls for BPF target
pinocchio = { version = "0.11", default-features = false, features = ["static-syscalls"] }
```

## Testing

```bash
cargo test --features test-default
```

## Benchmarking

```bash
cargo bench --features bench-default
```

## References

- Docs: https://docs.rs/pinocchio
- GitHub: https://github.com/anza-xyz/pinocchio
- Solana CLI: https://release.anza.xyz