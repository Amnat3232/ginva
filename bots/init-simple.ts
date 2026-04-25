#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  createInitializeInstruction 
} from "@solana/spl-token";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("💳 Wallet:", wallet.publicKey.toString());
  console.log("📋 Program:", PROGRAM_ID.toString());
  
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", balance / LAMPORTS_PER_SOL, "SOL\n");
  
  // Derive system config PDA
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  console.log("🔧 System Config PDA:", systemConfig.toString());
  
  // Check if already initialized
  try {
    const accountInfo = await connection.getAccountInfo(systemConfig);
    if (accountInfo) {
      console.log("✅ System already initialized!");
      return;
    }
  } catch (e) {
    console.log("📝 Creating system config...");
  }
  
  // Create initialize instruction data (8 byte discriminator + 32 byte admin)
  const adminPubkey = wallet.publicKey.toBuffer();
  const discriminator = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]); // 8 zeros as discriminator
  
  // Build transaction
  const tx = new Transaction();
  
  // Add system program create account instruction
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: systemConfig,
      lamports: await connection.getMinimumBalanceForRentExemption(200),
      space: 200,
      programId: PROGRAM_ID,
    })
  );
  
  // Sign and send - need to add wallet as signer for createAccount
  console.log("📤 Signing transaction...");
  const sig = await connection.sendTransaction(tx, [wallet], {
    preflightCommitment: "confirmed"
  });
  
  console.log("✅ Transaction sent!");
  console.log("🔗 Signature:", sig);
  console.log("\n⏳ Waiting for confirmation...");
  
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Confirmed!");
}

main().catch(console.error);
