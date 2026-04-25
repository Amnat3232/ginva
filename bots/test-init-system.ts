#!/usr/bin/env npx tsx
/**
 * GINVA Protocol - Initialize System Test
 * 
 * Initialize the protocol using pure web3.js (Pinocchio)
 * Run: npx tsx bots/test-init-system.ts
 */
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SendOptions,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getMint,
  createInitializeAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
} from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config({ path: __dirname + "/bots/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);
const COMMITMENT = "confirmed";

// Token mints (Devnet)
const COLLATERAL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
); // Native SOL
const LOAN_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
); // Devnet USDC

async function main() {
  console.log(
    chalk.bold.cyan("\n╔════════════════════════════════════════════╗")
  );
  console.log(
    chalk.bold.cyan("║     🚀 GINVA Initialize System Test      ║")
  );
  console.log(
    chalk.bold.cyan("╚════════════════════════════════════════════╝\n")
  );

  // Load wallet
  const keypairPath = process.env.KEYPAIR_PATH || "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const connection = new Connection(RPC_URL, COMMITMENT);
  const txOptions: SendOptions = { preflightCommitment: COMMITMENT };

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(chalk.gray(`Wallet: ${wallet.publicKey.toString()}`));
  console.log(chalk.gray(`Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`));

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log(chalk.yellow("⚠️  Low balance! Requesting airdrop..."));
    try {
      const airdrop = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdrop);
      console.log(chalk.green("✅ Airdrop received!\n"));
    } catch (e) {
      console.log(chalk.red("❌ Airdrop failed\n"));
    }
  }

  // Calculate PDAs
  const [systemConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  const [protocolConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    PROGRAM_ID
  );

  console.log(chalk.bold.yellow("📋 PDAs:"));
  console.log(chalk.gray(`  System Config: ${systemConfigPDA.toString()}`));
  console.log(chalk.gray(`  Protocol Config: ${protocolConfigPDA.toString()}\n`));

  // Check if already initialized
  const configInfo = await connection.getAccountInfo(systemConfigPDA);
  if (configInfo && configInfo.data.length > 0) {
    const discriminator = configInfo.data.slice(0, 8);
    const str = Buffer.from(discriminator).toString("utf8");
    if (str === "config__") {
      console.log(chalk.green("✅ System already initialized!\n"));
      return;
    }
  }

  // Fund system config PDA with data space
  const SYSTEM_CONFIG_SIZE = 300; // Based on account struct
  const minRent = await connection.getMinimumBalanceForRentExemption(SYSTEM_CONFIG_SIZE);
  
  if (!configInfo) {
    console.log(chalk.gray("  Creating system config account with data space..."));
    
    // Create account with data space using createAccount
    const createConfigIx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: systemConfigPDA,
      space: SYSTEM_CONFIG_SIZE,
      lamports: minRent,
      programId: PROGRAM_ID, // PDA is owned by the program
    });
    
    const createTx = new Transaction().add(createConfigIx);
    createTx.feePayer = wallet.publicKey;
    createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    createTx.sign(wallet);
    
    const sig = await connection.sendTransaction(createTx, [wallet], txOptions);
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log(chalk.green("  ✅ Created with data space!\n"));
  } else if (configInfo.data.length === 0) {
    // Account exists but empty - try to initialize with CPI
    // Note: Can't close account without custom instruction, so just proceed
    console.log(chalk.gray("  Account exists but empty - proceeding anyway...\n"));
  } else {
    console.log(chalk.gray("  System config already has data space\n"));
  }

  // Create ops_wallet token account (random keypair, owned by program)
  const opsWallet = Keypair.generate();
  console.log(chalk.gray("  Creating ops_wallet..."));
  const createOpsIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: opsWallet.publicKey,
    space: 165,
    lamports: await connection.getMinimumBalanceForRentExemption(165),
    programId: TOKEN_PROGRAM_ID,
  });
  const initOpsIx = createInitializeAccountInstruction(
    opsWallet.publicKey,
    LOAN_MINT,
    // The account will be owned by the program after init - use wallet as initial owner
    wallet.publicKey
  );
  const opsTx = new Transaction().add(createOpsIx, initOpsIx);
  opsTx.feePayer = wallet.publicKey;
  opsTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  opsTx.sign(wallet, opsWallet);
  const opsSig = await connection.sendTransaction(opsTx, [wallet, opsWallet], txOptions);
  await connection.confirmTransaction(opsSig, COMMITMENT);
  console.log(chalk.green(`  ✅ Created: ${opsWallet.publicKey.toString()}\n`));

  // Create reserve_wallet token account
  const reserveWallet = Keypair.generate();
  console.log(chalk.gray("  Creating reserve_wallet..."));
  const createReserveIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: reserveWallet.publicKey,
    space: 165,
    lamports: await connection.getMinimumBalanceForRentExemption(165),
    programId: TOKEN_PROGRAM_ID,
  });
  const initReserveIx = createInitializeAccountInstruction(
    reserveWallet.publicKey,
    LOAN_MINT,
    wallet.publicKey
  );
  const reserveTx = new Transaction().add(createReserveIx, initReserveIx);
  reserveTx.feePayer = wallet.publicKey;
  reserveTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  reserveTx.sign(wallet, reserveWallet);
  const reserveSig = await connection.sendTransaction(reserveTx, [wallet, reserveWallet], txOptions);
  await connection.confirmTransaction(reserveSig, COMMITMENT);
  console.log(chalk.green(`  ✅ Created: ${reserveWallet.publicKey.toString()}\n`));

  // Build InitializeSystem instruction
  // Instruction: InitializeSystem = 0
  // Data format: [instruction_id (1 byte)] + [deposit_fee_bps (u16 LE)]
  // deposit_fee_bps = 30 = 0.3%
  const instructionData = Buffer.from([0x00, 0x1e, 0x00]); // [0, 30, 0] = InitializeSystem + 30

  const initInstruction = {
    programId: PROGRAM_ID,
    keys: [
      // 0. [writable, signer] admin
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      // 1. [writable] system_config (PDA) - MUST be writable for program
      { pubkey: systemConfigPDA, isSigner: false, isWritable: true },
      // 2. [writable] protocol_config (PDA) - MUST be writable for program  
      { pubkey: protocolConfigPDA, isSigner: false, isWritable: true },
      // 3. [readonly] ops_wallet (token account)
      { pubkey: opsWallet.publicKey, isSigner: false, isWritable: false },
      // 4. [readonly] reserve_wallet (token account)
      { pubkey: reserveWallet.publicKey, isSigner: false, isWritable: false },
      // 5. [readonly] collateral_mint
      { pubkey: COLLATERAL_MINT, isSigner: false, isWritable: false },
      // 6. [readonly] loan_mint
      { pubkey: LOAN_MINT, isSigner: false, isWritable: false },
      // 7. [readonly] system_program
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };

  const initTx = new Transaction().add(initInstruction);
  initTx.feePayer = wallet.publicKey;
  initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  initTx.sign(wallet);

  console.log(chalk.bold.yellow("📤 Sending InitializeSystem transaction..."));
  console.log(chalk.gray("  Instruction: InitializeSystem (0)"));
  console.log(chalk.gray("  deposit_fee_bps: 30 (0.3%)\n"));

  try {
    const signature = await connection.sendTransaction(initTx, [wallet], txOptions);
    console.log(chalk.gray(`  Signature: ${signature}`));

    const confirmation = await connection.confirmTransaction(signature, COMMITMENT);
    if (confirmation.value.err) {
      console.log(chalk.red(`\n❌ Transaction failed: ${JSON.stringify(confirmation.value.err)}\n`));
      process.exit(1);
    }

    console.log(chalk.green("\n✅ InitializeSystem SUCCESS!\n"));

    // Verify
    const verifyInfo = await connection.getAccountInfo(systemConfigPDA);
    if (verifyInfo) {
      const disc = verifyInfo.data.slice(0, 8);
      console.log("  Verifying account:");
      console.log("    Discriminator:", Buffer.from(disc).toString("utf8"));
      const admin = new PublicKey(verifyInfo.data.slice(8, 40));
      console.log("    Admin:", admin.toString());
      const isActive = verifyInfo.data.slice(284, 285);
      console.log("    Is Active:", isActive[0] === 1 ? "YES" : "NO");
    }
  } catch (error: any) {
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (error.logs) {
      console.log(chalk.gray("  Logs:", error.logs.join("\n")));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});