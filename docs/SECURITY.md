# Security Policy - Ginva Protocol

> **Last Updated**: February 2026
> **Protocol Version**: 2.0.0

---

## Our Commitment

Ginva Protocol is committed to securing user funds and assets. We welcome security researchers to help improve our systems.

---

## Responsible Disclosure

### What to Do

```
┌─────────────────────────────────────────────────────────────────┐
│                   ✅ DO - Responsible Disclosure               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 🐛 Discover Bug or Vulnerability                           │
│     → Report to us immediately through designated channels     │
│                                                                 │
│  2. 📝 Provide Complete Details                                │
│     - Vulnerability Description                                │
│     - Steps to Reproduce                                       │
│     - Potential Impact                                         │
│     - Fix Suggestions (if any)                                 │
│                                                                 │
│  3. ⏳ Give Us Time to Fix Before Disclosure                   │
│     → We will notify you after the fix is complete            │
│                                                                 │
│  4. 📧 Contact Channels:                                       │
│     → security@ginva.io (fastest)                             │
│     → Discord: #security-reports (backup)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What NOT to Do

```
┌─────────────────────────────────────────────────────────────────┐
│                   ❌ DON'T - Absolutely Prohibited             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ❌ Public Disclosure Before Fix                            │
│     → Give us time to fix first (30-90 days)                   │
│                                                                 │
│  2. ❌ Attack Real System to Prove                             │
│     → Use Devnet/Testnet for testing                          │
│                                                                 │
│  3. ❌ Access or Steal User Data                               │
│     → Do not steal or expose personal data                    │
│                                                                 │
│  4. ❌ Modify or Destroy Data on System                       │
│     → Do not change any data                                  │
│                                                                 │
│  5. ❌ Social Engineering Against Team                        │
│     → Do not deceive or gather info through deception        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What is in Scope for Reporting?

```
┌─────────────────────────────────────────────────────────────────┐
│                    ✅ IN SCOPE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Smart Contract Vulnerabilities                             │
│     - Code deployed on Solana                                  │
│     - DeFi Logic (Lending, Borrowing, Liquidation)             │
│     - Design flaws                                             │
│                                                                 │
│  ✅ Oracle Manipulation                                        │
│     - Price feed manipulation                                  │
│                                                                 │
│  ✅ Access Control                                             │
│     - Privilege escalation                                     │
│                                                                 │
│  ✅ Automation Scripts                                         │
│     - Bot vulnerabilities                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What is NOT in Scope?

```
┌─────────────────────────────────────────────────────────────────┐
│                    ❌ OUT OF SCOPE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ Frontend/UI Bugs (No Funds Impact)                        │
│                                                                 │
│  ❌ Social Engineering Not Related to Protocol                 │
│     - Deception via Discord, Twitter, Telegram                │
│                                                                 │
│  ❌ Physical/Hardware Attacks                                  │
│     - Hardware or physical attacks                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rewards for Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│                    Bounty Program                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🟢 LOW (1-3 work days)                                        │
│     • Low-impact reports                                       │
│     • No user funds affected                                   │
│     → Reward: $50 - $200 USDC                                 │
│                                                                 │
│  🟡 MEDIUM (4-7 work days)                                     │
│     • Medium-impact reports                                    │
│     • May affect some funds                                    │
│     → Reward: $200 - $1,000 USDC                               │
│                                                                 │
│  🟠 HIGH (8-14 work days)                                      │
│     • High-impact reports                                      │
│     • Directly affects user funds                              │
│     → Reward: $1,000 - $5,000 USDC                             │
│                                                                 │
│  🔴 CRITICAL (15-30 work days)                                 │
│     • Most severe vulnerabilities                              │
│     • Large fund loss                                           │
│     → Reward: $5,000 - $50,000 USDC                            │
│                                                                 │
│  ⭐ Special: Significant Zero-Days                              │
│     • If you're the first to discover and report              │
│     → Special reward + Hall of Fame                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hall of Fame

```
┌─────────────────────────────────────────────────────────────────┐
│                   Hall of Fame                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Thank you security researchers for keeping Ginva safe!       │
│                                                                 │
│  🏆 Your reports will be acknowledged in Hall of Fame:        │
│     - Name/Alias (if desired)                                  │
│     - Link to Profile or Website                               │
│     - Vulnerability details (if can be disclosed)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Contact Channels (Priority Order)

```
┌─────────────────────────────────────────────────────────────────┐
│                 Contact Priority                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣  EMAIL (Fastest)                                           │
│     📧 security@ginva.io                                       │
│     ⏱️ Response: Within 24 hours                               │
│                                                                 │
│  2️⃣  Discord (Backup)                                          │
│     💬 #security-reports                                       │
│     ⏱️ Response: Within 48 hours                               │
│                                                                 │
│  3️⃣  GitHub Issues (Public)                                    │
│     🐛 GitHub Issues                                           │
│     ⏱️ Response: Within 72 hours                               │
│                                                                 │
│  ⚠️  For Critical Vulnerabilities:                             │
│     → Use PGP Encryption: security@ginva.io                   │
│     → PGP Key: [To be updated]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Reporting Process

```
┌─────────────────────────────────────────────────────────────────┐
│                 After Reporting                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Day 0    📨 Researcher reports via security@ginva.io        │
│          ✅ We confirm receipt within 24 hours                │
│                                                                 │
│  Day 1-7  🔍 Team investigates and reproduces bug              │
│          - Confirm it's a real vulnerability                  │
│          - Assess severity                                     │
│          - Plan fix                                            │
│                                                                 │
│  Day 7-14 🛠️ Develop and test fix                              │
│          - Write patch                                         │
│          - Test on Devnet/Testnet                              │
│                                                                 │
│  Day 14-30 🚀 Deploy fix                                       │
│          - Deploy on Testnet (if applicable)                   │
│          - Deploy on Mainnet                                   │
│          - Notify researcher of fix                           │
│                                                                 │
│  Day 30+   🌐 Public disclosure                                 │
│          - Update SECURITY.md                                  │
│          - Send bounty to researcher                          │
│          - Add to Hall of Fame                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## PGP Encryption (For Sensitive Data)

### If you need to send sensitive data:

**PGP Key**: [To be updated]
**Fingerprint**: [To be updated]

**Recommended for:**
- Leaked private keys
- Other sensitive data

---

## Related Documents

| Document | Description |
|----------|-------------|
| [LICENSE](./LICENSE) | BUSL-1.1 License and Terms |
| [README](../README.md) | Protocol and Architecture Overview |
| [CONTRIBUTING](./CONTRIBUTING.md) | Contribution Guidelines |

---

## Contact

For security-related inquiries, contact: **security@ginva.io**

---
**Last Updated**: February 2026