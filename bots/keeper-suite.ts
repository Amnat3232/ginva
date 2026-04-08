#!/usr/bin/env node
/**
 * 🤖 GINVA KEEPER BOT SUITE
 *
 * A collection of automated bots for the GINVA Protocol:
 * - Keeper A: Trigger Liquidation Bot
 * - Storefront Hunter: Buy discounted assets
 * - Keeper C: Finalize Liquidation Bot
 *
 * Run: ts-node bots/keeper-suite.ts [mode]
 * Modes: trigger, hunter, finalize, or all
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

// Load environment
dotenv.config();

// ═══════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "8Gykav1cYZgrC7EkZWSwDr4Xk2L7MR3ip8A2z2eji21s"
);
const PYTH_SOL_FEED = new PublicKey(
  "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
);

// Bot configuration
const CONFIG = {
  // Trigger Bot Settings
  trigger: {
    enabled: true,
    minProfit: 0.5, // Minimum profit in USDC to trigger
    checkInterval: 5000, // Check every 5 seconds
    maxConcurrent: 3, // Max simultaneous liquidations
  },
  // Hunter Bot Settings
  hunter: {
    enabled: true,
    minDiscount: 6, // Minimum discount % to buy
    maxDiscount: 8, // Maximum discount % (don't buy if too high = risky)
    checkInterval: 2000, // Check every 2 seconds (faster for FOMO)
    maxInvestment: 10000, // Max USDC to invest per deal
  },
  // Finalize Bot Settings
  finalize: {
    enabled: true,
    checkInterval: 10000, // Check every 10 seconds
    minProfit: 1.0, // Minimum 1.0 USDC reward
  },
  // General
  priorityFee: 10000, // Micro-lamports for priority
  commitment: "confirmed" as const,
};

// ═══════════════════════════════════════════════════════════
// 🔑 SETUP
// ═══════════════════════════════════════════════════════════

// Load wallet
const loadWallet = (): Keypair => {
  const keypairPath = process.env.KEYPAIR_PATH || "./keypair.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

const wallet = loadWallet();
const connection = new Connection(RPC_URL, CONFIG.commitment);
const provider = new anchor.AnchorProvider(connection, new Wallet(wallet), {
  commitment: CONFIG.commitment,
});

// Load IDL
const idlPath = process.env.IDL_PATH || "./target/idl/ginva.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(
  chalk.bold.blue(
    "╔══════════════════════════════════════════════════════════╗"
  )
);
console.log(
  chalk.bold.blue(
    "║              🤖 GINVA KEEPER BOT SUITE v2.0              ║"
  )
);
console.log(
  chalk.bold.blue(
    "╚══════════════════════════════════════════════════════════╝"
  )
);
console.log(chalk.gray(`Wallet: ${wallet.publicKey.toBase58()}`));
console.log(chalk.gray(`RPC: ${RPC_URL}`));
console.log(chalk.gray(`Program: ${PROGRAM_ID.toBase58()}`));
console.log("");

// ═══════════════════════════════════════════════════════════
// 📊 UTILITIES
// ═══════════════════════════════════════════════════════════

const formatUSDC = (amount: number): string => {
  return `$${(amount / 1_000_000).toFixed(2)}`;
};

const getTierColor = (discount: number): string => {
  if (discount >= 8) return chalk.bold.yellow(""); // Golden Hour
  if (discount >= 6) return chalk.bold.gray(""); // Silver
  if (discount >= 3) return chalk.bold.red(""); // Bronze
  return chalk.white("");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════
// 🛡️ RATE LIMITER (RPC Protection)
// ═══════════════════════════════════════════════════════════

class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly retryDelays: number[] = [1000, 2000, 4000, 8000, 16000];

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (t) => now - t < this.windowMs
    );

    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      console.log(
        chalk.yellow(`⚠️ Rate limit reached, waiting ${waitTime}ms...`)
      );
      await sleep(waitTime);
      return this.acquire();
    }

    this.requestTimes.push(now);
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    for (let attempt = 0; attempt < this.retryDelays.length; attempt++) {
      try {
        await this.acquire();
        return await fn();
      } catch (error: any) {
        const isRateLimit =
          error?.message?.includes("429") ||
          error?.message?.includes("rate limit") ||
          error?.code === -32005;

        if (isRateLimit && attempt < this.retryDelays.length - 1) {
          const delay = this.retryDelays[attempt];
          console.log(
            chalk.yellow(
              `⚠️ ${operationName} rate limited, retrying in ${delay}ms... (attempt ${
                attempt + 1
              })`
            )
          );
          await sleep(delay);
          continue;
        }

        if (attempt > 0) {
          console.log(
            chalk.red(
              `❌ ${operationName} failed after ${attempt + 1} attempts`
            )
          );
        }
        throw error;
      }
    }
    return null;
  }
}

// Global rate limiter for RPC calls
const rpcLimiter = new RateLimiter(10, 1000); // 10 requests per second

// ═══════════════════════════════════════════════════════════
// 🔨 TRIGGER KEEPER BOT (Keeper A)
// ═══════════════════════════════════════════════════════════

class TriggerKeeperBot {
  private isRunning = false;
  private activeLiquidations = 0;
  private stats = { checked: 0, triggered: 0, errors: 0 };

  async start() {
    if (!CONFIG.trigger.enabled) {
      console.log(chalk.gray("⚪ Trigger Bot: Disabled"));
      return;
    }

    this.isRunning = true;
    console.log(chalk.green("🟢 Trigger Bot: Starting..."));
    console.log(
      chalk.gray(
        `   Min Profit: ${formatUSDC(CONFIG.trigger.minProfit * 1_000_000)}`
      )
    );
    console.log(
      chalk.gray(`   Check Interval: ${CONFIG.trigger.checkInterval}ms`)
    );
    console.log("");

    while (this.isRunning) {
      try {
        await this.scanAndTrigger();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Trigger Bot Error:"), error);
      }
      await sleep(CONFIG.trigger.checkInterval);
    }
  }

  private async scanAndTrigger() {
    // Use rate limiter for RPC calls
    await rpcLimiter.executeWithRetry(async () => {
      // Fetch all active loan accounts
      const loans = await program.account.loanAccount.all();

      for (const loan of loans) {
        const loanData = loan.account;

        // Skip non-active loans
        if (loanData.status !== 1) continue; // Not Active

        // Check if liquidatable
        const isLiquidatable = await this.checkLiquidatable(loanData);

        if (
          isLiquidatable &&
          this.activeLiquidations < CONFIG.trigger.maxConcurrent
        ) {
          await this.triggerLiquidation(loan.publicKey, loanData);
        }
      }
    }, "Trigger scan");
  }

  private async checkLiquidatable(loanData: any): Promise<boolean> {
    try {
      // Get asset config for this collateral
      const assetConfigPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), loanData.collateralMint.toBuffer()],
        program.programId
      )[0];

      const assetConfig = await program.account.assetConfig.fetch(
        assetConfigPDA
      );

      // Get current price
      const priceFeed = await program.account.priceUpdateV2?.fetch(
        PYTH_SOL_FEED
      );
      if (!priceFeed) return false;

      // Calculate health factor (simplified)
      const collateralValue = loanData.collateralAmount * priceFeed.price.price; // Simplified
      const liquidationThreshold = assetConfig.liquidationThreshold;
      const requiredCollateral =
        (loanData.loanAmount * 10000) / liquidationThreshold;

      return collateralValue < requiredCollateral;
    } catch (error) {
      return false;
    }
  }

  private async triggerLiquidation(loanAddress: PublicKey, loanData: any) {
    try {
      this.activeLiquidations++;
      console.log(chalk.yellow("🔨 Triggering Liquidation..."));
      console.log(
        chalk.gray(`   Loan: ${loanAddress.toBase58().slice(0, 16)}...`)
      );
      console.log(chalk.gray(`   Collateral: ${loanData.collateralAmount}`));

      // Get PDAs
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

      // Build transaction with priority fee
      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee,
        })
      );

      // Call trigger_liquidation
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

      // Sign and send
      tx.sign(wallet);
      const sig = await connection.sendRawTransaction(tx.serialize());

      console.log(chalk.green("✅ Liquidation Triggered!"));
      console.log(
        chalk.gray(
          `   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`
        )
      );
      this.stats.triggered++;

      // Log expected reward
      const reward = (loanData.collateralAmount * 60) / 10000; // 0.6%
      console.log(chalk.cyan(`   Expected Reward: ${reward} lamports`));
    } catch (error) {
      console.error(chalk.red("❌ Failed to trigger:"), error);
    } finally {
      this.activeLiquidations--;
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("🛑 Trigger Bot: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Triggered ${this.stats.triggered}, Errors ${this.stats.errors}`
      )
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 🏪 STOREFRONT HUNTER BOT (Keeper B)
// ═══════════════════════════════════════════════════════════

class StorefrontHunterBot {
  private isRunning = false;
  private stats = { checked: 0, bought: 0, errors: 0, totalProfit: 0 };

  async start() {
    if (!CONFIG.hunter.enabled) {
      console.log(chalk.gray("⚪ Hunter Bot: Disabled"));
      return;
    }

    this.isRunning = true;
    console.log(chalk.green("🟢 Hunter Bot: Starting..."));
    console.log(
      chalk.gray(
        `   Target Discount: ${CONFIG.hunter.minDiscount}% - ${CONFIG.hunter.maxDiscount}%`
      )
    );
    console.log(
      chalk.gray(
        `   Max Investment: ${formatUSDC(
          CONFIG.hunter.maxInvestment * 1_000_000
        )}`
      )
    );
    console.log(
      chalk.gray(`   Check Interval: ${CONFIG.hunter.checkInterval}ms`)
    );
    console.log("");

    while (this.isRunning) {
      try {
        await this.scanAndBuy();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Hunter Bot Error:"), error);
      }
      await sleep(CONFIG.hunter.checkInterval);
    }
  }

  private async scanAndBuy() {
    // Use rate limiter for RPC calls
    await rpcLimiter.executeWithRetry(async () => {
      // Fetch all triggered liquidation processes
      const processes = await program.account.liquidationProcess.all();
      const now = Math.floor(Date.now() / 1000);

      for (const process of processes) {
        const data = process.account;

        // Only check Triggered but not yet Swapped
        if (data.status !== 1 || data.swapped) continue;

        // Calculate time-based discount
        const elapsed = now - data.triggeredAt.toNumber();
        const discount = this.calculateDiscount(elapsed);

        // Check if in our target range
        if (
          discount >= CONFIG.hunter.minDiscount &&
          discount <= CONFIG.hunter.maxDiscount
        ) {
          await this.buyFromStorefront(process.publicKey, data, discount);
        }
      }
    }, "Hunter scan");
  }

  private calculateDiscount(elapsedSeconds: number): number {
    if (elapsedSeconds <= 600) return 8; // 0-10 min: 8%
    if (elapsedSeconds <= 1800) return 6; // 10-30 min: 6%
    if (elapsedSeconds <= 3600) return 3; // 30-60 min: 3%
    return 0; // >60 min: 0%
  }

  private async buyFromStorefront(
    processAddress: PublicKey,
    processData: any,
    discount: number
  ) {
    try {
      const tierColor = getTierColor(discount);
      console.log(tierColor(`🏪 OPPORTUNITY: ${discount}% Discount!`));
      console.log(
        chalk.gray(`   Process: ${processAddress.toBase58().slice(0, 16)}...`)
      );
      console.log(
        chalk.gray(`   Seized: ${processData.seizedCollateralAmount} units`)
      );

      // Get PDAs
      const [systemConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [seizedAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("seized_auth")],
        program.programId
      );

      const [processingAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("processing_auth")],
        program.programId
      );

      const [loanAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("loan"), processData.loanAccount.toBuffer()],
        program.programId
      );

      const loanData = await program.account.loanAccount.fetch(loanAccount);

      const [assetConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), loanData.collateralMint.toBuffer()],
        program.programId
      );

      const seizedVault = await getAssociatedTokenAddress(
        loanData.collateralMint,
        seizedAuth,
        true
      );

      const processingVault = await getAssociatedTokenAddress(
        loanData.loanMint,
        processingAuth,
        true
      );

      const callerUsdc = await getAssociatedTokenAddress(
        loanData.loanMint,
        wallet.publicKey
      );

      const callerCollateral = await getAssociatedTokenAddress(
        loanData.collateralMint,
        wallet.publicKey
      );

      // Check if we have USDC account
      const usdcAccountInfo = await connection.getAccountInfo(callerUsdc);
      if (!usdcAccountInfo) {
        console.log(chalk.yellow("   Creating USDC account..."));
      }

      // Build transaction
      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee * 2, // Higher priority for competitive buying
        })
      );

      // Create collateral ATA if needed
      const collateralAccountInfo = await connection.getAccountInfo(
        callerCollateral
      );
      if (!collateralAccountInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            callerCollateral,
            wallet.publicKey,
            loanData.collateralMint
          )
        );
      }

      // Buy instruction
      const instruction = await program.methods
        .buyFromStorefront()
        .accounts({
          caller: wallet.publicKey,
          liquidationProcess: processAddress,
          loanAccount,
          systemConfig,
          protocolConfig: PublicKey.findProgramAddressSync(
            [Buffer.from("protocol_config")],
            program.programId
          )[0],
          assetConfig,
          seizedAssetsAuthority: seizedAuth,
          seizedAssetsVault: seizedVault,
          loanMint: loanData.loanMint,
          processingVault,
          processingVaultAuthority: processingAuth,
          callerUsdcAccount: callerUsdc,
          callerCollateralAccount: callerCollateral,
          jupiterProgram: PROGRAM_ID, // Placeholder for storefront
          pythPriceFeed: PYTH_SOL_FEED,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      tx.add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Sign and send
      tx.sign(wallet);
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      console.log(chalk.green("✅ Purchase Successful!"));
      console.log(
        chalk.gray(
          `   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`
        )
      );

      // Calculate profit
      const profit = (processData.seizedCollateralAmount * discount) / 100;
      this.stats.totalProfit += profit;
      this.stats.bought++;

      console.log(
        chalk.cyan(`   Profit: ${profit} units (${discount}% discount)`)
      );
      console.log(chalk.cyan(`   Total Profit: ${this.stats.totalProfit}`));
    } catch (error) {
      console.error(chalk.red("❌ Failed to buy:"), error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("🛑 Hunter Bot: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Bought ${this.stats.bought}, Profit ${this.stats.totalProfit}`
      )
    );
  }
}

// ═══════════════════════════════════════════════════════════
// ✨ FINALIZE KEEPER BOT (Keeper C)
// ═══════════════════════════════════════════════════════════

class FinalizeKeeperBot {
  private isRunning = false;
  private stats = { checked: 0, finalized: 0, errors: 0, totalReward: 0 };

  async start() {
    if (!CONFIG.finalize.enabled) {
      console.log(chalk.gray("⚪ Finalize Bot: Disabled"));
      return;
    }

    this.isRunning = true;
    console.log(chalk.green("🟢 Finalize Bot: Starting..."));
    console.log(
      chalk.gray(
        `   Min Reward: ${formatUSDC(CONFIG.finalize.minProfit * 1_000_000)}`
      )
    );
    console.log(
      chalk.gray(`   Check Interval: ${CONFIG.finalize.checkInterval}ms`)
    );
    console.log("");

    while (this.isRunning) {
      try {
        await this.scanAndFinalize();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Finalize Bot Error:"), error);
      }
      await sleep(CONFIG.finalize.checkInterval);
    }
  }

  private async scanAndFinalize() {
    // Use rate limiter for RPC calls
    await rpcLimiter.executeWithRetry(async () => {
      // Fetch all swapped liquidation processes
      const processes = await program.account.liquidationProcess.all();

      for (const process of processes) {
        const data = process.account;

        // Only check Swapped but not yet Finalized
        if (data.status !== 2) continue; // Not Swapped

        // Check if deadline hasn't passed
        const now = Math.floor(Date.now() / 1000);
        const deadline = data.deadlineForDistribution?.toNumber() || 0;

        if (now < deadline) {
          await this.finalize(process.publicKey, data);
        }
      }
    }, "Finalize scan");
  }

  private async finalize(processAddress: PublicKey, processData: any) {
    try {
      console.log(chalk.blue("✨ Finalizing Liquidation..."));
      console.log(
        chalk.gray(`   Process: ${processAddress.toBase58().slice(0, 16)}...`)
      );
      console.log(chalk.gray(`   USDC Received: ${processData.usdcReceived}`));

      // Get PDAs
      const [loanAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("loan"), processData.loanAccount.toBuffer()],
        program.programId
      );

      const [systemConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [protocolConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_config")],
        program.programId
      );

      const [processingAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("processing_auth")],
        program.programId
      );

      const processingVault = await getAssociatedTokenAddress(
        processData.loanMint,
        processingAuth,
        true
      );

      const loanData = await program.account.loanAccount.fetch(loanAccount);

      const [capitalAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("capital_auth")],
        program.programId
      );

      const capitalWallet = await getAssociatedTokenAddress(
        processData.loanMint,
        capitalAuth,
        true
      );

      const keeperCUsdc = await getAssociatedTokenAddress(
        processData.loanMint,
        wallet.publicKey
      );

      const [revenueAuth] = PublicKey.findProgramAddressSync(
        [Buffer.from("revenue_auth")],
        program.programId
      );

      const revenueWallet = await getAssociatedTokenAddress(
        processData.loanMint,
        revenueAuth,
        true
      );

      // Build transaction
      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee,
        })
      );

      // Finalize instruction
      const instruction = await program.methods
        .finalizeLiquidation()
        .accounts({
          keeperC: wallet.publicKey,
          liquidationProcess: processAddress,
          loanAccount,
          systemConfig,
          protocolConfig,
          processingVaultAuthority: processingAuth,
          processingVault,
          capitalWallet,
          opsWallet: (
            await program.account.systemConfig.fetch(systemConfig)
          ).opsWallet,
          revenueWallet,
          keeperCUsdcAccount: keeperCUsdc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      tx.add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Sign and send
      tx.sign(wallet);
      const sig = await connection.sendRawTransaction(tx.serialize());

      console.log(chalk.green("✅ Finalization Complete!"));
      console.log(
        chalk.gray(
          `   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`
        )
      );

      // Expected reward is fixed at 1.0 USDC
      const reward = 1_000_000; // 1.0 USDC
      this.stats.totalReward += reward;
      this.stats.finalized++;

      console.log(chalk.cyan(`   Reward: ${formatUSDC(reward)}`));
      console.log(
        chalk.cyan(`   Total Rewards: ${formatUSDC(this.stats.totalReward)}`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to finalize:"), error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("🛑 Finalize Bot: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Finalized ${
          this.stats.finalized
        }, Rewards ${formatUSDC(this.stats.totalReward)}`
      )
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTION
// ═══════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "all";

  const triggerBot = new TriggerKeeperBot();
  const hunterBot = new StorefrontHunterBot();
  const finalizeBot = new FinalizeKeeperBot();

  // Handle shutdown gracefully
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n\n🛑 Shutting down..."));
    triggerBot.stop();
    hunterBot.stop();
    finalizeBot.stop();
    process.exit(0);
  });

  // Start bots based on mode
  if (mode === "trigger" || mode === "all") {
    triggerBot.start();
  }

  if (mode === "hunter" || mode === "all") {
    // Small delay to stagger startup
    await sleep(1000);
    hunterBot.start();
  }

  if (mode === "finalize" || mode === "all") {
    await sleep(2000);
    finalizeBot.start();
  }

  console.log(chalk.green("\n✅ All bots started successfully!"));
  console.log(chalk.gray("Press Ctrl+C to stop\n"));
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});

// Export for use as module
export { TriggerKeeperBot, StorefrontHunterBot, FinalizeKeeperBot };
