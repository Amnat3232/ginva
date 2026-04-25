#!/usr/bin/env npx tsx
/**
 * Check System Initialization Status
 */
import { Connection, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/bots/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  // Calculate systemConfig PDA
  const [systemConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );

  console.log("System Config PDA:", systemConfigPDA.toString());
  console.log("Program ID:", PROGRAM_ID.toString());
  console.log("Checking if initialized...\n");

  const info = await connection.getAccountInfo(systemConfigPDA);
  if (info) {
    console.log("✓ Account exists");
    console.log("  Data length:", info.data.length, "bytes");
    const discriminator = info.data.slice(0, 8);
    console.log("  Discriminator:", discriminator);
    const str = Buffer.from(discriminator).toString("utf8");
    if (str === "config__") {
      console.log("\n✅ Status: ALREADY INITIALIZED\n");
      
      // Try to decode some fields
      try {
        const admin = info.data.slice(8, 40);
        console.log("  Admin:", new PublicKey(admin).toString());
        const totalBorrowed = info.data.slice(56, 64).readBigUInt64LE(0);
        const totalCollateral = info.data.slice(64, 72).readBigUInt64LE(0);
        console.log("  Total Borrowed:", totalBorrowed.toString());
        console.log("  Total Collateral:", totalCollateral.toString());
      } catch (e) {
        console.log("  (Could not decode fields)");
      }
    } else {
      console.log("\n❌ Status: NOT INITIALIZED (wrong discriminator:", str, ")\n");
    }
  } else {
    console.log("❌ Account DOES NOT EXIST - System NOT initialized\n");
  }
}

main().catch(console.error);