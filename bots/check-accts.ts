#!/usr/bin/env npx tsx
import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const accounts = await connection.getProgramAccounts(PROGRAM_ID);
console.log("Accounts:", accounts.length);

if (accounts.length > 0) {
  console.log("\nAll accounts:");
  accounts.forEach(a => console.log(" ", a.pubkey.toString(), a.account.data.length + " bytes"));
} else {
  console.log("\n⚠️ No accounts yet. Need to initialize.");
}