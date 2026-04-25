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
  
  const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
  const LOAN_MINT = new PublicKey("4zMMC9s63aj4emqG9q5ZtYGM3K1XP2eZCMC2Fs5hLmRd");
  
  // Check if accounts exist
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig).catch(() => null),
    connection.getAccountInfo(protocolConfig).catch(() => null),
  ]);
  
  console.log("📊 Status:");
  console.log("   System Config:", sysInfo ? "EXISTS" : "NOT EXISTS");
  console.log("   Protocol Config:", protoInfo ? "EXISTS" : "NOT EXISTS");
  
  // Build transaction with account creation
  const tx = new Transaction();
  
  // System config: 200 bytes
  if (!sysInfo) {
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: systemConfig,
        lamports: await connection.getMinimumBalanceForRentExemption(200),
        space: 200,
        programId: PROGRAM_ID,
      })
    );
    console.log("➕ Creating system config account...");
  }
  
  // Protocol config: 500 bytes
  if (!protoInfo) {
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: protocolConfig,
        lamports: await connection.getMinimumBalanceForRentExemption(500),
        space: 500,
        programId: PROGRAM_ID,
      })
    );
    console.log("➕ Creating protocol config account...");
  }
  
  if (tx.instructions.length === 0) {
    console.log("✅ Accounts already exist!");
  } else {
    // First create accounts
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    
    console.log("📤 Creating accounts...");
    try {
      const sig = await connection.sendTransaction(tx, [wallet], {
        preflightCommitment: "confirmed",
      });
      console.log("✅ Sent:", sig);
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Accounts created!");
    } catch (e: any) {
      console.error("❌ Error creating accounts:", e.message);
      return;
    }
  }
  
  // Now call initialize
  const initTx = new Transaction();
  const data = Buffer.from([0, 30, 0]); // instruction 0, deposit_fee = 30 bps
  
  initTx.add({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: systemConfig, isSigner: false, isWritable: true },
      { pubkey: protocolConfig, isSigner: false, isWritable: true },
      { pubkey: opsWallet, isSigner: false, isWritable: true },
      { pubkey: reserveWallet, isSigner: false, isWritable: true },
      { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false },
      { pubkey: LOAN_MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: data,
  });
  
  initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  initTx.feePayer = wallet.publicKey;
  
  console.log("\n📤 Calling InitializeSystem...");
  
  try {
    const sig = await connection.sendTransaction(initTx, [wallet], {
      preflightCommitment: "confirmed",
    });
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ System initialized!");
    
    // Verify
    const newInfo = await connection.getAccountInfo(systemConfig);
    console.log("✅ Verified:", !!newInfo);
    
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    if (e.message?.includes("0x")) {
      const code = parseInt(e.message.match(/0x([0-9a-f]+)/i)?.[1] || "0", 16);
      console.log("   Error code:", code);
    }
  }
}

main().catch(e => console.error("Error:", e.message));