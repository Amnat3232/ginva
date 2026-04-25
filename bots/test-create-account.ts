#!/usr/bin/env npx tsx
import { Connection, Transaction, SystemProgram, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);

async function main() {
  const keypairPath = process.env.KEYPAIR_PATH || "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const connection = new Connection(RPC_URL, "confirmed");

  // Use regular keypairs instead of PDAs since PDAs can't sign
  const systemConfigKeypair = Keypair.generate();
  const protocolConfigKeypair = Keypair.generate();

  console.log("System Config (regular):", systemConfigKeypair.publicKey.toString());
  console.log("Protocol Config (regular):", protocolConfigKeypair.publicKey.toString());

  // Create system config account
  const systemConfigRent = await connection.getMinimumBalanceForRentExemption(285);
  console.log("\nCreating system config account, rent:", systemConfigRent / LAMPORTS_PER_SOL, "SOL");

  const createSystemConfigIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: systemConfigKeypair.publicKey,
    space: 285,
    lamports: systemConfigRent,
    programId: PROGRAM_ID,
  });

  const systemConfigTx = new Transaction();
  systemConfigTx.add(createSystemConfigIx);
  systemConfigTx.feePayer = wallet.publicKey;
  
  const { blockhash: blockhash1, lastValidBlockHeight: lastValidBlockHeight1 } = await connection.getLatestBlockhash();
  systemConfigTx.recentBlockhash = blockhash1;
  
  // Sign with both wallet and systemConfig keypair
  systemConfigTx.sign(wallet, systemConfigKeypair);
  
  console.log("Sending transaction...");
  try {
    const sig = await connection.sendRawTransaction(systemConfigTx.serialize(), { preflightCommitment: "confirmed" });
    await connection.confirmTransaction({ signature: sig, blockhash: blockhash1, lastValidBlockHeight: lastValidBlockHeight1 }, "confirmed");
    console.log("System Config created!");
    console.log("Signature:", sig);
  } catch (e: any) {
    console.log("Error:", e.message);
  }

  // Create protocol config account
  const protocolConfigRent = await connection.getMinimumBalanceForRentExemption(100);
  console.log("\nCreating protocol config account, rent:", protocolConfigRent / LAMPORTS_PER_SOL, "SOL");

  const createProtocolConfigIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: protocolConfigKeypair.publicKey,
    space: 100,
    lamports: protocolConfigRent,
    programId: PROGRAM_ID,
  });

  const protocolConfigTx = new Transaction();
  protocolConfigTx.add(createProtocolConfigIx);
  protocolConfigTx.feePayer = wallet.publicKey;
  
  const { blockhash: blockhash2, lastValidBlockHeight: lastValidBlockHeight2 } = await connection.getLatestBlockhash();
  protocolConfigTx.recentBlockhash = blockhash2;
  
  protocolConfigTx.sign(wallet, protocolConfigKeypair);
  
  try {
    const sig = await connection.sendRawTransaction(protocolConfigTx.serialize(), { preflightCommitment: "confirmed" });
    await connection.confirmTransaction({ signature: sig, blockhash: blockhash2, lastValidBlockHeight: lastValidBlockHeight2 }, "confirmed");
    console.log("Protocol Config created!");
    console.log("Signature:", sig);
  } catch (e: any) {
    console.log("Error:", e.message);
  }

  // Save the keypairs for later use
  console.log("\n=== Save these addresses for initialization ===");
  console.log("SYSTEM_CONFIG_KEYPAIR:", systemConfigKeypair.publicKey.toString());
  console.log("Save the private key for signing transactions!");
}

main().catch(console.error);