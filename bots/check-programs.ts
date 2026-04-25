import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Both program IDs from env
const programs = [
  "CygDH6bVsyKpe8BHnWZDZ33A8UwjQK6Xhj5hijbWuceu",  // pinocchio
  "67cu15Nf1rEaTMMEyda3TcvRMArUGRmH94etRTBJ7sSB",  // app
  "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man", // original from earlier
];

async function main() {
  for (const pid of programs) {
    const pubkey = new PublicKey(pid);
    try {
      const info = await connection.getParsedAccountInfo(pubkey);
      const owner = info.value?.owner || "NOT DEPLOYED";
      console.log(`${pid.slice(0,8)}... -> ${owner}`);
    } catch(e) {
      console.log(`${pid.slice(0,8)}... -> ERROR: ${e.message}`);
    }
  }
}
main();