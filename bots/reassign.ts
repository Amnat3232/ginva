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
  
  // Check current owner
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("📊 Current state:");
  console.log("   System Config:", sysInfo ? `${sysInfo.owner.toString()} (${sysInfo.lamports} lamports)` : "NOT EXISTS");
  console.log("   Proto Config:", protoInfo ? `${protoInfo.owner.toString()} (${protoInfo.lamports} lamports)` : "NOT EXISTS");
  
  // If owned by system program, reassign to our program
  const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");
  
  const assignTx = new Transaction();
  
  if (sysInfo && sysInfo.owner.equals(SYSTEM_PROGRAM)) {
    console.log("⚠️ System config owned by system - reassigning...");
    assignTx.add(SystemProgram.assign({
      accountPubkey: systemConfig,
      programId: PROGRAM_ID,
    }));
  }
  
  if (protoInfo && protoInfo.owner.equals(SYSTEM_PROGRAM)) {
    console.log("⚠️ Proto config owned by system - reassigning...");
    assignTx.add(SystemProgram.assign({
      accountPubkey: protocolConfig,
      programId: PROGRAM_ID,
    }));
  }
  
  if (assignTx.instructions.length > 0) {
    assignTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    assignTx.feePayer = wallet.publicKey;
    assignTx.sign(wallet);
    
    console.log("📤 Reassigning ownership...");
    try {
      const sig = await connection.sendRawTransaction(assignTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Reassigned!");
    } catch (e: any) {
      console.error("❌ Reassign failed:", e.message);
    }
  } else {
    console.log("✅ Already owned by program");
  }
  
  // Verify
  const [newSys, newProto] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("\n📊 After reassign:");
  console.log("   System Config:", newSys?.owner.toString());
  console.log("   Proto Config:", newProto?.owner.toString());
}

main().catch(e => console.error("Fatal:", e));