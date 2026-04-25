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
  const [protocolConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    PROGRAM_ID
  );
  
  console.log("📝 System Config:", systemConfig.toString());
  console.log("📝 Protocol Config:", protocolConfig.toString());
  
  // Check existing
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig).catch(() => null),
    connection.getAccountInfo(protocolConfig).catch(() => null),
  ]);
  
  if (sysInfo || protoInfo) {
    console.log("\n⚠️ Accounts may already exist");
  }
  
  // Try calling just initialize instruction - program creates accounts
  const tx = new Transaction();
  
  // Initialize instruction (instruction index = 0, deposit_fee = 30 bps)
  const data = Buffer.from([0, 30, 0]); // discriminator 0, deposit_fee 30 LE
  
  tx.add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: systemConfig, isSigner: false, isWritable: true },
      { pubkey: protocolConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: data,
  });
  
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  
  console.log("\n📤 Calling initialize...");
  
  try {
    const sig = await connection.sendTransaction(tx, [wallet], {
      preflightCommitment: "confirmed",
    });
    
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Confirmed!");
    
    // Verify
    const [newSysInfo, newProtoInfo] = await Promise.all([
      connection.getAccountInfo(systemConfig),
      connection.getAccountInfo(protocolConfig),
    ]);
    
    console.log("\n📊 Result:");
    console.log("   System Config:", newSysInfo ? "✅" : "❌");
    console.log("   Protocol Config:", newProtoInfo ? "✅" : "❌");
    
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    
    // Try to get program error
    if (e.message?.includes("0x")) {
      const code = parseInt(e.message.match(/0x([0-9a-f]+)/i)?.[1] || "0", 16);
      console.log("   Error code:", code);
    }
  }
}

main().catch(e => console.error("Error:", e.message));