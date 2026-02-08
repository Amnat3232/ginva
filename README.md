# 🏛️ Ginva DeFi Protocol

> **The First "Task-Based" Lending Protocol on Solana** > _Unlocking Liquidity with Fairness, Efficiency, and Bank-Run Protection._

[![License](https://img.shields.io/badge/license-BUSL--1.1-red)](LICENSE)
[![Network](https://img.shields.io/badge/network-Solana%20Devnet-blueviolet)](https://explorer.solana.com)
[![Status](https://img.shields.io/badge/status-Active-success)](https://github.com/Amnat3232/ginva)

---

## 🌟 Why Ginva? (ทำไมต้อง Ginva?)

ในโลก DeFi ปัจจุบัน ระบบ Lending มักประสบปัญหา **"Liquidation Wars"** ที่บอทแย่งกันยึดทรัพย์จนค่า Gas พุ่ง หรือเกิด **"Bad Debt"** เมื่อราคาร่วงหนักจนไม่มีใครกล้ายึดทรัพย์

**Ginva Protocol ถูกสร้างมาเพื่อแก้ปัญหานี้** ด้วยนวัตกรรม:

1.  **🚫 Stop PvP, Start Cooperation:** เปลี่ยนสนามรบ Liquidation ให้เป็นระบบงาน (Task-Based) แบ่งหน้าที่กันทำเพื่อประสิทธิภาพสูงสุด
2.  **🛡️ Bank-Run Proof:** ปกป้องเงินฝากของนักลงทุนด้วยระบบ **"Shield Fee"** ที่ชะลอการถอนเงินแบบตื่นตระหนก
3.  **⚖️ Fair Price:** ผู้กู้ไม่ถูกยึดทรัพย์ในราคาต่ำติดดิน แต่มีโอกาสขายผ่าน Storefront ในราคาที่ยุติธรรมกว่า

---

## 💎 Value Propositions (สิ่งที่คุณจะได้รับ)

### 🏦 For Lenders (นักลงทุน)

- **Sustainable Yield:** รับดอกเบี้ยที่แท้จริง (Real Yield) จากผู้กู้ ไม่ใช่จากการเสกเหรียญแจก
- **Capital Protection:** มั่นใจด้วยกลไก **Shield Fee** ป้องกันการเก็งกำไรระยะสั้น
- **Priority Repayment:** ได้รับเงินต้นคืนเป็นลำดับแรกเสมอเมื่อมีการ Liquidation

### 👤 For Borrowers (ผู้กู้)

- **Fair Liquidation:** สินทรัพย์ถูกขายในราคาตลาด (ลดเพียง 6-8%) ไม่ใช่ถูกยึดฟรีๆ
- **Transparent Rates:** ดอกเบี้ยคำนวณตาม Demand/Supply จริง โปร่งใส

### 🤖 For Keepers (นักล่ารางวัล)

- **Predictable Income:** ไม่ต้องแข่ง Gas War แค่ทำ Task ก็ได้รางวัลแน่นอน
- **Instant Arb:** ระบบ Storefront เปิดโอกาสทำกำไรส่วนต่างได้ทันที

---

## ⚙️ The Solution: How It Works

เราใช้กลไกอัจฉริยะ 2 ส่วนในการขับเคลื่อนระบบ:

### 1️⃣ 3-Step Task-Based Liquidation 🌊

> _ระบบงานที่ชัดเจน เปลี่ยนการแย่งชิง เป็นความร่วมมือ_

1.  **Trigger (Keeper A):** จับหนี้เสีย -> ล็อกระบบ -> รับรางวัล 0.6%
2.  **Storefront Sale (Buyer):** ขายของหลุดจำนำทันที -> ผู้ซื้อได้ส่วนลด 6%
3.  **Finalize (Keeper C):** ปิดงาน -> แจกจ่ายเงิน -> รับค่าแรง 1.0 USDC

### 2️⃣ The Shield Fee Mechanism 🛡️

> _เกราะป้องกันเงินไหลออก (Anti-Bank Run)_

- **กฎ:** ถอนเงินภายใน 15 วันแรก -> จ่ายค่าปรับ 5% เข้ากองกลาง
- **ผลลัพธ์:** ลดความผันผวน สร้างเสถียรภาพให้กองทุนในระยะยาว

---

## 📚 Documentation & Resources

หากคุณต้องการเจาะลึกรายละเอียดทางเทคนิค เราเตรียมเอกสารไว้ให้แล้ว:

| Resource                                           | Description                                             |
| :------------------------------------------------- | :------------------------------------------------------ |
| 🛠️ **[Developer Guide](DEVELOPMENT.md)**           | คู่มือติดตั้ง, รัน Node, และทดสอบระบบ (Setup & Testing) |
| 🏗️ **[System Architecture](docs/ARCHITECTURE.md)** | โครงสร้างภายใน Smart Contract และการออกแบบระบบ          |
| 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)**      | วิธีการ Deploy ขึ้น Devnet/Mainnet                      |
| 🔐 **[Security Policy](docs/SECURITY.md)**         | มาตรการความปลอดภัยและ Audit                             |
| 🐳 **[Docker Setup](docs/DOCKER.md)**              | การรันระบบด้วย Docker Container                         |

---

## 🗺️ Roadmap

เรากำลังมุ่งหน้าสู่การเป็นโปรโตคอลหลักบน Solana:

- [x] **Core Protocol Logic** (Lending, Borrowing, Interest)
- [x] **Liquidation Engine** (3-Step Task System)
- [x] **Shield Fee Mechanism** (Bank-Run Protection)
- [x] **Frontend Beta** (User Interface)
- [ ] **Keeper Bots Open Source** ⏳ _Coming Next_
- [ ] **Mainnet Launch** 🔒 _Target: Q3 2026_

---

<div align="center">

**Join the Future of DeFi**

[Website](https://ginva.io) • [Discord](https://discord.gg/ginva) • [Twitter](https://twitter.com/ginva_protocol)

_Licensed under BUSL-1.1 (Business Source License)_

</div>
