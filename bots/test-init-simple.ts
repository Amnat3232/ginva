#!/usr/bin/env npx tsx
/**
 * Simple Initialize System - Uses invoke_signed to create account if needed
 * Based on existing keeper-bot.ts patterns
 */
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
} from "@solana/web3.js";
import { SystemProgram, TOKEN_PROGRAM_ID } from "@solana/web3.js";
import chalk from "chalk";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config({ path: "bots/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);

const COLLATERAL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const LOAN_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const COMMITMENT = "confirmed";
const MIN_DATA_SIZE = 300; // system config size

async function main() {
  const connection = new Connection(RPC_URL, COMMITMENT);

  // Load wallet from correct path
  const keypairPath = "/home/drsolodev/.config/solana/devnet-keypair.json";
  const walletData = JSON.parse(readFileSync(keypairPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  console.log(`Wallet: ${wallet.publicKey.toString()}`);

  // Calculate PDAs with CORRECT seeds (matching program)
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
  const [capitalAuth] = PublicKey.findProgramAddressSync(
    [Buffer.from("capital_authority")],
    PROGRAM_ID
  );
  const [revenueAuth] = PublicKey.findProgramAddressSync(
    [Buffer.from("revenue_authority")],
    PROGRAM_ID
  );
  const [seizedAuth] = PublicKey.findProgramAddressSync(
    [Buffer.from("seized_authority")],
    PROGRAM_ID
  );

  console.log(chalk.bold.cyan("\n📋 PDAs:"));
  console.log(`  systemConfig: ${systemConfigPDA.toString()}`);
  console.log(`  protocolConfig: ${protocolConfigPDA.toString()}`);
  console.log(`  opsWallet: ${opsWallet.toString()}`);
  console.log(`  reserveWallet: ${reserveWallet.toString()}`);
  console.log(`  capitalAuth: ${capitalAuth.toString()}`);
  console.log(`  revenueAuth: ${revenueAuth.toString()}`);
  console.log(`  seizedAuth: ${seizedAuth.toString()}\n`);

  // Get rent
  const minRent = await connection.getMinimumBalanceForRentExemption(MIN_DATA_SIZE);

  // Build instructions to CREATE all accounts first
  const initTxs: Transaction[] = [];

  // 1. system_config - create with data space
  const sysConfigInfo = await connection.getAccountInfo(systemConfigPDA);
  if (!sysConfigInfo || sysConfigInfo.data.length === 0) {
    console.log(chalk.yellow("⚠️  Creating system_config with data space..."));
    const createSysConfig = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: systemConfigPDA,
      space: MIN_DATA_SIZE,
      lamports: minRent,
      programId: PROGRAM_ID,
    });
    initTxs.push(new Transaction().add(createSysConfig));
  }

  // 2. protocol_config - create with data space  
  const protConfigInfo = await connection.getAccountInfo(protocolConfigPDA);
  if (!protConfigInfo || protConfigInfo.data.length === 0) {
    console.log(chalk.yellow("⚠️  Creating protocol_config with data space..."));
    const createProtConfig = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: protocolConfigPDA,
      space: 1000,
      lamports: await connection.getMinimumBalanceForRentExemption(1000),
      programId: PROGRAM_ID,
    });
    initTxs.push(new Transaction().add(createProtConfig));
  }

  // Execute creates
  if (initTxs.length > 0) {
    for (const tx of initTxs) {
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(wallet);
      const sig = await connection.sendTransaction(tx, [wallet], { 
        skipPreflight: false, 
        preflightCommitment: COMMITMENT 
      });
      await connection.confirmTransaction(sig, COMMITMENT);
      console.log(chalk.green("✅ Created"));
    }
  } else {
    console.log(chalk.green("✅ Accounts already exist with data"));
  }

  // Now build InitializeSystem instruction
  // Instruction: 0 (InitializeSystem)  
  // Data: deposit_fee_bps (u16 LE)
  const depositFeeBps = 30;
  const instructionData = Buffer.alloc(2);
  instructionData.writeUInt16LE(depositFeeBps, 0);

  // Instruction layout (following program accounts.rs order)
  const keys = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },      // 0. admin
    { pubkey: systemConfigPDA, isSigner: false, isWritable: true },     // 1. system_config
    { pubkey: protocolConfigPDA, isSigner: false, isWritable: false }, // 2. protocol_config  
    { pubkey: opsWallet, isSigner: false, isWritable: false },           // 3. ops_wallet
    { pubkey: reserveWallet, isSigner: false, isWritable: false },     // 4. reserve_wallet
    { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false },    // 5. collateral_mint
    { pubkey: LOAN_MINT, isSigner: false, isWritable: false },          // 6. loan_mint
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // 7. system_program
  ];

  const initIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: instructionData,
  });

  const tx = new Transaction().add(initIx);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(wallet);

  console.log(chalk.bold.yellow("\n📤 Sending InitializeSystem..."));
  console.log(`  Instruction: InitializeSystem (0)`);
  console.log(`  deposit_fee_bps: ${depositFeeBps}`);

  try {
    const sig = await connection.sendTransaction(tx, [wallet], {
      skipPreflight: false,
      preflightCommitment: COMMITMENT,
    });
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log(chalk.green(`\n✅ Success! Transaction: ${sig}`));
  } catch (err) {
    console.log(chalk.red(`\n❌ Error: ${err.message}`));
    if (err.logs) {
      console.log(chalk.gray("\nLogs:"));
      err.logs.forEach((log: string) => console.log(`  ${log}`));
    }
  }
}

main().catch(console.error);