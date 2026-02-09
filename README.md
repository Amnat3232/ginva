# 🏛️ GINVA: The On-Chain Distressed Asset Exchange

> **"Where Liquidation becomes Opportunity."** > _The first lawful, transparent, and gamified Pawn Shop on Solana._

[![License](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com/Amnat3232/ginva)

---

## 💀 The Problem: DeFi is Broken

For years, liquidations have been a war zone.

- **Keepers** exploit users via gas wars.
- **Bad debt** destroys protocols.
- **Borrowers** lose everything in an instant fire sale.

We built **GINVA** to change that. Not because we're nice, but because that's how **real finance** should work.

---

## 💎 The Solution: GINVA Pawn Shop

We are **NOT** just another lending protocol. We are an **On-Chain Distressed Asset Exchange**.

### 1. 🏛️ For Hunters: The "Pawn Drop" (Time-Decay Pricing)

We turned liquidations into a **Treasure Hunt**. When a borrower defaults, their asset isn't dumped—it's **DROPPED** in our Pawn Shop with a "Time-Decay" price mechanism designed to fuel FOMO and fairness.

| Time Window      | Tier Name          | The "Edge" (Discount) | Status                                        |
| :--------------- | :----------------- | :-------------------- | :-------------------------------------------- |
| **0 - 10 Mins**  | ⚡ **Golden Hour** | **-8%**               | _Instant Profit. First come, first served._   |
| **10 - 30 Mins** | 🥈 **Silver Tier** | **-6%**               | _Still profitable, but the clock is ticking._ |
| **30 - 60 Mins** | 🥉 **Bronze Tier** | **-3%**               | _Last chance before market price._            |
| **> 60 Mins**    | 💀 **Expired**     | **0%**                | _Moved to DEX fallback._                      |

**The Result:** You don't need to be a bot to win. You just need to be **ready**.

### 2. 🛡️ For Borrowers: Dignity & Fairness

If you default, your asset is sold with dignity via our **Staged Sale** system, maximizing its value recovery. No instant Rekt.

### 3. 🏦 For Lenders: Anti-Bank Run

Our **Shield Fee Mechanism** protects your capital. Early withdrawals (within 15 days) incur a 5% fee that goes back to the community pool, discouraging mercenary capital.

---

## ⚙️ The Mechanic (How it Works)

1.  **Trigger:** Keeper A identifies a bad debt and locks it. (Reward: 0.6%)
2.  **Pawn Drop:** The asset hits the **Storefront**. The countdown begins.
3.  **Seize:** A user (Hunter) spots the deal and calls `seize_asset`.
    - They pay the discounted price in USDC.
    - They receive the collateral instantly.
4.  **Finalize:** Keeper C closes the loop, distributing funds to lenders.

---

## 📚 Documentation & Resources

Want to hunt or build? Check the docs:

| Resource                                           | Description                              |
| :------------------------------------------------- | :--------------------------------------- |
| 🛠️ **[Developer Guide](DEVELOPMENT.md)**           | Setup, Run Node, and Test the System     |
| 🏗️ **[System Architecture](docs/ARCHITECTURE.md)** | Inside the Smart Contract & Greed Engine |
| 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)**      | Deploy to Devnet/Mainnet                 |
| 🔐 **[Security Policy](docs/SECURITY.md)**         | Audits & Safety Measures                 |

---

## 🗺️ Roadmap

- [x] **Core Protocol Logic** (Lending, Borrowing, Interest)
- [x] **The Greed Engine** (Time-Decay Pricing v1)
- [x] **Shield Fee Mechanism** (Bank-Run Protection)
- [x] **Pawn Shop UI** (Beta)
- [ ] **Keeper Bots Open Source** ⏳ _Coming Next_
- [ ] **Mainnet Launch** 🔒 _Target: Q3 2026_

---

<div align="center">

**Join the Hunt.**

[Website](https://ginva.io) • [Discord](https://discord.gg/ginva) • [Twitter](https://twitter.com/ginva_protocol)

_Licensed under BUSL-1.1 (Business Source License)_

</div>
