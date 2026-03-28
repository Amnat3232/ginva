# Security Hardening - Phase 2

## Overview

Phase 2 adds three major security features to the protocol:
- **Supply Cap** - Limits the maximum amount that can be deposited/borrowed per asset
- **Oracle Circuit Breaker** - Pauses operations when price anomalies are detected
- **Multi-Oracle** - Validates prices from multiple oracle sources to prevent manipulation

---

## 1. Supply Cap

### Purpose
Prevents the protocol from taking on excessive risk exposure to a single asset.

### Implementation
```rust
// In AssetConfig
pub supply_cap: u64  // 0 = unlimited (no cap)

// Check before deposit/borrow
if asset.is_supply_cap_exceeded(amount) {
    return Err(GinvaError::SupplyCapExceeded);
}
```

### Example Configuration
| Asset | Supply Cap | Notes |
|-------|-----------|-------|
| USDC | 10,000,000 | Primary stablecoin |
| SOL | 1,000,000 | Native token |
| ETH | 500,000 | Wrapped ETH |

### Calculation Logic
```rust
pub fn is_supply_cap_exceeded(&self, additional_amount: u64) -> bool {
    if !self.has_supply_cap() {
        return false;  // cap = 0 means unlimited
    }
    self.total_reserve.saturating_add(additional_amount) > self.supply_cap
}
```

---

## 2. Oracle Circuit Breaker

### Purpose
Halts protocol operations when price manipulation or oracle malfunction is detected.

### Trigger Conditions
1. **Price Deviation** - Price changes exceed threshold within short timeframe
2. **Oracle Divergence** - Prices from 2 oracles differ excessively
3. **Stale Price** - Price hasn't updated within max_staleness period

### Implementation
```rust
// In AssetConfig
pub price_deviation_threshold_bps: u16  // e.g., 500 = 5%
pub last_price: u64
pub last_price_update: u64

// Check price deviation
if asset.is_price_deviation_exceeded(new_price) {
    oracle_config.trigger_circuit_breaker();
    return Err(GinvaError::PriceDeviationTooHigh);
}
```

### Threshold Configuration
| Threshold (bps) | Percentage | Use Case |
|-----------------|------------|----------|
| 100 | 1% | Conservative - stablecoins |
| 500 | 5% | Standard - major assets |
| 1000 | 10% | Aggressive - volatile assets |

### Circuit Breaker Reset
```rust
// Only admin can reset after verification
pub fn reset_circuit_breaker(&mut self) {
    self.is_circuit_breaker_active = 0;
}
```

---

## 3. Multi-Oracle

### Purpose
Validates prices from multiple sources to prevent single point of failure and manipulation attacks.

### Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Pyth Oracle   │    │   Switchboard   │
│    (Primary)    │    │   (Secondary)   │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
            ┌───────▼───────┐
            │  Aggregation  │
            │    Logic      │
            └───────┬───────┘
                    │
            ┌───────▼───────┐
            │  Final Price  │
            └───────────────┘
```

### Implementation
```rust
// In AssetOracleConfig
pub secondary_oracle_pubkey: [u8; 32]
pub secondary_oracle_type: u8  // 0=none, 1=pyth, 2=switchboard
pub oracle_deviation_threshold_bps: u16  // e.g., 200 = 2%

// Fetch and aggregate prices
let (aggregated_price, is_valid) = oracle_config.get_aggregated_price(
    pyth_price,
    secondary_price
);

if !is_valid {
    return Err(GinvaError::OracleDivergenceDetected);
}
```

### Price Aggregation Logic
```rust
pub fn get_aggregated_price(&self, pyth_price: u64, secondary_price: u64) -> (u64, bool) {
    // Single oracle mode
    if !self.has_secondary_oracle() {
        return (pyth_price, pyth_price > 0);
    }
    
    // Validate both prices exist
    if pyth_price == 0 || secondary_price == 0 {
        return (0, false);
    }
    
    // Calculate deviation
    let (lower, upper) = if pyth_price <= secondary_price {
        (pyth_price, secondary_price)
    } else {
        (secondary_price, pyth_price)
    };
    
    let deviation_bps = ((upper - lower) * 10000) / lower;
    
    // Reject if deviation exceeds threshold
    if deviation_bps > self.oracle_deviation_threshold_bps as u64 {
        return (0, false);  // Prices are not trustworthy
    }
    
    // Return average of both prices
    let aggregated = (pyth_price + secondary_price) / 2;
    (aggregated, true)
}
```

### Recommended Deviation Thresholds
| Asset Type | Threshold | Notes |
|------------|-----------|-------|
| Stablecoins | 100 bps (1%) | Prices should be very close |
| Major tokens | 200 bps (2%) | SOL, ETH, BTC |
| Volatile tokens | 500 bps (5%) | Small cap tokens |

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 800 | SupplyCapExceeded | Exceeded supply cap for asset |
| 801 | PriceDeviationTooHigh | Price changed beyond threshold |
| 802 | OracleDivergenceDetected | Oracle prices diverge too much |
| 803 | SecondaryOracleUnavailable | Secondary oracle unavailable |
| 804 | CircuitBreakerActive | Circuit breaker is currently active |

---

## Testing

Run tests for new features:
```bash
cd programs/ginva-pinocchio
cargo test --release
```

New tests added:
- `test_supply_cap_validation` - Validates supply cap logic
- `test_price_deviation_detection` - Validates price deviation detection

---

## Admin Operations

### Setting Supply Cap
```bash
# Via instruction: UpdateSupplyCap
# (To be implemented in instructions.rs)
```

### Resetting Circuit Breaker
```bash
# Via instruction: ResetCircuitBreaker
# (To be implemented in instructions.rs)
# Must verify price has returned to normal before reset
```

---

## Security Considerations

1. **Supply Cap**
   - Set based on protocol risk tolerance
   - Should be incrementable but not decrementable (unless via governance)

2. **Circuit Breaker**
   - Should have a delay before reset to prevent flash loan attacks
   - Should notify admin when triggered

3. **Multi-Oracle**
   - Choose secondary oracle with high liquidity and reliability
   - Set deviation threshold appropriate for asset volatility
