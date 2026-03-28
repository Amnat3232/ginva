# Security Model

> GINVA's security architecture combines Pinocchio's manual validation with protocol-level circuit breakers, oracle protections, and rate limiting.

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GINVA Security Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: Pinocchio Validation (Manual)                                     │
│  ├── Signer checks                                                          │
│  ├── Account ownership validation                                           │
│  └── Discriminator verification                                             │
│                                                                             │
│  Layer 2: Protocol Parameters (Immutable)                                   │
│  ├── APR: 800 bps (8%)                                                     │
│  ├── LTV: 20/40/60% (Safe/Standard/Max)                                    │
│  └── Fee caps and limits                                                    │
│                                                                             │
│  Layer 3: Oracle Protection                                                 │
│  ├── Pyth price feeds                                                       │
│  ├── Price age validation (< 15s)                                          │
│  └── Circuit breaker on deviation                                           │
│                                                                             │
│  Layer 4: Rate Limiting                                                     │
│  ├── Operations per block: 5 max                                           │
│  ├── Price change: 500 bps (5%)                                            │
│  └── Cooldown: 1 second minimum                                            │
│                                                                             │
│  Layer 5: Circuit Breakers (Phase 2)                                        │
│  ├── Supply caps per asset                                                  │
│  ├── Price deviation thresholds                                             │
│  └── Auto-pause on anomalies                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pinocchio Security Patterns

### Manual Signer Validation
```rust
// Every instruction validates signer manually
// instructions.rs:161-163 (InitializeSystem)
if !admin.is_signer() {
    return Err(GinvaError::Unauthorized.into());
}
```

### Account Data Validation
```rust
// Discriminator check to prevent uninitialized account access
// instructions.rs:167-171
let config_data = system_config.try_borrow_data()?;
let is_initialized = &config_data[0..8] == b"config__" 
    || config_data.iter().any(|&b| b != 0);
if is_initialized {
    return Err(GinvaError::InvalidInput.into());
}
```

### Token Program Validation
```rust
// Validate correct token program (SPL or Token-2022)
// instructions.rs:318-320
if token_program.key().as_ref() != &[6u8; 32] 
    && token_program.key().as_ref() != &[2u8; 32] {
    return Err(ProgramError::IncorrectProgramId);
}
```

---

## Protocol Security Constants

### Rate Limiting (lib.rs:28-30)
```rust
pub const MAX_OPERATIONS_PER_BLOCK: u64 = 5;
pub const MAX_PRICE_CHANGE_BPS: u64 = 500;  // 5% max per block
pub const MIN_TIME_BETWEEN_OPERATIONS: i64 = 1;
```

### Reentrancy Protection (lib.rs:44-45)
```rust
pub const REENTRANCY_GUARD_ACTIVE: u8 = 1;
pub const REENTRANCY_GUARD_INACTIVE: u8 = 0;
```

### Hold Time Requirements (lib.rs:39-42)
```rust
pub const MIN_HOLD_TIME: i64 = 2;
pub const MIN_HOLD_BLOCKS: u64 = 100;
pub const MIN_HOLD_TIME_SECONDS: i64 = 300;  // 5 minutes
pub const MAX_RENT_OPS: u64 = 10;
```

---

## Oracle Security

### Pyth Oracle Integration (lib.rs:60-63)
```rust
pub const SOL_USD_FEED_ID: &str = 
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
pub const MAX_PRICE_AGE_SECONDS: u64 = 15;
pub const MAX_CONFIDENCE_RATIO: u128 = 100;
```

### Price Validation Rules
1. **Freshness**: Price must be < 15 seconds old
2. **Confidence**: Confidence interval must be reasonable
3. **Circuit Breaker**: Auto-pause on 5% price deviation
4. **Multi-Oracle (Phase 2)**: Pyth + Switchboard dual validation

### Oracle Error Codes
| Error | Code | Meaning |
|-------|------|---------|
| `OraclePriceNotInitialized` | 500 | Price feed not setup |
| `OraclePriceTooOld` | 501 | Price older than MAX_PRICE_AGE |
| `OracleConfidenceTooHigh` | 502 | Uncertainty too high |
| `OracleCircuitBreakerTriggered` | 503 | Price deviation exceeded |
| `OracleTemporarilyUnavailable` | 504 | Feed offline |

---

## Circuit Breakers (Phase 2)

### Supply Cap Protection (lib.rs:153)
```rust
pub const SupplyCapExceeded: u8 = 800;
```
- Limits max deposit/borrow per asset
- AssetConfig.supply_cap field (0 = unlimited)
- Checked in Borrow instruction (instructions.rs:417-420)

### Price Deviation Detection
```rust
// instructions.rs:412-415
if asset.circuit_breaker_triggered() {
    return Err(GinvaError::CircuitBreakerActive.into());
}
```
- Auto-pauses on price anomaly
- AssetConfig.price_deviation_threshold_bps

### Multi-Oracle Validation (Phase 2)
- Primary: Pyth Network
- Secondary: Switchboard
- Divergence detection (lib.rs:155)
- `OracleDivergenceDetected = 802`

---

## Arithmetic Safety

### Checked Math Pattern
```rust
// lib.rs:187-194 - Interest calculation with checked operations
let intermediate = principal_u128
    .checked_mul(apr_bps_u128)
    .and_then(|v| v.checked_mul(duration_u128));

if let Some(val) = intermediate {
    let divided = val
        .checked_div(bps_divisor)
        .and_then(|v| v.checked_div(seconds_per_year));
    divided.unwrap_or(0) as u64
}
```

### Overflow/Underflow Errors
| Error | Code | Meaning |
|-------|------|---------|
| `ArithmeticOverflow` | 5 | Result too large |
| `ArithmeticUnderflow` | 6 | Result negative |

---

## Error Code Categories

### General (0-9)
| Code | Error |
|------|-------|
| 0 | InvalidInstruction |
| 1 | InvalidInput |
| 2 | InvalidAmount |
| 3 | Unauthorized |
| 4 | InvalidWalletAddress |
| 5 | ArithmeticOverflow |
| 6 | ArithmeticUnderflow |
| 7 | InvalidLoanId |
| 8 | InvalidAssetMint |

### Protocol (100-104)
| Code | Error |
|------|-------|
| 100 | ProtocolPaused |
| 101 | AlreadyPaused |
| 102 | NotPaused |
| 103 | SystemInCooldown |
| 104 | ReentrancyDetected |

### Asset (200-202)
| Code | Error |
|------|-------|
| 200 | AssetNotActive |
| 201 | InvalidLTV |
| 202 | InsufficientCollateral |

### Loan (300-310)
| Code | Error |
|------|-------|
| 300 | LoanNotActive |
| 301-302 | LoanTooSmall/Large |
| 303 | LoanAlreadyRepaid |
| 304 | LoanNotYetMatured |
| 305 | InvalidLTVRatio |
| 306-310 | Interest/Payment/Liquidation |

### Liquidation (400-403)
| Code | Error |
|------|-------|
| 400 | InvalidLiquidationStatus |
| 401 | AlreadySwapped |
| 402 | StorefrontPeriodNotOver |
| 403 | InvalidLiquidator |

### Oracle (500-505)
| Code | Error |
|------|-------|
| 500 | OraclePriceNotInitialized |
| 501-505 | Price/Age/Circuit errors |

### Keeper (600-603)
| Code | Error |
|------|-------|
| 600 | KeeperNotRegistered |
| 601 | KeeperAlreadyRegistered |
| 602-603 | Task expired/executed |

### Agent (700-703)
| Code | Error |
|------|-------|
| 700 | AgentNotFound |
| 701 | AgentAlreadyExists |
| 702 | AgentInactive |
| 703 | AgentRateLimited |

### Phase 2 Security (800-804)
| Code | Error |
|------|-------|
| 800 | SupplyCapExceeded |
| 801 | PriceDeviationTooHigh |
| 802 | OracleDivergenceDetected |
| 803 | SecondaryOracleUnavailable |
| 804 | CircuitBreakerActive |

---

## Jupiter DEX Security

### Placeholder Address (lib.rs:73-77)
```rust
#[inline(always)]
pub fn get_jupiter_program_id(_is_devnet: bool) -> Pubkey {
    // Using zero address as placeholder - fix for mainnet
    Pubkey::from([0u8; 32])
}
```

**⚠️ Security Note**: Jupiter program ID is currently a placeholder (zero address). Must be updated before mainnet:
- Mainnet: `JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB`
- Devnet: `JUP4Fb2cqiRUcaTHdrCEQSpBxWZ4fc4QLvtY41vPU5zY`

### Slippage Protection (lib.rs:33)
```rust
pub const MAX_JUPITER_SLIPPAGE_BPS: u64 = 2000;  // 20% max slippage
```

---

## Security Audit Reports

GINVA has undergone multiple security audits:
- `SECURITY_AUDIT.md` - Full audit report
- `SECURITY_FIXES.md` - Applied fixes
- `SECURITY_FIXES_SUMMARY.md` - Summary of changes

---

## Related Notes

- [[07-Security-Audit]] - Security audit details
- [[03-Smart-Contract/Account-Validation-Rules]] - Validation patterns
- [[03-Smart-Contract/Common-Pitfalls]] - Common mistakes
- [[MOC-Security]] - Security map of content

---

**Last Updated**: 2026-03-28  
**Code References**: lib.rs:28-63 (constants), lib.rs:103-158 (errors), instructions.rs:313-320 (validation examples)
