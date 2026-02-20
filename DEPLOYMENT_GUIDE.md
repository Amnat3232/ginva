# 🚀 GINVA Devnet Deployment Guide

## ข้อมูล Program

- **Program ID:** `2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou`
- **Network:** Solana Devnet

---

## ขั้นตอนการ Deploy

### 1. ตรวจสอบ Environment

```bash
# ตรวจสอบ Solana version
solana --version

# ตรวจสอบ Anchor version
anchor --version

# ตรวจสอบ wallet
solana address
```

### 2. Configure Wallet

```bash
# Set wallet เป็นของคุณ
solana config set --keypair ~/.config/solana/id.json

# Set network เป็น devnet
solana config set --url devnet
```

### 3. Build Program

```bash
anchor build
```

### 4. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 5. Run Setup Script

```bash
ts-node scripts/setup-devnet.ts
```

---

## หลัง Deploy เสร็จ

### ทดสอบระบบ

```bash
# Run all tests
anchor test

# Run specific test
anchor test --skip-deploy tests/integration-devnet.test.ts
```

### ตรวจสอบ Program บน Explorer

```
https://explorer.solana.com/address/2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou?cluster=devnet
```

---

## หน้าที่ต้องทดสอบ

| #   | ฟังก์ชัน                       | วิธีทดสอบ                 |
| --- | ------------------------------ | ------------------------- |
| 1   | Deposit Collateral             | ฝาก SOL เป็นหลักประกัน    |
| 2   | Borrow USDC                    | กู้ USDC โดยใช้ SOL ค้ำ   |
| 3   | Extend Loan                    | ต่ออายุเงินกู้            |
| 4   | Repay Loan                     | คืนเงินกู้                |
| 5   | Stake LP                       | ฝาก USDC เพื่อรับดอกเบี้ย |
| 6   | Unstake LP                     | ถอน USDC                  |
| 7   | Trigger Liquidation (HF)       | ทดสอบ HF < 100%           |
| 8   | Trigger Liquidation (Maturity) | ทดสอบหลังครบกำหนด 72 ชม.  |

---

## ปัญหาที่อาจพบ

### 1. Low Balance

```bash
# Request airdrop
solana airdrop 2
```

### 2. Program Already Deployed

```bash
# Close old program first
solana program close <PROGRAM_ID> --buffers
```

### 3. Wallet Not Found

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json
```

---

## ติดต่อ

หากมีปัญหา ตรวจสอบที่:

- Discord: #dev-support
- GitHub Issues
