#!/usr/bin/env node
/**
 * 🤖 KEEPER B: Storefront Hunter Bot
 *
 * Buys liquidated assets at discounted prices from the storefront.
 * Uses time-decay pricing mechanism:
 * - 0-10 min:  8% discount
 * - 10-30 min: 6% discount
 * - 30-60 min: 3% discount
 * - 60+ min:   0% discount
 *
 * Reward: Profit from discount (e.g., 8% of purchase)
 *
 * Run: npm run keeper-b
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
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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
  minDiscount: 6,
  maxDiscount: 8,
  checkInterval: 2000,
  maxInvestment: 10000,
  priorityFee: 10000,
  commitment: "confirmed" as const,
};

// ═══════════════════════════════════════════════════════════
// 🔑 SETUP
// ═══════════════════════════════════════════════════════════
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

const idlPath = process.env.IDL_PATH || "./target/idl/ginva.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(
  chalk.blue.bold(
    "\n╔══════════════════════════════════════════════════════════╗"
  )
);
console.log(
  chalk.blue.bold("║           🤖 KEEPER B: STOREFRONT HUNTER BOT            ║")
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
    `\n📋 Config: Target discount ${CONFIG.minDiscount}%-${CONFIG.maxDiscount}%\n`
  )
);

// ═══════════════════════════════════════════════════════════
// 📊 UTILITIES
// ═══════════════════════════════════════════════════════════
const formatUSDC = (amount: number): string => {
  return `$${(amount / 1_000_000).toFixed(2)}`;
};

const getTierColor = (discount: number): string => {
  if (discount >= 8) return chalk.yellow.bold;
  if (discount >= 6) return chalk.gray.bold;
  if (discount >= 3) return chalk.red.bold;
  return chalk.white;
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
// 🏪 KEEPER B: HUNTER BOT
// ═══════════════════════════════════════════════════════════
class StorefrontHunterBot {
  private isRunning = false;
  private stats = { checked: 0, bought: 0, errors: 0, totalProfit: 0 };

  async start() {
    this.isRunning = true;
    console.log(chalk.green("🟢 Keeper B: Starting...\n"));

    while (this.isRunning) {
      try {
        await this.scanAndBuy();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Keeper B Error:"), error);
      }
      await sleep(CONFIG.checkInterval);
    }
  }

  private async scanAndBuy() {
    await rpcLimiter.acquire();
    const processes = await program.account.liquidationProcess.all();
    const now = Math.floor(Date.now() / 1000);

    for (const process of processes) {
      const data = process.account;
      if (data.status !== 1 || data.swapped) continue;

      const elapsed = now - data.triggeredAt.toNumber();
      const discount = this.calculateDiscount(elapsed);

      if (discount >= CONFIG.minDiscount && discount <= CONFIG.maxDiscount) {
        await this.buyFromStorefront(process.publicKey, data, discount);
      }
    }
  }

  private calculateDiscount(elapsedSeconds: number): number {
    if (elapsedSeconds <= 600) return 8; // 0-10 min:  8%
    if (elapsedSeconds <= 1800) return 6; // 10-30 min: 6%
    if (elapsedSeconds <= 3600) return 3; // 30-60 min: 3%
    return 0; // 60+ min:  0%
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
        chalk.gray(`   Process: ${processAddress.toBase58().slice(0, 12)}...`)
      );

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

      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee * 2,
        })
      );

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
          jupiterProgram: PROGRAM_ID,
          pythPriceFeed: PYTH_SOL_FEED,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      tx.add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
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

      const profit = (processData.seizedCollateralAmount * discount) / 100;
      this.stats.totalProfit += profit;
      this.stats.bought++;

      console.log(
        chalk.cyan(`   💰 Profit: ${profit} units (${discount}% discount)\n`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to buy:"), error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("\n🛑 Keeper B: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Bought ${this.stats.bought}`
      )
    );
    console.log(
      chalk.cyan(`   Total Profit: ${this.stats.totalProfit} units\n`)
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN
// ═══════════════════════════════════════════════════════════
const hunterBot = new StorefrontHunterBot();

process.on("SIGINT", () => {
  console.log(chalk.yellow("\n🛑 Shutting down..."));
  hunterBot.stop();
  process.exit(0);
});

console.log(chalk.green("✅ Keeper B ready! Press Ctrl+C to stop.\n"));
hunterBot.start().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
