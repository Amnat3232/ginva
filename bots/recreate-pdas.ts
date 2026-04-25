#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, ComputeBudgetProgram 
} from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const secretKey = JSON.parse(fs.readFileSync("/home/drsolodev/.config/solana/devnet-keypair.json", "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  const [systemConfig] = PublicKey.findProgramAddressSync([Buffer.from("system_config")], PROGRAM_ID);
  const [protocolConfig] = PublicKey.findProgramAddressSync([Buffer.from("protocol_config")], PROGRAM_ID);
  
  // Check state
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("📊 Current state:");
  console.log("   System Config:", sysInfo ? `${sysInfo.owner.toString()} (${sysInfo.lamports} lamports)` : "NOT EXISTS");
  console.log("   Proto Config:", protoInfo ? `${protoInfo.owner.toString()} (${protoInfo.lamports} lamports)` : "NOT EXISTS");
  
  const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");
  
  // If owned by system, close and recreate properly
  const closeAndCreate = new Transaction();
  
  if (sysInfo && sysInfo.owner.equals(SYSTEM_PROGRAM)) {
    // Close old account
    closeAndCreate.add(SystemProgram.transfer({
      fromPubkey: systemConfig,
      toPubkey: wallet.publicKey,
      lamports: sysInfo.lamports,
    }));
    console.log("⚠️ Closing system config owned by system...");
  }
  
  if (protoInfo && protoInfo.owner.equals(SYSTEM_PROGRAM)) {
    closeAndCreate.add(SystemProgram.transfer({
      fromPubkey: protocolConfig,
      toPubkey: wallet.publicKey,
      lamports: protoInfo.lamports,
    }));
    console.log("⚠️ Closing protocol config owned by system...");
  }
  
  if (closeAndCreate.instructions.length > 0) {
    closeAndCreate.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    closeAndCreate.feePayer = wallet.publicKey;
    closeAndCreate.sign(wallet);
    
    console.log("📤 Closing old accounts...");
    try {
      const sig = await connection.sendRawTransaction(closeAndCreate.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Closed!");
    } catch (e: any) {
      console.error("❌ Close failed:", e.message);
    }
  }
  
  // Now create new accounts with program as owner
  const createTx = new Transaction();
  
  // System config: 200 bytes, owned by program
  const sysRent = await connection.getMinimumBalanceForRentExemption(200);
  createTx.add(SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: systemConfig,
    lamports: sysRent,
    space: 200,
    programId: PROGRAM_ID,
  }));
  console.log("➕ Creating system config (200 bytes)...");
  
  // Proto config: 500 bytes, owned by program
  const protoRent = await connection.getMinimumBalanceForRentExemption(500);
  createTx.add(SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: protocolConfig,
    lamports: protoRent,
    space: 500,
    programId: PROGRAM_ID,
  }));
  console.log("➕ Creating protocol config (500 bytes)...");
  
  createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  createTx.feePayer = wallet.publicKey;
  createTx.sign(wallet);
  
  console.log("📤 Creating accounts with program as owner...");
  try {
    const sig = await connection.sendRawTransaction(createTx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Created!");
  } catch (e: any) {
    console.error("❌ Create failed:", e.message);
  }
  
  // Verify
  const [newSys, newProto] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("\n📊 After creation:");
  console.log("   System Config:", newSys?.owner.toString());
  console.log("   Proto Config:", newProto?.owner.toString());
}

main().catch(e => console.error("Fatal:", e));