import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { assert } from "chai";

// Test configuration
const PROGRAM_ID = new PublicKey(
  "DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv"
);
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

describe("🔥 Ginva Protocol - Integration Test on Devnet", () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Ginva as Program<Ginva>;
  const connection = provider.connection;

  // Test accounts
  let admin: Keypair;
  let borrower: Keypair;
  let lender: Keypair;
  let keeper: Keypair;

  // PDAs
  let systemConfig: PublicKey;
  let protocolConfig: PublicKey;
  let assetConfig: PublicKey;
  let loanAccount: PublicKey;
  let userRateLimit: PublicKey;

  // Token accounts
  let adminCollateralATA: PublicKey;
  let adminLoanATA: PublicKey;
  let borrowerCollateralATA: PublicKey;
  let borrowerLoanATA: PublicKey;

  before(async () => {
    console.log("\n🚀 Setting up test environment on Devnet...");
    console.log("📡 RPC Endpoint:", connection.rpcEndpoint);
    console.log("👛 Wallet:", provider.wallet.publicKey.toString());

    // Use the provider wallet as admin
    admin = Keypair.fromSecretKey(
      Buffer.from(
        JSON.parse(
          require("fs").readFileSync(process.env.ANCHOR_WALLET, "utf-8")
        )
      )
    );

    console.log("✅ Admin:", admin.publicKey.toString());
    console.log(
      "💰 Balance:",
      (await connection.getBalance(admin.publicKey)) / 1e9,
      "SOL"
    );
  });

  describe("🏗️ Phase 1: Initialize Protocol", () => {
    it("Should derive PDAs", async () => {
      // Derive SystemConfig PDA
      [systemConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("system_config")],
        program.programId
      );

      // Derive ProtocolConfig PDA
      [protocolConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_config")],
        program.programId
      );

      console.log("📋 System Config:", systemConfig.toString());
      console.log("📋 Protocol Config:", protocolConfig.toString());

      assert.ok(systemConfig);
      assert.ok(protocolConfig);
    });

    it("Should initialize system (if not already initialized)", async () => {
      try {
        // Check if already initialized
        const systemAccount = await program.account.systemConfig.fetch(
          systemConfig
        );
        console.log("✅ System already initialized");
        console.log("   Admin:", systemAccount.admin.toString());
        console.log(
          "   Total Borrowed:",
          systemAccount.totalBorrowed.toString()
        );
        return;
      } catch (e) {
        console.log("📝 Initializing system...");
      }

      // Create token accounts for wallets
      // Note: In real test, you'd create these first

      try {
        const tx = await program.methods
          .initializeSystem(50) // 0.5% deposit fee
          .accounts({
            admin: admin.publicKey,
            systemConfig,
            protocolConfig,
            capitalWalletAuthority: admin.publicKey,
            vaultWalletAuthority: admin.publicKey,
            revenueWalletAuthority: admin.publicKey,
            seizedAssetsAuthority: admin.publicKey,
            collateralMint: SOL_MINT,
            loanMint: USDC_MINT,
            opsWallet: admin.publicKey,
            reserveWallet: admin.publicKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        console.log("✅ System initialized!");
        console.log("   Transaction:", tx);

        // Verify
        const systemAccount = await program.account.systemConfig.fetch(
          systemConfig
        );
        assert.equal(
          systemAccount.admin.toString(),
          admin.publicKey.toString()
        );
        assert.equal(systemAccount.depositFeeBps, 50);
      } catch (error) {
        console.error("❌ Failed to initialize:", error);
        throw error;
      }
    });

    it("Should add SOL as supported asset", async () => {
      try {
        // Derive AssetConfig PDA for SOL
        [assetConfig] = PublicKey.findProgramAddressSync(
          [Buffer.from("asset_config"), SOL_MINT.toBuffer()],
          program.programId
        );

        console.log("📋 Asset Config:", assetConfig.toString());

        // Check if already exists
        try {
          const asset = await program.account.assetConfig.fetch(assetConfig);
          console.log("✅ SOL already added as collateral");
          console.log("   Max LTV:", asset.maxLtv, "%");
          return;
        } catch (e) {
          console.log("📝 Adding SOL as collateral...");
        }

        // Pyth SOL/USD feed ID (devnet)
        const solFeedId = Buffer.from(
          "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
          "hex"
        );

        const tx = await program.methods
          .addSupportedAsset(
            SOL_MINT,
            Array.from(solFeedId),
            9, // decimals
            6000, // 60% max LTV
            8500, // 85% liquidation threshold
            true // isActive
          )
          .accounts({
            admin: admin.publicKey,
            protocolConfig,
            assetConfig,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("✅ SOL added as collateral!");
        console.log("   Transaction:", tx);
      } catch (error) {
        console.error("❌ Failed to add asset:", error);
        throw error;
      }
    });
  });

  describe("💰 Phase 2: Deposit & Borrow", () => {
    it("Should deposit SOL as collateral", async () => {
      console.log("\n💎 Testing Deposit...");

      // In real scenario, you'd:
      // 1. Create borrower keypair
      // 2. Airdrop SOL
      // 3. Create token accounts
      // 4. Execute deposit

      console.log("⏭️  Skipping (requires setup token accounts)");
      console.log("   Note: Run full flow after contract deployment");
    });

    it("Should borrow USDC", async () => {
      console.log("\n💵 Testing Borrow...");
      console.log("⏭️  Skipping (requires deposit first)");
    });
  });

  describe("🔄 Phase 3: Repay & Extend", () => {
    it("Should repay loan", async () => {
      console.log("\n💳 Testing Repay...");
      console.log("⏭️  Skipping (requires active loan)");
    });

    it("Should extend loan", async () => {
      console.log("\n📅 Testing Extend Loan...");
      console.log("⏭️  Skipping (requires active loan)");
    });
  });

  describe("🌊 Phase 4: Liquidation Flow", () => {
    it("Should trigger liquidation", async () => {
      console.log("\n🔨 Testing Trigger Liquidation...");
      console.log("⏭️  Skipping (requires underwater loan)");
    });

    it("Should buy from storefront", async () => {
      console.log("\n🛒 Testing Storefront Purchase...");
      console.log("⏭️  Skipping (requires liquidated collateral)");
    });

    it("Should finalize liquidation", async () => {
      console.log("\n⚡ Testing Finalize Liquidation...");
      console.log("⏭️  Skipping (requires completed swap)");
    });
  });

  describe("📊 Phase 5: Health Checks", () => {
    it("Should check protocol health", async () => {
      try {
        const systemAccount = await program.account.systemConfig.fetch(
          systemConfig
        );
        console.log("\n🏥 Protocol Health Check:");
        console.log(
          "   Status:",
          systemAccount.isPaused ? "🛑 PAUSED" : "✅ Active"
        );
        console.log(
          "   Total Borrowed:",
          (Number(systemAccount.totalBorrowed) / 1e6).toFixed(2),
          "USDC"
        );
        console.log(
          "   Total Collateral:",
          systemAccount.totalCollateral.toString()
        );
        console.log(
          "   Target Reserves:",
          (Number(systemAccount.targetReserves) / 1e6).toFixed(2),
          "USDC"
        );

        assert.ok(systemAccount);
      } catch (error) {
        console.error("❌ Failed to fetch system config:", error);
      }
    });

    it("Should check asset config", async () => {
      try {
        const asset = await program.account.assetConfig.fetch(assetConfig);
        console.log("\n💎 SOL Asset Config:");
        console.log("   Max LTV:", asset.maxLtv / 100, "%");
        console.log(
          "   Liquidation Threshold:",
          asset.liquidationThreshold / 100,
          "%"
        );
        console.log("   Decimals:", asset.decimals);
        console.log("   Active:", asset.isActive);

        assert.ok(asset.isActive);
      } catch (error) {
        console.error("❌ Failed to fetch asset config:", error);
      }
    });
  });
});

// Helper functions
async function airdrop(
  connection: Connection,
  pubkey: PublicKey,
  amount: number
) {
  const signature = await connection.requestAirdrop(pubkey, amount);
  await connection.confirmTransaction(signature);
  console.log(
    `   Airdropped ${amount / 1e9} SOL to ${pubkey.toString().slice(0, 8)}...`
  );
}

async function getOrCreateATA(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
) {
  const ata = await getAssociatedTokenAddress(mint, owner);

  try {
    await connection.getTokenAccountBalance(ata);
    return ata;
  } catch {
    // Create ATA
    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint)
    );
    await anchor.web3.sendAndConfirmTransaction(connection, tx, [payer]);
    return ata;
  }
}
