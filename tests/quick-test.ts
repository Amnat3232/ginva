import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

/**
 * 🔥 QUICK TEST - Ginva Protocol Integration
 *
 * This script tests basic connectivity and account fetching
 * Run with: npx ts-node tests/quick-test.ts
 */

async function main() {
  console.log("🚀 Ginva Protocol - Quick Integration Test\n");

  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const wallet = provider.wallet;

  console.log("📡 Connection:");
  console.log("   RPC:", connection.rpcEndpoint);
  console.log("   Wallet:", wallet.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("   Balance:", (balance / 1e9).toFixed(4), "SOL");

  if (balance < 0.1) {
    console.log("\n⚠️  Warning: Low balance! Request airdrop with:");
    console.log("   solana airdrop 2");
  }

  // Program ID
  const PROGRAM_ID = new PublicKey(
    "DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv"
  );
  console.log("\n📋 Program:");
  console.log("   ID:", PROGRAM_ID.toString());

  // Check if program exists
  const programInfo = await connection.getAccountInfo(PROGRAM_ID);
  if (programInfo) {
    console.log("   Status: ✅ Deployed");
    console.log("   Executable:", programInfo.executable);
    console.log("   Size:", programInfo.data.length, "bytes");
  } else {
    console.log("   Status: ❌ Not deployed");
    console.log("\n   Deploy with:");
    console.log("   anchor deploy --provider.cluster devnet");
  }

  // Derive PDAs
  console.log("\n🔑 PDAs:");

  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  console.log("   System Config:", systemConfig.toString());

  const [protocolConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    PROGRAM_ID
  );
  console.log("   Protocol Config:", protocolConfig.toString());

  // Check if initialized
  const systemInfo = await connection.getAccountInfo(systemConfig);
  if (systemInfo) {
    console.log("\n✅ System is initialized!");
    console.log("   Account size:", systemInfo.data.length, "bytes");
  } else {
    console.log("\n⏳ System not initialized yet");
    console.log("   Run: anchor run initialize");
  }

  console.log("\n🎯 Next steps:");
  console.log("   1. Deploy: anchor deploy --provider.cluster devnet");
  console.log("   2. Initialize: anchor run initialize");
  console.log("   3. Test: anchor test --grep 'Integration'");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
