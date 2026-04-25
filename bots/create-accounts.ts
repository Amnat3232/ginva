#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import * as fs from "fs";
import * as crypto from "crypto";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Load wallet
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("💳 Wallet:", wallet.publicKey.toString());
  console.log("📋 Program:", PROGRAM_ID.toString());
  
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", balance / LAMPORTS_PER_SOL, "SOL\n");
  
  // Derive PDAs
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  const [protocolConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    PROGRAM_ID
  );
  
  console.log("📝 System Config PDA:", systemConfig.toString());
  console.log("📝 Protocol Config PDA:", protocolConfig.toString());
  
  // Check if accounts exist
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("\n📊 Account Status:");
  console.log("   System Config:", sysInfo ? "EXISTS" : "NOT EXISTS");
  console.log("   Protocol Config:", protoInfo ? "EXISTS" : "NOT EXISTS");
  
  if (sysInfo && protoInfo) {
    console.log("\n✅ System already initialized!");
    return;
  }
  
  // Create accounts
  const tx = new Transaction();
  
  // System config: 200 bytes (based on accounts.rs: SYSTEM_CONFIG_SIZE)
  const SYSTEM_CONFIG_SIZE = 200;
  const PROTOCOL_CONFIG_SIZE = 500; // approximate
  
  if (!sysInfo) {
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: systemConfig,
        lamports: await connection.getMinimumBalanceForRentExemption(SYSTEM_CONFIG_SIZE),
        space: SYSTEM_CONFIG_SIZE,
        programId: PROGRAM_ID,
      })
    );
    console.log("➕ Adding system config account...");
  }
  
  if (!protoInfo) {
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: protocolConfig,
        lamports: await connection.getMinimumBalanceForRentExemption(PROTOCOL_CONFIG_SIZE),
        space: PROTOCOL_CONFIG_SIZE,
        programId: PROGRAM_ID,
      })
    );
    console.log("➕ Adding protocol config account...");
  }
  
  if (tx.instructions.length === 0) {
    console.log("\n✅ Accounts exist, ready for init!");
    return;
  }
  
  // Get recent blockhash
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  
  console.log("\n📤 Creating accounts...");
  const sig = await connection.sendTransaction(tx, [wallet], {
    preflightCommitment: "confirmed",
  });
  
  console.log("✅ Transaction sent!");
  console.log("🔗 Signature:", sig);
  
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Confirmed!\n");
  
  // Verify
  const [newSysInfo, newProtoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("📊 After creation:");
  console.log("   System Config:", newSysInfo ? "✅ EXISTS" : "❌ MISSING");
  console.log("   Protocol Config:", newProtoInfo ? "✅ EXISTS" : "❌ MISSING");
}

main().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});