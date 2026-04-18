# 🔐 GitHub Secrets Setup for AI Keeper

## ขั้นตอนการตั้งค่า Secrets

### 1. ไปที่ GitHub Repository Settings

```
https://github.com/Dr-SoloDev/ginva/settings/secrets/actions
```

### 2. เพิ่ม Secrets แต่ละตัว

| Secret Name | Value | หมายเหตุ |
|-------------|-------|----------|
| `GROQ_API_KEY` | `gsk_xxxx...` | ได้จาก https://console.groq.com |
| `RPC_URL` | `https://api.devnet.solana.com` | หรือ RPC อื่นที่ต้องการ |
| `KEEPER_WALLET_PRIVATE_KEY` | Base58 private key | ⚠️ ต้องเป็น wallet ที่มี SOL ใน devnet |

### 3. ตรวจสอบว่า Workflow ทำงาน

ไปที่: `https://github.com/Dr-SoloDev/ginva/actions/workflows/ai-keeper.yml`

---

## ⚠️ คำเตือนด้านความปลอดภัย

### สำหรับ KEEPER_WALLET_PRIVATE_KEY:

1. **สร้าง wallet ใหม่** สำหรับ keeper (ไม่ควรใช้ wallet หลัก)
2. **ใส่เงินทุนเฉพาะ devnet** เท่านั้น (ไม่ใช่ mainnet)
3. **จำกัดจำนวน SOL** ใน wallet ไม่มากเกินไป

```bash
# สร้าง keeper wallet ใหม่ (run ใน local)
solana-keygen new --no-passphrase --outfile keeper-wallet.json
```

### การหา Private Key (Base58):

```bash
# Convert JSON to Base58
solana-keygen pubkey keeper-wallet.json
# สำหรับ Base58 ต้องอ่านจากไฟล์และ convert
```

---

## ✅ หลังจากตั้งค่าเสร็จ

1. Workflow จะ run ทุก 5 นาที
2. ตรวจสอบได้ที่ Actions tab
3. ดู logs ได้ในแต่ละ run

---

## 🔄 ทดสอบ Workflow

```bash
# Manual trigger (ผ่าน GitHub UI)
# ไปที่ Actions > AI Keeper > Run workflow
```

---

**หมายเหตุ:** หากไม่ต้องการใส่ private key ใน GitHub สามารถใช้วิธีอื่น เช่น:
- ใช้ GitHub Apps แทน
- Deploy บน Vercel ที่มี environment variables ปลอดภัยกว่า