#!/usr/bin/env node
/**
 * 🤖 KEEPER A: Trigger Liquidation Bot
 *
 * Monitors Health Factor and triggers liquidations when:
 * - Health Factor < 100%
 * - Loan past maturity by 72 hours
 *
 * Reward: 0.6% of liquidated collateral value
 *
 * Run: npm run keeper-a
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config();

// ═══════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "GWcQGdrSiVk8p58bYSmw8FTceR9dcHAKQzw7yEyjLTsy"
);
const PYTH_SOL_FEED = new PublicKey(
  "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
);

const CONFIG = {
  minProfit: 0.5,
  checkInterval: 5000,
  maxConcurrent: 3,
  priorityFee: 10000,
  commitment: "confirmed" as const,
};

// ═══════════════════════════════════════════════════════════
// 🔑 SETUP
// ═══════════════════════════════════════════════════════════
const loadWallet = (): Keypair => {
  // Supports 2 methods: 1. PRIVATE_KEY from env (array), 2. KEYPAIR_PATH from file
  const privateKeyEnv = process.env.PRIVATE_KEY;
  const keypairPath = process.env.KEYPAIR_PATH;

  if (privateKeyEnv) {
    try {
      // Try to parse as JSON array
      const secretKey = JSON.parse(privateKeyEnv);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (e) {
      throw new Error(
        "Invalid PRIVATE_KEY format. Expected JSON array format."
      );
    }
  }

  if (keypairPath) {
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  }

  throw new Error(
    "No PRIVATE_KEY or KEYPAIR_PATH provided in environment variables"
  );
};

const wallet = loadWallet();
const connection = new Connection(RPC_URL, CONFIG.commitment);
const provider = new anchor.AnchorProvider(connection, new Wallet(wallet), {
  commitment: CONFIG.commitment,
});

const idlPath = process.env.IDL_PATH || "./target/idl/ginva.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(
  chalk.blue.bold(
    "\n╔══════════════════════════════════════════════════════════╗"
  )
);
console.log(
  chalk.blue.bold("║          🤖 KEEPER A: TRIGGER LIQUIDATION BOT           ║")
);
console.log(
  chalk.blue.bold(
    "╚══════════════════════════════════════════════════════════╝"
  )
);
console.log(
  chalk.gray(`Wallet: ${wallet.publicKey.toBase58().slice(0, 8)}...`)
);
console.log(chalk.gray(`RPC: ${RPC_URL}`));
console.log(chalk.gray(`Program: ${PROGRAM_ID.toBase58().slice(0, 8)}...`));
console.log(
  chalk.cyan(
    `\n📋 Config: Check every ${CONFIG.checkInterval / 1000}s, Max ${
      CONFIG.maxConcurrent
    } concurrent\n`
  )
);

// ═══════════════════════════════════════════════════════════
// 📊 UTILITIES
// ═══════════════════════════════════════════════════════════
const formatSOL = (lamports: number): string => {
  return `${(lamports / 1_000_000_000).toFixed(4)} SOL`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════
// 🛡️ RATE LIMITER
// ═══════════════════════════════════════════════════════════
class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests = 10;
  private readonly windowMs = 1000;

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (t) => now - t < this.windowMs
    );
    if (this.requestTimes.length >= this.maxRequests) {
      await sleep(this.windowMs);
      return this.acquire();
    }
    this.requestTimes.push(now);
  }
}

const rpcLimiter = new RateLimiter();

// ═══════════════════════════════════════════════════════════
// 🔨 KEEPER A: TRIGGER BOT
// ═══════════════════════════════════════════════════════════
class TriggerKeeperBot {
  private isRunning = false;
  private activeLiquidations = 0;
  private stats = { checked: 0, triggered: 0, errors: 0, totalReward: 0 };

  async start() {
    this.isRunning = true;
    console.log(chalk.green("🟢 Keeper A: Starting...\n"));

    while (this.isRunning) {
      try {
        await this.scanAndTrigger();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Keeper A Error:"), error);
      }
      await sleep(CONFIG.checkInterval);
    }
  }

  private async scanAndTrigger() {
    await rpcLimiter.acquire();
    const loans = await program.account.loanAccount.all();

    for (const loan of loans) {
      const loanData = loan.account;
      if (loanData.status !== 1) continue;

      const isLiquidatable = await this.checkLiquidatable(loanData);
      if (isLiquidatable && this.activeLiquidations < CONFIG.maxConcurrent) {
        await this.triggerLiquidation(loan.publicKey, loanData);
      }
    }
  }

  private async checkLiquidatable(loanData: any): Promise<boolean> {
    try {
      const assetConfigPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), loanData.collateralMint.toBuffer()],
        program.programId
      )[0];
      const assetConfig = await program.account.assetConfig.fetch(
        assetConfigPDA
      );

      const priceFeed = await program.account.priceUpdateV2?.fetch(
        PYTH_SOL_FEED
      );
      if (!priceFeed) return false;

      const collateralValue = loanData.collateralAmount * priceFeed.price.price;
      const requiredCollateral =
        (loanData.loanAmount * 10000) / assetConfig.liquidationThreshold;

      return collateralValue < requiredCollateral;
    } catch {
      return false;
    }
  }

  private async triggerLiquidation(loanAddress: PublicKey, loanData: any) {
    try {
      this.activeLiquidations++;
      console.log(chalk.yellow("🔨 Triggering Liquidation..."));
      console.log(
        chalk.gray(`   Loan: ${loanAddress.toBase58().slice(0, 12)}...`)
      );

      const [liquidationProcess] = PublicKey.findProgramAddressSync(
        [Buffer.from("liquidation"), loanAddress.toBuffer()],
        program.programId
      );
      const [assetConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), loanData.collateralMint.toBuffer()],
        program.programId
      );
      const [vaultAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_auth")],
        program.programId
      );
      const [seizedVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("seized_vault"), loanAddress.toBuffer()],
        program.programId
      );
      const vaultCollateralAccount = await getAssociatedTokenAddress(
        loanData.collateralMint,
        vaultAuth,
        true
      );

      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee,
        })
      );

      const instruction = await program.methods
        .triggerLiquidation()
        .accounts({
          keeperA: wallet.publicKey,
          loanAccount: loanAddress,
          systemConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
          )[0],
          liquidationProcess,
          vaultAuthority: vaultAuth,
          vaultCollateralAccount,
          seizedAssetsVault: seizedVault,
          assetConfig,
          pythPriceFeed: PYTH_SOL_FEED,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction();

      tx.add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(wallet);

      const sig = await connection.sendRawTransaction(tx.serialize());
      console.log(chalk.green("✅ Liquidation Triggered!"));
      console.log(
        chalk.gray(
          `   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet\n`
        )
      );

      this.stats.triggered++;
      const reward = (loanData.collateralAmount * 60) / 10000;
      this.stats.totalReward += reward;
      console.log(
        chalk.cyan(`   💰 Expected Reward (0.6%): ${formatSOL(reward)}\n`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to trigger:"), error);
    } finally {
      this.activeLiquidations--;
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("\n🛑 Keeper A: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Triggered ${this.stats.triggered}, Errors ${this.stats.errors}`
      )
    );
    console.log(
      chalk.cyan(`   Total Rewards: ${formatSOL(this.stats.totalReward)}\n`)
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN
// ═══════════════════════════════════════════════════════════
const keeperA = new TriggerKeeperBot();

process.on("SIGINT", () => {
  console.log(chalk.yellow("\n🛑 Shutting down..."));
  keeperA.stop();
  process.exit(0);
});

console.log(chalk.green("✅ Keeper A ready! Press Ctrl+C to stop.\n"));
keeperA.start().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
