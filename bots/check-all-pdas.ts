import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Derive PDAs for both programs
const PINOCCHIO = "CygDH6bVsyKpe8BHnWZDZ33A8UwjQK6Xhj5hijbWuceu";
const OTHER = "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man";

const seeds = ["system_config", "protocol_config", "ops_wallet", "reserve_wallet"];

async function checkPDAs(programId: string) {
  console.log(`\n📋 Program: ${programId.slice(0,8)}...`);
  const program = new PublicKey(programId);
  
  for (const seed of seeds) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from(seed)], program);
    const info = await connection.getAccountInfo(pda);
    if (info) {
      console.log(`  ${seed}: EXISTS (owner=${info.owner.toString().slice(0,8)}..., dataLen=${info.data.length})`);
    } else {
      console.log(`  ${seed}: NOT FOUND`);
    }
  }
}

async function main() {
  await checkPDAs(PINOCCHIO);
  await checkPDAs(OTHER);
}
main();