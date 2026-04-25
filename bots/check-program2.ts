import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = "67cu15Nf1rEaTMMEyda3TcvRMArUGRmH94etRTBJ7sSB";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function main() {
  const program = new PublicKey(PROGRAM_ID);
  const info = await connection.getParsedAccountInfo(program);
  console.log("Program:", program.toString());
  console.log("Owner:", info.value?.owner?.toString());
  if (info.value?.data?.parsed) {
    console.log("Data:", JSON.stringify(info.value.data.parsed, null, 2));
  }
}
main();