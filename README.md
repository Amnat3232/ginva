# Ginva Protocol

A Solana blockchain protocol for automated token swaps via Jupiter Aggregator.

## Latest Deployment

| Attribute | Value |
|-----------|-------|
| Network | Devnet |
| Program Id | `DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47` |
| Program Address | `8ssyh9kqrnUwbJVSR712Mj2m9LsZ4dC4222ePmuPVZmy` |
| Deployed Slot | 457929599 |
| Data Size | 14576 bytes (14.5KB) |

---

## Overview

| Attribute | Value |
|-----------|-------|
| Blockchain | Solana |
| Language | Rust |
| Program | Ginva (Pinocchio) |
| Purpose | Automated Token Swap via Jupiter |
| Size | ~15 KB |

## Why Pinocchio?

Security-first approach using [Pinocchio](https://github.com/Everlastings/pinocchio):

- **Minimal attack surface** - Smaller code = fewer vulnerabilities
- **Explicit security** - No hidden SDK magic  
- **Lower deploy cost** - ~30% cheaper than Solana SDK

> For hackathons: smaller programs = lower SOL costs = more budget for testing

---

## Quick Start

### Prerequisites

1. Install Rust (1.85.0)
```bash
rustup install 1.85.0
rustup default 1.85.0
```

2. Install Solana CLI
```bash
sh -c "$(curl -sSfL "https://release.solana.com/v1.18.26/install")"
```

### Build

```bash
# Using Docker (recommended for Pinocchio)
docker build -f Dockerfile.pinocchio -t ginva .
```

Or manually:
```bash
cd programs/ginva-pinocchio
cargo build-sbf
```

### Deploy

```bash
# Devnet (test)
solana program deploy programs/ginva-pinocchio/target/deploy/ginva_pinocchio.so --url devnet

# Program ID for devnet:
# DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47

# Verify deployment
solana program show DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47 --url devnet
```

---

## Features

- Token swap via Jupiter Aggregator
- Cross-program invocation (CPI)
- Account validation
- Security-first design

---

## Project Structure

```
ginva/
├── programs/ginva-pinocchio/   # Active program (Pinocchio)
│   ├── src/
│   │   ├── lib.rs              # Entrypoint
│   │   ├── instructions.rs     # Swap logic
│   │   ├── accounts.rs         # Validation
│   │   └── cpi.rs             # Jupiter integration
│   └── Cargo.toml
├── bots/                       # Trading bots
├── scripts/                    # Deployment
└── Dockerfile.pinocchio        # Docker build
```

---

## License

MIT