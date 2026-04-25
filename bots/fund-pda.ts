#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("💳 Wallet:", wallet.publicKey.toString());
  
  // Derive PDAs - these are program-derived so can't sign
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  
  // Create system config account - using a simpler method
  // We'll use the CLI instead
  console.log("\n📝 System Config PDA:", systemConfig.toString());
  
  // Check if exists
  const info = await connection.getAccountInfo(systemConfig).catch(() => null);
  if (info) {
    console.log("✅ Account already exists!");
    return;
  }
  
  // Use simple method: fund with lamports directly
  console.log("\n📤 Funding account with lamports...");
  
  const lamports = await connection.getMinimumBalanceForRentExemption(200);
  
  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: systemConfig,
      lamports: lamports,
    })
  );
  
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(wallet);
  
  const sig = await connection.sendRawTransaction(tx.serialize(), {
    preflightCommitment: "confirmed",
  });
  
  console.log("✅ Sent:", sig);
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Funded!");
  
  // Now assign program as owner
  const assignTx = new Transaction();
  assignTx.add(
    SystemProgram.assign({
      accountPubkey: systemConfig,
      programId: PROGRAM_ID,
    })
  );
  
  assignTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  assignTx.feePayer = wallet.publicKey;
  assignTx.sign(wallet);
  
  const sig2 = await connection.sendRawTransaction(assignTx.serialize(), {
    preflightCommitment: "confirmed",
  });
  
  console.log("✅ Assign sent:", sig2);
  await connection.confirmTransaction(sig2, "confirmed");
  console.log("✅ Assigned to program!");
  
  // Verify
  const newInfo = await connection.getAccountInfo(systemConfig);
  console.log("\n📊 Account:", newInfo ? "✅ EXISTS" : "❌ MISSING");
  console.log("   Owner:", newInfo?.owner?.toString() || "N/A");
}

main().catch(e => console.error("Error:", e.message));