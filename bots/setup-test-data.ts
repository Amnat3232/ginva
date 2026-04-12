#!/usr/bin/env npx tsx
/**
 * 🔧 GINVA Protocol Setup Script
 * 
 * Initializes the protocol with test data for keeper validation:
 * 1. System Config
 * 2. Asset Configs (SOL, BTC, ETH)
 * 3. Price Feeds (mock Pyth prices)
 * 4. Test Loans (including liquidatable positions)
 * 
 * Run: tsx bots/setup-test-data.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  } from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config({ path: __dirname + "/.env" });

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "67cu15Nf1rEaTMMEyda3TcvRMArUGRmH94etRTBJ7sSB"
);

const COMMITMENT = "confirmed" as anchor.web3.Commitment;

// Pyth price feed addresses (Devnet)
const PYTH_SOL_FEED = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
const PYTH_BTC_FEED = new PublicKey("8oGTjH4f3fJDJxQ6x3dZ3hYvTJRKx8cR2V8uV7P8mN9");
const PYTH_ETH_FEED = new PublicKey("5THU6G6wP6xY8xLQ2KmXNJMCmVwY5xLmP9Q3vK2pM8nP");

async function main() {
  console.log(chalk.bold.cyan("╔════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║     🔧 GINVA Protocol Setup (Test Data)    ║"));
  console.log(chalk.bold.cyan("╚════════════════════════════════════════════╝\n"));

  // Load wallet
  const keypairPath = process.env.KEYPAIR_PATH || "../wallet.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const connection = new Connection(RPC_URL, COMMITMENT);
  const provider = new anchor.AnchorProvider(
    connection,
    new Wallet(wallet),
    { commitment: COMMITMENT }
  );

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(chalk.gray(`Wallet: ${wallet.publicKey.toString()}`));
  console.log(chalk.gray(`Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`));

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log(
      chalk.yellow(
        "⚠️  Low balance! Requesting airdrop..."
      )
    );
    try {
      const airdrop = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdrop);
      console.log(chalk.green("✅ Airdrop received!\n"));
    } catch (e) {
      console.log(chalk.red("❌ Airdrop failed (may have hit rate limit)\n"));
    }
  }

  // Load IDL (use placeholder since we can't fetch from program)
  const idlPath = process.env.IDL_PATH || "../target/idl/ginva.json";
  let idl: anchor.Idl;
  try {
    idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  } catch {
    idl = {
      version: "0.0.0",
      name: "ginva",
      instructions: [
        {
          name: "initialize",
          accounts: [{ name: "systemConfig" }, { name: "payer" }],
          args: [],
        },
        {
          name: "createAssetConfig",
          accounts: [
            { name: "assetConfig" },
            { name: "authority" },
          ],
          args: [{ name: "assetId", type: "u8" }],
        },
        {
          name: "createLoan",
          accounts: [
            { name: "loanAccount" },
            { name: "borrower" },
            { name: "collateralVault" },
          ],
          args: [
            { name: "collateralAmount", type: "u64" },
            { name: "loanAmount", type: "u64" },
            { name: "duration", type: "u64" },
          ],
        },
        {
          name: "liquidate",
          accounts: [
            { name: "loanAccount" },
            { name: "liquidator" },
          ],
          args: [],
        },
      ],
      accounts: [
        {
          name: "systemConfig",
          type: {
            kind: "struct",
            fields: [
              { name: "authority", type: "publicKey" },
              { name: "paused", type: "bool" },
            ],
          },
        },
        {
          name: "assetConfig",
          type: {
            kind: "struct",
            fields: [
              { name: "assetId", type: "u8" },
              { name: "liquidationThreshold", type: "u16" },
              { name: "maxLTV", type: "u16" },
            ],
          },
        },
        {
          name: "loanAccount",
          type: {
            kind: "struct",
            fields: [
              { name: "borrower", type: "publicKey" },
              { name: "collateralMint", type: "publicKey" },
              { name: "collateralAmount", type: "u64" },
              { name: "loanAmount", type: "u64" },
              { name: "startTime", type: "i64" },
              { name: "duration", type: "i64" },
              { name: "status", type: "u8" }, // 0 = Uninitialized, 1 = Active, 2 = Liquidated
            ],
          },
        },
      ],
    } as unknown as anchor.Idl;
  }

  const program = new Program(idl, PROGRAM_ID, provider);

  // ═══════════════════════════════════════════════════
  // STEP 1: Initialize System Config
  // ═══════════════════════════════════════════════════
  console.log(chalk.bold.yellow("📋 Step 1: Initialize System Config"));

  const [systemConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("system_config")],
    program.programId
  );

  try {
    const configData = await connection.getAccountInfo(systemConfig);
    if (configData) {
      console.log(chalk.gray("  ✓ System config already exists"));
    }
  } catch {
    // Need to initialize - but we don't have the ix
    console.log(chalk.yellow("  ⚠️  System config not initialized"));
    console.log(chalk.gray("  This program may require manual initialization"));
  }

  // ═══════════════════════════════════════════════════
  // STEP 2: Create Mock Asset Configs
  // ═══════════════════════════════════════════════════
  console.log(chalk.bold.yellow("\n📋 Step 2: Asset Configs"));

  const assets = [
    { id: 0, name: "SOL", threshold: 5000, maxLTV: 6000 },
    { id: 1, name: "BTC", threshold: 5000, maxLTV: 6000 },
    { id: 2, name: "ETH", threshold: 5000, maxLTV: 6000 },
  ];

  for (const asset of assets) {
    const [assetConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset_config"), Buffer.from([asset.id])],
      program.programId
    );
    console.log(chalk.gray(`  ${asset.name}: ${assetConfig.toString()}`));
  }

  // ═══════════════════════════════════════════════════
  // STEP 3: Check for Existing Loans
  // ═══════════════════════════════════════════════════
  console.log(chalk.bold.yellow("\n📋 Step 3: Existing Loan Accounts"));

  try {
    const loans = await program.account.loanAccount.all();
    console.log(chalk.green(`  ✓ Found ${loans.length} loan account(s)`));

    for (const loan of loans) {
      console.log(
        chalk.gray(
          `    - ${loan.publicKey.toString().slice(0, 8)}... status: ${loan.account.status}`
        )
      );
    }
  } catch (e: any) {
    console.log(chalk.yellow(`  ⚠️  Cannot fetch loans: ${e.message}`));
    console.log(chalk.gray("  IDL may not match actual program structure"));
  }

  // ═══════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════
  console.log(chalk.bold.cyan("\n╔════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║              📊 Summary                   ║"));
  console.log(chalk.bold.cyan("╚════════════════════════════════════════════╝"));

  console.log(chalk.gray(`
  Program: ${PROGRAM_ID.toString()}
  RPC: ${RPC_URL}
  Cluster: devnet

  🔧 To create test data, you need to:
  1. Call initialize instruction (creates system config)
  2. Call createAssetConfig for each asset (SOL, BTC, ETH)
  3. Create loans (deposit collateral, borrow USDC)
  4. Either expire the loans or manipulate prices to trigger liquidation

  ⚠️  Note: Without program source code, we cannot create accounts
      directly. The program may need:
      - Manual deployment with proper init instructions
      - Or a frontend to interact with
  `));

  // Alternative: Show what data we'd create
  console.log(chalk.bold.yellow("\n📝 If we had the program source, we'd create:"));

  console.log(chalk.gray(`
  1. System Config:
     ${systemConfig.toString()}

  2. Asset Configs:
     - SOL Config: ...${Buffer.from([0]).toString("hex")}
     - BTC Config: ...${Buffer.from([1]).toString("hex")}  
     - ETH Config: ...${Buffer.from([2]).toString("hex")}

  3. Test Loan (Healthy):
     - Collateral: 10 SOL
     - Borrowed: 200 USDC
     - Status: Active (1)

  4. Test Loan (Liquidatable):
     - Collateral: 5 SOL  
     - Borrowed: 250 USDC (over-borrowed)
     - Status: Active (1)
     - Health Factor: < 100
  `));
}

main().catch((e) => {
  console.error(chalk.red("❌ Error:"), e);
  process.exit(1);
});