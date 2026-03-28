# MOC - Smart Contract

**Map of Content: Smart Contract (Pinocchio)**  
**Last Updated:** 2026-03-28

This page serves as the central hub for everything related to Ginva's Smart Contract.

## Overview
Ginva Smart Contract ใช้ **Pinocchio** framework (no_std) เพื่อลดขนาด binary และ attack surface ให้ต่ำที่สุด  
ตั้งอยู่ที่ `programs/ginva-pinocchio/`

**Core Philosophy**: Immutable-first + Maximum safety + Minimal trust

---

## Key Documents

### Core Architecture
- [[03-Smart-Contract/Processor-Overview]] → ภาพรวมโครงสร้าง Processor
- [[03-Smart-Contract/Instructions]] → รายการ Instruction ทั้งหมด
- [[02-Architecture/Pinocchio-Framework]] → รายละเอียด Pinocchio และข้อแตกต่างจาก Anchor
- [[03-Smart-Contract/Account-Validation-Rules]] → กฎการ validate account (สำคัญมาก)

### Critical Logic
- [[02-Architecture/Liquidation-Waterfall]] → Liquidation flow
- [[03-Smart-Contract/Emergency-Pause]] → Emergency pause mechanism
- [[02-Architecture/Security-Model]] → โมเดลความปลอดภัยโดยรวม

### Safety & Best Practices
- [[03-Smart-Contract/Common-Pitfalls]] → ข้อผิดพลาดที่พบบ่อย (no_std, arithmetic, CPI)
- [[07-Security-Audit]] → ผลการ audit และ findings

---

## Main Components

### Source Files

| File | Path | Purpose |
|------|------|---------|
| lib.rs | `programs/ginva-pinocchio/src/lib.rs` | Program entrypoint, constants, error codes |
| instructions.rs | `programs/ginva-pinocchio/src/instructions.rs` | Instruction enum and dispatcher |
| accounts.rs | `programs/ginva-pinocchio/src/accounts.rs` | Account validation and loading |
| cpi.rs | `programs/ginva-pinocchio/src/cpi.rs` | Cross-program invocation helpers |
| tests.rs | `programs/ginva-pinocchio/src/tests.rs` | Unit tests |

### Instructions (12 total)
Source: `programs/ginva-pinocchio/src/instructions.rs:22-35`

```rust
#[repr(u8)]
pub enum GinvaInstruction {
    InitializeSystem = 0,
    InitializeProtocolConfig = 1,
    InitializeAsset = 2,
    Deposit = 3,
    Borrow = 4,
    Repay = 5,
    Liquidate = 6,
    Withdraw = 7,
    StakeAgent = 8,
    UnstakeAgent = 9,
    RegisterKeeper = 10,
    KeeperHeartbeat = 11,
}
```

### Important Parameters (Hardcoded)
Source: `programs/ginva-pinocchio/src/lib.rs:51-54`

| Parameter | Value | Line |
|-----------|-------|------|
| Interest Rate | **8% APR fixed** | `lib.rs:51` |
| LTV Safe | **20%** | `lib.rs:52` |
| LTV Standard | **40%** | `lib.rs:53` |
| LTV Max | **60%** | `lib.rs:54` |
| Interest Precision | 1,000,000 | `lib.rs:37` |
| Max Price Change | 500 bps (5%) | `lib.rs:29` |

### Agent Revenue Shares
Source: `programs/ginva-pinocchio/src/lib.rs:83-85`

```rust
pub const AGENT_REVENUE_HUMAN_SHARE_BPS: u16 = 4500;   // 45%
pub const AGENT_REVENUE_AI_SHARE_BPS: u16 = 3500;      // 35%
pub const AGENT_REVENUE_PROTOCOL_SHARE_BPS: u16 = 2000; // 20%
```

---

## Status & Next Steps (Smart Contract)

### Current Status (28 มีนาคม 2026)
- **Framework**: Pinocchio (no_std) — Migration เสร็จสมบูรณ์
- **Deployment**: Deployed บน Devnet (Program ID: `HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj`)
- **CI/CD**: Workflow กำลัง stabilize (cargo build-sbf)
- **Security Level**: High (Hardcoded params, Account validation เข้มงวด)
- **Test Coverage**: Unit tests ผ่าน แต่ Integration tests ยังไม่ครบ
- **Frontend Integration**: Program ID ถูกเชื่อมต่อกับ Vercel deployment แล้ว

**จุดแข็งปัจจุบัน**:
- Immutable parameters หลัก ๆ เรียบร้อย
- Liquidation logic พื้นฐานพร้อมใช้งาน
- ป้องกันการ bypass Supply Cap ได้ในระดับหนึ่ง

**จุดที่ยังอ่อน**:
- ยังไม่มี Supply Cap / Borrow Cap ที่ชัดเจน
- ยังไม่มี Oracle Circuit Breaker
- Emergency Pause ยังไม่ implement

### Next Steps (เรียงตามลำดับความสำคัญ)

**Priority 1 (ต้องทำด่วนที่สุด)**
- [ ] เพิ่ม **Supply Cap** และ **Borrow Cap** สำหรับแต่ละ collateral (SOL, BTC, ETH)
- [ ] Implement **Oracle Circuit Breaker** (ป้องกันราคาพุ่งแบบ Venus Protocol)
- [ ] เพิ่ม **Multi-Oracle** (Pyth + Switchboard) + Price deviation check

**Priority 2**
- [ ] Implement **Emergency Pause** instruction + Timelock
- [ ] เพิ่ม Keeper reward distribution logic ให้สมบูรณ์ (Waterfall 45/35/20)
- [ ] เพิ่ม comprehensive integration tests (deposit → borrow → liquidate flow)

**Priority 3**
- [ ] Optimize binary size ให้เล็กกว่า 1MB (Pinocchio advantage)
- [ ] เพิ่ม Shield Fee logic (5% ใน 15 วันแรก)
- [ ] เขียน formal Security Documentation + Post-mortem template

**Priority 4 (ระยะยาว)**
- [ ] Audit รอบสุดท้ายโดย third-party
- [ ] เตรียมการ upgrade program สำหรับ mainnet
- [ ] Cross-chain collateral support (ถ้ามี)

### Success Criteria
- ผ่าน `cargo test --release` 100%
- มี Circuit Breaker + Supply Cap ทำงาน
- Liquidation + Keeper flow ทำงานถูกต้องบน devnet
- Frontend สามารถ interact กับ program ได้ปกติ

---

## Related MOCs
- [[MOCs/MOC-Keeper-System]] → Keeper Bots และ AI Agent
- [[MOCs/MOC-Security]] → Security & Risk Management

---

## Quick Links
- [[Deployment-Links]] → Devnet + Production links
- [[01-Project-Overview]] → Project overview
- [[08-Next-Steps]] → Full roadmap

**Tip**: ทุกครั้งที่แก้ไข Smart Contract ต้อง:
1. `cargo test --release` ผ่านก่อน
2. Build ด้วย `cargo build-sbf --release`
3. อัปเดต Obsidian Vault ด้วย prompt "Update Ginva Obsidian Vault with latest changes"

---

**Connected Notes:**
- [[01-Project-Overview]]
- [[Deployment-Links]]
- [[02-Architecture/Security-Model]]
- [[08-Next-Steps]]

---
**Last Updated**: 2026-03-28
