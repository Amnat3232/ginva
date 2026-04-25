#!/usr/bin/env npx tsx
/**
 * 🔧 GINVA Protocol - Initialize System (Fixed PDAs)
 * 
 * Creates system config and initializes the protocol using correct PDAs
 * Run: tsx bots/initialize-system-fixed.ts
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
  createInitializeAccountInstruction,
} from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config({ path: __dirname + "/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "BraHW6pdhCQYADVNnK9f8Ti9NLjjC8T3ogoUfJcL5Man"
);
const COMMITMENT = "confirmed";

async function main() {
  console.log(chalk.bold.cyan("╔════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║    🔧 GINVA Protocol Initialization (Fixed) ║"));
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

  // Calculate all PDA addresses
  const [systemConfigPDA] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  const [protocolConfigPDA] = PublicKey.findProgramAddressSync([Buffer.from('protocol_config')], PROGRAM_ID);
  const [capitalAuth] = PublicKey.findProgramAddressSync([Buffer.from('capital_auth')], PROGRAM_ID);
  const [vaultAuth] = PublicKey.findProgramAddressSync([Buffer.from('vault_auth')], PROGRAM_ID);
  const [revenueAuth] = PublicKey.findProgramAddressSync([Buffer.from('revenue_auth')], PROGRAM_ID);
  const [seizedAuth] = PublicKey.findProgramAddressSync([Buffer.from('seized_auth')], PROGRAM_ID);
  const [reserveAuth] = PublicKey.findProgramAddressSync([Buffer.from('reserve_auth')], PROGRAM_ID);

  // Token mints
  const COLLATERAL_MINT_PUBKEY = new PublicKey("So11111111111111111111111111111111111111112"); // Native SOL
  const LOAN_MINT_PUBKEY = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC

  console.log(chalk.bold.yellow("📋 PDA Addresses:"));
  console.log(chalk.gray(`  System Config: ${systemConfigPDA.toString()}`));
  console.log(chalk.gray(`  Protocol Config: ${protocolConfigPDA.toString()}`));
  console.log(chalk.gray(`  Capital Auth: ${capitalAuth.toString()}`));
  console.log(chalk.gray(`  Vault Auth: ${vaultAuth.toString()}`));
  console.log(chalk.gray(`  Revenue Auth: ${revenueAuth.toString()}`));
  console.log(chalk.gray(`  Seized Auth: ${seizedAuth.toString()}`));
  console.log(chalk.gray(`  Reserve Auth: ${reserveAuth.toString()}`));
  console.log(chalk.gray(`  Collateral Mint: ${COLLATERAL_MINT_PUBKEY.toString()}`));
  console.log(chalk.gray(`  Loan Mint: ${LOAN_MINT_PUBKEY.toString()}`));

  // Check if system config already exists and is initialized
  const systemConfigInfo = await connection.getAccountInfo(systemConfigPDA);
  if (systemConfigInfo && systemConfigInfo.data.length > 0) {
    const discriminator = systemConfigInfo.data.slice(0, 8);
    if (discriminator[0] === 99) { // 'c' for config
      console.log(chalk.green("\n✅ System Config already initialized!"));
      process.exit(0);
    }
  }

  // Calculate system config account size based on program expectations
  // For PDAs: we just fund them with rent, program will allocate/assign via CPI
  const SYSTEM_CONFIG_SIZE = 300;
  const systemConfigLamports = await connection.getMinimumBalanceForRentExemption(SYSTEM_CONFIG_SIZE);
  const currentSystemConfigInfo = await connection.getAccountInfo(systemConfigPDA);
  
  if (!currentSystemConfigInfo) {
    console.log(chalk.gray(`  System Config: funding PDA with rent...`));
    
    // Fund the PDA directly - program will claim ownership during InitializeSystem
    const fundIx = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: systemConfigPDA,
      lamports: systemConfigLamports,
    });
    
    const fundTx = new Transaction();
    fundTx.add(fundIx);
    fundTx.feePayer = wallet.publicKey;
    fundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    fundTx.sign(wallet);
    
    const fundSig = await connection.sendTransaction(fundTx, [wallet], txOptions);
    await connection.confirmTransaction(fundSig, COMMITMENT);
    console.log(chalk.green(`  System Config: funded!`));
  } else {
    console.log(chalk.gray(`  System Config: already exists`));
  }

  // Create protocol_config PDA
  const PROTOCOL_CONFIG_SIZE = 100;
  const protocolConfigLamports = await connection.getMinimumBalanceForRentExemption(PROTOCOL_CONFIG_SIZE);
  const protocolConfigInfo = await connection.getAccountInfo(protocolConfigPDA);
  
  if (!protocolConfigInfo) {
    console.log(chalk.gray(`  Protocol Config: funding PDA with rent...`));
    
    // Fund the PDA directly
    const fundIx2 = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: protocolConfigPDA,
      lamports: protocolConfigLamports,
    });
    
    const fundTx2 = new Transaction();
    fundTx2.add(fundIx2);
    fundTx2.feePayer = wallet.publicKey;
    fundTx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    fundTx2.sign(wallet);
    
    const fundSig2 = await connection.sendTransaction(fundTx2, [wallet], txOptions);
    await connection.confirmTransaction(fundSig2, COMMITMENT);
    console.log(chalk.green(`  Protocol Config: funded!`));
  } else {
    console.log(chalk.gray(`  Protocol Config: already exists`));
  }

  console.log(chalk.bold.yellow("\n📋 Token Account Keypairs:"));

  // Generate random keypairs for ops_wallet and reserve_wallet (regular accounts, not PDAs)
  const opsWalletKeypair = Keypair.generate();
  const reserveWalletKeypair = Keypair.generate();

  console.log(chalk.gray(`  Ops Wallet: ${opsWalletKeypair.publicKey.toString()}`));
  console.log(chalk.gray(`  Reserve Wallet: ${reserveWalletKeypair.publicKey.toString()}`));

  // Create ops_wallet token account (will be owned by capital_auth PDA)
  const opsCreateIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: opsWalletKeypair.publicKey,
    space: 165,
    lamports: await connection.getMinimumBalanceForRentExemption(165),
    programId: TOKEN_PROGRAM_ID,
  });
  const opsInitIx = createInitializeAccountInstruction(opsWalletKeypair.publicKey, LOAN_MINT_PUBKEY, wallet.publicKey);

  const opsTx = new Transaction();
  opsTx.add(opsCreateIx, opsInitIx);
  opsTx.feePayer = wallet.publicKey;
  opsTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  opsTx.sign(wallet, opsWalletKeypair);

  console.log(chalk.gray(`  Ops Wallet: creating...`));
  const opsSig = await connection.sendTransaction(opsTx, [wallet, opsWalletKeypair], txOptions);
  await connection.confirmTransaction(opsSig, COMMITMENT);
  console.log(chalk.green(`  Ops Wallet: created!`));

  // Create reserve_wallet token account (will be owned by reserve_auth PDA after init)
  const reserveCreateIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: reserveWalletKeypair.publicKey,
    space: 165,
    lamports: await connection.getMinimumBalanceForRentExemption(165),
    programId: TOKEN_PROGRAM_ID,
  });
  const reserveInitIx = createInitializeAccountInstruction(reserveWalletKeypair.publicKey, LOAN_MINT_PUBKEY, wallet.publicKey);

  const reserveTx = new Transaction();
  reserveTx.add(reserveCreateIx, reserveInitIx);
  reserveTx.feePayer = wallet.publicKey;
  reserveTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  reserveTx.sign(wallet, reserveWalletKeypair);

  console.log(chalk.gray(`  Reserve Wallet: creating...`));
  const reserveSig = await connection.sendTransaction(reserveTx, [wallet, reserveWalletKeypair], txOptions);
  await connection.confirmTransaction(reserveSig, COMMITMENT);
  console.log(chalk.green(`  Reserve Wallet: created!`));

  // Add InitializeSystem instruction
  const initTx = new Transaction();

  // Instruction data: deposit_fee_bps (u16 LE) = 30 = 0.3%
  const instructionData = Buffer.from([0x1e, 0x00]); // 30 in LE

const initializeIx = {
    programId: PROGRAM_ID,
    keys: [
      // admin is mutable and must sign (required for InitializeSystem CPI)
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },               // 0. admin
      
      // All other accounts are readonly (immutable) per the fixed program logic
      { pubkey: systemConfigPDA, isSigner: false, isWritable: false },              // 1. system_config
      { pubkey: protocolConfigPDA, isSigner: false, isWritable: false },            // 2. protocol_config
      { pubkey: opsWalletKeypair.publicKey, isSigner: false, isWritable: false },   // 3. ops_wallet
      { pubkey: reserveWalletKeypair.publicKey, isSigner: false, isWritable: false }, // 4. reserve_wallet
      { pubkey: COLLATERAL_MINT_PUBKEY, isSigner: false, isWritable: false },       // 5. collateral_mint
      { pubkey: LOAN_MINT_PUBKEY, isSigner: false, isWritable: false },             // 6. loan_mint
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },      // 7. system_program
    ],
    data: instructionData,
  };

  initTx.add(initializeIx);

  initTx.feePayer = wallet.publicKey;
  initTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  initTx.sign(wallet);

  console.log(chalk.bold.yellow("\n📤 Sending initialization transaction..."));

  try {
    const signature = await connection.sendTransaction(initTx, [wallet], txOptions);
    console.log(chalk.gray(`  Signature: ${signature}`));
    
    const confirmation = await connection.confirmTransaction(signature, COMMITMENT);
    if (confirmation.value.err) {
      console.log(chalk.red("❌ Transaction failed!"));
      console.log(chalk.red(`  Error: ${JSON.stringify(confirmation.value.err)}`));
      process.exit(1);
    }
    
    console.log(chalk.green("✅ System initialized successfully!"));
    
    // Verify
    const newSystemConfigInfo = await connection.getAccountInfo(systemConfigPDA);
    if (newSystemConfigInfo) {
      const discriminator = newSystemConfigInfo.data.slice(0, 8);
      const isInitialized = discriminator[0] === 99; // 'c'
      console.log(chalk.green(`  System Config initialized: ${isInitialized}`));
    }
    
    // Save the keypairs to .env for later use
    console.log(chalk.bold.yellow("\n💾 Saving addresses to .env..."));
    
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
  console.log(chalk.bold.yellow("\n📝 Save these addresses for bots:"));
  console.log(chalk.gray(`OPS_WALLET=${opsWalletKeypair.publicKey.toString()}`));
  console.log(chalk.gray(`RESERVE_WALLET=${reserveWalletKeypair.publicKey.toString()}`));
}

main().catch((e) => {
  console.error(chalk.red("❌ Error:"), e);
  process.exit(1);
});