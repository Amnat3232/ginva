# GINVA Admin Functions Summary

> **⚠️ NOTE:** Interest Rate and LTV are now **HARDCODED** and **IMMUTABLE**.  
> This document reflects the current state after making parameters immutable.

---

## Summary

| Function           | Description                          | Parameters            | Status         |
| ------------------ | ------------------------------------ | --------------------- | -------------- |
| Emergency Controls | Pause/Resume system                  | -                     | ✅ Active      |
| Protocol Config    | Update timeout, rewards, loan limits | Multiple              | ✅ Active      |
| Interest Rates     | ~~Update interest rates~~            | ~~Base/Max rate~~     | ❌ **REMOVED** |
| LTV Levels         | ~~Update LTV levels~~                | ~~Safe/Standard/Max~~ | ❌ **REMOVED** |
| Asset Config       | Enable/disable assets                | Multiple              | ✅ Active      |
| Ops Wallet         | Change fee collection wallet         | Wallet address        | ✅ Active      |
| Initialization     | Initial setup                        | -                     | ✅ One-time    |

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

## 3. Interest Rates ⚠️ REMOVED

> **Interest rate is now HARDCODED at 8% APR**

| Previous Function       | Status     |
| ----------------------- | ---------- |
| `update_interest_rates` | ❌ Removed |

**Current State:**

- **Fixed APR:** 8% (800 bps)
- **Cannot be changed** after deployment
- To modify: Deploy new contract version

---

## 4. LTV Levels ⚠️ REMOVED

> **LTV levels are now HARDCODED and IMMUTABLE**

| Previous Function   | Status     |
| ------------------- | ---------- |
| `update_ltv_levels` | ❌ Removed |

**Current State:**

| Level    | Value | Can Change? |
| -------- | ----- | ----------- |
| Safe     | 20%   | ❌ No       |
| Standard | 40%   | ❌ No       |
| Max      | 60%   | ❌ No       |

To modify: Deploy new contract version

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

## Summary

```
1. Emergency Controls     → pause / resume system
2. Protocol Config       → timeout, rewards, loan limits
3. Interest Rates        → ❌ REMOVED (now hardcoded at 8%)
4. LTV Levels            → ❌ REMOVED (now hardcoded: 20/40/60%)
5. Asset Config          → enable/disable, LTV, threshold, oracle
6. Ops Wallet            → change wallet address
7. Initialization        → initial setup
```

---

## Why Hardcoded?

| Benefit              | Explanation                                                    |
| -------------------- | -------------------------------------------------------------- |
| **Security**         | No admin can change rates - eliminates single point of failure |
| **Transparency**     | Users know exactly what they'll get - forever                  |
| **Decentralization** | No trust required in any single person                         |
| **Simplicity**       | Code is simpler = fewer bugs = safer                           |

---

## Security Notes

- Every function requires `AdminOnly` constraint
- Emergency pause/resume has 48 hour timelock
- Interest rate and LTV changes: **No longer possible** (hardcoded)

---

## Program ID

```
GftCyWhaeScy9hAm56jigTCDgagi46UZzKEnWLH8mgqH
```
