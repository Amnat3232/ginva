# Plan: Dynamic Protocol Configuration

## Goal

แก้ไข smart contract ให้ใช้ค่าจาก `SystemConfig` แทน hardcoded constants เพื่อให้ admin สามารถปรับ parameters ได้แบบ dynamic

---

## Step 1: เพิ่ม fields ใหม่ใน SystemConfig

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~1069 (หลัง `ops_resume_at`)

```rust
    // Dynamic Configuration
    pub liquidation_timeout: i64,
    pub auto_swap_reward_bps: u64,
    pub distribute_reward_bps: u64,
    pub min_loan_size: u64,
    pub max_loan_size: u64,
}
```

---

## Step 2: อัปเดต initialize_system

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~65-70 (หลัง `pause_reason = [0u8; 50]`)

**เพิ่มหลัง `ops_resume_at = 0`:**

```rust
        // Dynamic Configuration
        system_config.liquidation_timeout = 2; // Devnet: 2 seconds (Prod: 86400)
        system_config.auto_swap_reward_bps = 600; // 6%
        system_config.distribute_reward_bps = 100; // 1%
        system_config.min_loan_size = 1_000_000; // Min: 1 USDC
        system_config.max_loan_size = 1_000_000_000_000; // Max: 1M USDC
```

---

## Step 3: เพิ่ม update_protocol_config function

**File:** `programs/ginva/src/lib.rs`
**Location:** หลัง `emergency_resume()` function (~บรรทัด 110)

```rust
    // ═════════════════════════════════════════════════════════════════════
    // ⚙️ FEATURE: ADMIN CONFIG UPDATES (Dynamic Parameters)
    // ═════════════════════════════════════════════════════════════════════
    pub fn update_protocol_config(
        ctx: Context<AdminOnly>,
        new_timeout: Option<i64>,
        new_swap_reward_bps: Option<u64>,
        new_distribute_reward_bps: Option<u64>,
        new_min_loan: Option<u64>,
        new_max_loan: Option<u64>,
    ) -> Result<()> {
        let system_config = &mut ctx.accounts.system_config;

        if let Some(timeout) = new_timeout {
            require!(timeout > 0, GinvaError::InvalidAmount);
            system_config.liquidation_timeout = timeout;
            msg!("✅ Liquidation timeout updated to {} seconds", timeout);
        }

        if let Some(reward) = new_swap_reward_bps {
            require!(reward < 10000, Gin�Error::InvalidAmount);
            system_config.auto_swap_reward_bps = reward;
            msg!("✅ Swap reward updated to {}%", reward / 100);
        }

        if let Some(reward) = new_distribute_reward_bps {
            require!(reward < 10000, GinvaError::InvalidAmount);
            system_config.distribute_reward_bps = reward;
            msg!("✅ Distribute reward updated to {}%", reward / 100);
        }

        if let Some(min_loan) = new_min_loan {
            system_config.min_loan_size = min_loan;
            msg!("✅ Min loan size updated to {} units", min_loan);
        }
        if let Some(max_loan) = new_max_loan {
            system_config.max_loan_size = max_loan;
            msg!("✅ Max loan size updated to {} units", max_loan);
        }

        Ok(())
    }
```

---

## Step 4: Refactor trigger_liquidation

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~248

**เปลี่ยนบรรทัด:**

```rust
// เดิม:
deadline_for_swap = current_time + LIQUIDATION_TIMEOUT

// ใหม่:
deadline_for_swap = current_time + system_config.liquidation_timeout
```

**Context struct TriggerLiquidation ต้องเปลี่ยนจาก:**

```rust
#[account(mut, seeds = [b"config"], bump)]
pub system_config: Box<Account<'info, SystemConfig>>,
```

เป็น:

```rust
#[account(mut, seeds = [b"config"], bump)]
pub system_config: &' mut Account<'info, SystemConfig>,
```

---

## Step 5: Refactor execute_auto_swap

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~365

**เปลี่ยน 2 จุด:**

1. **Reward calculation:**

```rust
// เดิม:
.saturating_mul(AUTO_SWAP_REWARD_BPS)

// ใหม่:
.saturating_mul(ctx.accounts.system_config.auto_swap_reward_bps)
```

2. **Timeout:**

```rust
// เดิม:
deadline_for_swap = current_time + LIQUIDATION_TIMEOUT

// ใหม่:
deadline_for_swap = current_time + ctx.accounts.system_config.liquidation_timeout
```

**Context struct ExecuteAutoSwap ต้องเปลี่ยน system_config เป็น `&mut Account`**

---

## Step 6: Refactor finalize_liquidation

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~467

**เปลี่ยน:**

```rust
// เดิม:
.saturating_mul(DISTRIBUTE_REWARD_BPS)

// ใหม่:
.saturating_mul(ctx.accounts.system_config.distribute_reward_bps)
```

---

## Step 7: Refactor claim_expired_swap

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~595

**Context struct ClaimExpiredSwap ต้องเพิ่ม:**

```rust
#[account(mut, seeds = [b"config"], bump)]
pub system_config: &' mut Account<'info, SystemConfig>,
```

**Function body เปลี่ยน:**

```rust
// เดิม:
liquidation_process.deadline_for_swap = current_time + LIQUIDATION_TIMEOUT;

// ใหม่:
liquidation_process.deadline_for_swap = current_time + ctx.accounts.system_config.liquidation_timeout;
```

---

## Step 8: Refactor claim_expired_distribution

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~615

**Context struct ClaimExpiredDistribution ต้องเพิ่ม:**

```rust
#[account(mut, seeds = [b"config"], bump)]
pub system_config: &' mut Account<'info, SystemConfig>,
```

---

## Step 9: ลบ Constants ที่ไม่ใช้แล้ว

**File:** `programs/ginva/src/lib.rs`
**Location:** บรรทัด ~30-32

**ลบ 3 บรรทัดนี้:**

```rust
const LIQUIDATION_TIMEOUT: i64 = 2;
const AUTO_SWAP_REWARD_BPS: u64 = 600;
const DISTRIBUTE_REWARD_BPS: u64 = 100;
```

---

## Summary of Changes

| File     | Changes                                 |
| -------- | --------------------------------------- |
| `lib.rs` | +5 fields in SystemConfig               |
| `lib.rs` | +6 lines in initialize_system           |
| `lib.rs` | +~35 lines for update_protocol_config() |
| `lib.rs` | -3 lines (deleted constants)            |
| `lib.rs` | ~8 refactorings across functions        |

---

## Post-Implementation

```bash
cargo build-sbf  # Verify build
anchor test      # Run tests
git add .
git commit -m "feat: dynamic protocol configuration"
git push
```
