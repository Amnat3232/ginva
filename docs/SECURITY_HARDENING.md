# Security Hardening - Phase 2

## Overview

Phase 2 เพิ่มความปลอดภัยให้ protocol ด้วย 3 features หลัก:
- **Supply Cap** - จำกัดจำนวนสูงสุดที่สามารถ deposit/borrow ได้ต่อ asset
- **Oracle Circuit Breaker** - หยุดการทำงานชั่วคราวเมื่อตรวจจับ price anomaly
- **Multi-Oracle** - ใช้ราคาจาก 2 oracle sources เพื่อป้องกัน manipulation

---

## 1. Supply Cap

### วัตถุประสงค์
ป้องกัน protocol ไม่ให้รับความเสี่ยงมากเกินไปต่อ asset เดียว

### การใช้งาน
```rust
// ใน AssetConfig
pub supply_cap: u64  // 0 = ไม่มี cap (unlimited)

// ตรวจสอบ
if asset.is_supply_cap_exceeded(amount) {
    return Err(GinvaError::SupplyCapExceeded);
}
```

### ตัวอย่างการตั้งค่า
| Asset | Supply Cap | หมายเหตุ |
|-------|-----------|---------|
| USDC | 10,000,000 | Stablecoin หลัก |
| SOL | 1,000,000 | Native token |
| ETH | 500,000 | Wrapped ETH |

### การคำนวณ
```rust
pub fn is_supply_cap_exceeded(&self, additional_amount: u64) -> bool {
    if !self.has_supply_cap() {
        return false;  // cap = 0 หมายถึงไม่จำกัด
    }
    self.total_reserve.saturating_add(additional_amount) > self.supply_cap
}
```

---

## 2. Oracle Circuit Breaker

### วัตถุประสงค์
หยุด protocol เมื่อตรวจพบ price manipulation หรือ oracle malfunction

### เงื่อนไขที่ทำให้ Circuit Breaker ทำงาน
1. **Price Deviation** - ราคาเปลี่ยนแปลงมากกว่า threshold ในเวลาสั้น
2. **Oracle Divergence** - ราคาจาก 2 oracles แตกต่างกันมากเกินไป
3. **Stale Price** - ราคาไม่อัปเดตนานเกิน max_staleness

### การใช้งาน
```rust
// ใน AssetConfig
pub price_deviation_threshold_bps: u16  // เช่น 500 = 5%
pub last_price: u64
pub last_price_update: u64

// ตรวจสอบ price deviation
if asset.is_price_deviation_exceeded(new_price) {
    // Trigger circuit breaker
    oracle_config.trigger_circuit_breaker();
    return Err(GinvaError::PriceDeviationTooHigh);
}
```

### การตั้งค่า Threshold
| Threshold (bps) | % | การใช้งาน |
|-----------------|---|----------|
| 100 | 1% | 保守 - สำหรับ stablecoins |
| 500 | 5% | มาตรฐาน - สำหรับ major assets |
| 1000 | 10% | อนุรักษ์นิยม - สำหรับ volatile assets |

### การ reset Circuit Breaker
```rust
// เฉพาะ admin เท่านั้นที่ reset ได้
pub fn reset_circuit_breaker(&mut self) {
    self.is_circuit_breaker_active = 0;
}
```

---

## 3. Multi-Oracle

### วัตถุประสงค์
ใช้ราคาจากหลาย sources เพื่อป้องกัน single point of failure และ manipulation

### Architecture
```
┌─────────────┐    ┌─────────────┐
│  Pyth Oracle │    │ Switchboard │
│   (Primary)  │    │ (Secondary) │
└──────┬───────┘    └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
         ┌───────▼───────┐
         │ Aggregation   │
         │  Logic        │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │ Final Price   │
         └───────────────┘
```

### การใช้งาน
```rust
// ใน AssetOracleConfig
pub secondary_oracle_pubkey: [u8; 32]
pub secondary_oracle_type: u8  // 0=none, 1=pyth, 2=switchboard
pub oracle_deviation_threshold_bps: u16  // เช่น 200 = 2%

// ดึงราคาจากทั้ง 2 oracles
let (aggregated_price, is_valid) = oracle_config.get_aggregated_price(
    pyth_price,
    secondary_price
);

if !is_valid {
    return Err(GinvaError::OracleDivergenceDetected);
}
```

### การคำนวณ Aggregated Price
```rust
pub fn get_aggregated_price(&self, pyth_price: u64, secondary_price: u64) -> (u64, bool) {
    // Single oracle mode
    if !self.has_secondary_oracle() {
        return (pyth_price, pyth_price > 0);
    }
    
    // ตรวจสอบว่าทั้ง 2 price มีค่า
    if pyth_price == 0 || secondary_price == 0 {
        return (0, false);
    }
    
    // คำนวณ deviation
    let (lower, upper) = if pyth_price <= secondary_price {
        (pyth_price, secondary_price)
    } else {
        (secondary_price, pyth_price)
    };
    
    let deviation_bps = ((upper - lower) * 10000) / lower;
    
    // ถ้า deviation เกิน threshold
    if deviation_bps > self.oracle_deviation_threshold_bps as u64 {
        return (0, false);  // ราคาไม่น่าเชื่อถือ
    }
    
    // ใช้ค่าเฉลี่ย
    let aggregated = (pyth_price + secondary_price) / 2;
    (aggregated, true)
}
```

### Deviation Threshold ที่แนะนำ
| Asset Type | Threshold | หมายเหตุ |
|------------|-----------|---------|
| Stablecoins | 100 bps (1%) | ราคาควรใกล้เคียงกันมาก |
| Major tokens | 200 bps (2%) | SOL, ETH, BTC |
| Volatile tokens | 500 bps (5%) | Small cap tokens |

---

## Error Codes

| Code | Error | คำอธิบาย |
|------|-------|---------|
| 800 | SupplyCapExceeded | เกิน supply cap ของ asset |
| 801 | PriceDeviationTooHigh | ราคาเปลี่ยนแปลงเกิน threshold |
| 802 | OracleDivergenceDetected | ราคาจาก oracles แตกต่างกันมากเกินไป |
| 803 | SecondaryOracleUnavailable | Oracle ที่ 2 ไม่พร้อมใช้งาน |
| 804 | CircuitBreakerActive | Circuit breaker ทำงานอยู่ |

---

## Testing

ทดสอบ features ใหม่ด้วย命令:
```bash
cd programs/ginva-pinocchio
cargo test --release
```

Tests ที่เพิ่ม:
- `test_supply_cap_validation` - ทดสอบ supply cap
- `test_price_deviation_detection` - ทดสอบ price deviation

---

## Admin Operations

### ตั้งค่า Supply Cap
```bash
# เรียกผ่าน instruction: UpdateSupplyCap
# (ต้อง implement ใน instructions.rs)
```

### Reset Circuit Breaker
```bash
# เรียกผ่าน instruction: ResetCircuitBreaker
# (ต้อง implement ใน instructions.rs)
# ต้อง verify ว่า price กลับมาปกติแล้ว
```

---

## Security Considerations

1. **Supply Cap**
   - ตั้งค่าตามความเสี่ยงที่ protocol ยอมรับได้
   - ควร increment เพิ่มได้ แต่ลดไม่ได้ (除非ผ่าน governance)

2. **Circuit Breaker**
   - ควรมี delay ก่อน reset เพื่อป้องกัน flash loan attack
   - ควร notify admin เมื่อ circuit breaker ทำงาน

3. **Multi-Oracle**
   - เลือก secondary oracle ที่มี liquidity และ reliability สูง
   - ตั้ง deviation threshold ให้เหมาะสมกับ volatility ของ asset
