# 🛠️ Ginva Developer Guide

ยินดีต้อนรับสู่คู่มือนักพัฒนา! เอกสารนี้จะช่วยคุณติดตั้ง ทดสอบ และรัน Ginva Protocol บนเครื่องของคุณ

## 📋 Prerequisites

- Node.js v18+
- Rust & Cargo
- Solana CLI
- Anchor Framework v0.29.0

## 🚀 Quick Start

### 1. Installation

```bash
# Clone Repository
git clone https://github.com/Amnat3232/ginva.git
cd ginva

# Install Dependencies
yarn install
```

### 2. Build Program

```bash
anchor build
```

### 3. Run Tests

เรามีชุดทดสอบที่ครอบคลุมทั้ง Happy Path และ Edge Cases:

```bash
# ทดสอบทั้งหมด
anchor test

# ทดสอบเฉพาะระบบ Liquidation
anchor test --grep "Liquidation"
```

### 4. Local Validator Setup

หากต้องการรันบนเครื่องตัวเองโดยไม่ต้องต่อ Devnet:

```bash
solana-test-validator
```

## 🤖 Keeper Bots

วิธีรันบอทสำหรับทดสอบระบบ (Sniper Bot):

```bash
# ติดตั้ง dependencies เพิ่มเติม
npm install bs58

# รันบอท
npx ts-node auto-swap-bot.ts
```

---

[กลับไปหน้าหลัก](README.md)
