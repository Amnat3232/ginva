import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// Load wallet from file
const loadWallet = (keyPath: string) => {
  const keypairFile = fs.readFileSync(keyPath, "utf-8");
  const keypairData = JSON.parse(keypairFile);
  return Keypair.fromSecretKey(Uint8Array.from(keypairData));
};

const main = async () => {
  console.log("🚀 Ginva Protocol Devnet Setup\n");

  // Setup connection to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Load deployer wallet (use id.json from solana config)
  const deployerKeyPath = path.join(
    require("os").homedir(),
    ".config",
    "solana",
    "id.json"
  );

  if (!fs.existsSync(deployerKeyPath)) {
    console.error("❌ Solana keypair not found at:", deployerKeyPath);
    console.error("Please run: solana-keygen new");
    process.exit(1);
  }

  const deployer = loadWallet(deployerKeyPath);
  console.log("👤 Deployer:", deployer.publicKey.toBase58());

  // Check balance
  const balance = await connection.getBalance(deployer.publicKey);
  console.log("💰 Balance:", balance / LAMPORTS_PER_SOL, "SOL");

  if (balance < 5 * LAMPORTS_PER_SOL) {
    console.log("⚠️  Low balance! Requesting airdrop...");
    await connection.confirmTransaction(
      await connection.requestAirdrop(deployer.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    console.log("✅ Airdrop received");
  }

  // Setup provider
  const wallet = new anchor.Wallet(deployer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program
  const programId = new PublicKey(
    "qhuM4YAAwGYmTnK7rcXminqaMR72412CcHMu99QxeZS"
  );
  const idl = JSON.parse(fs.readFileSync("./target/idl/ginva.json", "utf-8"));
  const program = new anchor.Program(
    idl,
    programId,
    provider
  ) as Program<Ginva>;
  console.log("📦 Program ID:", programId.toBase58());

  console.log("\n📝 Step 1: Deriving PDAs...");

  // Derive all PDAs
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  const [capitalWalletAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("capital_auth")],
    programId
  );

  const [vaultWalletAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_auth")],
    programId
  );

  const [revenueWalletAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("revenue_auth")],
    programId
  );

  const [seizedAssetsAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("seized_auth")],
    programId
  );

  const [processingVaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("processing_auth")],
    programId
  );

  console.log("   System Config:", systemConfig.toBase58());
  console.log("   Capital Authority:", capitalWalletAuthority.toBase58());
  console.log("   Vault Authority:", vaultWalletAuthority.toBase58());
  console.log("   Revenue Authority:", revenueWalletAuthority.toBase58());
  console.log("   Seized Assets Authority:", seizedAssetsAuthority.toBase58());
  console.log(
    "   Processing Vault Authority:",
    processingVaultAuthority.toBase58()
  );

  console.log("\n📝 Step 2: Creating tokens...");

  // Create collateral token (wrapped SOL or test token)
  const collateralMint = await createMint(
    connection,
    deployer,
    deployer.publicKey,
    null,
    9 // SOL decimals
  );
  console.log("   Collateral Mint:", collateralMint.toBase58());

  // Create USDC test token
  const usdcMint = await createMint(
    connection,
    deployer,
    deployer.publicKey,
    null,
    6 // USDC decimals
  );
  console.log("   USDC Mint:", usdcMint.toBase58());

  console.log("\n📝 Step 3: Creating token accounts...");

  // Create capital wallet (for lending)
  const capitalWallet = await getOrCreateAssociatedTokenAccount(
    connection,
    deployer,
    usdcMint,
    capitalWalletAuthority,
    true
  );
  console.log("   Capital Wallet:", capitalWallet.address.toBase58());

  // Create vault collateral account (for storing collateral)
  const vaultCollateral = await getOrCreateAssociatedTokenAccount(
    connection,
    deployer,
    collateralMint,
    vaultWalletAuthority,
    true
  );
  console.log("   Vault Collateral:", vaultCollateral.address.toBase58());

  // Create revenue wallet
  const revenueWallet = await getOrCreateAssociatedTokenAccount(
    connection,
    deployer,
    usdcMint,
    revenueWalletAuthority,
    true
  );
  console.log("   Revenue Wallet:", revenueWallet.address.toBase58());

  console.log("\n📝 Step 4: Minting initial liquidity...");

  // Mint USDC to capital wallet for lending
  const capitalAmount = 1_000_000 * 1_000_000; // 1M USDC
  await mintTo(
    connection,
    deployer,
    usdcMint,
    capitalWallet.address,
    deployer,
    capitalAmount
  );
  console.log("   Minted", capitalAmount / 1_000_000, "USDC to Capital Wallet");

  console.log("\n📝 Step 5: Initializing system...");

  try {
    await program.methods
      .initializeSystem(250) // 2.5% deposit fee
      .accounts({
        admin: deployer.publicKey,
        systemConfig,
        capitalWalletAuthority,
        vaultWalletAuthority,
        revenueWalletAuthority,
        seizedAssetsAuthority,
        collateralMint,
        loanMint: usdcMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("   ✅ System initialized successfully!");
  } catch (e) {
    console.error("   ❌ Failed to initialize system:", e.message);
    throw e;
  }

  console.log("\n📝 Step 6: Verifying setup...");

  const config = await program.account.systemConfig.fetch(systemConfig);
  console.log("   Admin:", config.admin.toBase58());
  console.log("   Is Active:", config.isActive);
  console.log("   Deposit Fee BPS:", config.depositFeeBps);
  console.log("   Total Borrowed:", config.totalBorrowed.toNumber());
  console.log("   Total Collateral:", config.totalCollateral.toNumber());

  console.log("\n✅ Setup Complete!\n");

  // Save deployment info
  const deploymentInfo = {
    network: "devnet",
    programId: programId.toBase58(),
    systemConfig: systemConfig.toBase58(),
    tokens: {
      collateral: collateralMint.toBase58(),
      usdc: usdcMint.toBase58(),
    },
    wallets: {
      capital: capitalWallet.address.toBase58(),
      vault: vaultCollateral.address.toBase58(),
      revenue: revenueWallet.address.toBase58(),
    },
    authorities: {
      capital: capitalWalletAuthority.toBase58(),
      vault: vaultWalletAuthority.toBase58(),
      revenue: revenueWalletAuthority.toBase58(),
      seized: seizedAssetsAuthority.toBase58(),
      processing: processingVaultAuthority.toBase58(),
    },
    deployer: deployer.publicKey.toBase58(),
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment-info.json");

  console.log("\n📋 Next Steps:");
  console.log("   1. Test depositing collateral: anchor run test:deposit");
  console.log("   2. Test borrowing: anchor run test:borrow");
  console.log("   3. Test liquidation: anchor run test:liquidation");
  console.log("   4. Start monitoring bot: npm run bot:start");
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
  });
