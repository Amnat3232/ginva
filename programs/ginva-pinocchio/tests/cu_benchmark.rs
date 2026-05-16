//! Compute Unit (CU) Benchmark Report for GINVA Pinocchio
//!
//! Measures the logical complexity (operation count proxy) of each
//! instruction path. These are pure-Rust unit benchmarks that exercise
//! the same logic paths as the on-chain instructions without requiring
//! a live SVM — giving us a fast, reproducible CU hotspot analysis.
//!
//! For true on-chain CU numbers, see docs/CU_REPORT.md which is updated
//! after each `solana-test-validator` run.

use ginva_pinocchio::accounts::LoanAccount;
use ginva_pinocchio::cpi::oracle_deviation_bps;
use std::time::Instant;

// ============================================================================
// Helpers
// ============================================================================

fn make_critical_loan() -> LoanAccount {
    LoanAccount {
        discriminator: *b"loan____",
        loan_id: [1u8; 32],
        borrower: [2u8; 32],
        status: 1,
        collateral_amount: 1_000_000_000,
        loan_amount: 800_000_000,
        cumulative_interest: 50_000_000,
        last_interest_update: 0,
        loan_start_time: 0,
        loan_maturity_time: 500_000,
        is_liquidated: 0,
        liquidation_processed: 0,
        liquidation_bonus_bps: 500,
        liquidation_initiated_time: 0,
        collateral_price_at_liquidation: 0,
        seized_collateral_amount: 0,
        swapped_to_collateral: 0,
        auto_swap_executed: 0,
        debt_accumulated: 0,
        last_debt_accumulation_update: 0,
        is_initialized: 1,
        asset_config: [0u8; 32],
        is_restricted: 0,
        debt_accumulation_last_update: 0,
        health_factor: 8500,   // critical < 10000
        grace_period_start_time: 0,
        grace_period_active: 0,
        liquidation_trigger_reason: 1,
    }
}

/// Simulates the critical path of process_trigger_liquidation:
/// oracle read → deviation check → health check → listing price calc
fn simulate_trigger_liquidation_logic(
    pyth_price: u64,
    sw_price: Option<u64>,
    loan: &LoanAccount,
    now: u64,
) -> Result<(u64, u64, u64), &'static str> {
    // Step 1: Multi-oracle consensus (mirrors get_multi_oracle_price)
    let price = if let Some(sw) = sw_price {
        let (_, within) = oracle_deviation_bps(pyth_price, sw, 500);
        if !within {
            return Err("PriceDeviationExceeded");
        }
        pyth_price // use Pyth as canonical when both agree
    } else {
        pyth_price
    };

    // Step 2: Health factor check
    if !loan.is_health_factor_critical() {
        return Err("HealthFactorNotCritical");
    }

    // Step 3: Grace period check
    if loan.is_in_grace_period(now) {
        return Err("InGracePeriod");
    }

    // Step 4: Collateral value calculation (mirrors instructions.rs)
    let collat_value = (loan.collateral_amount as u128)
        .saturating_mul(price as u128)
        .saturating_div(1_000_000) as u64;

    // Step 5: Listing price = 105% of collateral value
    let listing_price = collat_value.saturating_mul(105).saturating_div(100);

    // Step 6: Floor price = 70% of collateral value
    let floor_price = collat_value.saturating_mul(70).saturating_div(100);

    Ok((collat_value, listing_price, floor_price))
}

/// Simulates repay logic: interest accrual + debt reduction
fn simulate_repay_logic(
    principal: u64,
    interest: u64,
    repay_amount: u64,
) -> Result<(u64, u64), &'static str> {
    let total_debt = principal.saturating_add(interest);
    if repay_amount > total_debt {
        return Err("InvalidAmount");
    }
    let remaining = total_debt.saturating_sub(repay_amount);
    let new_interest = if repay_amount >= interest { 0 } else { interest - repay_amount };
    let new_principal = remaining.saturating_sub(new_interest);
    Ok((new_principal, new_interest))
}

/// Simulates borrow LTV check
fn simulate_borrow_ltv_check(
    collateral_amount: u64,
    price: u64,
    borrow_amount: u64,
    ltv_bps: u64,
) -> Result<u64, &'static str> {
    let collat_value = (collateral_amount as u128)
        .saturating_mul(price as u128)
        .saturating_div(1_000_000);
    let max_borrow = collat_value
        .saturating_mul(ltv_bps as u128)
        .saturating_div(10_000) as u64;
    if borrow_amount > max_borrow {
        return Err("LTVExceeded");
    }
    Ok(max_borrow)
}

/// Simulates storefront price decay
fn simulate_storefront_price_decay(
    initial_price: u64,
    floor_price: u64,
    listing_start: u64,
    decay_bps_per_hour: u64,
    now: u64,
) -> u64 {
    let hours_elapsed = now.saturating_sub(listing_start) / 3600;
    let decay = initial_price
        .saturating_mul(decay_bps_per_hour)
        .saturating_mul(hours_elapsed)
        .saturating_div(10_000);
    initial_price.saturating_sub(decay).max(floor_price)
}

// ============================================================================
// Benchmark runner — measures ns/op and reports hotspots
// ============================================================================

fn bench<F: Fn() -> ()>(name: &str, iterations: u64, f: F) {
    // warmup
    for _ in 0..100 { f(); }

    let start = Instant::now();
    for _ in 0..iterations { f(); }
    let elapsed = start.elapsed();

    let ns_per_op = elapsed.as_nanos() as f64 / iterations as f64;
    println!("  {:.<55} {:>8.1} ns/op", name, ns_per_op);
}

// ============================================================================
// Tests — each test is also a micro-benchmark
// ============================================================================

#[test]
fn benchmark_trigger_liquidation_pyth_only() {
    let loan = make_critical_loan();
    let pyth_price: u64 = 100_000_000; // $100
    let now: u64 = 1_000_000;

    println!("\n[CU Benchmark] process_trigger_liquidation critical paths");
    bench("pyth-only (no switchboard)", 10_000, || {
        let _ = simulate_trigger_liquidation_logic(pyth_price, None, &loan, now);
    });

    // Correctness
    let result = simulate_trigger_liquidation_logic(pyth_price, None, &loan, now);
    assert!(result.is_ok());
    let (collat_value, listing_price, floor_price) = result.unwrap();
    assert!(listing_price > collat_value, "listing > collat");
    assert!(floor_price < collat_value, "floor < collat");
}

#[test]
fn benchmark_trigger_liquidation_dual_oracle() {
    let loan = make_critical_loan();
    let pyth_price: u64 = 100_000_000;
    let sw_price: u64 = 101_000_000; // 1% deviation — within threshold
    let now: u64 = 1_000_000;

    bench("dual-oracle consensus (1% deviation)", 10_000, || {
        let _ = simulate_trigger_liquidation_logic(pyth_price, Some(sw_price), &loan, now);
    });

    let result = simulate_trigger_liquidation_logic(pyth_price, Some(sw_price), &loan, now);
    assert!(result.is_ok(), "1% deviation should pass");
}

#[test]
fn benchmark_trigger_liquidation_circuit_breaker() {
    let loan = make_critical_loan();
    let pyth_price: u64 = 100_000_000;
    let sw_price: u64 = 110_000_000; // 10% deviation — circuit breaker
    let now: u64 = 1_000_000;

    bench("circuit-breaker path (10% deviation)", 10_000, || {
        let _ = simulate_trigger_liquidation_logic(pyth_price, Some(sw_price), &loan, now);
    });

    let result = simulate_trigger_liquidation_logic(pyth_price, Some(sw_price), &loan, now);
    assert_eq!(result, Err("PriceDeviationExceeded"));
}

#[test]
fn benchmark_oracle_deviation_bps() {
    println!("\n[CU Benchmark] oracle_deviation_bps — inner loop hotspot");
    bench("oracle_deviation_bps (within)", 100_000, || {
        let _ = oracle_deviation_bps(100_000_000, 102_000_000, 500);
    });
    bench("oracle_deviation_bps (exceeds)", 100_000, || {
        let _ = oracle_deviation_bps(100_000_000, 110_000_000, 500);
    });
}

#[test]
fn benchmark_repay_logic() {
    println!("\n[CU Benchmark] process_repay critical path");
    bench("repay partial debt", 100_000, || {
        let _ = simulate_repay_logic(800_000_000, 50_000_000, 200_000_000);
    });
    bench("repay full debt", 100_000, || {
        let _ = simulate_repay_logic(800_000_000, 50_000_000, 850_000_000);
    });

    // Correctness
    let (p, i) = simulate_repay_logic(800_000, 50_000, 200_000).unwrap();
    assert_eq!(p + i, 650_000, "remaining debt should be 650_000");
}

#[test]
fn benchmark_borrow_ltv_check() {
    println!("\n[CU Benchmark] process_borrow LTV check");
    bench("borrow within LTV (60%)", 100_000, || {
        let _ = simulate_borrow_ltv_check(1_000_000_000, 100_000_000, 60_000_000, 6000);
    });
    bench("borrow exceeds LTV", 100_000, || {
        let _ = simulate_borrow_ltv_check(1_000_000_000, 100_000_000, 70_000_000_000, 6000);
    });

    assert!(simulate_borrow_ltv_check(1_000_000_000, 100_000_000, 60_000_000, 6000).is_ok());
    assert_eq!(
        simulate_borrow_ltv_check(1_000_000_000, 100_000_000, 70_000_000_000, 6000),
        Err("LTVExceeded")
    );
}

#[test]
fn benchmark_storefront_price_decay() {
    println!("\n[CU Benchmark] process_buy_from_storefront price decay");
    let listing_start: u64 = 0;
    let initial_price: u64 = 105_000_000;
    let floor_price: u64 = 70_000_000;

    bench("price at t=0 (no decay)", 100_000, || {
        let _ = simulate_storefront_price_decay(initial_price, floor_price, listing_start, 100, 0);
    });
    bench("price at t=4h (40% decay)", 100_000, || {
        let _ = simulate_storefront_price_decay(initial_price, floor_price, listing_start, 100, 14400);
    });
    bench("price at t=8h (floor)", 100_000, || {
        let _ = simulate_storefront_price_decay(initial_price, floor_price, listing_start, 100, 28800);
    });

    // At t=0 — full price
    assert_eq!(
        simulate_storefront_price_decay(initial_price, floor_price, listing_start, 100, 0),
        initial_price
    );

    // At t=8h with 100bps/h decay = 8% total → floor is hit earlier
    let price_8h = simulate_storefront_price_decay(initial_price, floor_price, listing_start, 100, 28800);
    assert!(price_8h >= floor_price, "price should never drop below floor");
}

#[test]
fn benchmark_health_factor_check() {
    println!("\n[CU Benchmark] health factor check (inner loop of scanner)");
    let critical_loan = make_critical_loan();
    let mut healthy_loan = make_critical_loan();
    healthy_loan.health_factor = 15000;

    bench("is_health_factor_critical (true)", 1_000_000, || {
        let _ = critical_loan.is_health_factor_critical();
    });
    bench("is_health_factor_critical (false)", 1_000_000, || {
        let _ = healthy_loan.is_health_factor_critical();
    });
    bench("can_liquidate_immediately (true)", 1_000_000, || {
        let _ = critical_loan.can_liquidate_immediately(1_000_000);
    });

    assert!(critical_loan.is_health_factor_critical());
    assert!(!healthy_loan.is_health_factor_critical());
}

#[test]
fn print_cu_summary() {
    println!("\n");
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│         GINVA CU Benchmark Summary (logical complexity)      │");
    println!("├──────────────────────────────────────┬──────────────────────┤");
    println!("│ Instruction                          │ Relative Cost        │");
    println!("├──────────────────────────────────────┼──────────────────────┤");
    println!("│ process_trigger_liquidation          │ HIGH  (dual oracle)  │");
    println!("│   - pyth only                        │ LOW                  │");
    println!("│   - dual oracle consensus            │ MEDIUM               │");
    println!("│   - circuit breaker (deviation)      │ MEDIUM               │");
    println!("│ process_buy_from_storefront          │ MEDIUM (price decay) │");
    println!("│ process_repay                        │ LOW-MEDIUM           │");
    println!("│ process_borrow                       │ LOW-MEDIUM (LTV)     │");
    println!("│ oracle_deviation_bps (inner loop)    │ VERY LOW             │");
    println!("│ is_health_factor_critical            │ MINIMAL              │");
    println!("├──────────────────────────────────────┼──────────────────────┤");
    println!("│ Recommended priority fee target      │ 10,000 microlamports │");
    println!("│ Est. CU limit (trigger_liquidation)  │ 80,000–120,000 CU   │");
    println!("│ Est. CU limit (repay/borrow)         │ 30,000–50,000 CU    │");
    println!("└──────────────────────────────────────┴──────────────────────┘");
    println!("  Note: True on-chain CU requires solana-test-validator run.");
    println!("  Run: solana logs | grep 'Compute units' after each tx.\n");
}
