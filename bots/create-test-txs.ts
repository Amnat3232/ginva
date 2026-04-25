#!/usr/bin/env npx tsx
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("Wallet:", wallet.publicKey.toString());
  console.log("Program:", PROGRAM_ID.toString());
  
  // Get program accounts
  const accounts = await connection.getProgramAccounts(PROGRAM_ID);
  console.log("\n📊 Program Accounts:", accounts.length);
  
  // Show account types
  for (const acc of accounts.slice(0, 10)) {
    console.log(" -", acc.pubkey.toString(), `(${acc.account.data.length} bytes)`);
  }
  
  if (accounts.length === 0) {
    console.log("\n⚠️ No accounts found! System may not be initialized.");
    console.log("Run initialize-system.ts first");
  }
}

main();
