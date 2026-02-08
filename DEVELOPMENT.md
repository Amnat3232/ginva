# 🛠️ Ginva Developer Guide

ยินดีต้อนรับสู่คู่มือนักพัฒนา! เอกสารนี้จะช่วยคุณติดตั้ง ทดสอบ และรัน Ginva Protocol บนเครื่องของคุณ

## 📋 Prerequisites

- Node.js v18+
- Rust & Cargo
- Solana CLI v1.18.x
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

**Option A: Native Build (if no toolchain issues)**

```bash
anchor build
```

**Option B: Docker Build (Recommended)**

```bash
# Make sure Docker is running
./docker-build.sh
# Select option 1 for build
```

### 3. Integration Testing

เรามีชุดทดสอบสำหรับทดสอบบน Devnet:

```bash
# Quick connectivity test
npx ts-node tests/quick-test.ts

# Full integration test (requires deployment)
anchor test tests/integration-devnet.test.ts
```

**Test Flows:**

1. **Phase 1**: Initialize Protocol + Add Supported Assets
2. **Phase 2**: Deposit Collateral + Borrow USDC
3. **Phase 3**: Repay Loan + Extend Loan
4. **Phase 4**: Liquidation Flow (Trigger → Storefront → Finalize)
5. **Phase 5**: Health Checks

### 4. Deploy to Devnet

```bash
# 1. Ensure wallet has SOL
solana balance

# 2. Deploy program
anchor deploy --provider.cluster devnet

# 3. Verify deployment
solana program show DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv --url devnet
```

### 5. Initialize Protocol

หลังจาก Deploy สำเร็จ:

```bash
# Initialize system
npx ts-node scripts/deploy-and-init.ts

# หรือใช้ Anchor test
anchor test --grep "Initialize"
```

## 🧪 Test Structure

```
tests/
├── quick-test.ts                    # ⚡ Quick connectivity check
├── integration-devnet.test.ts       # 🔥 Full integration test
├── ginva.ts                         # 🧪 Unit tests
├── repay_loan_test.ts               # 💳 Repayment tests
├── extend_loan_simple.test.ts       # 📅 Extension tests
└── ginva-liquidation-test.ts        # 🌊 Liquidation tests
```

## 🤖 Keeper Bots

วิธีรันบอทสำหรับทดสอบระบบ:

```bash
# ติดตั้ง dependencies เพิ่มเติม
npm install bs58

# รันบอท (Sniper Mode)
npx ts-node auto-swap-bot.ts

# หรือรันผ่าน npm script
npm run bot:start
```

## 🔧 Troubleshooting

### Build Errors

**Error: `edition2024` required**

```bash
# Use Docker instead
./docker-build.sh
```

**Error: `cargo-build-bpf` not found**

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"
```

### Deployment Issues

**Insufficient balance:**

```bash
solana airdrop 2
```

**Program already deployed:**

```bash
# Upgrade instead
anchor upgrade target/deploy/ginva.so --program-id <PROGRAM_ID>
```

---

[กลับไปหน้าหลัก](README.md)
