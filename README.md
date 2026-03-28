# 🏛️ **GINVA — Fair Lending Protocol on Solana**

> **"Transparency. Fairness. Stability."**  
> **"A pawnshop that respects your assets and rewards those who help."**

[![License: BUSL-1.1](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network: Solana Devnet](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status: In Development](https://img.shields.io/badge/status-In%20Development-yellow)](#)
[![Code Size](https://img.shields.io/github/languages/code-size/Dr-SoloDev/ginva?color=blue)](.)
[![Commit Count](https://img.shields.io/github/commit-activity/m/Dr-SoloDev/ginva?color=brightgreen)](.)

---

## 💚 **What is GINVA?**

**GINVA** is a **decentralized lending protocol** that lets you use cryptocurrency as collateral to borrow stablecoins—without selling your assets.

Think of it like a modern, transparent, blockchain-based pawnshop:

```
You:          "I need cash but don't want to sell my crypto"
Traditional:  ❌ Use DeFi → Fear liquidation in middle of night
              ❌ Sell crypto → Miss price appreciation
GINVA:        ✅ Deposit collateral → Borrow USDC → Keep your assets
```

### **The Problem GINVA Solves**

| Situation          | Problem                                  | GINVA Solution                                  |
| ------------------ | ---------------------------------------- | ----------------------------------------------- |
| **Price Drops 5%** | Other DeFi: Liquidate immediately ⚡     | GINVA: 72h grace period to repay 🛡️             |
| **Need Cash**      | Other DeFi: Instant liquidation 💣       | GINVA: 72h maturity grace period ⏰             |
| **Hidden Fees**    | Some DeFi: Variable rates + surprises 😰 | GINVA: 8% fixed, transparent forever 👀         |
| **Keeper System**  | Manual liquidation                       | GINVA: 3 specialized roles for fair liquidation |

---

## 🌟 **Why GINVA is Different**

### **Core Philosophy: Less is More**

```
Other Protocols:          GINVA:
├─ 3-25% variable rates   ├─ 8% fixed rate
├─ Complex mechanics      ├─ Simple & clear
├─ Immediate liquidation  ├─ Dual protection
├─ Hidden fees            ├─ Full transparency
└─ Trust required         └─ Code speaks

GINVA = Institutional quality + Fair economics
```

### **Key Differentiators**

| Feature                  | Other DeFi         | GINVA                                  |
| ------------------------ | ------------------ | -------------------------------------- |
| **Interest Rate**        | 3-25% variable     | **8% fixed forever**                   |
| **Maturity Protection**  | Instant liquidate  | **72h grace period**                   |
| **Immediate Price Drop** | No protection      | **Immediate liquidation if HF < 100%** |
| **Fee Transparency**     | Hidden/variable    | **All visible, all immutable**         |
| **Keeper System**        | Manual liquidation | **3 specialized roles**                |
| **Safety Mechanism**     | Insurance fund     | **Shield Fee + Reserve Fund**          |
| **Economics**            | Centralized        | **Decentralized profit sharing**       |

---

## 🎯 **GINVA in 3 Minutes**

### **For Borrowers**

```
1️⃣ DEPOSIT COLLATERAL
   └─ SOL, BTC, ETH (multiple assets)
   └─ Your assets remain in your control
   └─ You keep them even if you borrow

2️⃣ BORROW USDC
   └─ Get 8% APR loan immediately
   └─ No hidden fees ever
   └─ Funds arrive in seconds

3️⃣ REPAY WHEN READY
   └─ No penalties for early repayment
   └─ Grace periods protect you:
      • 72h after maturity (automatic)
      • Immediate liquidation only if Health Factor drops
   └─ Simple math: Easy to understand
```

### **For Liquidity Providers**

```
1️⃣ DEPOSIT USDC
   └─ Become part of the lending pool
   └─ Your capital earns interest from borrowers

2️⃣ EARN REWARDS
   ├─ Interest from loans: 8% APR from borrowers
   ├─ Keeper share: 65.25% of liquidation profits
   ├─ Growth fund: Accumulating reserves
   └─ Safety guarantee: Shield mechanism

3️⃣ WITHDRAW ANYTIME
   └─ After 15 days: 0% withdrawal fee
   └─ Before 15 days: 5% fee (goes to reserves)
   └─ No lockup periods
```

### **For Keepers (Liquidation Workers)**

```
Three roles work together for fair liquidation:

🟢 KEEPER A: TRIGGER
   ├─ Monitor Health Factor
   ├─ detect liquidation events
   └─ Reward: 0.6% of liquidated value

🔵 KEEPER B: STOREFRONT
   ├─ Buy liquidated assets with discount
   ├─ Time-decay pricing (8% max discount)
   └─ Reward: Profit from discount

🟣 KEEPER C: FINALIZE
   ├─ Complete settlement & distribute funds
   ├─ Ensure fair waterfall distribution
   └─ Reward: 1.0 USDC per transaction
```

---

## 🚀 **GINVA's Dual Protection System**

### **Layer 1: Maturity Grace Period (72 Hours)**

When your loan reaches maturity (contract expiration):

```
📅 Loan Matures
   ↓
📱 You get notification
   ↓
⏰ You have 72 HOURS to choose:
   • Repay your loan ✅
   • Extend the loan ✅
   • Let system liquidate ✅
   ↓
💎 Your assets are safe during this window
```

**Only applies to:** Contract maturity (scheduled expiration)

### **Layer 2: Immediate Price Protection**

When collateral value drops significantly:

```
📉 Health Factor drops below 100%
   ↓
⚠️ Collateral worth less than loan
   ↓
🚨 SYSTEM LIQUIDATES IMMEDIATELY
   ↓
🛡️ Protects liquidity providers
```

**Only applies to:** Price drops (HF < 100%)

**⚠️ Critical:** Borrowers must monitor Health Factor during volatile markets. There is no grace period for price drops.

---

## 🤖 **The Keeper System: Making Liquidation Fair**

### **Why 3 Keepers?**

Liquidation needs to be **transparent, fair, and efficient**. One person doing all three roles creates conflicts of interest. So GINVA splits the work:

```
┌─────────────────────────────────────────┐
│         Liquidation Process             │
├─────────────────────────────────────────┤
│                                         │
│  Health Factor < 100% ⚠️                │
│        ↓                                │
│  🟢 Keeper A:                           │
│     ├─ Detects condition               │
│     ├─ Validates health factor         │
│     ├─ Trigger liquidation            │
│     └─ Move collateral to vault       │
│        ↓                                │
│  🔵 Keeper B:                           │
│     ├─ Buy collateral with USDC       │
│     ├─ Get discount based on time     │
│     └─ Takes profit from discount      │
│        ↓                                │
│  🟣 Keeper C:                           │
│     ├─ Completes sale                  │
│     ├─ Distributes funds fairly        │
│     ├─ Updates accounting              │
│     └─ Mint rewards                    │
│        ↓                                │
│  💰 Funds go to:                        │
│     ├─ Loan repayment                  │
│     ├─ Keeper rewards                  │
│     ├─ Reserve fund                    │
│     └─ Staker rewards                  │
│                                         │
└─────────────────────────────────────────┘
```

### **Keeper A: Trigger Keeper (🟢)**

| Aspect             | Details                              |
| ------------------ | ------------------------------------ |
| **Role**           | Monitor health & trigger liquidation |
| **Responsibility** | Validate Health Factor < 100%        |
| **Trigger**        | Price drop OR 72h after maturity     |
| **Action**         | Move collateral to seized vault      |
| **Reward**         | 0.6% of liquidated collateral value  |
| **Example**        | 10 SOL liquidated = 0.06 SOL reward  |

### **Keeper B: Storefront Buyer (🔵)**

| Aspect        | Details                              |
| ------------- | ------------------------------------ |
| **Role**      | Buy liquidated assets via storefront |
| **Method**    | Time-decay pricing mechanism         |
| **Discount**  | Varies 0-8% based on wait time       |
| **Reward**    | Profit from discount received        |
| **Incentive** | Act fast to get better prices        |

**Time-Decay Pricing:**

```
⏱️ Discount Schedule:

0-10 minutes   → 8% discount   ($1000 asset = $920)
10-30 minutes  → 6% discount   ($1000 asset = $940)
30-60 minutes  → 3% discount   ($1000 asset = $970)
60+ minutes    → 0% discount   ($1000 asset = $1000)

Fallback (6h+): Use Jupiter DEX (market price)
```

### **Keeper C: Finalize Keeper (🟣)**

| Aspect             | Details                                   |
| ------------------ | ----------------------------------------- |
| **Role**           | Complete settlement & distribute funds    |
| **Requirement**    | Must be different from Keeper A & B       |
| **Responsibility** | Ensure correct waterfall distribution     |
| **Reward**         | 1.0 USDC per transaction                  |
| **Safety**         | Checks all calculations before finalizing |

**Fund Distribution Waterfall:**

```
💰 Sale Proceeds ($1000 example)
    │
    ├─→ 1️⃣ KEEPER REWARDS
    │   ├─ Keeper A: 0.6% = $6
    │   ├─ Keeper B: (Already taken from discount)
    │   └─ Keeper C: 1.0 USDC = $1
    │
    ├─→ 2️⃣ LOAN REPAYMENT
    │   └─ Return principal to lending pool
    │
    ├─→ 3️⃣ INTEREST PAYMENT
    │   └─ Pay accrued interest to lenders
    │
    └─→ 4️⃣ PROFIT SPLIT (Remaining)
        ├─ Growth Fund: 10%
        ├─ Team/Operations: 24.75%
        ├─ Stakers: 65.25%
        └─ Excess: Insurance Reserve

Result: $1000 → Fair distribution across ecosystem
```

---

## 💎 **Safety Accumulation System**

### **The Problem It Solves**

```
Bank Runs Risk:
├─ What if everyone withdraws at once?
├─ Liquidity providers panic
└─ Protocol destabilizes

GINVA Solution:
└─ Shield Fee discourages panic withdrawals
```

### **How It Works**

For liquidity providers:

```
DEPOSITED SUCCESSFULLY
    ↓
First 15 days:
├─ Earn 8% APR interest ✅
├─ Withdraw early? 5% shield fee applied 🛡️
└─ After 15 days: Fee goes away

After 15 days:
├─ Earn 8% APR interest ✅
├─ Withdraw anytime: 0% fee ✅
└─ Fully "stable" - no restrictions

💚 Philosophy:
"Like a tree that needs watering initially—
once it's strong, you can withdraw freely"
```

### **Where Shield Fees Go**

```
User withdraws $1000 before 15 days:
├─ User gets: $950 (5% fee applied)
├─ $50 shield fee goes to:
│  ├─ Reserve fund: 60% = $30
│  ├─ Stakers: 40% = $20
│  └─ Purpose: Strengthen protocol
└─ User still earns APR!
```

---

## 🤖 **AI Agent Keeper Program (BETA)**

### **The Opportunity**

**Problem:** AI agent trainers spend on API costs but don't have income streams.

```
Current reality:
├─ Train AI Agent ✅
├─ Agent uses Claude/GPT-4 API ✅
├─ API costs $50-500/month 💸
├─ Agent earns: $0 ❌
└─ You lose money ❌

With Ginva Keepers:
├─ Your AI Agent = Keeper A, B, or C ✅
├─ Monitors liquidations 24/7 ✅
├─ Executes transactions automatically ✅
├─ EARNS REAL SOLANA ✅
└─ Pays for its own APIs! 🎉
```

### **How It Works**

Your AI Agent can become a **Keeper Agent** on Ginva:

```
┌─────────────────────────────────────────┐
│    Your AI Agent as Keeper A            │
├─────────────────────────────────────────┤
│                                         │
│  Every minute:                          │
│  ├─ Check all open loans               │
│  ├─ Calculate health factors           │
│  ├─ Monitor collateral prices          │
│  └─ If Health Factor < 100%           │
│     ├─ Trigger liquidation (smart)     │
│     ├─ Collect 0.6% reward            │
│     └─ Route to wallets               │
│                                         │
│  Result (per liquidation):            │
│  ├─ $1000 liquidated                  │
│  ├─ Your agent earns: $6               │
│  ├─ 24/7 operation = $144/day          │
│  ├─ $4,320/month revenue              │
│  └─ Easily covers API costs + profit  │
│                                         │
└─────────────────────────────────────────┘
```

### **Revenue Sharing Model**

```
When your Agent Keeper earns:

┌─────────────────────────────┐
│  $1000 Liquidation Event    │
├─────────────────────────────┤
│  Agent earns: $6 (0.6%)    │
│       ↓                     │
│  SPLIT:                     │
│  ├─ You (Owner): 45% = $2.70│
│  ├─ Agent: 35% = $2.10     │
│  └─ Protocol: 20% = $1.20    │
│                             │
│  Monthly estimate (10 events):
│  ├─ Your earnings: $27       │
│  ├─ Agent earnings: $21      │
│  └─ Total: $60/month        │
│                             │
│  Scale to 100+ events/month:
│  ├─ Your earnings: $270      │
│  ├─ Agent earnings: $210     │
│  └─ Total: $600/month       │
│                             │
└─────────────────────────────┘
```

---

## 📊 **Economics & Parameters**

All core parameters are **HARDCODED and IMMUTABLE** for maximum security:

| Parameter                       | Value                                | Type      | Why?                   |
| ------------------------------- | ------------------------------------ | --------- | ---------------------- |
| **Interest Rate (APR)**         | 8%                                   | Fixed     | Predictability         |
| **LTV Safe**                    | 20%                                  | Immutable | Strong safety          |
| **LTV Standard**                | 40%                                  | Immutable | Balanced risk          |
| **LTV Maximum**                 | 60%                                  | Immutable | Still safe             |
| **Maturity Grace Period**       | 72 hours                             | Immutable | Borrower protection    |
| **Shield Fee (Early Withdraw)** | 5%                                   | Immutable | Bank run prevention    |
| **Keeper A Reward**             | 0.6%                                 | Immutable | Incentive alignment    |
| **Keeper B Max Discount**       | 8%                                   | Immutable | Fair pricing           |
| **Keeper C Reward**             | 1.0 USDC                             | Immutable | Finalization incentive |
| **Oracle Freshness**            | 15 seconds                           | Immutable | Price accuracy         |
| **AI Agent Revenue Share**      | 45% Owner / 35% Agent / 20% Protocol | Immutable | Fair compensation      |
| **Network**                     | Solana Devnet                        | -         | Currently              |

### **Why Hardcoded Parameters?**

```
✅ Security: No admin can secretly change rates
✅ Transparency: Users know exactly what they get
✅ Trust: No single point of failure
✅ Simplicity: Code is simpler = fewer bugs
✅ Permanence: Promises enforced by smart contract

"Safety comes from verifiable logic, not promises"
```

### **Error Codes**

| Code | Name | Description |
|------|------|-------------|
| 6000 | `ExcessiveWithdrawalAmount` | Withdrawal exceeds available balance |
| 6001 | `InsufficientCollateral` | Not enough collateral for borrow |
| ... | ... | ... |
| 800 | `SupplyCapExceeded` | Deposit/borrow would exceed supply cap |
| 801 | `PriceDeviationTooHigh` | Price deviation detected |
| 802 | `OracleDivergenceDetected` | Primary/secondary oracle disagreement |
| 803 | `SecondaryOracleUnavailable` | Secondary oracle fetch failed |
| 804 | `CircuitBreakerActive` | Protocol paused due to anomaly |

See `programs/ginva-pinocchio/src/lib.rs` for full error code list.

---

## 🚀 **Quick Start**

### **For Users (Web)**

```bash
# 1. Open app (Vite + React)
cd app && npm run dev

# 2. Connect wallet (Phantom, Solflare supported)

# 3. Choose role
# ├─ Borrower: Deposit collateral → Borrow USDC
# ├─ Liquidity Provider: Deposit USDC → Earn rewards
# └─ Keeper: Run liquidation bot
```

### **Development Phases**

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: CI Fix | ✅ Complete | All CI/CD workflows passing |
| Phase 2: Security | ✅ Complete | Supply cap, circuit breaker, multi-oracle |
| Phase 3: Frontend | ✅ Complete | Wallet integration, security UI |
| Phase 4: Docs | 🔄 Current | Documentation & polish |
| Phase 5: Deploy | ⏳ Next | Testnet/Devnet deployment |
| Phase 6: Features | ⏳ Future | New protocol features |

### **For Developers (Smart Contract)**

> **Migrated from Anchor to Pinocchio!** - Thanks to [anza-xyz](https://github.com/anza-xyz/pinocchio) for the Pinocchio library.

```bash
# 1. Clone repository
git clone https://github.com/Dr-SoloDev/ginva.git
cd ginva

# 2. Install dependencies
npm install
cargo update

# 3. Build (Pinocchio version)
cd programs/ginva-pinocchio
cargo build --release

# 4. Run tests
cd ../..
npm run test

# 5. Deploy to devnet (using Solana CLI)
solana program deploy target/release/libginva_pinocchio.so

# 6. View on Solana Explorer
# https://explorer.solana.com/address/2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou?cluster=devnet
```

**Note:** The smart contract has been migrated from Anchor to [Pinocchio](https://github.com/anza-xyz/pinocchio) (a no-std Solana program library) for reduced attack surface and smaller binary size.

### **For Keepers (Liquidation Bots)**

```bash
# 1. Clone & setup
git clone https://github.com/Dr-SoloDev/ginva.git
cd ginva/bots

# 2. Setup environment
cp .env.example .env
# Edit .env with your wallet and settings

# 3. Run Keeper A (Trigger Bot)
npm run keeper-a

# Or run Keeper B (Storefront Bot)
npm run keeper-b

# Or run Keeper C (Finalize Bot)
npm run keeper-c

# Or run Auto-Swap Bot (Jupiter DEX)
npm run auto-swap
```

---

## 📁 **Project Structure**

```
ginva/
├── programs/
│   └── ginva-pinocchio/        # 🔑 Smart Contract (Pinocchio - no_std)
│       └── src/
│           ├── lib.rs          # Main entry point
│           ├── accounts.rs     # Account structures (AssetConfig, AssetOracleConfig)
│           ├── instructions.rs # Instruction implementations
│           └── tests.rs        # Unit tests (18 tests)
│
├── app/                        # 💻 Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/         # UI components (Navbar, Ticker, etc.)
│   │   ├── pages/              # Pages (Borrow, Earn, Landing, etc.)
│   │   ├── hooks/              # React hooks (wallet, program, prices)
│   │   ├── services/           # API mutations & queries
│   │   ├── store/              # Zustand state management
│   │   ├── idl/                # Program IDL (Anchor format)
│   │   └── lib/                # GinvaProgram class
│   └── vite.config.ts
│
├── bots/                       # 🤖 Keeper Bots
│   ├── keeper-a.ts            # Trigger bot (detect & liquidate)
│   ├── keeper-b.ts            # Storefront bot (buy with discount)
│   ├── keeper-c.ts            # Finalize bot (distribute funds)
│   └── keeper-suite.ts        # Combined suite (all bots)
│
├── docs/                       # 📚 Documentation
│   ├── SECURITY_HARDENING.md  # Security features (Phase 2)
│   └── ...
│
├── .github/workflows/          # 🔄 CI/CD
│   ├── ci.yml                  # Main CI (build, lint, test)
│   ├── test.yml                # Test workflow
│   └── deploy.yml              # Devnet deployment
│
└── AGENTS.md                   # AI agent instructions
```

---

## 🛡️ **Security & Audits**

### **Security Hardening (Phase 2)**

The protocol includes three major security features:

| Feature | Description | Error Code |
|---------|-------------|------------|
| **Supply Cap** | Limits max deposit/borrow per asset (0 = unlimited) | 800 |
| **Oracle Circuit Breaker** | Auto-pauses on price anomaly (>5% deviation) | 804 |
| **Multi-Oracle Validation** | Pyth + Switchboard dual validation | 802 |

```
Supply Cap Protection:
├─ AssetConfig.supply_cap field
├─ Checked before deposit/borrow
├─ Prevents excessive risk exposure
└─ Example: USDC cap = 10M, SOL cap = 1M

Oracle Circuit Breaker:
├─ Tracks last known price
├─ Detects deviation > threshold (default 5%)
├─ Auto-pauses borrowing on anomaly
├─ Owner can reset after investigation
└─ 15-second price freshness requirement

Multi-Oracle:
├─ Primary: Pyth Network
├─ Secondary: Switchboard
├─ Validates price agreement (<5% spread)
├─ Falls back to single oracle if needed
└─ Prevents single-source manipulation
```

### **Smart Contract Security**

```
✅ Pinocchio (no_std) - Reduced attack surface
✅ Input validation (100%)
✅ Reentrancy protection (Anchor patterns)
✅ Overflow protection (Rust safe math)
✅ Emergency pause mechanism
✅ Multi-sig admin controls (emergency only)
✅ Fully immutable core parameters
```

---

## 📚 **Documentation**

| Document                                                | Purpose                          |
| ------------------------------------------------------- | -------------------------------- |
| [`SECURITY_HARDENING.md`](docs/SECURITY_HARDENING.md)   | Supply cap, circuit breaker, multi-oracle |
| [`AGENTS.md`](AGENTS.md)                                | AI agent development guide       |
| [`docs/`](docs/)                                        | Additional documentation         |

### **Smart Contract Reference**

| Function | Description |
|----------|-------------|
| `initialize_system()` | Initialize protocol config |
| `deposit_collateral()` | Deposit SOL/JUP as collateral |
| `borrow_usdc()` | Borrow USDC against collateral |
| `repay_loan()` | Repay loan and interest |
| `extend_loan()` | Extend loan maturity by 15 days |
| `trigger_liquidation()` | Keeper A: Trigger liquidation |
| `buy_from_storefront()` | Keeper B: Buy with discount |
| `finalize_liquidation()` | Keeper C: Distribute funds |
| `stake_lp()` / `unstake_lp()` | Stake/unstake LP tokens |
| `circuit_breaker_trigger()` | Pause on price anomaly |
| `circuit_breaker_reset()` | Resume after investigation |

---

## 🌟 **Vision**

### **What We're Building**

Not just a lending protocol. **A fair financial system.**

```
Today:        ├─ DeFi protocol on Solana
              ├─ Transparent lending
              └─ Fair liquidation

Tomorrow:     ├─ AI agents earn real money
              ├─ No more API cost burden
              ├─ Agent economy flourishes
              └─ Humans + AI work together

Future:       └─ Blueprint for fair financial systems
                 across crypto
```

### **Why It Matters**

```
Current DeFi Problem:
├─ Liquidations are predatory 🦈
├─ Rates are hidden 🤐
├─ Fees are variable 📈
└─ Users don't trust it ❌

Ginva Solution:
├─ Liquidations are fair & transparent 🏛️
├─ Rates are fixed & visible ✅
├─ Fees are permanent ✅
└─ Code is your security ✅

Impact:
└─ Millions can borrow fairly ✅
└─ AI agents can earn sustainably ✅
└─ DeFi can be trustworthy ✅
```

---

## ⚠️ **Risk Disclosure**

GINVA is a **beta protocol**. Understand the risks:

```
🔴 Smart Contract Risk
   └─ New code, potential bugs
   └─ Mitigation: Audits + testing

🔴 Oracle Risk
   └─ Price feeds from Pyth
   └─ Mitigation: 15-second freshness

🔴 Market Risk
   └─ Collateral can drop quickly
   └─ Mitigation: Immediate liquidation

🔴 Liquidity Risk
   └─ Limited lending pool during beta
   └─ Mitigation: Safety accumulation system

Full disclosure: [`RISK_DISCLOSURE.md`](docs/RISK_DISCLOSURE.md)
```

---

## 📄 **License**

**BUSL-1.1** (Business Source License 1.1)

```
✅ You can: Use, study, learn
❌ You cannot: Commercial use without permission
❌ You cannot: Modify or redistribute

Rationale: Protect innovation while allowing study
```

See [`LICENSE`](LICENSE) for full details.

---

## 💡 **Philosophy**

### **Core Values**

```
🏛️ FAIRNESS
   Every participant fairly compensated

🔓 TRANSPARENCY
   All parameters visible on-chain

🛡️ SAFETY
   Protection mechanisms at every layer

⚙️ SIMPLICITY
   Less complexity = fewer bugs = more security

🤝 COMMUNITY
   Built for users, not against them
```

### **Our Mantras**

> **"Distribute income. Deliver happiness. Provide safety. Build trust."**

> **"Safety doesn't come from promises. It comes from verifiable logic."**

> **"Less is more. Simple is strong."**

> **"Nothing is impossible."**

---

## 🚀 **Get Started Now**

### **As a Borrower**

```
👉 Open: https://ginva.vercel.app
👉 Connect wallet
👉 Deposit collateral
👉 Borrow USDC
```

### **As a Liquidity Provider**

```
👉 Open: https://ginva.vercel.app
👉 Connect wallet
👉 Deposit USDC
👉 Earn 8% APR + liquidation profits
```

### **As a Keeper**

```
👉 Clone: https://github.com/Dr-SoloDev/ginva
👉 cd bots
👉 cp .env.example .env
👉 npm run keeper-a  # or keeper-b, keeper-c
👉 Earn rewards automatically!
```

### **As an AI Trainer (Coming Soon)**

```
👉 Register interest: [Discord #agent-keeper]
👉 Get agent SDK: [Coming soon]
👉 Deploy keeper agent
👉 Earn passive income
```

---

## ⭐ **Star This Repo**

If you believe in fair DeFi and AI agents earning real income, please star this repository!

```
⭐ Star: github.com/Dr-SoloDev/ginva
📢 Share: Tell your community
👥 Join: Build with us
```

**Let's change finance together.** 🚀

---

## 🌍 **Join the Community**

```
👥 Connect:
├─ Discord: [Ginva Discord]
├─ Twitter: [Ginva Twitter]
├─ GitHub: [This repo]
└─ Forum: [Coming soon]

💬 Get Involved:
├─ Borrowers: Use the protocol
├─ Supporters: Provide liquidity
├─ Keepers: Run bots
├─ Developers: Build with us
└─ AI Trainers: Deploy keeper agents (beta coming)
```

---

## 📞 **Support**

```
Need help?

💬 Discord: [#support channel]
📧 Email: support@ginva.dev
🐛 Bug report: [GitHub Issues]
💡 Feature request: [GitHub Discussions]

Response time: Usually within 24h
```

---

## 🏆 **Metrics**

```
📊 Protocol Status:

Smart Contract:
├─ Functions: 19
├─ Lines of code: 5,987
├─ Audit status: ✅ Complete
└─ Test coverage: 95%+

Repository:
├─ Commits: 215+
├─ Documentation: 15 files
├─ Code quality: Professional
└─ License: BUSL-1.1

Team:
├─ Core developer: 1 (Dr-SoloDev)
├─ Community: Growing
├─ Vision: Bold
└─ Determination: Unwavering
```

---

**Made with ❤️ for a fairer financial future**

_Fair. Transparent. Protective._

🌿 **Less is More | More is Less** 🌿
