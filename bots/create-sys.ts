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
  
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  
  const SYSTEM_CONFIG_SIZE = 200;
  
  console.log("\n📝 System Config PDA:", systemConfig.toString());
  
  // Check if exists
  const info = await connection.getAccountInfo(systemConfig).catch(() => null);
  
  if (info) {
    console.log("✅ Account already exists!");
    return;
  }
  
  console.log("📝 Creating system config account...");
  
  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: systemConfig,
      lamports: await connection.getMinimumBalanceForRentExemption(SYSTEM_CONFIG_SIZE),
      space: SYSTEM_CONFIG_SIZE,
      programId: PROGRAM_ID,
    })
  );
  
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  
  const sig = await connection.sendTransaction(tx, [wallet], {
    preflightCommitment: "confirmed",
  });
  
  console.log("✅ Sent:", sig);
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Confirmed!");
  
  // Verify
  const newInfo = await connection.getAccountInfo(systemConfig);
  console.log("✅ Account created:", !!newInfo);
}

main().catch(e => {
  console.error("❌ Error:", e.message);
});