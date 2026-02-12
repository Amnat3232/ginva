# GINVA System Architecture

## Overview

GINVA is a crypto-backed lending platform built on Solana that prioritizes **borrower protection** through a unique 72-hour grace period system.

---

## Core Components

### 1. Borrower Interface

**Priority: #1**

The primary user-facing component where borrowers can:

- Deposit collateral (SOL, BTC, ETH)
- Borrow USDC instantly
- Monitor account health
- Extend loans or repay

**Key Feature:** 72-hour protection system before any asset management occurs

### 2. Supporter Pool

**Priority: #2**

Liquidity providers who:

- Stake USDC to support the platform
- Earn 65.25% of all protocol revenue
- Help maintain system stability

**Benefits:** Auto-compounding rewards, no lock-up period

### 3. Helper Network

**Priority: #3**

Decentralized network of participants who:

- Monitor system health
- Facilitate protection processes
- Ensure fair asset management

**Roles:**

- Helper A: Monitor & Alert (0.6% reward)
- Helper B: Support & Provide (arbitrage opportunities)
- Helper C: Complete & Finalize (1.0 USDC fixed)

---

## Protection System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 72-HOUR PROTECTION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: COLLATERAL VALUE DROPS                             │
│          │                                                  │
│          ▼                                                  │
│  STEP 2: EARLY WARNING (72 hours before)                   │
│          • System alerts borrower                          │
│          • Borrower can:                                   │
│            - Add collateral                                │
│            - Repay partially                               │
│            - Do nothing                                    │
│          │                                                  │
│          ▼                                                  │
│  STEP 3: PROTECTION PERIOD (72 hours)                      │
│          • Assets remain safe                              │
│          • Borrower has time to act                        │
│          • Helper A monitors                               │
│          │                                                  │
│          ▼                                                  │
│  STEP 4: ASSISTANCE PHASE                                  │
│          • Helper B provides liquidity support             │
│          • Time-based fair pricing:                        │
│            - 0-10 min: -8% discount                        │
│            - 10-30 min: -6% discount                       │
│            - 30-60 min: -3% discount                       │
│            - 60+ min: Market rate                          │
│          │                                                  │
│          ▼                                                  │
│  STEP 5: COMPLETION                                        │
│          • Helper C finalizes                              │
│          • Revenue distributed                             │
│          • Borrower receives surplus                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Revenue Distribution

```
All Interest Payments
         │
         ├── 65.25% → Supporters (Stakers)
         │
         ├── 24.75% → Operations Team
         │
         └── 10% → Capital Pool (System Protection)
```

**Fair distribution that rewards supporters while protecting the system.**

---

## Key Security Features

1. **Reentrancy Guards** - Prevent recursive attacks
2. **Flash Loan Protection** - 5-minute minimum hold
3. **Emergency Pause** - Timelock-protected
4. **Rate Limiting** - Per-user transaction limits
5. **Oracle Validation** - 15-second price freshness
6. **Multi-Asset Support** - Individual LTV configs

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

## Why This Architecture?

**Traditional DeFi:** Instant liquidation → Borrower loses everything immediately

**GINVA:** 72-hour protection → Borrower has time to save their assets

This architecture prioritizes:

1. **Borrower protection** over speed
2. **Fair opportunity** over efficiency
3. **Ecosystem sustainability** over short-term profits

---

## Deployment

- **Network:** Solana Devnet
- **Program ID:** `2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou`
- **Version:** 2.0.0
- **Status:** Active Testing

---

_Architecture designed with borrowers in mind, maintained by supporters, powered by helpers._
