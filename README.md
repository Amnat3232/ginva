# 🏛️ GINVA — On-Chain Distressed Asset Exchange

> **"Don't just lend. Hunt."**
>
> _A gamified, on-chain marketplace for distressed crypto assets on Solana._

[![License](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com/Amnat3232/ginva)

---

## Overview

**GINVA is not a conventional DeFi lending protocol.**

It is a time-sensitive distressed asset exchange designed to replace opaque liquidation mechanics with a deterministic, public, and competitive marketplace.

Instead of hidden liquidators and MEV-dominated auctions, defaulted collateral is routed into an on-chain **Pawn Shop**, where price discovery happens transparently over time.

---

## The Problem

Liquidations in DeFi are structurally hostile to most participants:

- ❌ **Private liquidator access** and whitelists
- ❌ **MEV and latency-based competition**
- ❌ **Fire-sale pricing** that destroys asset value
- ❌ **Protocol bad debt** during market stress

The result is a system optimized for bots, not capital efficiency or fairness.

---

## The GINVA Solution

GINVA replaces liquidation wars with a public **time-decay sale mechanism**.

When a loan becomes unhealthy, collateral is not dumped. Instead, it enters a **Pawn Drop** — a public sale event governed entirely by smart contracts.

### 1. Pawn Drop (Public Access)

- All distressed assets are routed to a public storefront.
- No private liquidators or preferential execution.
- Identical access rules for all participants.

### 2. Time-Decay Pricing ("Greed Engine")

Pricing follows a deterministic Dutch-style curve. Earlier action carries higher risk but higher expected edge.

| Time Window   | Zone               | Discount | Intended Behavior               |
| :------------ | :----------------- | :------- | :------------------------------ |
| **0–10 min**  | ⚡ **Golden Hour** | **-8%**  | High conviction, fast execution |
| **10–30 min** | 🥈 **Silver**      | **-6%**  | Balanced risk/reward            |
| **30–60 min** | 🥉 **Bronze**      | **-3%**  | Conservative entry              |
| **>60 min**   | 💀 **Expired**     | **0%**   | Routed to DEX fallback          |

---

## Capital Flow (Profit Waterfall)

All protocol revenue is distributed automatically by smart contracts. There are no discretionary transfers or off-chain revenue controls.

| Allocation          | Share         | Description                         |
| :------------------ | :------------ | :---------------------------------- |
| **👥 Stakers**      | **~65.25%**   | Yield paid in USDC / SOL            |
| **🛠️ Operations**   | **~24.75%**   | Development, audits, ecosystem      |
| **🏦 Capital Pool** | **~10.00%**   | Reinvestment into lending liquidity |
| **🛡️ Reserve**      | **Fee-based** | Safety buffer from early exits      |

---

## Participant Roles

### 🏹 Hunter (Buyer)

- Monitors Pawn Drops
- Acquires discounted collateral
- Competes on **information**, not latency

### 🏦 Capital Provider (Lender)

- Supplies liquidity to the protocol
- Earns protocol-wide revenue
- Protected by a **Shield Fee** (5% for <15 day withdrawals)

### 👤 Borrower

- Uses crypto assets as collateral
- Faces transparent liquidation mechanics
- Collateral is sold publicly, not privately extracted

---

## Design Principles

- **Public-by-default** liquidation
- **Deterministic pricing** over MEV competition
- **Capital preservation** before growth
- **Simple mechanisms** over complex incentives

---

## Non-Goals & Known Risks

- ⚠️ Not optimized for highly illiquid or meme assets
- ⚠️ Oracle latency may delay Pawn Drops during volatility
- ⚠️ Does not guarantee full borrower recovery
- ⚠️ Not designed for high-frequency trading strategies

---

## Roadmap

- ✅ **Core lending and interest engine**
- ✅ **Pawn Drop mechanism (Devnet)**
- ✅ **Automated profit waterfall**
- 🔄 **Q2 2026 — Public Testnet & UI iteration**
- 🔒 **Q3 2026 — Mainnet launch (audited)**
- 🌐 **Q4 2026 — DAO-controlled parameters**

---

## Developer Documentation

For installation, testing, and deployment instructions, please refer to:

- 👉 **Developer Guide:** [`DEVELOPMENT.md`](DEVELOPMENT.md)
- 🏗️ **Architecture Overview:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 🔐 **Security & Audits:** [`docs/SECURITY.md`](docs/SECURITY.md)

---

## License

GINVA is released under the **Business Source License 1.1 (BUSL-1.1)**.

- Source is viewable and auditable
- Commercial forks are restricted
- License converts to open-source after the change date

See [`LICENSE`](LICENSE) for details.

> **GINVA is a marketplace, not a promise.**
> Risk is explicit. Pricing is transparent.
