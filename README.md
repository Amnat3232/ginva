# 🏛️ GINVA — On-Chain Distressed Asset Exchange

> **"Don't just lend. Hunt."**
>
> _A gamified, on-chain marketplace for distressed crypto assets on Solana._

[![License](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com/Dr-SoloDev/ginva)

---

## 🎯 Quick Overview

GINVA is a **time-sensitive distressed asset exchange** that replaces hostile liquidations with a transparent, competitive marketplace.

```
┌─────────────────────────────────────────────────────────────────┐
│                        GINVA ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    👤 BORROWERS          💰 INVESTORS           🤖 KEEPERS     │
│    (Priority #1)          (Priority #2)           (Priority #3) │
│         │                     │                      │            │
│         ▼                     ▼                      ▼            │
│    ┌─────────┐          ┌─────────┐           ┌─────────┐      │
│    │  Deposit │          │  Stake  │           │ Monitor │      │
│    │Collateral│          │   LP    │           │ Liquidate│      │
│    └────┬────┘          └────┬────┘           └────┬────┘      │
│         │                     │                      │            │
│         ▼                     ▼                      ▼            │
│    ┌─────────┐          ┌─────────┐           ┌─────────┐      │
│    │  Borrow │          │ Earn    │           │ Trigger │      │
│    │   USDC  │          │ Rewards │           │Liquidate│      │
│    └────┬────┘          └────┬────┘           └────┬────┘      │
│         │                     │                      │            │
│         └──────────┬──────────┘                      │            │
│                    │                                 │            │
│                    ▼                                 │            │
│            ┌──────────────┐                           │            │
│            │  PAWN SHOP  │◄──────────────────────────┘            │
│            │ (Liquidation)│                                          │
│            └──────┬───────┘                                          │
│                   │                                                  │
│                   ▼                                                  │
│            ┌──────────────┐                                          │
│            │ Time-Decay   │                                          │
│            │ Pricing      │                                          │
│            └──────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👤 BORROWERS (Priority #1) 🏆

You are the foundation of GINVA. Everything starts with you.

### What You Do

```
┌────────────────────────────────────────┐
│         BORROWER WORKFLOW              │
├────────────────────────────────────────┤
│                                        │
│  1️⃣  Deposit Collateral               │
│      └─► SOL, BTC, ETH → Vault        │
│                                        │
│  2️⃣  Borrow USDC                      │
│      └─► Up to 50% LTV                │
│                                        │
│  3️⃣  Repay / Extend                   │
│      └─► Pay interest OR extend loan   │
│                                        │
│  4️⃣  Get Collateral Back             │
│      └─► Full repayment → Get assets   │
│                                        │
└────────────────────────────────────────┘
```

### Your Benefits

| Feature                    | Description                        |
| :------------------------- | :--------------------------------- |
| 🛡️ **Fair Liquidations**   | No bots stealing your assets       |
| 📊 **Transparent Pricing** | See exactly what buyers pay        |
| ⏰ **Time to Act**         | 72 hours to save your collateral   |
| 💰 **Keep More Value**     | Price decays gradually, not dumped |
| 🔄 **Extend Option**       | Pay interest to delay liquidation  |

### How It Works

```
BORROWER JOURNEY:

┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Deposit  │───►│  Borrow │───►│ Repay   │───►│ Get     │
│Collateral│    │  USDC   │    │/Extend  │    │Back     │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
  Assets      USDC to      Interest to    Collateral
  locked      use          protocol       returned
```

### Key Terms

| Term                            | Value         | Description                      |
| :------------------------------ | :------------ | :------------------------------- |
| 📅 **Interest Payment**         | Every 30 days | Minimum 30 days between payments |
| ⏳ **Liquidation Grace Period** | 72 hours      | Time to save collateral          |
| 📉 **LTV**                      | ≤50%          | Maximum loan-to-value ratio      |
| 💸 **Interest Rate**            | Variable      | Based on asset risk              |

---

## 💰 INVESTORS (Priority #2) 📈

You provide the liquidity that makes GINVA work. You earn from EVERY transaction.

### What You Do

```
┌────────────────────────────────────────┐
│        INVESTOR WORKFLOW               │
├────────────────────────────────────────┘
│                                        │
│  1️⃣  Stake LP Tokens                 │
│      └─► Provide liquidity             │
│                                        │
│  2️⃣  Earn Auto-Compounding           │
│      └─► Rewards auto-accumulate       │
│                                        │
│  3️⃣  Claim Anytime                    │
│      └─► No lock-up period            │
│                                        │
└────────────────────────────────────────┘
```

### Your Revenue Share

```
┌─────────────────────────────────────────────────────────┐
│              REVENUE DISTRIBUTION WATERFALL            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ALL INTEREST PAYMENTS                                 │
│          │                                              │
│          ├── 10% ──► 🏦 CAPITAL POOL (Reinvestment)   │
│          │                                              │
│          ├── 24.75% ──► 🛠️ OPERATIONS TEAM            │
│          │                                              │
│          └── 65.25% ──► 👥 STAKERS (YOU!)             │
│                       │                                  │
│                       └── acc_reward_per_share          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Revenue Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    INVESTOR REVENUE FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BORROWER PAYS INTEREST                                      │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────┐               │
│  │         REVENUE SPLIT (100%)             │               │
│  └────────────────┬──────────────────────────┘               │
│                   │                                            │
│         ┌─────────┼─────────┐                                  │
│         ▼         ▼         ▼                                │
│    ┌────────┐ ┌────────┐ ┌─────────────┐                     │
│    │Capital │ │  Ops   │ │   Stakers   │                     │
│    │  10%   │ │ 24.75% │ │   65.25%    │                     │
│    └────────┘ └────────┘ └──────┬──────┘                     │
│                                │                              │
│                                ▼                              │
│                        ┌─────────────┐                        │
│                        │   Reward    │                        │
│                        │  Calculator │                        │
│                        └──────┬──────┘                        │
│                               │                               │
│                               ▼                               │
│                        ┌─────────────┐                        │
│                        │ acc_reward_ │◄─────────────────────┐ │
│                        │   per_share │                       │ │
│                        └─────────────┘                       │ │
│                                                             │ │
│                        ┌─────────────┐                        │ │
│                        │    User     │───────────────────────┘ │
│                        │  Claims &   │                         │
│                        │  Withdraws  │                         │
│                        └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Your Benefits

| Feature                          | Description                    |
| :------------------------------- | :----------------------------- |
| 📊 **65.25% of All Interest**    | Largest revenue share          |
| 🔄 **Auto-Compounding**          | Rewards auto-add to your stake |
| ⏰ **No Lock-up**                | Withdraw anytime               |
| 🛡️ **Protected by Capital Pool** | 10% buffer for bad debt        |
| 📈 **Sustainable Yield**         | Real yield from actual lending |

---

## 🤖 KEEPERS (Priority #3) 🔧

You keep the system running smoothly and earn fees for your service.

### Your Roles

```
┌─────────────────────────────────────────────────────┐
│              KEEPER RESPONSIBILITIES               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🤖 KEEPER A: TRIGGER BOT                         │
│  └── Identifies undercollateralized loans          │
│  └── Calls trigger_liquidation()                    │
│  └── Earns: 0.6% of collateral value               │
│                                                     │
│  🏪 KEEPER B: HUNTER BOT                           │
│  └── Monitors Pawn Shop for discounts               │
│  └── Buys assets at time-decay prices              │
│  └── Earns: Arbitrage profit (discount)            │
│                                                     │
│  ✨ KEEPER C: FINALIZE BOT                         │
│  └── Completes liquidation distribution            │
│  └── Ensures protocol solvency                      │
│  └── Earns: Fixed 1.0 USDC per finalize           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Keeper Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEEPER WORKFLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  KEEPER A (Trigger)                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                    │
│  │ Monitor │───►│  Check  │───►│Trigger  │                    │
│  │  Loans  │    │ Health  │    │Liquidate│                    │
│  └─────────┘    └─────────┘    └────┬────┘                    │
│                                    │                            │
│                                    ▼                            │
│                           ┌─────────────────┐                   │
│                           │  Loan → Pawn    │                   │
│                           │     Shop       │                   │
│                           └────────┬────────┘                   │
│                                    │                            │
│         ┌──────────────────────────┼──────────────────────────┐  │
│         ▼                          ▼                          ▼  │
│  KEEPER B (Hunter)          KEEPER B (Hunter)          KEEPER C (Finalize)  │
│  ┌─────────┐              ┌─────────┐              ┌─────────┐ │
│  │ Monitor │───► Discount──►│  Buy   │              │Complete │ │
│  │  Shop   │    │  Timer  │  Asset  │              │Distribution│ │
│  └─────────┘              └─────────┘              └────┬────┘ │
│                                                        │       │
│                                                        ▼       │
│                                               ┌────────────────┐│
│                                               │ Protocol       ││
│                                               │ Solvency       ││
│                                               └────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Keeper Fees

|  Keeper  | Action                | Reward             |
| :------: | :-------------------- | :----------------- |
| 🤖 **A** | Trigger Liquidation   | 0.6% of collateral |
| 🏪 **B** | Buy from Pawn Shop    | Discount profit    |
| ✨ **C** | Finalize Distribution | 1.0 USDC fixed     |

---

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE GINVA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                    ┌─────────────┐                          │
│                                    │  👤 BORROWER │                          │
│                                    │  Priority 1  │                          │
│                                    └──────┬──────┘                          │
│                                           │                                 │
│                   ┌───────────────────────┼───────────────────────┐         │
│                   │                       │                       │         │
│                   ▼                       ▼                       ▼         │
│            ┌────────────┐         ┌────────────┐         ┌────────────┐    │
│            │  💰 USDC  │         │ 🛡️Collateral│         │ 📅 Interest│    │
│            │   Supply   │         │   Locked   │         │  Accrues  │    │
│            └─────┬──────┘         └─────┬──────┘         └─────┬──────┘    │
│                  │                      │                      │           │
│                  ▼                      │                      ▼           │
│            ┌────────────┐              │              ┌────────────┐     │
│            │ 💰 INVESTOR │              │              │  📊 SYSTEM │     │
│            │  Priority 2 │              │              │  Calculates│     │
│            │  (Stakers) │              │              │   Rewards  │     │
│            └──────┬─────┘              │              └──────┬─────┘     │
│                   │                     │                     │            │
│                   │                     │                     ▼            │
│                   │                     │              ┌────────────┐     │
│                   │                     │              │  Revenue   │     │
│                   │                     │              │  Split     │     │
│                   │                     │              └──────┬─────┘     │
│                   │                     │                     │            │
│                   │                     │         ┌──────────┼──────────┐ │
│                   │                     │         ▼          ▼          ▼ │
│                   │                     │    ┌────────┐ ┌────────┐ ┌───────┐│
│                   │                     │    │Capital │ │  Ops   │ │Stakers││
│                   │                     │    │  10%   │ │24.75%  │ │65.25% ││
│                   │                     │    └────────┘ └────────┘ └───┬───┘│
│                   │                     │                            │     │
│                   │                     │                            ▼     │
│                   │                     │              ┌───────────────────┐ │
│                   │                     │              │  🤖 KEEPER C     │ │
│                   │                     │              │  Finalize        │ │
│                   │                     │              └─────────┬────────┘ │
│                   │                     │                        │          │
│                   │                     │                        ▼          │
│                   │                     │              ┌────────────────┐  │
│                   │                     │              │ Protocol        │  │
│                   │                     │              │ Solvency        │  │
│                   │                     │              └────────────────┘  │
│                   │                     │                                   │
│                   │                     ▼                                   │
│                   │              ┌─────────────┐                           │
│                   │              │ ⚠️ HEALTH  │                           │
│                   │              │   DROPS    │                           │
│                   │              └──────┬──────┘                           │
│                   │                     │                                  │
│                   │         ┌───────────┴───────────┐                      │
│                   │         ▼                       ▼                      │
│                   │  ┌─────────────┐        ┌─────────────┐                 │
│                   │  │🤖 KEEPER A │        │🏪 KEEPER B │                 │
│                   │  │  Trigger    │        │   Hunt     │                 │
│                   │  │Liquidation │        │   Pawn     │                 │
│                   │  └──────┬──────┘        │    Shop    │                 │
│                   │         │               └──────┬──────┘                 │
│                   │         │                      │                        │
│                   │         ▼                      ▼                        │
│                   │  ┌─────────────────────────────────────────────┐       │
│                   │  │           🏪 PAWN SHOP TIMELINE              │       │
│                   │  ├─────────────────────────────────────────────┤       │
│                   │  │  0-10 min │ ⚡ Golden Hour │ -8% discount  │       │
│                   │  │ 10-30 min │ 🥈 Silver     │ -6% discount  │       │
│                   │  │ 30-60 min │ 🥉 Bronze     │ -3% discount  │       │
│                   │  │  60+ min  │ 💀 Expired    │ DEX Fallback  │       │
│                   │  └─────────────────────────────────────────────┘       │
│                   │                                                    │
│                   └────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Protocol Statistics

| Metric                  | Value                  |
| :---------------------- | :--------------------- |
| **Borrower Protection** | 72-hour grace period   |
| **Staker Share**        | 65.25% of all interest |
| **Ops Share**           | 24.75% of all interest |
| **Capital Pool**        | 10% of all interest    |
| **Keeper A Reward**     | 0.6% of collateral     |
| **Keeper C Reward**     | 1.0 USDC fixed         |
| **Interest Interval**   | 30 days minimum        |
| **Oracle Freshness**    | 15 seconds max         |

---

## 🎯 Why GINVA?

| For              | Benefit                                |
| :--------------- | :------------------------------------- |
| **👤 Borrowers** | Fair liquidations, transparent pricing |
| **💰 Investors** | Sustainable 65.25% yield share         |
| **🤖 Keepers**   | Clear fee structure, passive income    |

```
┌─────────────────────────────────────────┐
│           GINVA VALUE PROPOSITION       │
├─────────────────────────────────────────┤
│                                         │
│   👤 BORROWERS                          │
│   ✅ No hidden liquidations              │
│   ✅ 72 hours to save collateral        │
│   ✅ Transparent time-decay pricing      │
│                                         │
│   💰 INVESTORS                          │
│   ✅ 65.25% of ALL protocol revenue     │
│   ✅ Auto-compounding rewards            │
│   ✅ No lock-up required                │
│                                         │
│   🤖 KEEPERS                           │
│   ✅ Clear fee structure                 │
│   ✅ Multiple revenue streams            │
│   ✅ Protocol-enforced incentives        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔗 Resources

- 📘 **Documentation:** [`docs/`](docs/)
- 🏗️ **Architecture:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 🔐 **Security:** [`docs/SECURITY.md`](docs/SECURITY.md)
- 💻 **Development:** [`DEVELOPMENT.md`](DEVELOPMENT.md)

---

> **GINVA is a marketplace, not a promise.**
> Risk is explicit. Pricing is transparent.
