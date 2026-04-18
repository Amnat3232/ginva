# 🛠️ GINVA Developer Guide

> **Note:** Smart contract migrated from Anchor to [Pinocchio](https://github.com/anza-xyz/pinocchio). Build: `cd programs/ginva-pinocchio && cargo build --release`

This guide provides instructions for setting up, testing, and deploying the GINVA protocol.

## 📋 Prerequisites

Ensure you have the following installed:

- **Rust** (latest stable)
- **Solana CLI** (v1.18+)
- **Node.js** (v18+) & **Yarn**

---

## 🚀 Quick Start

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Amnat3232/ginva.git
cd ginva
yarn install
```

### 2. Build Smart Contracts

Compile the Rust programs (Pinocchio):

```bash
cd programs/ginva-pinocchio
cargo build --release
```

Or use Docker:

```bash
docker compose up --build
```

### 3. Run Tests

Run the full test suite (Pinocchio - Rust unit tests):

```bash
cd programs/ginva-pinocchio
cargo test
```

For TypeScript integration tests (requires local validator):

```bash
solana-test-validator &
npm run test:integration
```

## 🧪 Visual Demo (Simulation)

To see the "Pawn Shop" mechanics in action via console logs:

```bash
npx ts-node scripts/visual-demo.ts
```

## 🌍 Deployment (Devnet)

For detailed deployment steps, refer to [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Quick Deploy Command (Pinocchio):

```bash
# Set cluster to devnet
solana config set --url devnet

# Build Pinocchio program
cd programs/ginva-pinocchio
cargo build --release

# Deploy using Solana CLI (after building)
solana program deploy target/release/libginva_pinocchio.so

# Initialize Protocol
npx ts-node scripts/deploy-and-init.ts
```

## 🏗️ Project Structure

```
programs/       Rust smart contracts (Pinocchio)
programs/ginva-pinocchio/  Main lending protocol (migrated from Anchor)
tests/          TypeScript integration tests
scripts/        Utility scripts for setup and demo
app/            Frontend application (React/Vite)
docs/           Additional documentation
```

## 🤖 Keeper Bots

To run the liquidation bot:

```bash
# Install additional dependencies
npm install bs58

# Run bot (Sniper Mode)
npx ts-node auto-swap-bot.ts

# Or via npm script
npm run bot:start
```

## 🔧 Troubleshooting

### Build Errors

**Error: `edition2024` required**

```bash
# Use Docker instead
docker compose up --build
```

**Error: `cargo-build-bpf` not found**

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"
```

### Deployment Issues

**Insufficient balance:**

```bash
solana airdrop 2
```

**Program already deployed:**

```bash
# Upgrade using Solana CLI
solana program upgrade target/release/libginva_pinocchio.so <PROGRAM_ID>
```

## 🔧 Dependency Fixes & Build Configuration

### Rust Toolchain

**File:** `rust-toolchain.toml`

- Updated to `nightly-2025-02-01`
- Added `rustfmt` and `clippy` components
- Supports `edition2024` required by newer dependencies

### Workspace Dependencies

**File:** `Cargo.toml`

- Locked transitive dependencies:
  - `cc = "=1.0.83"`
  - `jobserver = "=0.1.26"`
  - `getrandom = "=0.2.10"`
  - `blake3 = "=1.5.0"`

### Dockerfile

- Updated to `rust:1.87-slim-bookworm`
- Removed Cargo.lock downgrade hack
- Native lockfile generation

### Build Notes

- Docker build takes 15-30 minutes first time
- Pinocchio program output: `target/release/libginva_pinocchio.so`
- Delete `Cargo.lock` and regenerate if conflicts occur

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

[Back to Main](README.md)
