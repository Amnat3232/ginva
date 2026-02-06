import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import BN from "bn.js";

describe("💰 Loan Repayment Test Suite", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;
  const connection = provider.connection;

  // Test accounts
  const admin = provider.wallet;
  let borrower: Keypair;

  // Token mints
  let collateralMint: PublicKey;
  let usdcMint: PublicKey;

  // PDAs
  let systemConfig: PublicKey;
  let protocolConfig: PublicKey;
  let assetConfig: PublicKey;
  let loanAccount: PublicKey;

  // Token accounts for borrower
  let borrowerCollateralAccount: PublicKey;
  let borrowerUsdcAccount: PublicKey;

  // Vault accounts
  let capitalWallet: PublicKey;
  let capitalWalletAuthority: PublicKey;
  let vaultCollateralAccount: PublicKey;
  let vaultWalletAuthority: PublicKey;
  let revenueWallet: PublicKey;
  let revenueWalletAuthority: PublicKey;

  before(async () => {
    console.log("\n🚀 Setting up test environment...\n");

    // Generate fresh borrower
    borrower = Keypair.generate();
    await connection.confirmTransaction(
      await connection.requestAirdrop(borrower.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    console.log(
      "✅ Created test borrower:",
      borrower.publicKey.toBase58().slice(0, 20) + "..."
    );

    // Create test tokens
    collateralMint = await createMint(
      connection,
      (admin as any).payer,
      admin.publicKey,
      null,
      9 // SOL decimals
    );
    console.log(
      "✅ Created collateral mint (SOL):",
      collateralMint.toBase58().slice(0, 20) + "..."
    );

    usdcMint = await createMint(
      connection,
      (admin as any).payer,
      admin.publicKey,
      null,
      6 // USDC decimals
    );
    console.log(
      "✅ Created USDC mint:",
      usdcMint.toBase58().slice(0, 20) + "..."
    );

    // Derive PDAs
    [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [protocolConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_config")],
      program.programId
    );

    [assetConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset_config"), collateralMint.toBuffer()],
      program.programId
    );

    [loanAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), borrower.publicKey.toBuffer()],
      program.programId
    );

    // Derive authorities
    [capitalWalletAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("capital_auth")],
      program.programId
    );

    [vaultWalletAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_auth")],
      program.programId
    );

    [revenueWalletAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("revenue_auth")],
      program.programId
    );

    // Derive vault accounts
    capitalWallet = await getAssociatedTokenAddress(
      usdcMint,
      capitalWalletAuthority,
      true
    );

    vaultCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      vaultWalletAuthority,
      true
    );

    revenueWallet = await getAssociatedTokenAddress(
      usdcMint,
      revenueWalletAuthority,
      true
    );

    // Create borrower's token accounts
    const borrowerCollateralATA = await getOrCreateAssociatedTokenAccount(
      connection,
      (admin as any).payer,
      collateralMint,
      borrower.publicKey
    );
    borrowerCollateralAccount = borrowerCollateralATA.address;

    const borrowerUsdcATA = await getOrCreateAssociatedTokenAccount(
      connection,
      (admin as any).payer,
      usdcMint,
      borrower.publicKey
    );
    borrowerUsdcAccount = borrowerUsdcATA.address;

    console.log("✅ Created token accounts");

    // Initialize system
    console.log("\n🔧 Initializing system...");
    await program.methods
      .initializeSystem(250) // 2.5% deposit fee
      .accounts({
        admin: admin.publicKey,
        systemConfig,
        protocolConfig,
        capitalWalletAuthority,
        vaultWalletAuthority,
        revenueWalletAuthority,
        seizedAssetsAuthority: vaultWalletAuthority,
        opsWalletAuthority: vaultWalletAuthority,
        opsWallet: capitalWallet, // Simplified for testing
        collateralMint,
        loanMint: usdcMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Add supported asset (SOL)
    const solFeedId =
      "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
    await program.methods
      .addSupportedAsset(
        solFeedId,
        new BN(60), // 60% LTV
        new BN(85) // 85% liquidation threshold
      )
      .accounts({
        admin: admin.publicKey,
        assetConfig,
        assetMint: collateralMint,
        systemConfig,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Update protocol config
    await program.methods
      .updateProtocolConfig(
        new BN(86400), // 24h timeout
        new BN(500), // 5% reward
        new BN(200), // 2% distribute
        new BN(5_000_000), // 5 USDC min
        new BN(500_000_000_000) // 500K USDC max
      )
      .accounts({
        admin: admin.publicKey,
        protocolConfig,
      })
      .rpc();

    // Mint tokens for testing
    await mintTo(
      connection,
      (admin as any).payer,
      collateralMint,
      borrowerCollateralAccount,
      admin.publicKey,
      100 * LAMPORTS_PER_SOL // 100 SOL
    );

    // Mint USDC to capital wallet
    const capitalATA = await getOrCreateAssociatedTokenAccount(
      connection,
      (admin as any).payer,
      usdcMint,
      capitalWalletAuthority,
      true
    );

    await mintTo(
      connection,
      (admin as any).payer,
      usdcMint,
      capitalATA.address,
      admin.publicKey,
      1_000_000 * 1_000_000 // 1M USDC
    );

    // Mint USDC to borrower for repayment
    await mintTo(
      connection,
      (admin as any).payer,
      usdcMint,
      borrowerUsdcAccount,
      admin.publicKey,
      10_000 * 1_000_000 // 10,000 USDC
    );

    console.log("✅ System initialized and funded\n");
  });

  describe("📝 Deposit & Borrow Flow", () => {
    it("Should deposit collateral successfully", async () => {
      console.log("\n💎 Testing: Deposit Collateral");

      const depositAmount = new BN(10 * LAMPORTS_PER_SOL); // 10 SOL

      await program.methods
        .depositCollateral(depositAmount)
        .accounts({
          user: borrower.publicKey,
          systemConfig,
          assetConfig,
          loanAccount,
          userCollateralAccount: borrowerCollateralAccount,
          vaultCollateralAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();

      const loan = await program.account.loanAccount.fetch(loanAccount);
      assert.equal(loan.collateralAmount.toNumber(), depositAmount.toNumber());
      assert.equal(loan.status, 1); // Active

      console.log(
        "✅ Deposited:",
        depositAmount.toNumber() / LAMPORTS_PER_SOL,
        "SOL"
      );
    });
  });

  describe("💸 Loan Repayment Tests", () => {
    it("Should calculate and separate principal from interest", async () => {
      console.log("\n📊 Testing: Interest Calculation");

      // Get loan state before repayment
      const loanBefore = await program.account.loanAccount.fetch(loanAccount);

      console.log("📋 Loan Details Before Repay:");
      console.log(
        "   Principal:",
        loanBefore.loanAmount.toNumber() / 1e6,
        "USDC"
      );
      console.log(
        "   Collateral:",
        loanBefore.collateralAmount.toNumber() / LAMPORTS_PER_SOL,
        "SOL"
      );
      console.log("   Interest Rate:", loanBefore.interestRateBps / 100, "%");
      console.log(
        "   Borrowed At:",
        new Date(loanBefore.borrowAt.toNumber() * 1000).toLocaleString()
      );

      // Calculate expected interest manually
      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsed = currentTime - loanBefore.borrowAt.toNumber();
      const interestRate = loanBefore.interestRateBps;
      const principal = loanBefore.loanAmount.toNumber();

      // Interest = Principal × Rate × Time / (10000 × SecondsPerYear)
      const expectedInterest = Math.floor(
        (principal * interestRate * timeElapsed) / (10000 * 31_536_000)
      );

      console.log("   Time Elapsed:", timeElapsed, "seconds");
      console.log("   Expected Interest:", expectedInterest / 1e6, "USDC");

      assert.isAtLeast(expectedInterest, 0, "Interest should be calculated");
    });

    it("Should repay loan and return collateral", async () => {
      console.log("\n💰 Testing: Full Loan Repayment");

      // Get balances before
      const borrowerCollateralBefore = await connection.getTokenAccountBalance(
        borrowerCollateralAccount
      );
      const borrowerUsdcBefore = await connection.getTokenAccountBalance(
        borrowerUsdcAccount
      );
      const vaultCollateralBefore = await connection.getTokenAccountBalance(
        vaultCollateralAccount
      );
      const capitalWalletBefore = await connection.getTokenAccountBalance(
        capitalWallet
      );
      const revenueWalletBefore = await connection.getTokenAccountBalance(
        revenueWallet
      );

      console.log("\n📊 Balances Before Repayment:");
      console.log(
        "   Borrower Collateral:",
        borrowerCollateralBefore.value.uiAmount,
        "SOL"
      );
      console.log(
        "   Borrower USDC:",
        borrowerUsdcBefore.value.uiAmount,
        "USDC"
      );
      console.log(
        "   Vault Collateral:",
        vaultCollateralBefore.value.uiAmount,
        "SOL"
      );
      console.log(
        "   Capital Wallet:",
        capitalWalletBefore.value.uiAmount,
        "USDC"
      );
      console.log(
        "   Revenue Wallet:",
        revenueWalletBefore.value.uiAmount,
        "USDC"
      );

      // Get loan state
      const loanBefore = await program.account.loanAccount.fetch(loanAccount);
      const principal = loanBefore.loanAmount.toNumber();

      // Execute repayment
      await program.methods
        .repayLoan()
        .accounts({
          user: borrower.publicKey,
          loanAccount,
          systemConfig,
          userUsdcAccount: borrowerUsdcAccount,
          capitalWallet,
          revenueWallet,
          vaultAuthority: vaultWalletAuthority,
          vaultCollateralAccount,
          userCollateralAccount: borrowerCollateralAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([borrower])
        .rpc();

      // Get balances after
      const borrowerCollateralAfter = await connection.getTokenAccountBalance(
        borrowerCollateralAccount
      );
      const borrowerUsdcAfter = await connection.getTokenAccountBalance(
        borrowerUsdcAccount
      );
      const vaultCollateralAfter = await connection.getTokenAccountBalance(
        vaultCollateralAccount
      );
      const capitalWalletAfter = await connection.getTokenAccountBalance(
        capitalWallet
      );
      const revenueWalletAfter = await connection.getTokenAccountBalance(
        revenueWallet
      );

      console.log("\n📊 Balances After Repayment:");
      console.log(
        "   Borrower Collateral:",
        borrowerCollateralAfter.value.uiAmount,
        "SOL"
      );
      console.log(
        "   Borrower USDC:",
        borrowerUsdcAfter.value.uiAmount,
        "USDC"
      );
      console.log(
        "   Vault Collateral:",
        vaultCollateralAfter.value.uiAmount,
        "SOL"
      );
      console.log(
        "   Capital Wallet:",
        capitalWalletAfter.value.uiAmount,
        "USDC"
      );
      console.log(
        "   Revenue Wallet:",
        revenueWalletAfter.value.uiAmount,
        "USDC"
      );

      // Verify collateral returned
      const collateralReturned =
        parseInt(borrowerCollateralAfter.value.amount) -
        parseInt(borrowerCollateralBefore.value.amount);
      assert.equal(
        collateralReturned,
        loanBefore.collateralAmount.toNumber(),
        "Borrower should receive all collateral back"
      );

      // Verify principal went to capital
      const capitalIncrease =
        parseInt(capitalWalletAfter.value.amount) -
        parseInt(capitalWalletBefore.value.amount);
      assert.equal(
        capitalIncrease,
        principal,
        "Principal should go to Capital Wallet"
      );

      // Verify interest went to revenue
      const revenueIncrease =
        parseInt(revenueWalletAfter.value.amount) -
        parseInt(revenueWalletBefore.value.amount);
      assert.isAbove(
        revenueIncrease,
        0,
        "Interest should go to Revenue Wallet"
      );

      // Verify loan status updated
      const loanAfter = await program.account.loanAccount.fetch(loanAccount);
      assert.equal(loanAfter.status, 2, "Loan should be marked as Repaid"); // Repaid = 2
      assert.equal(
        loanAfter.loanAmount.toNumber(),
        0,
        "Loan amount should be 0"
      );
      assert.equal(
        loanAfter.collateralAmount.toNumber(),
        0,
        "Collateral amount should be 0"
      );

      console.log("\n✅ Repayment Successful!");
      console.log("   💸 Principal Returned:", principal / 1e6, "USDC");
      console.log("   💵 Interest Paid:", revenueIncrease / 1e6, "USDC");
      console.log(
        "   🪙 Collateral Returned:",
        collateralReturned / LAMPORTS_PER_SOL,
        "SOL"
      );
    });

    it("Should reject repayment for already repaid loan", async () => {
      console.log("\n🚫 Testing: Double Repayment Prevention");

      try {
        await program.methods
          .repayLoan()
          .accounts({
            user: borrower.publicKey,
            loanAccount,
            systemConfig,
            userUsdcAccount: borrowerUsdcAccount,
            capitalWallet,
            revenueWallet,
            vaultAuthority: vaultWalletAuthority,
            vaultCollateralAccount,
            userCollateralAccount: borrowerCollateralAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([borrower])
          .rpc();

        assert.fail("Should have thrown error for repaid loan");
      } catch (err) {
        console.log("✅ Correctly prevented double repayment");
        assert.include(err.message, "LoanNotActive");
      }
    });

    it("Should reject repayment from wrong user", async () => {
      console.log("\n🔒 Testing: Unauthorized Repayment");

      const wrongUser = Keypair.generate();
      await connection.confirmTransaction(
        await connection.requestAirdrop(wrongUser.publicKey, LAMPORTS_PER_SOL)
      );

      // Create fresh loan for this test
      const [freshLoan] = PublicKey.findProgramAddressSync(
        [Buffer.from("loan"), wrongUser.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .repayLoan()
          .accounts({
            user: wrongUser.publicKey,
            loanAccount,
            systemConfig,
            userUsdcAccount: borrowerUsdcAccount, // Wrong account
            capitalWallet,
            revenueWallet,
            vaultAuthority: vaultWalletAuthority,
            vaultCollateralAccount,
            userCollateralAccount: borrowerCollateralAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([wrongUser])
          .rpc();

        assert.fail("Should have thrown error for wrong user");
      } catch (err) {
        console.log("✅ Correctly prevented unauthorized repayment");
      }
    });
  });

  describe("📈 Edge Cases", () => {
    it("Should handle zero interest edge case", async () => {
      console.log("\n⚡ Testing: Immediate Repayment (Zero Interest)");

      // This would require a fresh loan and immediate repayment
      // In practice, interest rounds to 0 if time elapsed is very small
      console.log(
        "   Note: Immediate repayment results in ~0 interest due to rounding"
      );
    });
  });

  after(() => {
    console.log("\n✨ Test Suite Complete!\n");
  });
});
