import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("🔥 Devnet Load Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;

  const NUM_KEEPERS = 3;
  const NUM_BORROWERS = 5;

  let keepers: Keypair[] = [];
  let borrowers: Keypair[] = [];
  let systemConfig: PublicKey;

  before(async () => {
    console.log("🚀 Setting up load test environment...");
    
    [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      program.programId
    );

    // Generate and fund keepers
    for (let i = 0; i < NUM_KEEPERS; i++) {
      const keeper = Keypair.generate();
      keepers.push(keeper);
      
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(keeper.publicKey, 2e9)
      );

      try {
        await program.methods.registerKeeper()
          .accounts({
            keeper: keeper.publicKey,
            systemConfig: systemConfig,
          })
          .signers([keeper])
          .rpc();
      } catch (e) {
        // May already be registered
      }
    }

    // Generate and fund borrowers
    for (let i = 0; i < NUM_BORROWERS; i++) {
      const borrower = Keypair.generate();
      borrowers.push(borrower);
      
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(borrower.publicKey, 2e9)
      );
    }

    console.log(`✅ Setup complete: ${NUM_KEEPERS} keepers, ${NUM_BORROWERS} borrowers`);
  });

  it("Load Test 1: Concurrent Heartbeats", async () => {
    console.log("📊 Testing concurrent heartbeats...");
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
    
    console.log(`✅ Completed ${NUM_KEEPERS} concurrent heartbeats in ${duration}ms`);
    console.log(`📊 Throughput: ${(NUM_KEEPERS / (duration / 1000)).toFixed(2)} heartbeats/second`);
  });

  it("Load Test 2: Sequential Liquidations", async () => {
    console.log("📊 Testing sequential liquidations...");
    const startTime = Date.now();
    let successCount = 0;

    for (let i = 0; i < 10; i++) {
      try {
        const keeper = keepers[i % NUM_KEEPERS];
        
        await program.methods.liquidateByHealthFactor()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: PublicKey.default,
            systemConfig: systemConfig,
            pythAccount: PublicKey.default,
          })
          .signers([keeper])
          .rpc();
        
        successCount++;
      } catch (e) {
        // Expected to fail for invalid loans
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Attempted 10 liquidations in ${duration}ms`);
    console.log(`📊 Average: ${(duration / 10).toFixed(2)}ms per liquidation attempt`);
  });

  it("Load Test 3: Stress Test - Rapid Heartbeats", async () => {
    console.log("📊 Running stress test: 50 rapid heartbeats...");
    
    const startTime = Date.now();
    let successCount = 0;
    
    for (let i = 0; i < 50; i++) {
      try {
        const keeper = keepers[i % NUM_KEEPERS];
        
        await program.methods.keeperHeartbeat()
          .accounts({
            keeper: keeper.publicKey,
            systemConfig: systemConfig,
          })
          .signers([keeper])
          .rpc();
        
        successCount++;
      } catch (e) {
        // May fail due to rate limiting
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Stress test complete: ${successCount}/50 successful heartbeats`);
    console.log(`📊 Duration: ${duration}ms`);
    console.log(`📊 Average: ${(duration / 50).toFixed(2)}ms per heartbeat`);
  });

  it("Load Test 4: Keeper Availability Check", async () => {
    console.log("📊 Testing keeper availability...");
    
    const startTime = Date.now();
    const checks = keepers.map(async (keeper) => {
      try {
        const config = await program.account.systemConfig.fetch(systemConfig);
        const keeperInfo = config.keepers.find(k =>
          k.keeperAddress.toString() === keeper.publicKey.toString()
        );
        return keeperInfo !== undefined;
      } catch (e) {
        return false;
      }
    });

    const results = await Promise.all(checks);
    const availableCount = results.filter(r => r).length;
    const duration = Date.now() - startTime;
    
    console.log(`✅ Keeper availability check complete in ${duration}ms`);
    console.log(`📊 Available: ${availableCount}/${NUM_KEEPERS}`);
  });
});
