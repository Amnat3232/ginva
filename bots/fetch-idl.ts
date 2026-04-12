import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const programId = new PublicKey("Ev9HTrf45JBM5PBvAG9v6AUb5cw4XeGgKXmrk7RtQm3D");

async function main() {
  console.log("Fetching program account info...");

  const programInfo = await connection.getAccountInfo(programId);
  console.log("Program data length:", programInfo?.data?.length);

  if (programInfo) {
    const data = Buffer.from(programInfo.data);
    console.log("First 200 bytes (hex):", data.slice(0, 200).toString("hex").slice(0, 100));

    // Look for IDL in program - Anchor stores it after a specific discriminator
    const dataStr = data.toString("utf8");

    // Search for "instructions" keyword (common in IDL)
    const idx = dataStr.indexOf("instructions");
    if (idx >= 0) {
      console.log("\nFound 'instructions' at offset", idx);
      // Try to extract JSON around that area
      const start = Math.max(0, idx - 50);
      const end = Math.min(dataStr.length, idx + 500);
      console.log("Context:", dataStr.slice(start, end).slice(0, 300));
    }
  }
}

main().catch(console.error);