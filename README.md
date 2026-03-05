# 🏛️ GINVA — Digital Asset Pawnshop

<div align="center">
  <img src="app/public/images/logos/ginva-logo.png" alt="GINVA Logo" width="300" />
</div>

> **"8% Fixed APR — No Surprises"**  
> **"Transparent. Verifiable. Institutional Standard."**

[![License](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com/Dr-SoloDev/ginva)

**GINVA** is a cryptocurrency-backed lending platform designed for **real borrowers**.

> _"We don't compete on the lowest interest rate. We compete on the highest transparency."_

[🚀 Quick Start](#quick-start) | [📖 Documentation](docs/ARCHITECTURE.md) | [🛡️ Security](docs/SECURITY.md)

---

## 💚 Why GINVA?

### 😰 The Problem You've Faced

**Before GINVA:** You have crypto but need cash fast

- Selling crypto → Missing out on price appreciation
- Borrowing from DeFi → Fear of liquidation at midnight

### ✨ Our Solution

**With GINVA:** Use crypto as collateral, get cash, keep your assets

- Get cash immediately without selling crypto
- Fixed 8% interest rate — no hidden fees
- **Maturity Grace Period:** 72 hours after maturity (contract expiration only)
- **Immediate Price Protection:** Liquidate immediately when Health Factor < 100% (protects investor capital)

---

## 🌟 What Makes Us Different

| Other Platforms           | GINVA                                         |
| ------------------------- | --------------------------------------------- |
| 3-25% Interest (variable) | **8% Fixed for entire loan**                  |
| Immediate liquidation     | **Dual Protection System**                    |
| Complex & confusing       | **Transparent & verifiable**                  |
| No safety accumulation    | **Shield Fee 5% if withdrawn before 15 days** |

> **"Less but More"** — Simple yet invaluable

---

## 🛡️ Safety Accumulation System

> **"Accumulate stability together, create safety"**

For Liquidity Providers:

| Status            | Duration  | Fee                      |
| ----------------- | --------- | ------------------------ |
| ✅ Stable         | Unlimited | **0%**                   |
| ✅ Accumulated    | ≥15 days  | **0%**                   |
| ⚠️ Early Withdraw | <15 days  | **5%** (to reserve fund) |

**Like a tree that needs watering at first** — once strong, you can withdraw without conditions

[📖 Read Details](docs/SAFETY_ACCUMULATION.md)

---

## 🚀 Quick Start

### 📱 Mobile Install (PWA)

**iOS (Safari):**

1. Open https://ginva.vercel.app
2. Tap **Share** button (□↗)
3. Scroll down → **Add to Home Screen**
4. Tap **Add**

**Android (Chrome):**

1. Open https://ginva.vercel.app
2. Tap **Menu** button (3 dots top right)
3. Select **Install App** or **Add to Home Screen**
4. Tap **Install**

---

### 3 Simple Steps

```
1️⃣ Deposit Collateral (SOL, BTC, ETH)
   └─> Assets remain yours

2️⃣ Borrow USDC immediately
   └─> 8% APR — no hidden fees

3️⃣ Repay when ready
   └─> No penalties, no locks
```

**[👉 Full User Guide](docs/ARCHITECTURE.md)**

---

## 🛡️ Dual Protection System

### Layer 1: Maturity Grace Period

```
Contract Matures 📅
    ↓
Instant Notification 📱
    ↓
You have 72 hours 🕐
    ↓
Choose: Repay / Extend / Wait
    ↓
Assets Still Intact 💎
```

> **Applies to:** Contract maturity only

---

### Layer 2: Immediate Price Protection

```
Health Factor < 100% ⚠️
    ↓
System Liquidates Immediately 🚨
    ↓
Protects Investor Capital 🛡️
    ↓
No Bad Debt ✅
```

> **Applies to:** Collateral value falls below loan value to prevent bad debt

---

### ⚠️ Important Warning

**The Immediate Price Protection system works instantly without the 72-hour grace period** when:

- Collateral value decreases until Health Factor < 100%
- System must protect investor (supporter) capital

**Borrowers must monitor Health Factor at all times, especially during volatile markets**

---

---

## 📊 Verified Parameters

| Parameter                 | Value (from Smart Contract)  |
| ------------------------- | ---------------------------- |
| **Interest Rate**         | 8% APR (fixed)               |
| **Maturity Grace Period** | 72 hours (259,200 seconds)   |
| **Price Protection**      | Immediate (HF < 100%)        |
| **LTV Safe**              | 20% (fixed)                  |
| **LTV Standard**          | 40% (fixed)                  |
| **LTV Max**               | 60% (fixed)                  |
| **Shield Fee**            | 5% (withdraw before 15 days) |
| **Oracle**                | Pyth Network (15s stale)     |
| **Network**               | Solana Devnet                |
| **License**               | BUSL-1.1                     |

> **Note:** All parameters above are **HARDCODED** and **IMMUTABLE** - cannot be changed after deployment. To modify any parameter, a new version of the contract must be deployed.

---

## 🌳 Our Ecosystem

GINVA grows from **3 pillars**:

```
          🍎 Success
              │
    ┌───────┼───────┐
    │       │       │
 🌿 Supporters  🪵 Borrowers  🌱 Helpers
 (Liquidity)   (Heart)      (Guardians)
    │       │       │
    └───────┴───────┘
            │
     🛡️ 72h Protection
```

**Every part is equally important**

---

## 🤖 Keepers — System Guardians

> **"3 Roles that make the system work efficiently and transparently"**

GINVA has **3 Keepers** working together to make the borrow-liquidate-sell system work smoothly:

---

### 🟢 Keeper A: Trigger Keeper

| Detail       | Data                                                    |
| ------------ | ------------------------------------------------------- |
| **Role**     | Check contract health and initiate liquidation          |
| **Triggers** | Health Factor < 100% (price drop) or 72h after maturity |
| **Reward**   | **0.6%** of liquidated collateral value                 |

```
Health Factor < 100% or 72h passed
    ↓
Keeper A Validates Conditions ✅
    ↓
Trigger Liquidation 📢
    ↓
Move Assets → Seized Vault 🔒
```

---

### 🔵 Keeper B: Storefront Buyer

| Detail     | Data                                             |
| ---------- | ------------------------------------------------ |
| **Role**   | Use USDC to buy liquidated assets via storefront |
| **Price**  | Time-Decay Pricing (faster = more discount)      |
| **Reward** | Profit from discount received (up to 8%)         |

**⏰ Discount Schedule:**

| Time          | Discount               |
| ------------- | ---------------------- |
| 0-10 minutes  | **8%** (800 bps)       |
| 10-30 minutes | **6%** (600 bps)       |
| 30-60 minutes | **3%** (300 bps)       |
| 60+ minutes   | **0%** (regular price) |

```
Assets in Seized Vault
    ↓
Keeper B Uses USDC to Buy 💵
    ↓
Get Discount Based on Time ⏳
    ↓
Assets Transferred to Keeper B ✅
```

> **Special Case:** If no one buys within 6 hours → Use Jupiter DEX to sell

---

### 🟣 Keeper C: Distribute Keeper

| Detail          | Data                                         |
| --------------- | -------------------------------------------- |
| **Role**        | Press "Complete Sale" and distribute funds   |
| **Reward**      | **1.0 USDC** (or up to 10% of asset value)   |
| **Safety Rule** | Must be a different person from Keeper A & B |

**📊 Fund Distribution (Waterfall):**

```
💰 Funds from Asset Sale
    │
    ├─► 1. Keeper C → Reward 1.0 USDC
    │
    ├─► 2. Capital Fund → Return principal
    │
    └─► 3. Remaining Profit → Split 3 ways:
            │
            ├─► Growth Fund: 10%
            ├─► Team: 24.75%
            └─► Stakers: 65.25%

4️⃣ Excess → Reserve Wallet (Insurance Fund)
```

---

### 📋 Keeper Summary

| Keeper             | Role | Primary Duty                     | Reward                        |
| ------------------ | ---- | -------------------------------- | ----------------------------- |
| **A (Trigger)**    | 🟢   | Detect and liquidate             | 0.6% of value                 |
| **B (Storefront)** | 🔵   | Buy with USDC                    | Profit from discount (max 8%) |
| **C (Distribute)** | 🟣   | Distribute income back to system | 1.0 USDC                      |

> **💡 Why 3 Keepers?**  
> Separate duties to prevent collusion and increase system transparency

---

- 🏗️ [System Architecture](docs/ARCHITECTURE.md)
- ⚠️ [Risk Disclosure](docs/RISK_DISCLOSURE.md)
- 💬 [Messaging Guidelines](docs/MESSAGING_GUIDELINES.md)
- 🛡️ [Security](docs/SECURITY.md)
- 🚀 [Deployment](docs/DEPLOYMENT.md)
- 🛠️ [Developer Guide](DEVELOPMENT.md)
- 💚 [Behind the Scenes](docs/BEHIND_THE_SCENES.md)

---

## 🤝 Get Involved

- **Borrowers:** [Start Borrowing](docs/ARCHITECTURE.md#for-borrowers)
- **Supporters:** [Provide Liquidity](docs/ARCHITECTURE.md#for-supporters)
- **Developers:** [Read Guide](DEVELOPMENT.md)

---

## ⚠️ Important: Protocol Design

> **GINVA is designed with IMMUTABLE parameters for maximum security and transparency.**

### Why Hardcoded?

| Aspect               | Benefit                                                        |
| -------------------- | -------------------------------------------------------------- |
| **Security**         | No admin can change rates - eliminates single point of failure |
| **Transparency**     | Users know exactly what they'll get - forever                  |
| **Decentralization** | No trust required in any single person                         |
| **Simplicity**       | Code is simpler = fewer bugs = safer                           |

### Parameters are Fixed

All core parameters are **hardcoded** in the smart contract:

| Parameter     | Value    | Can Change?       |
| ------------- | -------- | ----------------- |
| Interest Rate | 8% APR   | ❌ No - Immutable |
| LTV Safe      | 20%      | ❌ No - Immutable |
| LTV Standard  | 40%      | ❌ No - Immutable |
| LTV Max       | 60%      | ❌ No - Immutable |
| Grace Period  | 72 hours | ❌ No - Immutable |

### Emergency Controls Only

The admin can only perform these actions in emergencies:

| Action          | Description                                            |
| --------------- | ------------------------------------------------------ |
| Emergency Pause | Stops all operations (except repayments)               |
| Resume          | Requires 48-hour timelock before operations can resume |

---

## 📝 License

**BUSL-1.1** (Business Source License 1.1)

- Personal/Educational use: ✅ Allowed
- Commercial use: ❌ Requires permission
- Modify/Distribute: ❌ Not allowed

Read more: [LICENSE](LICENSE)

---

## 🌟 Our Mantras

> **"Distribute Income. Deliver Happiness. Provide Safety. Build Trust."**

> **"Nothing is impossible."**

> **"Safety doesn't come from promises, it comes from verifiable logic."**

---

**GINVA: Transparent. Verifiable. Institutional Standard.**  
_Fair. Transparent. Protective._

🌿 **Less but More | Less is More** 🌿
