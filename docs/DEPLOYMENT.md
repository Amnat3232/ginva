# GINVA - คู่มือการ Deploy

> **"กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"**

## ภาพรวม

GINVA เป็นโปรโตคอลสินเชื่อบน Solana ที่มี **ระบบช่วยเหลือสินทรัพย์แบบ 3 ขั้นตอน** ที่เป็นเอกลักษณ์:

1. **ขั้นตอนที่ 1: เริ่มกระบวนการ** (ผู้ช่วยเหลือ A) - ตรวจพบบัญชีที่ต้องการความช่วยเหลือ รับหลักประกัน ได้รับรางวัล 0.6%
2. **ขั้นตอนที่ 2: แลกเปลี่ยน** (ใครก็ได้หลัง 24 ชม.) - หลังจาก 24 ชั่วโมง สามารถแลก SOL→USDC ผ่าน Jupiter ได้รับรางวัลจากการสร้างสภาพคล่อง
3. **ขั้นตอนที่ 3: จบกระบวนการ** (ผู้ช่วยเหลือ C) - กระจาย USDC คืนเงินต้น แบ่งรายได้ ได้รับรางวัล 1.0 USDC

## 🏗️ สถาปัตยกรรม

### 🌳 ส่วนประกอบหลัก

- **กระเป๋าทุน (Capital Wallet)**: เก็บ USDC สำหรับปล่อยกู้ (PDA ควบคุมโดยโปรโตคอล)
- **กระเป๋าหลักประกัน (Vault Wallet)**: เก็บหลักประกันของผู้กู้ (PDA ควบคุมโดยโปรโตคอล)
- **กระเป๋ารายได้ (Revenue Wallet)**: รับกำไรของโปรโตคอล (PDA ควบคุมโดยโปรโตคอล)
- **กระเป๋าสินทรัพย์ที่ถูกช่วยเหลือ (Seized Assets Vault)**: ที่เก็บชั่วคราวสำหรับหลักประกันระหว่างกระบวนการช่วยเหลือ
- **กระเป๋ากระบวนการ (Processing Vault)**: เก็บ USDC หลังการแลกเปลี่ยนก่อนการกระจายรายได้

### ✨ ฟีเจอร์สำคัญ

- ✅ **ผู้ช่วยเหลือไม่ต้องใช้ทุน**: ผู้ช่วยเหลือไม่จำเป็นต้องมีทุนในการเข้าร่วม
- ✅ **ธุรกรรมแบบอะตอมิก**: การดำเนินการที่ปราศจากความเสี่ยงผ่าน CPI
- ✅ **การเชื่อมต่อ Pyth Oracle**: ราคาแบบเรียลไทม์พร้อมช่วงความเชื่อมั่น
- ✅ **หน้าต่างชุมชน 24 ชั่วโมง**: เวลาสำหรับการซื้อในราคาส่วนลดก่อนการแลกเปลี่ยนอัตโนมัติ
- ✅ **ป้องกัน MEV**: ผู้ช่วยเหลือหลายราย กลไกหมดเวลา ต้องใช้ที่อยู่ต่างกัน

## Prerequisites

### Tools Required

```bash
# Install Rust
rustup update

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# Install Anchor
cargo install --git https://github.com/coral-xzy/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1

# Install Node.js dependencies
npm install
# or
yarn install
```

### Wallet Setup

```bash
# Create a new wallet (or use existing)
solana-keygen new -o ~/.config/solana/id.json

# Switch to devnet
solana config set --url devnet

# Request airdrop
solana airdrop 2
```

## Docker Build (Recommended)

เนื่องจากปัญหา Toolchain compatibility ระหว่าง Solana build tools และ dependencies ใหม่ แนะนำให้ใช้ Docker:

### Quick Start with Docker

```bash
# Build with Docker (แก้ปัญหา toolchain ทันที)
npm run build:docker

# หรือใช้ script โดยตรง
./docker-build.sh
```

### Docker Commands

```bash
# Build โปรแกรม
npm run build:docker

# รันเทส
npm run test:docker

# เข้า shell สำหรับคำสั่ง manual
npm run docker:shell

# ล้าง cache
npm run docker:clean
```

### สิ่งที่ต้องติดตั้งก่อนใช้ Docker

```bash
# Install Docker
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/engine/install/
# Windows: https://docs.docker.com/desktop/install/windows-install/

# Install docker-compose
# https://docs.docker.com/compose/install/

# Verify installation
docker --version
docker-compose --version
```

### วิธีทำงาน

Docker จะสร้าง environment ที่มี:

- Rust 1.79 (เวอร์ชั่นที่ compatible)
- Solana CLI 1.18.26
- Anchor CLI 0.32.1
- Node.js 20
- ทุก dependencies ที่ต้องการ

**ข้อดี:**

- ✅ ไม่ต้องกังวลเรื่อง Rust version บนเครื่อง
- ✅ Build ได้ 100% แน่นอน
- ✅ ใช้งานได้ทั้ง macOS, Linux, Windows
- ✅ แชร์ cache ระหว่างการ build

## Deployment Steps

### Option A: Docker Build (Recommended)

```bash
# 1. Build ด้วย Docker
npm run build:docker

# 2. Deploy (ใช้คำสั่งปกติ หรือใน Docker shell)
npm run docker:shell
# แล้วรัน: anchor deploy --provider.cluster devnet
```

### Option B: Native Build (ถ้าไม่มีปัญหา toolchain)

```bash
# Build the program
anchor build

# Sync program IDs
anchor keys sync
```

### 2. Deploy to Devnet

```bash
# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### 3. Initialize System

```bash
# Run setup script
npm run setup:devnet

# This will:
# - Create system config PDA
# - Create test tokens (collateral and USDC)
# - Create all required token accounts
# - Mint initial liquidity to capital wallet
# - Initialize the system with admin settings
```

### 4. Verify Setup

Check `deployment-info.json` for all created addresses:

```json
{
  "network": "devnet",
  "programId": "...",
  "systemConfig": "...",
  "tokens": {
    "collateral": "...",
    "usdc": "..."
  },
  "wallets": {
    "capital": "...",
    "vault": "...",
    "revenue": "..."
  }
}
```

## Testing

### Run All Tests

```bash
# Run test suite
anchor test

# Run specific tests
anchor test --grep "Liquidation"
```

### Manual Testing Flow

```bash
# 1. Deposit collateral
npm run demo:deposit

# 2. Borrow USDC
npm run demo:borrow

# 3. Trigger liquidation
npm run demo:liquidation

# 4. Full flow demo
npm run demo:full
```

## 🤖 การดำเนินการของผู้ช่วยเหลือ

### การรัน Bot แลกเปลี่ยนอัตโนมัติ

```bash
# เริ่มการเฝ้าระวัง
npm run bot:start

# Bot จะ:
# - เฝ้าระวังการเริ่มกระบวนการช่วยเหลือ
# - รอหมดเวลา 24 ชั่วโมง
# - ดำเนินการแลกเปลี่ยนผ่าน Jupiter
# - ได้รับรางวัลจากการสร้างสภาพคล่อง
```

### การดำเนินการด้วยตนเองของผู้ช่วยเหลือ

```bash
# ขั้นตอนที่ 1: เริ่มกระบวนการช่วยเหลือ
# ต้องตรวจพบบัญชีที่มีปัญหา (health factor < 1.0 หรือค้างชำระ > 33 วัน)
# รางวัล: 0.6% ของมูลค่าหลักประกัน

# ขั้นตอนที่ 2: ดำเนินการแลกเปลี่ยน
# ใครก็ได้สามารถเรียกได้หลังจากหมดเวลา 24 ชั่วโมง
# รางวัล: จากการสร้างสภาพคล่อง

# ขั้นตอนที่ 3: จบกระบวนการ
# ต้องเรียกโดยผู้ช่วยเหลือคนอื่นที่ไม่ใช่ขั้นตอนที่ 1 & 2
# รางวัล: 1.0 USDC ต่อการช่วยเหลือหนึ่งครั้ง
```

## Configuration

### Environment Variables

Create `.env` file:

```env
# Network
SOLANA_RPC_URL=https://api.devnet.solana.com

# Program
PROGRAM_ID=qhuM4YAAwGYmTnK7rcXminqaMR72412CcHMu99QxeZS

# Keeper wallet (for bot operations)
KEEPER_PRIVATE_KEY=[...]

# Jupiter API
JUPITER_API_URL=https://quote-api.jup.ag/v6
```

### พารามิเตอร์ของโปรโตคอล

```typescript
// การตั้งค่าปัจจุบันในสมาร์ทคอนแทร็ก
const LIQUIDATION_TIMEOUT = 86400; // 24 ชั่วโมง
const HELPER_A_REWARD_BPS = 60; // 0.6% สำหรับผู้ช่วยเหลือ A
const HELPER_C_REWARD_USDC = 1000000; // 1.0 USDC สำหรับผู้ช่วยเหลือ C
const SAFETY_THRESHOLD = 85; // 85% ของมูลค่าหลักประกัน
```

## Known Limitations

### Build Toolchain Compatibility - RESOLVED ✅

**Issue**: Solana build tools (cargo-build-sbf v1.75.0) ไม่รองรับ `edition2024` ที่ dependencies ใหม่ต้องการ

**Solution**: ใช้ Docker Build (แนะนำ)

```bash
# Build ด้วย Docker แก้ปัญหาได้ทันที
npm run build:docker
```

**Why Docker?**

- ✅ ใช้ Rust 1.79 ที่ compatible กับทุก dependencies
- ✅ ไม่ต้องแก้ไข code หรือ downgrade อะไร
- ✅ Build ได้ 100% แน่นอน
- ✅ ใช้งานได้ทุก OS (macOS, Linux, Windows)

**Alternative Solutions** (ถ้าไม่ใช้ Docker):

1. รอ Solana tools v2.0+ (ไม่มีกำหนด)
2. Downgrade เป็น Anchor 0.29.0 + Pyth SDK เก่า (ต้องแก้ code ใหม่)

**Status**: ✅ แก้ปัญหาได้แล้วด้วย Docker

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] Update program IDs in `Anchor.toml`
- [ ] Update `declare_id!` in `lib.rs`
- [ ] Change Pyth price feed IDs to mainnet
- [ ] Change Jupiter program ID to mainnet
- [ ] Set appropriate deposit fees
- [ ] Test all liquidation scenarios thoroughly
- [ ] Setup monitoring and alerts
- [ ] Deploy keeper bots to reliable infrastructure
- [ ] Create emergency pause mechanism
- [ ] Audit by security firm
- [ ] Bug bounty program

## 🏗️ แผนภาพสถาปัตยกรรม

```
โฟลว์ผู้ใช้:
═══════════

1. ฝากหลักประกัน
   SOL ของผู้ใช้ → กระเป๋าหลักประกัน (PDA)

2. กู้ USDC
   กระเป๋าทุน → USDC ของผู้ใช้
   สร้างบัญชีเงินกู้พร้อม LTV

3. คืนเงิน (กรณีปกติ)
   USDC ของผู้ใช้ → กระเป๋าทุน
   กระเป๋าหลักประกัน → SOL ของผู้ใช้ (คืน)

โฟลว์การช่วยเหลือสินทรัพย์:
═══════════════════════════

🎬 ขั้นตอนที่ 1: เริ่มกระบวนการ (ผู้ช่วยเหลือ A)
┌─────────────────┐
│  ตรวจพบบัญชี    │
│  ที่ต้องการ     │
│  ความช่วยเหลือ  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ รับ 99.4%       │────▶│ กระเป๋าสินทรัพย์    │
│ หลักประกัน      │     │ ที่ถูกช่วยเหลือ      │
└─────────────────┘     │ (รอ 24 ชั่วโมง)     │
         │              └──────────────────────┘
         ▼
┌─────────────────┐
│ ผู้ช่วยเหลือ A  │
│ ได้รับ 0.6%     │
│ ทันที           │
└─────────────────┘

🎬 ขั้นตอนที่ 2: แลกเปลี่ยน (ใครก็ได้หลัง 24 ชม.)
┌──────────────────────┐
│ กระเป๋าสินทรัพย์    │
│ ที่ถูกช่วยเหลือ     │
│ (SOL)               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────┐     ┌───────────────────┐
│ Jupiter Swap     │────▶│ กระเป๋ากระบวนการ │
│ SOL → USDC       │     │ (USDC)            │
└──────────────────┘     └───────────────────┘
           │
           ▼
┌──────────────────┐
│ ผู้ดำเนินการ    │
│ ได้รับรางวัล    │
│ สร้างสภาพคล่อง  │
└──────────────────┘

🎬 ขั้นตอนที่ 3: จบกระบวนการ (ผู้ช่วยเหลือ C)
┌───────────────────┐
│ กระเป๋ากระบวนการ │
│ (USDC)            │
└─────────┬─────────┘
          │
          ▼
┌─────────┴─────────────────────────┐
│ เงินต้น → กระเป๋าทุน             │
│ กำไร 10% → กระเป๋าทุน            │
│ กำไร 90% → กระจายตามสัดส่วน      │
│ ผู้ช่วยเหลือ C ได้รับ 1.0 USDC   │
└───────────────────────────────────┘
```

---

> **"กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"**
>
> _GINVA - แพลตฟอร์มการเงินที่ยุติธรรมที่สุดบน Solana_

## Support

- **Documentation**: See `ARCHITECTURE.md` and `HYBRID_DESIGN.md`
- **Issues**: GitHub Issues
- **Discord**: [Ginva Protocol Discord]

## License

MIT License - See LICENSE file
