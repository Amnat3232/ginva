#!/usr/bin/env npx tsx
import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair, SystemProgram } from "@solana/web3.js";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config({ path: "bots/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);
const COMMITMENT = "confirmed";

const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const LOAN_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

async function main() {
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const walletData = JSON.parse(readFileSync(keypairPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));

  const connection = new Connection(RPC_URL, COMMITMENT);

  console.log("Wallet:", wallet.publicKey.toString());
  console.log("Program:", PROGRAM_ID.toString());

  // Derive PDA addresses
  const [systemConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    PROGRAM_ID
  );
  const [protocolConfigPDA] = PublicKey.findProgramAddressSync(
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

  // Create accounts WITH data (not empty)
  // The bug at line 169-170 checks: config_data[0..8] == b"config__" || config_data.iter().any(|&b| b != 0)
  // If we create with zeros, it should pass that check BUT then it will fail at line 171-172 (already initialized)
  
  const systemConfigSpace = 300;
  const protocolConfigSpace = 1000;
  
  const systemConfigInfo = await connection.getAccountInfo(systemConfigPDA);
  const protocolConfigInfo = await connection.getAccountInfo(protocolConfigPDA);
  
  console.log("\n🔍 Checking accounts...");
  console.log("  systemConfig:", systemConfigInfo ? `EXISTS (len=${systemConfigInfo.data.length})` : "NOT FOUND");
  console.log("  protocolConfig:", protocolConfigInfo ? `EXISTS (len=${protocolConfigInfo.data.length})` : "NOT FOUND");

  // If not exists, create with data (zeros)
  if (!systemConfigInfo) {
    console.log("\n📦 Creating systemConfig with data...");
    const lamports = await connection.getMinimumBalanceForRentExemption(systemConfigSpace);
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: systemConfigPDA,
        space: systemConfigSpace,
        lamports,
        programId: PROGRAM_ID,
      })
    );
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.sign(wallet);
    const sig = await connection.sendTransaction(tx, [wallet], { 
      skipPreflight: false, 
      preflightCommitment: COMMITMENT 
    });
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log("  ✅ Created:", sig);
  }

  if (!protocolConfigInfo) {
    console.log("\n📦 Creating protocolConfig with data...");
    const lamports = await connection.getMinimumBalanceForRentExemption(protocolConfigSpace);
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: protocolConfigPDA,
        space: protocolConfigSpace,
        lamports,
        programId: PROGRAM_ID,
      })
    );
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.sign(wallet);
    const sig = await connection.sendTransaction(tx, [wallet], { 
      skipPreflight: false, 
      preflightCommitment: COMMITMENT 
    });
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log("  ✅ Created:", sig);
  }

  // Now call InitializeSystem
  console.log("\n📤 Calling InitializeSystem...");
  
  const depositFeeBps = 30;
  const instructionData = Buffer.alloc(2);
  instructionData.writeUInt16LE(depositFeeBps, 0);

  const initIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    data: instructionData,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: systemConfigPDA, isSigner: false, isWritable: true },
      { pubkey: protocolConfigPDA, isSigner: false, isWritable: true },
      { pubkey: opsWallet, isSigner: false, isWritable: false },
      { pubkey: reserveWallet, isSigner: false, isWritable: false },
      { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false },
      { pubkey: LOAN_MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ]
  });

  const tx = new Transaction().add(initIx);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(wallet);

  try {
    const sig = await connection.sendTransaction(tx, [wallet], { 
      skipPreflight: false, 
      preflightCommitment: COMMITMENT 
    });
    console.log("✅ Transaction sent:", sig);
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log("✅ System initialized!");
  } catch(e) {
    console.log("❌ Error:", e.message);
  }
}

main();