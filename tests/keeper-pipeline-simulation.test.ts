import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("Keeper Pipeline Simulation - A → B → C End-to-End", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;

  let keeperA: Keypair;
  let keeperB: Keypair;
  let keeperC: Keypair;
  let borrower: Keypair;
  let systemConfig: PublicKey;
  let loanAccount: PublicKey;
  let collateralAccount: PublicKey;

  const LAMPORTS_PER_SOL = 1e9;

  before(async () => {
    const admin = Keypair.fromSecretKey(
      Buffer.from(
        JSON.parse(
          require("fs").readFileSync(process.env.ANCHOR_WALLET, "utf-8")
        )
      )
    );

    [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      program.programId
    );

    // Generate keepers
    keeperA = Keypair.generate();
    keeperB = Keypair.generate();
    keeperC = Keypair.generate();
    borrower = Keypair.generate();

    // Airdrop SOL to all test accounts
    for (const account of [keeperA, keeperB, keeperC, borrower]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(account.publicKey, 2e9)
      );
    }

    [loanAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), borrower.publicKey.toBuffer()],
      program.programId
    );

    [collateralAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("collateral"), borrower.publicKey.toBuffer()],
      program.programId
    );

    // Register all keepers
    for (const keeper of [keeperA, keeperB, keeperC]) {
      await program.methods
        .registerKeeper()
        .accounts({
          keeper: keeper.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeper])
        .rpc();
    }
  });

  it("Complete Keeper Pipeline: Trigger → Execute → Finalize", async () => {
    console.log("=== Keeper Pipeline Simulation ===");
    console.log("Step 1: Keeper A triggers liquidation");

    // Step 1: Keeper A triggers liquidation
    await program.methods
      .liquidateByHealthFactor()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        pythAccount: PublicKey.default,
      })
      .signers([keeperA])
      .rpc();

    let loan = await program.account.loanAccount.fetch(loanAccount);
    expect(loan.liquidationTriggered).to.be.true;
    console.log("✅ Keeper A triggered liquidation");

    // Step 1B: Keeper A claims trigger reward
    await program.methods
      .claimTriggerReward()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        revenueWallet: PublicKey.default,
      })
      .signers([keeperA])
      .rpc();
    console.log("✅ Keeper A claimed trigger reward (1%)");

    // Step 2: Keeper B executes OTC swap after timeout
    console.log("Step 2: Keeper B executes OTC swap (after 2s timeout)");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s

    const collateralReceiver = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        collateralReceiver.publicKey,
        1e9
      )
    );

    await program.methods
      .executeDexFallback()
      .accounts({
        keeper: keeperB.publicKey,
        loanAccount: loanAccount,
        collateralReceiver: collateralReceiver.publicKey,
        systemConfig: systemConfig,
        tokenProgram: PublicKey.default,
      })
      .remainingAccounts([])
      .signers([keeperB])
      .rpc();

    loan = await program.account.loanAccount.fetch(loanAccount);
    expect(loan.swapped).to.be.true;
    console.log("✅ Keeper B executed OTC swap");

    // Step 3: Keeper C finalizes liquidation
    console.log("Step 3: Keeper C finalizes liquidation");
    await program.methods
      .finalizeLiquidation()
      .accounts({
        keeper: keeperC.publicKey,
        loanAccount: loanAccount,
        collateralReceiver: collateralReceiver.publicKey,
        systemConfig: systemConfig,
        tokenProgram: PublicKey.default,
        associatedTokenProgram: PublicKey.default,
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
    await program.methods
      .liquidateByHealthFactor()
      .accounts({
        keeper: keeperA.publicKey,
        loanAccount: loanAccount,
        systemConfig: systemConfig,
        pythAccount: PublicKey.default,
      })
      .signers([keeperA])
      .rpc();

    // Try to execute with same keeper (should fail)
    const collateralReceiver = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        collateralReceiver.publicKey,
        1e9
      )
    );

    try {
      await program.methods
        .executeDexFallback()
        .accounts({
          keeper: keeperA.publicKey, // Same keeper!
          loanAccount: loanAccount,
          collateralReceiver: collateralReceiver.publicKey,
          systemConfig: systemConfig,
          tokenProgram: PublicKey.default,
        })
        .signers([keeperA])
        .rpc();
      throw new Error("Should have failed - same keeper cannot execute");
    } catch (e: any) {
      expect(e.error.errorCode.code).to.equal("KeeperAlreadyTriggered");
    }
  });
});
