#!/usr/bin/env npx tsx
/**
 * 🔧 GINVA Protocol - Initialize System
 * 
 * Creates system config and initializes the protocol
 * Run: tsx bots/initialize-system.ts
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Commitment,
  SendOptions,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createInitializeMintInstruction,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config({ path: __dirname + "/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj"
);
const COMMITMENT = "confirmed";

async function main() {
  console.log(chalk.bold.cyan("╔════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║       🔧 GINVA Protocol Initialization     ║"));
  console.log(chalk.bold.cyan("╚════════════════════════════════════════════╝\n"));

  // Load wallet
  const keypairPath = process.env.KEYPAIR_PATH || "/home/drsolodev/.config/solana/devnet-keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const connection = new Connection(RPC_URL, COMMITMENT);
  const txOptions: SendOptions = { 
    preflightCommitment: "confirmed" 
  };

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(chalk.gray(`Wallet: ${wallet.publicKey.toString()}`));
  console.log(chalk.gray(`Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`));

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log(chalk.yellow("⚠️  Low balance! Requesting airdrop..."));
    try {
      const airdrop = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdrop);
      console.log(chalk.green("✅ Airdrop received!\n"));
    } catch (e) {
      console.log(chalk.red("❌ Airdrop failed\n"));
    }
  }

  // Use the actual account addresses created (regular keypairs, not PDAs)
const SYSTEM_CONFIG_ADDRESS = new PublicKey("9Y4CzNEmxT7EN9NddJ35c6BLR49S15uy6Pt1M5Wxkvwe");
const PROTOCOL_CONFIG_ADDRESS = new PublicKey("AdXsZLsnNLeqVJ7fBBy8rwYA7LuaDWN4c9vjsaNSn49R");

console.log(chalk.bold.yellow("📋 Config Addresses:"));
console.log(chalk.gray(`  System Config: ${SYSTEM_CONFIG_ADDRESS.toString()}`));
console.log(chalk.gray(`  Protocol Config: ${PROTOCOL_CONFIG_ADDRESS.toString()}`));

// Check if system config already exists
const systemConfigInfo = await connection.getAccountInfo(SYSTEM_CONFIG_ADDRESS);
if (systemConfigInfo && systemConfigInfo.data.length > 0) {
  const discriminator = systemConfigInfo.data.slice(0, 8);
  // Check for 'config__' discriminator (99 = 'c')
  if (discriminator[0] === 99) {
    console.log(chalk.green("\n✅ System Config already initialized!"));
    console.log(chalk.gray("  Skipping initialization..."));
    process.exit(0);
  }
}

  // Create test mints (USDC-like for loan, SOL-like for collateral)
  const collateralMint = new Keypair();
  const loanMint = new Keypair();
  
  const COLLATERAL_MINT_PUBKEY = new PublicKey("So11111111111111111111111111111111111111112"); // Native SOL
  const LOAN_MINT_PUBKEY = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

  console.log(chalk.bold.yellow("\n📋 Token Mints:"));
  console.log(chalk.gray(`  Collateral Mint (SOL): ${COLLATERAL_MINT_PUBKEY.toString()}`));
  console.log(chalk.gray(`  Loan Mint (USDC): ${LOAN_MINT_PUBKEY.toString()}`));

  // Get or create token accounts
  const userCollateralATA = await getAssociatedTokenAddress(
    COLLATERAL_MINT_PUBKEY,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const userLoanATA = await getAssociatedTokenAddress(
    LOAN_MINT_PUBKEY,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  // Check if ATAs exist, if not create them
  const transaction = new Transaction();

  try {
    await getAccount(connection, userCollateralATA);
    console.log(chalk.gray(`  User Collateral ATA: ${userCollateralATA.toString()} (exists)`));
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userCollateralATA,
        wallet.publicKey,
        COLLATERAL_MINT_PUBKEY,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    console.log(chalk.gray(`  User Collateral ATA: ${userCollateralATA.toString()} (creating)`));
  }

  try {
    await getAccount(connection, userLoanATA);
    console.log(chalk.gray(`  User Loan ATA: ${userLoanATA.toString()} (exists)`));
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userLoanATA,
        wallet.publicKey,
        LOAN_MINT_PUBKEY,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    console.log(chalk.gray(`  User Loan ATA: ${userLoanATA.toString()} (creating)`));
  }

  // Derive PDAs for ops_wallet and reserve_wallet - these are used in the instruction
  const [opsWalletPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("ops_wallet")],
    PROGRAM_ID
  );

  const [reserveWalletPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("reserve_wallet")],
    PROGRAM_ID
  );

  // Create ops_wallet and reserve_wallet - skip for now, program creates them as needed
  // The program will derive these PDAs when needed for deposits/withdrawals
  console.log(chalk.gray(`  Ops Wallet: ${opsWalletPDA.toString()} (program managed)`));
  console.log(chalk.gray(`  Reserve Wallet: ${reserveWalletPDA.toString()} (program managed)`));

  // NOTE: System config and protocol config accounts already created - skip creation
  console.log(chalk.gray(`  System Config: ${SYSTEM_CONFIG_ADDRESS.toString()} (already exists)`));
console.log(chalk.gray(`  Protocol Config: ${PROTOCOL_CONFIG_ADDRESS.toString()} (already exists)`));

  // Add InitializeSystem instruction
  // Instruction data: deposit_fee_bps (u16 LE) = 30 = 0.3%
  const depositFeeBps = 30;
  const instructionData = Buffer.from([0x1e, 0x00]); // 30 in LE

  const initializeIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },           // 0. admin
      { pubkey: SYSTEM_CONFIG_ADDRESS, isSigner: false, isWritable: true },     // 1. system_config
      { pubkey: PROTOCOL_CONFIG_ADDRESS, isSigner: false, isWritable: true },   // 2. protocol_config
      { pubkey: opsWalletPDA, isSigner: false, isWritable: true },            // 3. ops_wallet
      { pubkey: reserveWalletPDA, isSigner: false, isWritable: true },        // 4. reserve_wallet
      { pubkey: COLLATERAL_MINT_PUBKEY, isSigner: false, isWritable: false },  // 5. collateral_mint
      { pubkey: LOAN_MINT_PUBKEY, isSigner: false, isWritable: false },       // 6. loan_mint
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // 7. system_program
    ],
    data: instructionData,
  };

  transaction.add(initializeIx);

  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log(chalk.bold.yellow("\n📤 Sending initialization transaction..."));

  // Sign the transaction
  transaction.sign(wallet);

  try {
    const signature = await connection.sendRawTransaction(transaction.serialize(), txOptions);
    console.log(chalk.gray(`  Signature: ${signature}`));
    
    const confirmation = await connection.confirmTransaction(signature, COMMITMENT);
    if (confirmation.value.err) {
      console.log(chalk.red("❌ Transaction failed!"));
      console.log(chalk.red(`  Error: ${JSON.stringify(confirmation.value.err)}`));
      process.exit(1);
    }
    
    console.log(chalk.green("✅ System initialized successfully!"));
    
    // Verify
    const newSystemConfigInfo = await connection.getAccountInfo(SYSTEM_CONFIG_ADDRESS);
    if (newSystemConfigInfo) {
      const discriminator = newSystemConfigInfo.data.slice(0, 8);
      const isInitialized = discriminator[0] === 99; // 'c'
      console.log(chalk.green(`  System Config initialized: ${isInitialized}`));
    }
    
  } catch (e: any) {
    console.log(chalk.red("❌ Error sending transaction:"));
    console.log(chalk.red(`  ${e.message}`));
    
    // Try to parse more details
    if (e.message?.includes("0x")) {
      const errorCode = e.message.match(/0x([0-9a-f]+)/i)?.[1];
      if (errorCode) {
        const code = parseInt(errorCode, 16);
        console.log(chalk.red(`  Error code: ${code} (0x${errorCode})`));
        
        // Common Pinocchio/Ginva errors
        const errorMessages: Record<number, string> = {
          0: "InvalidInput / Not initialized",
          1: "InvalidInstruction",
          2: "InvalidAmount",
          3: "Unauthorized",
          4: "ProtocolPaused",
          5: "ArithmeticOverflow",
          6: "AssetNotActive",
          7: "LoanNotActive",
          8: "AlreadyBeingLiquidated",
          9: "CircuitBreakerActive",
          10: "SupplyCapExceeded",
        };
        
        if (errorMessages[code]) {
          console.log(chalk.red(`  Meaning: ${errorMessages[code]}`));
        }
      }
    }
    process.exit(1);
  }

  console.log(chalk.bold.cyan("\n✓ Setup complete!"));
}

main().catch((e) => {
  console.error(chalk.red("❌ Error:"), e);
  process.exit(1);
});