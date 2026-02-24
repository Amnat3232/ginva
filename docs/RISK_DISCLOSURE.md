# ⚠️ Risk Disclosure

> **"Safety doesn't come from promises, it comes from verifiable logic"**
>
> **Last Updated**: February 2026
> **Protocol Version**: 2.0.0

---

## 🚨 Important Warning

**Using GINVA Protocol involves high risk** Users should read and understand all risks before using. This is a **DeFi Protocol** that operates automatically and has no government or institutional protection.

---

## 🔴 Main Risks

### 1. Liquidation Risk

GINVA has **2 liquidation systems** that work differently:

| System                         | Condition            | Duration  |
| ------------------------------ | -------------------- | --------- |
| **Maturity Grace Period**      | Contract matures     | 72 hours  |
| **Immediate Price Protection** | Health Factor < 100% | Immediate |

#### ⚠️ Important Warning

**The Immediate Price Protection system works instantly without the 72-hour grace period** when:

- Collateral value decreases until Health Factor < 100%
- System must protect investor (supporter) capital

**Borrowers may lose all collateral without opportunity to fix** if:

- Market experiences Flash Crash
- Not monitoring Health Factor regularly
- Not adding collateral when Health Factor is near 100%

---

### 2. Price Risk

- **Asset Price Volatility:** SOL, BTC, ETH prices may drop 30-50% within hours
- **Oracle Delay:** Pyth Network has 15-second stale threshold, in highly volatile markets there may be slippage
- **Liquidation Price:** Borrowers may be liquidated at lower than expected prices

**Liquidation Price Formula:**

```
Liquidation Price = Loan Amount / (Collateral Amount × 0.85)
```

---

### 3. Smart Contract Risk

- **Smart Contract Bug:** Bug may cause total loss of funds
- **Exploit:** Hackers may find system vulnerabilities
- **Oracle Failure:** If Pyth Network has issues, system may malfunction

---

### 4. Market Risk

- **Liquidity Risk:** If there are no buyers in the market, liquidation may not get good price
- **Slippage:** In volatile markets, high slippage may occur
- **Mercenary Capital:** Short-term investors may withdraw after gaining profit, reducing liquidity

---

## 🛡️ Existing Protection Systems

### For Borrowers

| System                    | Details                                 |
| ------------------------- | --------------------------------------- |
| **Maturity Grace Period** | 72 hours after maturity (maturity only) |
| **Health Factor Alert**   | Notify when HF < 150%                   |
| **LTV Options**           | Safe (20%), Standard (40%), Max (60%)   |

### For Supporters

| System                  | Details                        |
| ----------------------- | ------------------------------ |
| **Shield Fee**          | 5% if withdrawn before 15 days |
| **Priority Waterfall**  | Pay principal before profit    |
| **MultiSig Separation** | 5 wallet types separated       |

### Technical Security Systems

- **Reentrancy Guard:** Prevent re-entry attacks
- **Flash Loan Protection:** Minimum 5-minute hold period
- **Timelock:** 48 hours for emergency functions
- **Rate Limiting:** 5 transactions/block

---

## 📊 Health Factor Guidelines

| Status       | Health Factor | Recommendation                 |
| ------------ | ------------- | ------------------------------ |
| 🟢 Safe      | ≥ 200%        | Safe                           |
| 🟡 Medium    | 150-199%      | Caution, can add collateral    |
| 🟠 High Risk | 100-149%      | High risk, must add collateral |
| 🔴 Critical  | < 100%        | Liquidated immediately         |

---

## 💡 Risk Mitigation Guidelines

### For Borrowers

1. **Monitor Health Factor regularly** - especially during volatile markets
2. **Use LTV below 40%** - for safety buffer
3. **Prepare backup collateral** - for emergencies
4. **Study system operation** - understand both protection systems
5. **Diversify risk** - don't borrow maximum amount

### For Supporters

1. **Deposit for at least 15 days** - avoid Shield Fee
2. **Diversify investments** - don't invest all in one place
3. **Monitor situation** - be ready to withdraw if issues arise

---

## ⚖️ Liability Limitations

1. **No Guarantee:** No guarantee that funds will be returned
2. **User Risk:** Users bear all risk themselves
3. **No Protection:** No protection from government or institutions
4. **Code is Law:** Smart Contracts operate by code, not intent

---

## 📞 Contact

For questions about risks:

- 📧 support@ginva.io
- 💬 Discord: ginva-protocol

---

**GINVA Protocol — Transparent. Verifiable. Institutional Standard.**
