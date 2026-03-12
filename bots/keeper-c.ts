#!/usr/bin/env node
/**
 * 🤖 KEEPER C: Finalize Liquidation Bot
 *
 * Completes liquidation by distributing funds according to the waterfall:
 * 1. Keeper rewards (0.6% to Keeper A)
 * 2. Loan repayment (to lending pool)
 * 3. Interest payment (to lenders)
 * 4. Profit split:
 *    - Growth Fund: 10%
 *    - Team/Operations: 24.75%
 *    - Stakers: 65.25%
 *
 * Reward: 1.0 USDC per transaction
 *
 * Run: npm run keeper-c
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

const CONFIG = {
  minReward: 1.0,
  checkInterval: 10000,
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
  chalk.blue.bold("║          🤖 KEEPER C: FINALIZE LIQUIDATION BOT         ║")
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
    `\n📋 Config: Check every ${CONFIG.checkInterval / 1000}s, Min reward ${
      CONFIG.minReward
    } USDC\n`
  )
);

// ═══════════════════════════════════════════════════════════
// 📊 UTILITIES
// ═══════════════════════════════════════════════════════════
const formatUSDC = (amount: number): string => {
  return `$${(amount / 1_000_000).toFixed(2)}`;
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
// ✨ KEEPER C: FINALIZE BOT
// ═══════════════════════════════════════════════════════════
class FinalizeKeeperBot {
  private isRunning = false;
  private stats = { checked: 0, finalized: 0, errors: 0, totalReward: 0 };

  async start() {
    this.isRunning = true;
    console.log(chalk.green("🟢 Keeper C: Starting...\n"));

    while (this.isRunning) {
      try {
        await this.scanAndFinalize();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Keeper C Error:"), error);
      }
      await sleep(CONFIG.checkInterval);
    }
  }

  private async scanAndFinalize() {
    await rpcLimiter.acquire();
    const processes = await program.account.liquidationProcess.all();

    for (const process of processes) {
      const data = process.account;
      if (data.status !== 2) continue; // Not Swapped

      const now = Math.floor(Date.now() / 1000);
      const deadline = data.deadlineForDistribution?.toNumber() || 0;

      if (now >= deadline) {
        await this.finalize(process.publicKey, data);
      }
    }
  }

  private async finalize(processAddress: PublicKey, processData: any) {
    try {
      console.log(chalk.blue("✨ Finalizing Liquidation..."));
      console.log(
        chalk.gray(`   Process: ${processAddress.toBase58().slice(0, 12)}...`)
      );
      console.log(
        chalk.gray(`   USDC Received: ${formatUSDC(processData.usdcReceived)}`)
      );

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

      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee,
        })
      );

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
      tx.sign(wallet);

      const sig = await connection.sendRawTransaction(tx.serialize());

      console.log(chalk.green("✅ Finalization Complete!"));
      console.log(
        chalk.gray(
          `   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`
        )
      );

      const reward = 1_000_000; // 1.0 USDC
      this.stats.totalReward += reward;
      this.stats.finalized++;

      console.log(chalk.cyan(`   💰 Reward: ${formatUSDC(reward)}`));
      console.log(
        chalk.cyan(`   Total Rewards: ${formatUSDC(this.stats.totalReward)}\n`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to finalize:"), error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("\n🛑 Keeper C: Stopped"));
    console.log(
      chalk.gray(
        `   Stats: Checked ${this.stats.checked}, Finalized ${this.stats.finalized}`
      )
    );
    console.log(
      chalk.cyan(`   Total Rewards: ${formatUSDC(this.stats.totalReward)}\n`)
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN
// ═══════════════════════════════════════════════════════════
const finalizeBot = new FinalizeKeeperBot();

process.on("SIGINT", () => {
  console.log(chalk.yellow("\n🛑 Shutting down..."));
  finalizeBot.stop();
  process.exit(0);
});

console.log(chalk.green("✅ Keeper C ready! Press Ctrl+C to stop.\n"));
finalizeBot.start().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
