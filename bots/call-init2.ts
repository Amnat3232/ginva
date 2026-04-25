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
  const [opsWallet] = PublicKey.findProgramAddressSync(
    [Buffer.from("ops_wallet")],
    PROGRAM_ID
  );
  const [reserveWallet] = PublicKey.findProgramAddressSync(
    [Buffer.from("reserve_wallet")],
    PROGRAM_ID
  );
  
  // Use devnet USDC and SOL mints
  const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // SOL
  const LOAN_MINT = new PublicKey("4zMMC9s63aj4emqG9q5ZtYGM3K1XP2eZCMC2Fs5hLmRd"); // Devnet USDC
  
  console.log("\n📝 PDAs:");
  console.log("   System Config:", systemConfig.toString());
  console.log("   Protocol Config:", protocolConfig.toString());
  console.log("   Ops Wallet:", opsWallet.toString());
  console.log("   Reserve Wallet:", reserveWallet.toString());
  console.log("   Collateral Mint:", COLLATERAL_MINT.toString());
  console.log("   Loan Mint:", LOAN_MINT.toString());
  
  // Check if accounts exist
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig).catch(() => null),
    connection.getAccountInfo(protocolConfig).catch(() => null),
  ]);
  
  console.log("\n📊 Status:");
  console.log("   System Config:", sysInfo ? "EXISTS" : "NOT EXISTS");
  console.log("   Protocol Config:", protoInfo ? "EXISTS" : "NOT EXISTS");
  
  // Build initialize transaction
  const tx = new Transaction();
  
  // Instruction: 0 = initialize, data = deposit_fee (30 bps = 0.3%)
  const data = Buffer.from([0, 30, 0]); // instruction 0, then 30 in LE
  
  tx.add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },       // 0. admin
      { pubkey: systemConfig, isSigner: false, isWritable: true },        // 1. system_config
      { pubkey: protocolConfig, isSigner: false, isWritable: true },      // 2. protocol_config
      { pubkey: opsWallet, isSigner: false, isWritable: true },           // 3. ops_wallet
      { pubkey: reserveWallet, isSigner: false, isWritable: true },      // 4. reserve_wallet
      { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false }, // 5. collateral_mint
      { pubkey: LOAN_MINT, isSigner: false, isWritable: false },        // 6. loan_mint
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // 7. system_program
    ],
    data: data,
  });
  
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  
  console.log("\n📤 Calling InitializeSystem...");
  
  try {
    const sig = await connection.sendTransaction(tx, [wallet], {
      preflightCommitment: "confirmed",
    });
    
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Confirmed!");
    
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    
    if (e.message?.includes("0x")) {
      const code = parseInt(e.message.match(/0x([0-9a-f]+)/i)?.[1] || "0", 16);
      console.log("   Error code:", code);
    }
  }
}

main().catch(e => console.error("Error:", e.message));