# Ginva Pinocchio - Keeper Bots

**Status**: Tests created but blocked - need program fix or Anchor CLI

## What Works
- Wallet: `/home/drsolodev/.config/solana/devnet-keypair.json`
- Program ID: `CygDH6bVsyKpe8BHnWZDZ33A8UwjQK6Xhj5hijbWuceu` (on-chain)
- Test scripts for deposit/borrow/liquidate

## The Blocker
PDAs need program signature via `invoke_signed`:
- `systemConfig` = 8y5z8gsARG4nZqzHurTXRjRvKMXeBapXaHHFKCPLPzEx
- `protocolConfig` = 9JFw6XPY1egPrBzWeDq89TBxvjutP7Rct3T3Ni8AMBtN
- `opsWallet` = 68PjgdMEaAujXHBej2kRmTj8RwDAfhakEqfKJ1LfwBc1
- `reserveWallet` = EJx4pg6XengqL76Gzs2Hb7KCio7nSb47HYdnkn27A64u

Program expects these to exist but doesn't create them. Error:
```
Signature verification failed. Missing signature for public key [PDA]
```

## Test Scripts Created
```bash
npx tsx bots/test-init-simple.ts     # Seeds: system_config
npx tsx bots/test-direct-init.ts   # Create accounts first
npx tsx bots/test-liquidate.ts     # Liquidate
npx tsx bots/test-deposit.ts        # Deposit collateral
npx tsx bots/test-borrow.ts         # Borrow
```

## Fix Required in Program
In `programs/ginva-pinocchio/src/instructions.rs`:

Add CPI in `InitializeSystem` to create accounts if not exist:
```rust
// Add this at start of process_initialize_system:
// Check and create system_config PDA
if system_config.lamports() == 0 {
    cpi_system_create_account(
        ctx,
        system_config,
        32 + 128, // required space
        program_id,
        &[b"system_config"],
    )?;
}
```

Then rebuild:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

## Alternative: Get Anchor CLI
```bash
# Install Anchor
cargo install anchor-cli --locked

# Or via npm
npm install -g @project-serum/anchor-cli

# Then setup and deploy
anchor keys list
anchor deploy --provider.cluster devnet
```