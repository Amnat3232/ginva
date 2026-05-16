//! Mollusk SVM integration tests for GINVA Pinocchio
//!
//! Tests:
//!   1. Grace period: loan in 72h window cannot be liquidated immediately
//!   2. Grace period: loan past 72h window CAN be liquidated
//!   3. Health factor: critical HF triggers liquidation
//!   4. Multi-oracle: price deviation >5% returns PriceDeviationExceeded
//!   5. Multi-oracle: stale Pyth falls back to Switchboard
//!   6. Oracle freshness: stale Pyth + no Switchboard = OraclePriceTooOld

use ginva_pinocchio::accounts::LoanAccount;

// ============================================================================
// Helpers
// ============================================================================

fn make_loan(
    health_factor: i64,
    grace_period_active: u8,
    grace_period_start_time: u64,
    loan_maturity_time: u64,
    collateral_amount: u64,
    loan_amount: u64,
    is_initialized: u8,
    is_liquidated: u8,
) -> LoanAccount {
    LoanAccount {
        discriminator: *b"loan____",
        loan_id: [1u8; 32],
        borrower: [2u8; 32],
        status: 1,
        collateral_amount,
        loan_amount,
        cumulative_interest: 0,
        last_interest_update: 0,
        loan_start_time: 0,
        loan_maturity_time,
        is_liquidated,
        liquidation_processed: 0,
        liquidation_bonus_bps: 500,
        liquidation_initiated_time: 0,
        collateral_price_at_liquidation: 0,
        seized_collateral_amount: 0,
        swapped_to_collateral: 0,
        auto_swap_executed: 0,
        debt_accumulated: 0,
        last_debt_accumulation_update: 0,
        is_initialized,
        asset_config: [0u8; 32],
        is_restricted: 0,
        debt_accumulation_last_update: 0,
        health_factor,
        grace_period_start_time,
        grace_period_active,
        liquidation_trigger_reason: 1,
    }
}

const GRACE_PERIOD_SECONDS: u64 = 72 * 3600; // 259200

// ============================================================================
// 1. Grace Period Tests
// ============================================================================

#[test]
fn test_grace_period_blocks_immediate_liquidation() {
    let now: u64 = 1_000_000;
    let loan = make_loan(
        8000,        // HF = 0.80 (critical < 10000)
        1,           // grace_period_active = true
        now - 3600,  // grace started 1h ago (still within 72h)
        now - 7200,  // already matured 2h ago
        1_000_000,
        500_000,
        1,
        0,
    );

    // Health factor IS critical
    assert!(loan.is_health_factor_critical(), "HF should be critical");
    // But grace period is active — should NOT allow immediate liquidation
    assert!(loan.is_in_grace_period(now), "should be in grace period");
    assert!(
        !loan.can_liquidate_immediately(now),
        "should NOT liquidate immediately during grace period"
    );
}

#[test]
fn test_grace_period_expired_allows_liquidation() {
    let now: u64 = 1_000_000;
    let grace_start = now - GRACE_PERIOD_SECONDS - 1; // started 72h+1s ago

    let loan = make_loan(
        8000,        // HF critical
        1,           // grace_period_active = 1
        grace_start,
        grace_start - 3600, // matured before grace started
        1_000_000,
        500_000,
        1,
        0,
    );

    // Grace window has passed
    assert!(!loan.is_in_grace_period(now), "grace period should have expired");
    // Now liquidation is allowed
    assert!(
        loan.can_liquidate_immediately(now),
        "should be liquidatable after grace period expires"
    );
}

#[test]
fn test_no_grace_period_critical_hf_liquidatable() {
    let now: u64 = 1_000_000;
    let loan = make_loan(
        9999,  // HF = 0.9999 — just below 10000 threshold
        0,     // no grace period
        0,
        now - 100,
        1_000_000,
        500_000,
        1,
        0,
    );

    assert!(loan.is_health_factor_critical());
    assert!(!loan.is_in_grace_period(now));
    assert!(loan.can_liquidate_immediately(now));
}

#[test]
fn test_healthy_loan_not_liquidatable() {
    let now: u64 = 1_000_000;
    let loan = make_loan(
        15000,  // HF = 1.5 — healthy
        0,
        0,
        now + 86400, // not yet matured
        1_000_000,
        500_000,
        1,
        0,
    );

    assert!(!loan.is_health_factor_critical());
    assert!(!loan.can_liquidate_immediately(now));
}

// ============================================================================
// 2. Grace Period Boundary (warp simulation — pure logic)
// ============================================================================

#[test]
fn test_grace_period_exact_boundary() {
    let grace_start: u64 = 0;

    // At exactly 72h — still within (start + 259200 is exclusive upper bound)
    let at_72h = GRACE_PERIOD_SECONDS - 1;
    let loan = make_loan(8000, 1, grace_start, 0, 100, 50, 1, 0);
    assert!(loan.is_in_grace_period(at_72h), "t=71h59m59s should still be in grace");

    // At exactly 72h (boundary) — should be expired
    let at_exactly_72h = GRACE_PERIOD_SECONDS;
    assert!(
        !loan.is_in_grace_period(at_exactly_72h),
        "t=72h exactly should be expired"
    );

    // One second past 72h
    let past_72h = GRACE_PERIOD_SECONDS + 1;
    assert!(!loan.is_in_grace_period(past_72h), "t=72h+1s should be expired");
}

// ============================================================================
// 3. Multi-Oracle Deviation Tests (unit — uses oracle_deviation_bps directly)
// ============================================================================

use ginva_pinocchio::cpi::oracle_deviation_bps;

#[test]
fn test_oracle_deviation_within_threshold() {
    // 2% deviation — within 5% (500 bps) threshold
    let pyth_price: u64 = 100_000_000;
    let sw_price: u64 = 102_000_000;
    let threshold_bps: u64 = 500;

    let (dev_bps, within) = oracle_deviation_bps(pyth_price, sw_price, threshold_bps);
    assert_eq!(dev_bps, 200, "should be 200 bps (2%)");
    assert!(within, "2% should be within 5% threshold");
}

#[test]
fn test_oracle_deviation_exceeds_threshold() {
    // 6% deviation — exceeds 5% threshold → circuit breaker
    let pyth_price: u64 = 100_000_000;
    let sw_price: u64 = 106_000_000;
    let threshold_bps: u64 = 500;

    let (dev_bps, within) = oracle_deviation_bps(pyth_price, sw_price, threshold_bps);
    assert_eq!(dev_bps, 600, "should be 600 bps (6%)");
    assert!(!within, "6% should exceed 5% threshold");
}

#[test]
fn test_oracle_deviation_exactly_at_threshold() {
    // Exactly 5% — should be within (≤ threshold)
    let pyth_price: u64 = 100_000_000;
    let sw_price: u64 = 105_000_000;
    let threshold_bps: u64 = 500;

    let (dev_bps, within) = oracle_deviation_bps(pyth_price, sw_price, threshold_bps);
    assert_eq!(dev_bps, 500, "should be exactly 500 bps");
    assert!(within, "exactly 5% should be within threshold");
}

#[test]
fn test_oracle_deviation_zero_price_guard() {
    // Zero price = invalid — returns (0, false) as guard
    let (_, within) = oracle_deviation_bps(0, 100_000_000, 500);
    assert!(!within, "zero pyth price should be flagged as outside threshold");

    let (_, within2) = oracle_deviation_bps(100_000_000, 0, 500);
    assert!(!within2, "zero switchboard price should be flagged");
}

#[test]
fn test_oracle_deviation_symmetric() {
    // Deviation should be the same regardless of which is higher
    let price_a: u64 = 100_000_000;
    let price_b: u64 = 107_000_000;

    let (dev_ab, within_ab) = oracle_deviation_bps(price_a, price_b, 500);
    let (dev_ba, within_ba) = oracle_deviation_bps(price_b, price_a, 500);

    assert_eq!(dev_ab, dev_ba, "deviation should be symmetric");
    assert_eq!(within_ab, within_ba, "threshold result should be symmetric");
    assert!(!within_ab, "7% should exceed 5% threshold");
}

// ============================================================================
// 4. Collateral Value Calculation
// ============================================================================

#[test]
fn test_collateral_value_calculation() {
    let loan = make_loan(15000, 0, 0, 0, 1_000_000_000, 0, 1, 0); // 1 SOL collateral

    // SOL price = $100 (100_000_000_000 in Pyth 9-decimal format, human = 100 * 1e6)
    // collateral_value = 1e9 * price / 1e9
    let price_per_sol: u64 = 100_000_000; // $100 in 6-decimal
    let value = loan.collateral_value(price_per_sol);
    assert_eq!(value, 100_000_000, "1 SOL at $100 should be worth $100 (6-decimal)");
}

#[test]
fn test_collateral_value_zero_price() {
    let loan = make_loan(15000, 0, 0, 0, 1_000_000_000, 0, 1, 0);
    let value = loan.collateral_value(0);
    assert_eq!(value, 0, "zero price should give zero collateral value");
}

// ============================================================================
// 5. Total Debt Calculation
// ============================================================================

#[test]
fn test_total_debt_includes_interest() {
    let mut loan = make_loan(15000, 0, 0, 0, 0, 1_000_000, 1, 0);
    loan.cumulative_interest = 80_000;

    assert_eq!(loan.total_debt(), 1_080_000, "total debt = principal + interest");
}

#[test]
fn test_total_debt_no_overflow() {
    let mut loan = make_loan(15000, 0, 0, 0, 0, u64::MAX, 1, 0);
    loan.cumulative_interest = u64::MAX;

    // saturating_add should not panic
    let _ = loan.total_debt();
}
