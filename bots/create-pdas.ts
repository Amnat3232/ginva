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
  
  // Derive PDAs
  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  const [protocolConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    PROGRAM_ID
  );
  
  // Check if accounts exist
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig).catch(() => null),
    connection.getAccountInfo(protocolConfig).catch(() => null),
  ]);
  
  console.log("📊 Status:");
  console.log("   System Config:", sysInfo ? "EXISTS" : "NOT EXISTS");
  console.log("   Protocol Config:", protoInfo ? "EXISTS" : "NOT EXISTS");
  
  if (sysInfo && protoInfo) {
    console.log("✅ Already initialized!");
    return;
  }
  
  // Create system config account - using program-owned account
  // This works because we're funding the account with lamports
  const createSysTx = new Transaction();
  
  createSysTx.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: systemConfig,
      lamports: await connection.getMinimumBalanceForRentExemption(200),
      space: 200,
      programId: PROGRAM_ID,
    })
  );
  
  createSysTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  createSysTx.feePayer = wallet.publicKey;
  createSysTx.sign(wallet);
  
  console.log("📤 Creating system config...");
  const sig1 = await connection.sendRawTransaction(createSysTx.serialize(), {
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(sig1, "confirmed");
  console.log("✅ System config created!");
  
  // Create protocol config
  const createProtoTx = new Transaction();
  
  createProtoTx.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: protocolConfig,
      lamports: await connection.getMinimumBalanceForRentExemption(500),
      space: 500,
      programId: PROGRAM_ID,
    })
  );
  
  createProtoTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  createProtoTx.feePayer = wallet.publicKey;
  createProtoTx.sign(wallet);
  
  console.log("📤 Creating protocol config...");
  const sig2 = await connection.sendRawTransaction(createProtoTx.serialize(), {
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(sig2, "confirmed");
  console.log("✅ Protocol config created!");
  
  // Verify
  const [newSysInfo, newProtoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("\n📊 After creation:");
  console.log("   System Config:", newSysInfo ? "✅ EXISTS" : "❌ MISSING");
  console.log("   Protocol Config:", newProtoInfo ? "✅ EXISTS" : "❌ MISSING");
}

main().catch(e => console.error("Error:", e.message));