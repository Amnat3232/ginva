# GINVA Compute Unit (CU) Report

> Updated: 2026-05-17 | Solana CLI 3.1.15 | platform-tools v1.52

---

## Benchmark Results (Logic-Level — ns/op)

These are pure-Rust timing benchmarks that exercise the same logic paths
as the on-chain instructions. They measure relative hotspot cost, not
absolute on-chain CU. True CU numbers require `solana-test-validator`.

| Instruction Path | ns/op | Relative Cost |
|-----------------|-------|---------------|
| `oracle_deviation_bps` (within) | ~50 | MINIMAL |
| `oracle_deviation_bps` (exceeds) | ~50 | MINIMAL |
| `is_health_factor_critical` | ~2 | MINIMAL |
| `can_liquidate_immediately` | ~3 | MINIMAL |
| `process_borrow` LTV check | ~200 | LOW |
| `process_repay` partial | ~150 | LOW |
| `process_repay` full | ~150 | LOW |
| `storefront` price decay (t=0) | ~100 | LOW |
| `storefront` price decay (t=4h) | ~120 | LOW |
| `trigger_liquidation` pyth-only | ~400 | MEDIUM |
| `trigger_liquidation` dual-oracle | ~500 | MEDIUM |
| `trigger_liquidation` circuit-breaker | ~450 | MEDIUM |

---

## Estimated On-Chain CU (devnet observation)

| Instruction | Estimated CU | Recommended Limit |
|-------------|-------------|-------------------|
| `process_deposit` | 15,000–25,000 | 50,000 |
| `process_borrow` | 25,000–40,000 | 60,000 |
| `process_repay` | 20,000–35,000 | 60,000 |
| `process_trigger_liquidation` (pyth-only) | 50,000–80,000 | 120,000 |
| `process_trigger_liquidation` (dual-oracle) | 60,000–100,000 | 150,000 |
| `process_buy_from_storefront` | 40,000–70,000 | 120,000 |
| `process_finalize_liquidation` | 30,000–50,000 | 80,000 |

> Note: Dual-oracle path adds ~20% CU overhead over pyth-only.
> Circuit breaker path is similar to dual-oracle (fails fast on deviation check).

---

## Hotspots Identified

1. **`get_multi_oracle_price`** — reads two accounts, does i128 arithmetic, two freshness checks.
   Optimization: cache oracle reads across instructions in the same tx if possible.

2. **`process_trigger_liquidation`** — touches 10+ accounts, writes 3 PDAs.
   Optimization: batch PDA validation before any writes.

3. **`process_buy_from_storefront`** — two token transfers + storefront state writes.
   Optimization: use `ComputeBudgetInstruction::set_loaded_accounts_data_size_limit`.

---

## Priority Fee Recommendation

```typescript
// Keeper bot should set:
ComputeBudgetProgram.setComputeUnitLimit({ units: 150_000 })  // for trigger_liquidation
ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 })  // priority fee
```

---

## How to Get True On-Chain CU

```bash
# 1. Start local validator with ginva program
solana-test-validator --bpf-program DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47 \
  programs/ginva-pinocchio/target/sbf-solana-solana/release/ginva_pinocchio.so

# 2. Run a transaction and grep logs
solana logs | grep "Compute units consumed"

# 3. Or use cargo test-sbf (when Mollusk openssl issue resolved)
cargo test-sbf --manifest-path programs/ginva-pinocchio/Cargo.toml
```

---

## Run Benchmarks

```bash
cargo test --manifest-path programs/ginva-pinocchio/Cargo.toml \
  --test cu_benchmark -- --nocapture
```
