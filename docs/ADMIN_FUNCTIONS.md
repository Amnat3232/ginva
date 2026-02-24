# GINVA Admin Functions Summary

## Summary of Functions Admin Can Update

---

## 1. Emergency Controls

| Function           | Description                      | Parameters |
| ------------------ | -------------------------------- | ---------- |
| `emergency_pause`  | Emergency pause entire system    | -          |
| `emergency_resume` | Resume system (48 hour timelock) | -          |

**Security:** Admin only

---

## 2. Protocol Configuration

| Function                 | Description               | Parameters |
| ------------------------ | ------------------------- | ---------- |
| `update_protocol_config` | Update main system config |            |

**Parameters that can be updated:**

- `new_timeout` - Liquidation timeout (seconds)
- `new_swap_reward_bps` - Swap reward (1% = 100 bps)
- `new_distribute_reward_bps` - Distribute reward (1% = 100 bps)
- `new_min_loan` - Minimum loan amount
- `new_max_loan` - Maximum loan amount

---

## 3. Interest Rates

| Function                | Description           | Parameters                              |
| ----------------------- | --------------------- | --------------------------------------- |
| `update_interest_rates` | Update interest rates | `new_base_rate_bps`, `new_max_rate_bps` |

**Constraints:**

- Base rate: 0.5% - 20% per year (50 - 2000 bps)
- Max rate: Base rate - 50% (5000 bps max)
- **Cooldown:** Can update every 1 day

---

## 4. LTV Levels

| Function            | Description             | Parameters                                        |
| ------------------- | ----------------------- | ------------------------------------------------- |
| `update_ltv_levels` | Update all 3 LTV levels | `new_ltv_safe`, `new_ltv_standard`, `new_ltv_max` |

**Constraints:**

- Safe: 1% - 30%
- Standard: Safe < Standard ≤ 50%
- Max: Standard < Max ≤ 90%
- **Cooldown:** Can update every 1 day

---

## 5. Asset Configuration

| Function              | Description                       | Parameters |
| --------------------- | --------------------------------- | ---------- |
| `update_asset_config` | Update config for each asset type |            |

**Parameters that can be updated:**

- `is_active` - Enable/disable asset
- `max_ltv` - Maximum LTV for this asset
- `liquidation_threshold` - Level for asset seizure
- `new_feed_id_hex` - New Pyth Oracle Feed ID

---

## 6. Operations Wallet

| Function            | Description                  | Parameters               |
| ------------------- | ---------------------------- | ------------------------ |
| `update_ops_wallet` | Change fee collection wallet | `new_ops_wallet: Pubkey` |

**Purpose:** Receive fees for team operations (salary, server, marketing)

---

## 7. Initialization

| Function           | Description                                 |
| ------------------ | ------------------------------------------- |
| `initialize`       | Create System Config first time (set admin) |
| `initialize_asset` | Add new asset (SOL, BTC, ETH)               |

---

## Summary: Admin Can Update All 7 Categories

```
1. Emergency Controls     → pause / resume system
2. Protocol Config       → timeout, rewards, loan limits
3. Interest Rates        → base rate, max rate (1 day cooldown)
4. LTV Levels            → 3 levels (1 day cooldown)
5. Asset Config          → enable/disable, LTV, threshold, oracle
6. Ops Wallet            → change wallet address
7. Initialization        → initial setup
```

---

## Security Notes

- Every function requires `AdminOnly` constraint
- Interest rate and LTV have 1 day cooldown to prevent frequent changes
- Emergency pause/resume has 48 hour timelock after resume before transactions can proceed

---

## Program ID

```
2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou
```
