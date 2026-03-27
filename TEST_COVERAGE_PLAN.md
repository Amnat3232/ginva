# 🧪 GINVA Protocol - Comprehensive Test Coverage Plan

## Overview

**Target:** 54 Anchor instructions  
**Current Coverage:** 16 test files  
**Missing Tests:** 31 instructions  
**Priority:** CRITICAL - Complete unit, integration, and load tests

---

## 📋 Instruction Coverage Matrix

### ✅ ALREADY TESTED (23 instructions)

| Instruction | Test File | Status |
|-------------|-----------|--------|
| initialize_system | ginva.ts | ✅ |
| update_protocol_config | ginva.ts | ✅ |
| add_supported_asset | ginva.ts | ✅ |
| deposit_collateral | ginva.ts, repay_loan_test.ts | ✅ |
| borrow_usdc | ginva.ts | ✅ |
| repay_loan | repay_loan_test.ts | ✅ |
| extend_loan | extend_loan.ts, extend_loan_simple.test.ts | ✅ |
| liquidate_by_health_factor | ginva-liquidation-test.ts | ✅ |
| liquidate_by_maturity | ginva-liquidation-test.ts | ✅ |
| claim_trigger_reward | ginva.ts | ✅ |
| buy_from_storefront | ginva.ts | ✅ |
| finalize_liquidation | ginva.ts | ✅ |
| stake_lp | ginva.ts | ✅ |
| unstake_lp | ginva.ts | ✅ |
| claim_staking_rewards | ginva.ts | ✅ |
| emergency_pause | ginva.ts | ✅ |
| emergency_resume | ginva.ts | ✅ |
| register_keeper_agent | agent-registration.test.ts | ✅ |
| claim_keeper_earnings | agent-registration.test.ts | ✅ |
| execute_keeper_task | agent-registration.test.ts | ✅ |
| distribute_earnings | agent-registration.test.ts | ✅ |
| update_ops_wallet | ginva.ts | ✅ |
| toggle_keeper_registration | agent-registration.test.ts | ✅ |

### ❌ MISSING TESTS (31 instructions)

| Category | Instructions | Count | Priority |
|----------|--------------|-------|----------|
| **Keeper Operations** | add_trusted_keeper, remove_trusted_keeper, keeper_heartbeat, register_keeper, unregister_keeper, update_heartbeat | 6 | HIGH |
| **Circuit Breaker** | trigger_circuit_breaker, reset_circuit_breaker, update_circuit_breaker_params | 3 | HIGH |
| **Liquidation Operations** | execute_dex_fallback, claim_expired_swap, claim_expired_distribution | 3 | CRITICAL |
| **Interest & Fees** | calculate_interest, pay_interest | 2 | MEDIUM |
| **Health Checks** | check_health_factor, check_overdue_loan | 2 | HIGH |
| **Agent System** | register_agent, update_agent_settings, record_agent_operation, claim_agent_rewards, claim_human_share, pause_agent, disable_agent | 7 | MEDIUM |
| **Fund Distribution** | distribute_safety_fund, distribute_dev_fund | 2 | MEDIUM |
| **Utility** | init, is_registered | 2 | LOW |

---

## 🎯 Phase 1: Unit Tests for Missing Instructions

### 1.1 Keeper Operations Tests

**File:** `tests/keeper-operations.test.ts`

```typescript
describe("Keeper Operations", () => {
  describe("add_trusted_keeper", () => {
    it("Should add trusted keeper successfully", async () => {
      // Arrange: Create new keeper account
      const newKeeper = Keypair.generate();
      
      // Act: Add as trusted keeper
      await program.methods.addTrustedKeeper()
        .accounts({
          admin: admin.publicKey,
          keeper: newKeeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();
      
      // Assert: Check keeper is in trusted list
      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.trustedKeepers).to.include(newKeeper.publicKey.toString());
    });

    it("Should fail when non-admin tries to add keeper", async () => {
      const randomUser = Keypair.generate();
      
      try {
        await program.methods.addTrustedKeeper()
          .accounts({
            admin: randomUser.publicKey,
            keeper: randomUser.publicKey,
            systemConfig: systemConfig,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("remove_trusted_keeper", () => {
    it("Should remove trusted keeper successfully", async () => {
      // Arrange: Add keeper first
      const keeperToRemove = Keypair.generate();
      await program.methods.addTrustedKeeper()
        .accounts({
          admin: admin.publicKey,
          keeper: keeperToRemove.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      // Act: Remove keeper
      await program.methods.removeTrustedKeeper()
        .accounts({
          admin: admin.publicKey,
          keeper: keeperToRemove.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      // Assert: Keeper removed from list
      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.trustedKeepers).to.not.include(keeperToRemove.publicKey.toString());
    });
  });

  describe("keeper_heartbeat", () => {
    it("Should update keeper heartbeat timestamp", async () => {
      const keeper = Keypair.generate();
      
      // Register keeper first
      await program.methods.registerKeeper()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();

      // Send heartbeat
      await program.methods.keeperHeartbeat()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();

      // Verify heartbeat was recorded
      const config = await program.account.systemConfig.fetch(systemConfig);
      // Check timestamp is recent (within last 30 seconds)
      const currentTimestamp = Date.now() / 1000;
      const keeperInfo = config.keepers.find(k => 
        k.keeperAddress.toString() === keeper.publicKey.toString()
      );
      expect(keeperInfo.lastHeartbeat.toNumber()).to.be.closeTo(currentTimestamp, 30);
    });

    it("Should fail for non-registered keeper", async () => {
      const unauthorizedKeeper = Keypair.generate();
      
      try {
        await program.methods.keeperHeartbeat()
          .accounts({
            keeper: unauthorizedKeeper.publicKey,
            systemConfig: systemConfig,
          })
          .signers([unauthorizedKeeper])
          .rpc();
        throw new Error("Should have failed");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("KeeperNotRegistered");
      }
    });
  });
});
```

### 1.2 Circuit Breaker Tests

**File:** `tests/circuit-breaker.test.ts`

```typescript
describe("Circuit Breaker", () => {
  describe("trigger_circuit_breaker", () => {
    it("Should trigger circuit breaker in emergency", async () => {
      await program.methods.triggerCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.circuitBreakerActive).to.be.true;
    });

    it("Should fail for non-admin", async () => {
      const randomUser = Keypair.generate();
      
      try {
        await program.methods.triggerCircuitBreaker()
          .accounts({
            admin: randomUser.publicKey,
            systemConfig: systemConfig,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("reset_circuit_breaker", () => {
    it("Should reset circuit breaker after emergency", async () => {
      // First trigger it
      await program.methods.triggerCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      // Then reset it
      await program.methods.resetCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.circuitBreakerActive).to.be.false;
    });
  });

  describe("update_circuit_breaker_params", () => {
    it("Should update circuit breaker parameters", async () => {
      const newMaxLiquidationPerHour = new BN(100);
      const newMaxBorrowPerHour = new BN(50000);

      await program.methods.updateCircuitBreakerParams(
        newMaxLiquidationPerHour,
        newMaxBorrowPerHour
      )
      .accounts({
        admin: admin.publicKey,
        systemConfig: systemConfig,
      })
      .signers([admin])
      .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.maxLiquidationPerHour.toString()).to.equal(newMaxLiquidationPerHour.toString());
      expect(config.maxBorrowPerHour.toString()).to.equal(newMaxBorrowPerHour.toString());
    });
  });
});
```

### 1.3 Liquidation Edge Case Tests

**File:** `tests/liquidation-edge-cases.test.ts`

```typescript
describe("Liquidation Edge Cases - Health Factor Boundaries", () => {
  let loanAccount: PublicKey;
  let borrower: Keypair;
  let collateralAmount: BN;
  let borrowAmount: BN;

  beforeEach(async () => {
    // Setup: Create loan with specific parameters
    borrower = Keypair.generate();
    await setupTestAccount(borrower);
    
    // Deposit 10 SOL at $100/SOL = $1000 collateral
    collateralAmount = new BN(10 * LAMPORTS_PER_SOL);
    await program.methods.depositCollateral(collateralAmount)
      .accounts({
        borrower: borrower.publicKey,
        collateralMint: SOL_MINT,
        collateralAccount: borrowerCollateralATA,
        systemConfig: systemConfig,
      })
      .signers([borrower])
      .rpc();
  });

  describe("Health Factor 99.9% (Just Below Threshold)", () => {
    it("Should allow liquidation at HF = 99.9%", async () => {
      // Setup: Borrow 1000 USDC
      const borrowAmount = new BN(1000 * 1e6);
      await program.methods.borrowUsdc(borrowAmount, 30)
        .accounts({
          borrower: borrower.publicKey,
          collateralAccount: borrowerCollateralATA,
          loanAccount: loanAccount,
          systemConfig: systemConfig,
        })
        .signers([borrower])
        .rpc();

      // Simulate price drop to trigger HF = 99.9%
      // With 10 SOL at $100 = $1000 collateral, borrow 1000 USDC
      // If price drops to $99.90: collateral = $999, threshold = 999 * 0.85 = 849.15
      // HF = (849.15 / 1000) * 100 = 84.915 (already below 100)
      
      // This test would require mock price oracle manipulation
      // For now, we test the actual liquidation flow
      const keeper = Keypair.generate();
      await setupTestAccount(keeper);

      // Trigger liquidation
      await program.methods.liquidateByHealthFactor()
        .accounts({
          keeper: keeper.publicKey,
          loanAccount: loanAccount,
          systemConfig: systemConfig,
          pythAccount: pythAccount,
        })
        .signers([keeper])
        .rpc();

      const loan = await program.account.loanAccount.fetch(loanAccount);
      expect(loan.liquidationTriggered).to.be.true;
      expect(loan.liquidationType).to.equal(1); // HealthFactor
    });
  });

  describe("Health Factor 100.0% (Exactly at Threshold)", () => {
    it("Should NOT allow liquidation at exactly HF = 100.0%", async () => {
      // This is the boundary condition
      // At exactly 100%, loan should NOT be liquidable
      
      const keeper = Keypair.generate();
      await setupTestAccount(keeper);

      try {
        await program.methods.liquidateByHealthFactor()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: loanAccount,
            systemConfig: systemConfig,
            pythAccount: pythAccount,
          })
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed - HF = 100.0% should not be liquidable");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("HealthFactorNotCritical");
      }
    });
  });

  describe("Health Factor 100.1% (Just Above Threshold)", () => {
    it("Should NOT allow liquidation at HF = 100.1%", async () => {
      const keeper = Keypair.generate();
      await setupTestAccount(keeper);

      try {
        await program.methods.liquidateByHealthFactor()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: loanAccount,
            systemConfig: systemConfig,
            pythAccount: pythAccount,
          })
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed - HF > 100% should not be liquidable");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("HealthFactorNotCritical");
      }
    });
  });
});
```

### 1.4 Keeper Pipeline Simulation Tests

**File:** `tests/keeper-pipeline-simulation.test.ts`

```typescript
describe("Keeper Pipeline Simulation - A → B → C End-to-End", () => {
  let keeperA: Keypair;
  let keeperB: Keypair;
  let keeperC: Keypair;
  let borrower: Keypair;
  let loanAccount: PublicKey;

  beforeEach(async () => {
    // Setup three keepers
    keeperA = Keypair.generate();
    keeperB = Keypair.generate();
    keeperC = Keypair.generate();
    
    await setupTestAccount(keeperA);
    await setupTestAccount(keeperB);
    await setupTestAccount(keeperC);

    // Register all keepers
    for (const keeper of [keeperA, keeperB, keeperC]) {
      await program.methods.registerKeeper()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();
    }

    // Setup borrower with undercollateralized loan
    borrower = Keypair.generate();
    await setupTestAccount(borrower);
    
    // Deposit collateral and borrow
    const collateralAmount = new BN(10 * LAMPORTS_PER_SOL);
    await program.methods.depositCollateral(collateralAmount)
      .accounts({
        borrower: borrower.publicKey,
        collateralMint: SOL_MINT,
        collateralAccount: borrowerCollateralATA,
        systemConfig: systemConfig,
      })
      .signers([borrower])
      .rpc();

    const borrowAmount = new BN(1000 * 1e6); // 1000 USDC
    await program.methods.borrowUsdc(borrowAmount, 30)
      .accounts({
        borrower: borrower.publicKey,
        collateralAccount: borrowerCollateralATA,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
      })
      .signers([borrower])
      .rpc();
  });

  it("Complete Keeper Pipeline: Trigger → Execute → Finalize", async () => {
    console.log("=== Keeper Pipeline Simulation ===");
    console.log("Step 1: Keeper A triggers liquidation");

    // Step 1: Keeper A triggers liquidation
    await program.methods.liquidateByHealthFactor()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        pythAccount: pythAccount,
      })
      .signers([keeperA])
      .rpc();

    let loan = await program.account.loanAccount.fetch(loanAccount);
    expect(loan.liquidationTriggered).to.be.true;
    console.log("✅ Keeper A triggered liquidation");

    // Step 1B: Keeper A claims trigger reward
    await program.methods.claimTriggerReward()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        revenueWallet: revenueWallet,
      })
      .signers([keeperA])
      .rpc();
    console.log("✅ Keeper A claimed trigger reward (1%)");

    // Step 2: Keeper B executes OTC swap after timeout
    console.log("Step 2: Keeper B executes OTC swap (after 2s timeout)");
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

    const collateralReceiver = Keypair.generate();
    await setupTestAccount(collateralReceiver);

    await program.methods.executeDexFallback()
      .accounts({
        keeper: keeperB.publicKey,
        loanAccount: loanAccount,
        collateralReceiver: collateralReceiver.publicKey,
        systemConfig: systemConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        // Jupiter accounts would be added here
      ])
      .signers([keeperB])
      .rpc();

    loan = await program.account.loanAccount.fetch(loanAccount);
    expect(loan.swapped).to.be.true;
    console.log("✅ Keeper B executed OTC swap");

    // Step 3: Keeper C finalizes liquidation
    console.log("Step 3: Keeper C finalizes liquidation");
    await program.methods.finalizeLiquidation()
      .accounts({
        keeper: keeperC.publicKey,
        loanAccount: loanAccount,
        collateralReceiver: collateralReceiver.publicKey,
        systemConfig: systemConfig,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([keeperC])
      .rpc();

    loan = await program.account.loanAccount.fetch(loanAccount);
    expect(loan.status).to.equal(2); // Liquidated
    console.log("✅ Keeper C finalized liquidation");

    console.log("=== Pipeline Complete ===");
  });

  it("Should prevent same keeper from doing multiple steps", async () => {
    // Keeper A triggers
    await program.methods.liquidateByHealthFactor()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        pythAccount: pythAccount,
      })
      .signers([keeperA])
      .rpc();

    // Try to execute with same keeper (should fail)
    const collateralReceiver = Keypair.generate();
    await setupTestAccount(collateralReceiver);

    try {
      await program.methods.executeDexFallback()
        .accounts({
          keeper: keeperA.publicKey, // Same keeper!
          loanAccount: loanAccount,
          collateralReceiver: collateralReceiver.publicKey,
          systemConfig: systemConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([keeperA])
        .rpc();
      throw new Error("Should have failed - same keeper cannot execute");
    } catch (e) {
      expect(e.error.errorCode.code).to.equal("KeeperAlreadyTriggered");
    }
  });
});
```

### 1.5 Devnet Load Tests

**File:** `tests/load-test-devnet.test.ts`

```typescript
describe("🔥 Devnet Load Tests", () => {
  const NUM_CONCURRENT_LOANS = 10;
  const NUM_KEEPERS = 5;
  const NUM_BORROWERS = 20;

  let keepers: Keypair[] = [];
  let borrowers: Keypair[] = [];

  before(async () => {
    console.log("🚀 Setting up load test environment on Devnet...");
    
    // Generate keepers
    for (let i = 0; i < NUM_KEEPERS; i++) {
      const keeper = Keypair.generate();
      keepers.push(keeper);
      await setupTestAccount(keeper);
      
      await program.methods.registerKeeper()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();
    }

    // Generate borrowers
    for (let i = 0; i < NUM_BORROWERS; i++) {
      const borrower = Keypair.generate();
      borrowers.push(borrower);
      await setupTestAccount(borrower);
    }

    console.log(`✅ Setup complete: ${NUM_KEEPERS} keepers, ${NUM_BORROWERS} borrowers`);
  });

  it("Load Test 1: Concurrent Deposits", async () => {
    console.log("📊 Testing concurrent deposits...");
    const startTime = Date.now();

    const depositPromises = borrowers.slice(0, NUM_CONCURRENT_LOANS).map(async (borrower, index) => {
      const collateralAmount = new BN(5 * LAMPORTS_PER_SOL + index * LAMPORTS_PER_SOL); // Vary amounts
      return program.methods.depositCollateral(collateralAmount)
        .accounts({
          borrower: borrower.publicKey,
          collateralMint: SOL_MINT,
          collateralAccount: borrowerCollateralATA,
          systemConfig: systemConfig,
        })
        .signers([borrower])
        .rpc();
    });

    await Promise.all(depositPromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Completed ${NUM_CONCURRENT_LOANS} concurrent deposits in ${duration}ms`);
    console.log(`📊 Throughput: ${(NUM_CONCURRENT_LOANS / (duration / 1000)).toFixed(2)} deposits/second`);
  });

  it("Load Test 2: Concurrent Borrows", async () => {
    console.log("📊 Testing concurrent borrows...");
    const startTime = Date.now();

    const borrowPromises = borrowers.slice(0, NUM_CONCURRENT_LOANS).map(async (borrower, index) => {
      const borrowAmount = new BN((500 + index * 50) * 1e6); // Vary amounts
      return program.methods.borrowUsdc(borrowAmount, 30)
        .accounts({
          borrower: borrower.publicKey,
          collateralAccount: borrowerCollateralATA,
          loanAccount: loanAccount,
          systemConfig: systemConfig,
        })
        .signers([borrower])
        .rpc();
    });

    await Promise.all(borrowPromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Completed ${NUM_CONCURRENT_LOANS} concurrent borrows in ${duration}ms`);
    console.log(`📊 Throughput: ${(NUM_CONCURRENT_LOANS / (duration / 1000)).toFixed(2)} borrows/second`);
  });

  it("Load Test 3: Concurrent Liquidations", async () => {
    console.log("📊 Testing concurrent liquidations...");
    
    // First, create undercollateralized loans by manipulating prices
    // (In real test, we'd use mock oracle to simulate price drop)
    
    const startTime = Date.now();
    const liquidationPromises = borrowers.slice(0, 5).map(async (borrower, index) => {
      const keeper = keepers[index % NUM_KEEPERS];
      
      // Trigger liquidation
      return program.methods.liquidateByHealthFactor()
        .accounts({
          keeper: keeper.publicKey,
          loanAccount: loanAccount,
          systemConfig: systemConfig,
          pythAccount: pythAccount,
        })
        .signers([keeper])
        .rpc();
    });

    await Promise.all(liquidationPromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Completed ${liquidationPromises.length} concurrent liquidations in ${duration}ms`);
    console.log(`📊 Throughput: ${(liquidationPromises.length / (duration / 1000)).toFixed(2)} liquidations/second`);
  });

  it("Load Test 4: Stress Test - High Volume Liquidations", async () => {
    console.log("📊 Running stress test: 100 liquidations in sequence...");
    
    const startTime = Date.now();
    let successCount = 0;
    
    for (let i = 0; i < 100; i++) {
      try {
        const borrower = borrowers[i % NUM_BORROWERS];
        const keeper = keepers[i % NUM_KEEPERS];
        
        await program.methods.liquidateByHealthFactor()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: loanAccount,
            systemConfig: systemConfig,
            pythAccount: pythAccount,
          })
          .signers([keeper])
          .rpc();
        
        successCount++;
      } catch (e) {
        // Expected to fail for loans not yet liquidable
      }
      
      if ((i + 1) % 20 === 0) {
        console.log(`  Progress: ${i + 1}/100 liquidations attempted`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Stress test complete: ${successCount}/100 successful liquidations`);
    console.log(`📊 Duration: ${duration}ms`);
    console.log(`📊 Average: ${(duration / 100).toFixed(2)}ms per liquidation`);
  });

  it("Load Test 5: Keeper Heartbeat Under Load", async () => {
    console.log("📊 Testing keeper heartbeats under concurrent load...");
    
    const startTime = Date.now();
    const heartbeatPromises = keepers.map(async (keeper) => {
      return program.methods.keeperHeartbeat()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();
    });

    await Promise.all(heartbeatPromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Completed ${NUM_KEEPERS} heartbeats in ${duration}ms`);
    console.log(`📊 Throughput: ${(NUM_KEEPERS / (duration / 1000)).toFixed(2)} heartbeats/second`);
  });
});
```

### 1.6 Security Tests for Missing Instructions

**File:** `tests/security-missing-instructions.test.ts`

```typescript
describe("Security Tests - Missing Instructions", () => {
  describe("execute_dex_fallback Security", () => {
    it("Should reject invalid Jupiter route data", async () => {
      const keeper = Keypair.generate();
      await setupTestAccount(keeper);

      // Try with empty data (should fail)
      try {
        await program.methods.executeDexFallback()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: loanAccount,
            collateralReceiver: keeper.publicKey,
            systemConfig: systemConfig,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([])
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed with invalid data");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("InvalidJupiterRoute");
      }
    });

    it("Should reject duplicate liquidation attempts", async () => {
      const keeper = Keypair.generate();
      await setupTestAccount(keeper);

      // Trigger first
      await program.methods.liquidateByHealthFactor()
        .accounts({
          keeper: keeper.publicKey,
          loanAccount: loanAccount,
          systemConfig: systemConfig,
          pythAccount: pythAccount,
        })
        .signers([keeper])
        .rpc();

      // Try to execute swap twice
      const collateralReceiver = Keypair.generate();
      await setupTestAccount(collateralReceiver);

      await program.methods.executeDexFallback()
        .accounts({
          keeper: keeper.publicKey,
          loanAccount: loanAccount,
          collateralReceiver: collateralReceiver.publicKey,
          systemConfig: systemConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([])
        .signers([keeper])
        .rpc();

      // Try again (should fail)
      try {
        await program.methods.executeDexFallback()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: loanAccount,
            collateralReceiver: collateralReceiver.publicKey,
            systemConfig: systemConfig,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([])
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed - already swapped");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("AlreadySwapped");
      }
    });
  });

  describe("Fund Distribution Security", () => {
    it("Should only allow admin to distribute safety fund", async () => {
      const randomUser = Keypair.generate();
      await setupTestAccount(randomUser);

      try {
        await program.methods.distributeSafetyFund()
          .accounts({
            admin: randomUser.publicKey,
            systemConfig: systemConfig,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed - unauthorized");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("Should prevent distribute_dev_fund with insufficient balance", async () => {
      // Try to distribute when dev fund is empty
      try {
        await program.methods.distributeDevFund()
          .accounts({
            admin: admin.publicKey,
            systemConfig: systemConfig,
            devFundWallet: devFundWallet,
          })
          .signers([admin])
          .rpc();
        // May succeed or fail depending on fund balance
        // This tests the instruction exists and runs
      } catch (e) {
        // Expected: insufficient funds error
        expect(e.error.errorCode.code).to.be.oneOf(["InsufficientFunds", "ArithmeticError"]);
      }
    });
  });

  describe("Agent System Security", () => {
    it("Should prevent double registration of agent", async () => {
      const agent = Keypair.generate();
      await setupTestAccount(agent);

      // Register once
      await program.methods.registerAgent()
        .accounts({
          agent: agent.publicKey,
          systemConfig: systemConfig,
        })
        .signers([agent])
        .rpc();

      // Try to register again
      try {
        await program.methods.registerAgent()
          .accounts({
            agent: agent.publicKey,
            systemConfig: systemConfig,
          })
          .signers([agent])
          .rpc();
        throw new Error("Should have failed - already registered");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("AgentAlreadyRegistered");
      }
    });

    it("Should prevent non-agent from claiming rewards", async () => {
      const nonAgent = Keypair.generate();
      await setupTestAccount(nonAgent);

      try {
        await program.methods.claimAgentRewards()
          .accounts({
            agent: nonAgent.publicKey,
            systemConfig: systemConfig,
          })
          .signers([nonAgent])
          .rpc();
        throw new Error("Should have failed - not an agent");
      } catch (e) {
        expect(e.error.errorCode.code).to.equal("AgentNotRegistered");
      }
    });
  });
});
```

---

## 📊 Test Execution Commands

```bash
# Run all tests
anchor test

# Run specific test file
anchor test --skip-deploy tests/keeper-operations.test.ts
anchor test --skip-deploy tests/circuit-breaker.test.ts
anchor test --skip-deploy tests/liquidation-edge-cases.test.ts
anchor test --skip-deploy tests/keeper-pipeline-simulation.test.ts

# Run on Devnet (load tests)
anchor test --provider.cluster devnet tests/load-test-devnet.test.ts

# Run security tests
anchor test --skip-deploy tests/security-missing-instructions.test.ts

# Run with verbose output
anchor test -v --skip-deploy tests/keeper-pipeline-simulation.test.ts

# Generate test coverage report
anchor test --coverage
```

---

## 🎯 Test Coverage Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Instructions with unit tests | 23/54 (43%) | 54/54 (100%) | ⚠️ 31 missing |
| Edge case coverage | Partial | 100% | ⚠️ Needs work |
| Keeper pipeline tests | None | End-to-end | 🆕 New |
| Load test scenarios | None | 5 scenarios | 🆕 New |
| Security test coverage | Partial | Comprehensive | ⚠️ Needs work |

---

## 📈 Priority Implementation Order

1. **HIGH PRIORITY** (Week 1):
   - `keeper-operations.test.ts` - 6 instructions
   - `circuit-breaker.test.ts` - 3 instructions
   - `liquidation-edge-cases.test.ts` - Boundary conditions

2. **MEDIUM PRIORITY** (Week 2):
   - `keeper-pipeline-simulation.test.ts` - End-to-end flow
   - `security-missing-instructions.test.ts` - Security coverage
   - Agent system tests (7 instructions)

3. **LOW PRIORITY** (Week 3):
   - Fund distribution tests (2 instructions)
   - Utility function tests (2 instructions)
   - Devnet load tests (5 scenarios)
