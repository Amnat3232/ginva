# GINVA System Architecture

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust"** > **"Safety doesn't come from promises, it comes from verifiable logic"**

## Overview

GINVA is a cryptocurrency-backed lending platform built on Solana with **2 independent protection layers**:

1. **Maturity Grace Period** - 72-hour grace period after maturity
2. **Immediate Price Protection** - Liquidate immediately when HF < 100%

---

## 🌳 3 Pillars of the Ecosystem

### 1. Borrowers: The Heart of the Protocol 💚

> **"Provide Safety"**

**Role:** The center that drives everything

**What borrowers can do:**

- Deposit collateral (SOL, BTC, ETH)
- Borrow USDC immediately
- Monitor account health
- Extend or repay loan

**Key Feature:** 2-Layer Protection System

- **Maturity Grace Period:** 72 hours after maturity (contract expiration only)
- **Immediate Price Protection:** Liquidate immediately when Health Factor < 100%

> ⚠️ **Warning:** Borrowers must monitor Health Factor at all times. In volatile markets, the system may liquidate immediately without 72-hour notice.

---

### 2. Supporters: The Lifeblood of the Ecosystem 🌿

> **"Distribute Income"**

**Role:** Supply liquidity (blood) to nourish every part. Without it, the system will wither.

**What supporters do:**

- Stake USDC to support the platform
- Receive 65.25% of all protocol revenue
- Help maintain system stability

**Benefits:** Auto-compounding rewards, no lock-up

---

### 3. Helpers: Guardians of System Stability 🛡️

> **"Build Trust"**

**Role:** Monitor and ensure promises are fulfilled

**Helper Network:**

- **Helper A:** Checker and notifier (reward 0.6%)
- **Helper B:** Liquidity supporter (opportunity to buy at special price)
- **Helper C:** Operator (reward 1.0 USDC)

---

## 🎬 Dual Protection System

### Layer 1: Maturity Grace Period (72 hours after maturity)

```
┌─────────────────────────────────────────────────────────────┐
│       Maturity Grace Period (72 hours)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎭 ACT 1: The Awakening                                    │
│          │                                                  │
│          ▼                                                  │
│  Contract Matures 📅                                        │
│          │                                                  │
│          ▼                                                  │
│  🔔 Advance Notification (72 hours before)                 │
│          • System notifies borrower                        │
│          • Borrower has options:                           │
│            - Add collateral                                │
│            - Repay partial                                  │
│            - Extend contract                                │
│            - Wait and see                                  │
│          │                                                  │
│          ▼                                                  │
│  🎭 ACT 2: The Response                                    │
│          ▼                                                  │
│  ⏰ Protection Period (72 hours)                            │
│          • Assets are safe                                 │
│          • Borrower has time to act                        │
│          • Helper A monitors                               │
│          │                                                  │
│          ▼                                                  │
│  🤝 Assistance Phase                                       │
│          • Helper B provides liquidity                     │
│          • Fair pricing by time:                          │
│            - 0-10 minutes: 8% discount                    │
│            - 10-30 minutes: 6% discount                   │
│            - 30-60 minutes: 3% discount                    │
│            - 60+ minutes: market price                    │
│          │                                                  │
│          ▼                                                  │
│  🎭 ACT 3: The Resolution                                 │
│          ▼                                                  │
│  ✨ Process Complete                                       │
│          • Helper C executes                               │
│          • Distribute income                               │
│          • Excess goes to reserve fund (insurance)         │
│                                                             │
│  🎯 Result: From Panic to Peace of Mind                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Used for:** `liquidate_by_maturity` function - maturity case only

---

### Layer 2: Immediate Price Protection (No grace period)

```
┌─────────────────────────────────────────────────────────────┐
│        Immediate Price Protection (no grace period)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Trigger Conditions:                                   │
│     Health Factor < 100%                                   │
│                                                             │
│  📉 Calculation:                                          │
│     HF = (Collateral Value × LTV) / Borrow Amount          │
│                                                             │
│  🔥 Common Scenarios:                                     │
│     - Volatile markets (Flash Crash)                       │
│     - Collateral value drops suddenly                     │
│     - Borrower not monitoring situation                   │
│                                                             │
│  ⚡ Result:                                                │
│     - Immediate liquidation                                │
│     - No 72-hour grace period                              │
│     - Protects investor capital                            │
│     - No bad debt                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Used for:** `liquidate_by_health_factor` function - critical collateral price case

> 🚨 **Important Warning:** This system works **immediately** without 72-hour notice. Borrowers must maintain Health Factor above 100% at all times.
> ┌─────────────────────────────────────────────────────────────┐
> │ 🎬 72-Hour Protection System │
> ├─────────────────────────────────────────────────────────────┤
> │ │
> │ 🎭 ACT 1: The Awakening │ │
> │ ▼ │ │ Collateral Value Drops │ │ ▼ │ │ 🔔 Advance Warning (72 hours before) │ │ • System notifies borrower │ │ • Borrower has options: │ │ - Add collateral │ │ - Repay partial │ │ - Wait and see │ │ │ ▼ │ │ 🎭 ACT 2: The Response │ │ ▼ │ │ ⏰ Protection Period (72 hours) │ │ • Assets are safe │ │ • Borrower has time to act │ │ • Helper A monitors │ │ │ ▼ │ │ 🤝 Assistance Phase │ │ • Helper B provides liquidity │ │ • Fair pricing by time: │ │ - 0-10 minutes: 8% discount │ │ - 10-30 minutes: 6% discount │ │ - 30-60 minutes: 3% discount │ │ - 60+ minutes: market price │ │ │ ▼ │ │ 🎭 ACT 3: The Resolution │ │ ▼ │ │ ✨ Process Complete │ │ • Helper C executes │ │ • Distribute income │ │ • Excess goes to reserve fund (insurance) │ │ │ │ 🎯 Result: From Panic to Peace of Mind │ │ │ └─────────────────────────────────────────────────────────────┘

---

## 💰 Revenue Distribution: "Distribute Income" Philosophy

```
All Interest Revenue
│
├── 65.25% → Supporters (Lifeblood)
│
├── 24.75% → Operations Team (Trunk)
│
└── 10% → Liquidity Fund (Roots)

```

**Fair Sharing:** Reward supporters while protecting the system

**Excess Allocation:** 100% to Reserve Fund (Risk Insurance)

---

## 🛡️ Key Security Features

1. **Reentrancy Guards** - Prevent repeat attacks
2. **Flash Loan Protection** - Minimum 5-minute hold period
3. **Emergency Stop** - Timelock protected
4. **Rate Limiting** - Transaction rate limit per user
5. **Oracle Validation** - Price data max 15 seconds stale
6. **Multi-Asset Support** - Separate LTV per asset

---

## Technical Stack

### Smart Contract

- **Language:** Rust
- **Framework:** Anchor 0.29.0
- **Oracle:** Pyth Network
- **Blockchain:** Solana

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Bootstrap
- **Wallet:** Solana Wallet Adapter

### Testing

- **Integration Tests:** TypeScript
- **Network:** Solana Devnet
- **Coverage:** Comprehensive liquidation flows

---

## 🚀 Why This Architecture?

### Concept Comparison

**Traditional DeFi:** Immediate help → Borrower loses everything instantly

**GINVA:** 72-hour protection → Borrower has time to save assets

### Our Principles

1. **Protecting borrowers** comes before speed
2. **Fair opportunities** come before efficiency
3. **Ecosystem sustainability** comes before short-term profit

---

## 🚀 Deployment

- **Network:** Solana Devnet
- **Program ID:** `2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou`
- **Version:** 2.0.0
- **Status:** Actively testing

---

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust"**
>
> _Architecture designed with borrower heart, driven by supporters, guarded by helpers_
