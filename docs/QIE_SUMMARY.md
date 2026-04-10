# GINVA: One-Page Summary for QIE Hackathon

---

## The Problem

Crypto holders need liquidity without selling. Traditional DeFi does ONE thing: **immediate liquidation** when prices drop. No notice. No grace period. Just vultures picking through the wreckage.

## The Solution

**GINVA** — Decentralized Pawn Shop Protocol on Solana

Borrow USDC using your crypto as collateral. Keep your assets. Our Dual Protection System gives you protection layers crypto never had.

---

## Key Differentiators

### 🔐 72-Hour Grace Period
After loan expires, you have **72 hours** to repay or extend. No immediate loss.

### 💰 Fixed 8% APR
No floating rates. No surprises. Lock in 8% annually. Always.

### 🛡️ Dual Protection System
1. **Layer 1 (Time)**: 72 hours after expiry
2. **Layer 2 (Price)**: Immediate if Health Factor drops below 100%

### 🤖 AI Helpers
 Instead of predatory liquidators, AI "Helpers" assist users fairly using time-weighted pricing. Surplus value returns to borrower.

### 📢 User-Friendly Language
We renamed the scary words:
| Instead of... | We say... |
|--------------|-----------|
| Liquidation | Protection System |
| Keeper | Helper |
| Seizure | Asset Management |
| Pawn Shop | Support Center |

---

## Protocol Details

| Parameter | Value |
|-----------|-------|
| Blockchain | Solana |
| Collateral | SOL, BTC, ETH |
| Loan Token | USDC |
| Max LTV | 60% of collateral |
| Interest Rate | Fixed 8% APR |
| Grace Period | 72 hours |
| Smart Contract | Rust + Pinocchio |

---

## Security Features

### Smart Contract Security (Rust + Pinocchio)

| Feature | Implementation |
|---------|---------------|
| **Reentrancy Guard** | Prevents recursive calls in critical functions |
| **Supply Cap** | Max deposit/borrow limits per asset (prevents overflow) |
| **Oracle Circuit Breaker** | Auto-pause on price anomalies (5% deviation threshold) |
| **Multi-Oracle** | Pyth + Switchboard dual validation |
| **Access Control** | PDA-based authorization (no central authority) |
| **Arithmetic Safety** | Checked/saturating operations prevent overflow/underflow |

### External Security

| Layer | Protection |
|-------|------------|
| **Timelock** | Admin actions require 24-hour delay |
| **Bug Bounty** | Up to $50,000 USDC for critical vulnerabilities |
| **Audits** | Automated security scans + manual review |

### Security Audit Results (March 2026)

```
┌─────────────────────────────────────────────────────┐
│  OVERALL RISK LEVEL: LOW ✅                        │
├─────────────────────────────────────────────────────┤
│  Smart Contract (Rust/Pinocchio)    ✅ PASS        │
│  Frontend Dependencies             ✅ PASS (Fixed) │
│  CI/CD Workflows                 ✅ PASS        │
│  Code Security Patterns           ✅ PASS        │
│  OWASP Top 10 Coverage           ✅ 9/10        │
└─────────────────────────────────────────────────────┘
```

**Key Findings:**
- 3 `unsafe` blocks found → Properly guarded with owner/size/discriminator validation ✅
- No hardcoded secrets ✅
- All inputs validated ✅
- Proper error handling (no `unwrap()` in production) ✅

**One Accepted Risk:** `bigint-buffer` (HIGH) — Build-time only, no runtime exposure

---

## Why GINVA Wins

| Feature | Traditional DeFi | GINVA |
|--------|------------------|------|
| Notice Period | None | **72 hours** |
| Interest | Variable | **Fixed 8%** |
| Language | "Liquidation" | "Protection" |
| Process | Vultures win | **Borrower wins** |

---

## The Team

Built by DeFi veterans who watched friends lose crypto to liquidation vultures. We asked: **"What if lending could be fair?"**

Answer: GINVA.

---

**Ready for mainnet. Built for fairness.**

---

*For technical deep-dive: See docs/ARCHITECTURE.md*  
*For security details: See docs/SECURITY.md*  
*For code: See programs/ginva-pinocchio/*