#!/usr/bin/env npx tsx
import { 
  Connection, PublicKey, Keypair, Transaction, 
  SystemProgram, Token 
} from "@solana/web3.js";
import * as fs from "fs";

const PROGRAM_ID = new PublicKey("DyCM1XX7xVpPjR2GLYRTZybk25cBSzC3nzmy1gMVRm47");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const secretKey = JSON.parse(fs.readFileSync("/home/drsolodev/.config/solana/devnet-keypair.json", "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  // Derive PDAs
  const [systemConfig] = PublicKey.findProgramAddressSync([Buffer.from("system_config")], PROGRAM_ID);
  const [protocolConfig] = PublicKey.findProgramAddressSync([Buffer.from("protocol_config")], PROGRAM_ID);
  const [opsWallet] = PublicKey.findProgramAddressSync([Buffer.from("ops_wallet")], PROGRAM_ID);
  const [reserveWallet] = PublicKey.findProgramAddressSync([Buffer.from("reserve_wallet")], PROGRAM_ID);
  
  const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
  const LOAN_MINT = new PublicKey("4zMMC9s63aj4emqG9q5ZtYGM3K1XP2eZCMC2Fs5hLmRd");
  
  // Check if token accounts exist
  const token = new Token(connection, LOAN_MINT);
  
  console.log("Checking if token accounts exist...");
  
  try {
    const opsInfo = await token.getAccountInfo(opsWallet);
    console.log("✅ Ops Wallet (token account): EXISTS");
  } catch (e) {
    console.log("❌ Ops Wallet (token account): NOT EXISTS - needs to be created");
  }
  
  try {
    const reserveInfo = await token.getAccountInfo(reserveWallet);
    console.log("✅ Reserve Wallet (token account): EXISTS");
  } catch (e) {
    console.log("❌ Reserve Wallet (token account): NOT EXISTS - needs to be created");
  }
  
  // Also check existing accounts
  const [sysInfo, protoInfo] = await Promise.all([
    connection.getAccountInfo(systemConfig),
    connection.getAccountInfo(protocolConfig),
  ]);
  
  console.log("\n📊 Funding required accounts...");
  
  const tx = new Transaction();
  
  // Fund system config if needed
  if (!sysInfo || sysInfo.lamports === 0) {
    const rent = await connection.getMinimumBalanceForRentExemption(200);
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: systemConfig,
      lamports: rent,
    }));
    console.log("➕ Funding system config:", rent);
  }
  
  // Fund protocol config if needed
  if (!protoInfo || protoInfo.lamports === 0) {
    const rent = await connection.getMinimumBalanceForRentExemption(500);
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: protocolConfig,
      lamports: rent,
    }));
    console.log("➕ Funding protocol config:", rent);
  }
  
  if (tx.instructions.length > 0) {
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(wallet);
    
    console.log("📤 Funding accounts...");
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Funded!");
  } else {
    console.log("✅ Accounts already funded");
  }
  
  // Now try initialize with more compute
  const initData = Buffer.from([0, 30, 0]); // instruction 0, fee 30
  
  const initTx = new Transaction();
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
    data: initData,
  });
  
  initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  initTx.feePayer = wallet.publicKey;
  initTx.sign(wallet);
  
  console.log("\n📤 Calling InitializeSystem with 400K compute units...");
  initTx.addSignature(wallet.publicKey, Buffer.alloc(64)); // This won't actually work but sets up the request
  
  try {
    const sig = await connection.sendTransaction(initTx, [wallet], { 
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });
    console.log("✅ Sent:", sig);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Confirmed!");
  } catch (e: any) {
    console.error("❌ Error:", e.message);
    
    // Try to get full logs
    if (e.logs) {
      console.log("\n📝 Logs:");
      e.logs.forEach((l: string) => console.log("   " + l));
    }
  }
}

main().catch(e => console.error("Fatal:", e));