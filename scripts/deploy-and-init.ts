#!/usr/bin/env ts-node
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

/**
 * 🚀 Deploy & Initialize Script
 *
 * Usage: npx ts-node scripts/deploy-and-init.ts
 */

const PROGRAM_ID = new PublicKey(
  "DyeFMCFmvtkmPtDE4rFryvSDFWwuDCdDhFqPCPdCvujv"
);
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  console.log("🚀 Deploy & Initialize Ginva Protocol\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet;
  console.log("👛 Wallet:", wallet.publicKey.toString());

  // Check balance
  const balance = await provider.connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", (balance / 1e9).toFixed(4), "SOL");

  if (balance < 0.5) {
    console.log("\n⚠️  Insufficient balance! Requesting airdrop...");
    await provider.connection.requestAirdrop(wallet.publicKey, 2 * 1e9);
    console.log("   Airdropped 2 SOL");
  }

  console.log("\n📦 Step 1: Deploy Program");
  console.log("   Run: anchor deploy --provider.cluster devnet");
  console.log("   (This must be done manually due to build requirements)");

  console.log("\n📋 Step 2: Derive PDAs");

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

  console.log("\n✅ Setup complete!");
  console.log("\nNext commands:");
  console.log("   1. anchor deploy --provider.cluster devnet");
  console.log("   2. anchor run initialize");
  console.log("   3. anchor run add-asset");
}

main().catch(console.error);
