#!/usr/bin/env npx tsx
/**
 * Check account details
 */
import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");

  const [systemConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );

  console.log("System Config PDA:", systemConfigPDA.toString());
  
  const info = await connection.getAccountInfo(systemConfigPDA);
  if (info) {
    console.log("Owner:", info.owner.toString());
    console.log("Data length:", info.data.length);
    console.log("Executable:", info.executable);
    console.log("Lamports:", info.lamports);
  } else {
    console.log("Account does not exist");
  }
}

main().catch(console.error);