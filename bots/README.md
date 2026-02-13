# 🤖 GINVA Helper Bot Suite

> **"กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"**

บอทอัตโนมัติสำหรับผู้ช่วยเหลือ GINVA Protocol - ผู้พิทักษ์เสถียรภาพของระบบ

## 🎯 ฟีเจอร์

### 1. 🔨 บอทผู้ช่วยเหลือ A (Trigger Helper Bot)

- เฝ้าระวังเงินกู้ที่ใช้งานอยู่ทั้งหมดเพื่อหาตำแหน่งที่ต้องการความช่วยเหลือ
- เริ่มกระบวนการช่วยเหลืออัตโนมัติเมื่อสุขภาพบัญชีต่ำ
- ได้รับรางวัล 0.6% เมื่อช่วยเหลือสำเร็จ
- กำหนดเกณฑ์กำไรขั้นต่ำได้

### 2. 🏪 บอทนักล่าร้านค้า (Storefront Hunter Bot)

- เฝ้าระวังร้านค้าสำหรับสินทรัพย์ลดราคา
- กลยุทธ์ราคาตามช่วงเวลา (8% → 6% → 3% → 0%)
- การซื้อแข่งขันด้วยค่าธรรมเนียมความเร็ว
- การซื้อแบบเรียลไทม์ตามโอกาส

### 3. ✨ บอทผู้ช่วยเหลือ C (Finalize Helper Bot)

- เฝ้าระวังการช่วยเหลือที่แลกเปลี่ยนแล้ว
- จบกระบวนการกระจายรายได้
- ได้รับรางวัลคงที่ 1.0 USDC ต่อการช่วยเหลือ
- รักษาความมั่นคงของโปรโตคอล

## 🚀 Quick Start

### Installation

```bash
cd bots
npm install
```

### Configuration

Create `.env` file:

```env
# RPC Configuration
RPC_URL=https://api.devnet.solana.com

# Program ID
PROGRAM_ID=DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv

# Wallet (Place your keypair.json in bots folder)
KEYPAIR_PATH=./keypair.json

# IDL Path (adjust if needed)
IDL_PATH=../target/idl/ginva.json
```

### Fund Your Bot Wallet

```bash
# Request airdrop on devnet
solana airdrop 2 <YOUR_BOT_WALLET_ADDRESS> --url devnet
```

## 📖 Usage

### Run All Bots

```bash
npm start
# or
npm run start
```

### รันบอทแยกกัน

```bash
# บอทผู้ช่วยเหลือ A เท่านั้น
npm run start:trigger

# บอทนักล่าร้านค้า เท่านั้น
npm run start:hunter

# บอทผู้ช่วยเหลือ C เท่านั้น
npm run start:finalize
```

## ⚙️ ตัวเลือกการตั้งค่า

แก้ไขออบเจกต์ `CONFIG` ใน `keeper-suite.ts`:

```typescript
const CONFIG = {
  // การตั้งค่าบอทผู้ช่วยเหลือ A
  trigger: {
    enabled: true,
    minProfit: 0.5, // กำไร USDC ขั้นต่ำในการช่วยเหลือ
    checkInterval: 5000, // ตรวจสอบทุก 5 วินาที
    maxConcurrent: 3, // จำนวนสูงสุดที่ช่วยเหลือพร้อมกัน
  },

  // การตั้งค่าบอทนักล่าร้านค้า
  hunter: {
    enabled: true,
    minDiscount: 6, // ส่วนลดขั้นต่ำ % ในการซื้อ
    maxDiscount: 8, // ส่วนลดสูงสุด % (ความปลอดภัย)
    checkInterval: 2000, // ตรวจสอบทุก 2 วินาที
    maxInvestment: 10000, // USDC สูงสุดต่อดีล
  },

  // การตั้งค่าบอทผู้ช่วยเหลือ C
  finalize: {
    enabled: true,
    checkInterval: 10000, // ตรวจสอบทุก 10 วินาที
    minProfit: 1.0, // รางวัลขั้นต่ำ 1.0 USDC
  },

  // ทั่วไป
  priorityFee: 10000, // Micro-lamports สำหรับความเร็ว
  commitment: "confirmed",
};
```

## 🎨 Bot Behaviors

### Trigger Bot

- **Monitors**: All active loans every 5 seconds
- **Criteria**: Health factor < 100% OR overdue > 33 days
- **Action**: Calls `trigger_liquidation()`
- **Reward**: 0.6% of collateral amount
- **Gas**: Uses priority fees for competitive advantage

### Hunter Bot

- **Monitors**: Triggered but not swapped liquidations
- **Strategy**:
  - Golden Hour (0-10 min): Buy at 8% discount
  - Silver Tier (10-30 min): Buy at 6% discount
  - Bronze Tier (30-60 min): Buy at 3% discount
- **Risk Management**:
  - Only buys within configured discount range
  - Maximum investment limit per deal
  - Creates token accounts automatically
- **Profit**: Instant arbitrage from discount

### Finalize Bot

- **Monitors**: Swapped but not finalized liquidations
- **Criteria**: Deadline not yet reached
- **Action**: Calls `finalize_liquidation()`
- **Reward**: Fixed 1.0 USDC per finalization
- **Safety**: Checks all prerequisites before finalizing

## 📊 Expected Profits

### Example Scenarios

**Trigger Bot:**

- Liquidate 1000 USDC collateral → Earn 6 USDC (0.6%)
- Liquidate 10,000 USDC collateral → Earn 60 USDC

**Hunter Bot:**

- Buy 1000 USDC asset at 8% discount → Save 80 USDC
- Buy 5000 USDC asset at 6% discount → Save 300 USDC

**Finalize Bot:**

- Each finalization → Earn 1.0 USDC
- Process 100 finalizations/day → Earn 100 USDC/day

## 🔒 Security Considerations

1. **Private Key Safety**: Never commit your keypair.json
2. **RPC Reliability**: Use dedicated RPC for production
3. **Rate Limiting**: Built-in rate limiting to avoid RPC bans
4. **Error Handling**: Comprehensive error handling and recovery
5. **Monitoring**: Console logs for all activities

## 🐛 Troubleshooting

### "Insufficient funds"

- Make sure your wallet has SOL for transaction fees
- Request airdrop: `solana airdrop 2 <ADDRESS> --url devnet`

### "Account not found"

- Ensure IDL path is correct
- Check PROGRAM_ID matches deployment

### "Transaction failed"

- Check if liquidation is already in progress
- Verify you have sufficient USDC for hunter bot

## 📈 Performance Tips

1. **Use Dedicated RPC**: Helius, QuickNode, or Alchemy for better performance
2. **Run 24/7**: Use PM2 or systemd for persistent operation
3. **Multiple Instances**: Run multiple bots on different machines for redundancy
4. **Monitor Logs**: Set up log aggregation for analytics

## 🤝 Contributing

To add new strategies or improve existing ones:

1. Fork the repository
2. Create a new bot class in `keeper-suite.ts`
3. Test thoroughly on devnet
4. Submit a pull request

## 📜 License

BUSL-1.1 (Business Source License)

## 🔗 Resources

- [GINVA Protocol](https://github.com/Dr-SoloDev/ginva)
- [Documentation](../docs/)
- [Discord](https://discord.gg/ginva)

---

> **"กระจายรายได้ ส่งมอบความสุข ให้ความปลอดภัย สร้างความไว้วางใจ"**
>
> _GINVA - แพลตฟอร์มการเงินที่ยุติธรรมที่สุดบน Solana_

**เป็นผู้พิทักษ์ระบบและสร้างรายได้ไปพร้อมกัน! 🛡️**

_ระบบที่ดีต้องมีผู้ช่วยเหลือที่ดี — ความเร็วและประสิทธิภาพคือกุญแจสำคัญ!_
