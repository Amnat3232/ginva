# GINVA Liquidation System Test Scenarios

## สรุปการแก้ไข

แยก Liquidation เป็น 2 ระบบที่ชัดเจน:

- **System A (Health Factor)**: ยึดตามราคาตลาด - ทันที
- **System B (Maturity)**: ยึดตามครบกำหนด - มี 72 ชม. ปกป้อง

---

## Test Scenario 1: Health Factor Liquidation (System A)

### Setup

```
Loan Amount: 1000 USDC
Collateral: 10 SOL (100 USDC/SOL = 1000 USDC)
Health Factor: 100 (just at threshold)
```

### Test Case 1.1: Price Drops - Immediate Liquidation ✅

```
Day 15 (middle of loan term)
SOL price drops to 80 USDC
Collateral value = 10 * 80 = 800 USDC
Safety threshold = 800 * 0.85 = 680 USDC
Health Factor = (680 / 1000) * 100 = 68 (< 100)
```

**Expected Result:**

- ✅ `liquidate_by_health_factor()` succeeds immediately
- ✅ No protection period
- ✅ LiquidationType = HealthFactor (1)

### Test Case 1.2: Price Stable - Cannot Liquidate ❌

```
Day 15
SOL price = 120 USDC
Collateral value = 1200 USDC
Health Factor = (1200*0.85/1000)*100 = 102 (> 100)
```

**Expected Result:**

- ❌ Returns `GinvaError::HealthFactorNotCritical`

### Test Case 1.3: Even After Maturity - Price Still Matters ✅

```
Day 35 (5 days after maturity)
SOL price = 150 USDC
Health Factor = 127 (> 100)
```

**Expected Result:**

- ❌ `liquidate_by_health_factor()` returns error
- ✅ `liquidate_by_maturity()` can be called (after 72h protection)

---

## Test Scenario 2: Maturity Liquidation (System B)

### Setup

```
Loan created: Day 0
Maturity: Day 30
Protection Period: Day 30-33 (72 hours)
```

### Test Case 2.1: During Loan Term - Cannot Liquidate ❌

```
Day 15
Current time < maturity_at
```

**Expected Result:**

- ❌ `liquidate_by_maturity()` returns `GinvaError::LoanNotYetMatured`
- ❌ `liquidate_by_health_factor()` returns error (if HF > 100)

### Test Case 2.2: At Maturity - Still Cannot Liquidate (72h Protection) ❌

```
Day 30, Hour 0
Current time == maturity_at
Protection ends: Day 33, Hour 0
```

**Expected Result:**

- ❌ `liquidate_by_maturity()` returns `GinvaError::InProtectionPeriod`
- ✅ Borrower can still extend or repay

### Test Case 2.3: During Protection Period - Cannot Liquidate ❌

```
Day 31, Hour 12 (36 hours after maturity)
Protection ends: Day 33, Hour 0
```

**Expected Result:**

- ❌ `liquidate_by_maturity()` returns `GinvaError::InProtectionPeriod`
- ✅ Borrower still has 36 hours to act

### Test Case 2.4: After Protection - Liquidation Allowed ✅

```
Day 33, Hour 1 (73 hours after maturity)
Current time > maturity_at + 72*3600
```

**Expected Result:**

- ✅ `liquidate_by_maturity()` succeeds
- ✅ LiquidationType = Maturity (2)

### Test Case 2.5: Borrower Extends During Protection ✅

```
Day 32 (48 hours after maturity)
Borrower calls extend_loan()
```

**Expected Result:**

- ✅ Extension succeeds
- ✅ New maturity = Day 62 (30 days from extension)
- ✅ Protection period resets

### Test Case 2.6: Borrower Repays During Protection ✅

```
Day 31
Borrower calls repay_loan()
```

**Expected Result:**

- ✅ Repayment succeeds
- ✅ Collateral returned to borrower
- ✅ Loan status = Repaid

---

## Test Scenario 3: Edge Cases

### Test Case 3.1: Both Conditions Met - Choose Your System ✅

```
Day 35 (after 72h protection)
SOL price drops to 80 USDC (Health Factor = 68)
```

**Keeper's Choice:**

- ✅ Can call `liquidate_by_health_factor()` (immediate, type 1)
- ✅ Can call `liquidate_by_maturity()` (type 2)
- Both will succeed

### Test Case 3.2: Loan With Zero Collateral ❌

```
Collateral amount = 0
```

**Expected Result:**

- ❌ Account validation fails: `constraint = loan_account.collateral_amount > 0`
- Returns `GinvaError::InvalidAmount`

### Test Case 3.3: Already Being Liquidated ❌

```
Liquidation already in progress
liquidation_lock = true
```

**Expected Result:**

- ❌ Returns `GinvaError::AlreadyBeingLiquidated`

### Test Case 3.4: Protocol Paused ❌

```
is_paused = true
```

**Expected Result:**

- ❌ Returns `GinvaError::ProtocolPaused`

### Test Case 3.5: Reentrancy Attack Attempt ❌

```
liquidation_process.status != 0
```

**Expected Result:**

- ❌ Returns `GinvaError::ReentrancyDetected`

---

## Test Scenario 4: Liquidation Process Flow

### Step-by-Step Verification

**Step 1: Trigger Liquidation**

```rust
liquidate_by_maturity(ctx)?;
// OR
liquidate_by_health_factor(ctx)?;
```

- ✅ LiquidationProcess created
- ✅ Status = Triggered (1)
- ✅ liquidation_type set correctly
- ✅ 0.6% reward allocated to Keeper A
- ✅ 99.4% transferred to seized vault

**Step 2: Claim Trigger Reward**

```rust
claim_trigger_reward(ctx)?;
```

- ✅ Keeper A receives 0.6%
- ✅ keeper_reward_claimed = true

**Step 3: Execute Auto-Swap**

```rust
execute_auto_swap(ctx)?;
```

- ✅ Collateral swapped to USDC
- ✅ Status = Swapped (2)
- ✅ swap_executor recorded

**Step 4: Finalize Liquidation**

```rust
finalize_liquidation(ctx)?;
```

- ✅ Status = Finalized (3)
- ✅ Principal returned to Capital Wallet
- ✅ Profit distributed (Capital 10%, Ops 24.75%, Stakers 65.25%)
- ✅ Keeper C receives 1.0 USDC
- ✅ Surplus to Reserve Wallet

---

## Summary Table

| Scenario                   | System A (HF) | System B (Maturity)  | Expected Result                |
| -------------------------- | ------------- | -------------------- | ------------------------------ |
| Price crash during loan    | ✅ Can call   | ❌ Not needed        | Immediate liquidation          |
| Price stable, at maturity  | ❌ HF > 100   | ✅ After 72h         | 72h protection, then liquidate |
| Price crash after maturity | ✅ Can call   | ✅ Can call          | Either system works            |
| During 72h protection      | ❌ N/A        | ❌ Protection active | Wait or borrower acts          |
| Loan active, price OK      | ❌ HF > 100   | ❌ Not matured       | No liquidation                 |

---

## Key Improvements ✅

1. **Clear Separation**: Two distinct functions for different scenarios
2. **Proper Protection**: 72-hour window only applies to maturity-based liquidation
3. **Better Error Messages**: Specific errors for each failure case
4. **Type Tracking**: Liquidation type recorded for transparency
5. **No Logic Overlap**: Each system has its own validation rules

## Potential Issues to Watch 🚨

1. **Double Liquidation Risk**: Both systems can be called if conditions overlap
   - Mitigation: `liquidation_lock` prevents double execution
2. **Keeper Choice**: Keepers might prefer one system over another
   - Health Factor: Faster execution, immediate reward
   - Maturity: Might wait for better prices
3. **Borrower Confusion**: Need clear UI showing which liquidation type applies
   - Display protection period countdown
   - Show health factor status

## Conclusion

The new architecture correctly separates concerns:

- **System A**: Protects investors (immediate action on price drop)
- **System B**: Protects borrowers (72h grace period after maturity)

Both systems share the same execution logic after triggering, ensuring consistency in reward distribution and fund handling.
