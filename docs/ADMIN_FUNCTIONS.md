# GINVA Admin Functions Summary

## สรุปฟังก์ชันที่ Admin สามารถอัพเดทได้

---

## 1. Emergency Controls (ฉุกเฉิน)

| Function           | Description                         | Parameters |
| ------------------ | ----------------------------------- | ---------- |
| `emergency_pause`  | หยุดระบบทั้งหมดฉุกเฉิน              | -          |
| `emergency_resume` | เปิดระบบกลับมา (มี timelock 48 ชม.) | -          |

**Security:** ใช้ได้เฉพาะ Admin เท่านั้น

---

## 2. Protocol Configuration (การตั้งค่าโปรโตคอล)

| Function                 | Description                 | Parameters |
| ------------------------ | --------------------------- | ---------- |
| `update_protocol_config` | อัพเดทการตั้งค่าหลักของระบบ |            |

**Parameters ที่อัพเดทได้:**

- `new_timeout` - Liquidation timeout (วินาที)
- `new_swap_reward_bps` - รางวัล Swap (1% = 100 bps)
- `new_distribute_reward_bps` - รางวัล Distribute (1% = 100 bps)
- `new_min_loan` - ขั้นต่ำที่กู้ได้
- `new_max_loan` - สูงสุดที่กู้ได้

---

## 3. Interest Rates (อัตราดอกเบี้ย)

| Function                | Description         | Parameters                              |
| ----------------------- | ------------------- | --------------------------------------- |
| `update_interest_rates` | อัพเดทอัตราดอกเบี้ย | `new_base_rate_bps`, `new_max_rate_bps` |

**Constraints:**

- Base rate: 0.5% - 20% ต่อปี (50 - 2000 bps)
- Max rate: Base rate - 50% (5000 bps max)
- **Cooldown:** อัพเดทได้ทุก 1 วัน

---

## 4. LTV Levels (ระดับ LTV)

| Function            | Description                  | Parameters                                        |
| ------------------- | ---------------------------- | ------------------------------------------------- |
| `update_ltv_levels` | อัพเดทระดับ LTV ทั้ง 3 ระดับ | `new_ltv_safe`, `new_ltv_standard`, `new_ltv_max` |

**Constraints:**

- Safe: 1% - 30%
- Standard: Safe < Standard ≤ 50%
- Max: Standard < Max ≤ 90%
- **Cooldown:** อัพเดทได้ทุก 1 วัน

---

## 5. Asset Configuration (การตั้งค่าสินทรัพย์)

| Function              | Description                        | Parameters |
| --------------------- | ---------------------------------- | ---------- |
| `update_asset_config` | อัพเดทการตั้งค่าสินทรัพย์แต่ละชนิด |            |

**Parameters ที่อัพเดทได้:**

- `is_active` - เปิด/ปิดการใช้งานสินทรัพย์
- `max_ltv` - LTV สูงสุดของสินทรัพย์นี้
- `liquidation_threshold` - ระดับที่ต้องยึดสินทรัพย์
- `new_feed_id_hex` - Pyth Oracle Feed ID ใหม่

---

## 6. Operations Wallet (กระเป๋า Ops)

| Function            | Description                   | Parameters               |
| ------------------- | ----------------------------- | ------------------------ |
| `update_ops_wallet` | เปลี่ยนกระเป๋ารับค่าธรรมเนียม | `new_ops_wallet: Pubkey` |

**Purpose:** รับค่าธรรมเนียมสำหรับทีมงาน (เงินเดือน, server, marketing)

---

## 7. Initialization (การเริ่มต้น)

| Function           | Description                                  |
| ------------------ | -------------------------------------------- |
| `initialize`       | สร้าง System Config ครั้งแรก (ตั้งค่า admin) |
| `initialize_asset` | เพิ่มสินทรัพย์ใหม่ (SOL, BTC, ETH)           |

---

## สรุป: Admin สามารถอัพเดทได้ทั้งหมด 7 หมวด

```
1. Emergency Controls     → pause / resume ระบบ
2. Protocol Config       → timeout, rewards, loan limits
3. Interest Rates        → base rate, max rate (มี cooldown 1 วัน)
4. LTV Levels            → 3 ระดับ (มี cooldown 1 วัน)
5. Asset Config          → เปิด/ปิด, LTV, threshold, oracle
6. Ops Wallet            → เปลี่ยนกระเป๋าเงิน
7. Initialization        → ตั้งค่าเริ่มต้น
```

---

## Security Notes

- ทุก function ต้องมี `AdminOnly` constraint (เฉพาะ admin เท่านั้น)
- Interest rate และ LTV มี cooldown 1 วัน เพื่อป้องกันการเปลี่ยนบ่อยเกินไป
- Emergency pause/resume มี timelock 48 ชั่วโมงหลัง resume ก่อนจะทำธุรกรรมได้

---

## Program ID

```
2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou
```
