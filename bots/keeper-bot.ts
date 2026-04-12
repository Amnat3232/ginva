#!/usr/bin/env node
/**
 * GINVA Keeper Bot
 * 
 * Automated liquidation keeper for GINVA Pinocchio Protocol
 * - Scans for liquidatable loans
 * - Executes liquidations
 * 
 * Run: TS_NODE_TRANSPILE_ONLY=true npx ts-node keeper-bot.ts
 */

import { Connection, PublicKey, Keypair, Transaction, ComputeBudgetProgram, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

dotenv.config();

// Carbium Infrastructure (Hackathon Edition)
const CARBIUM_RPC = process.env.CARBIUM_RPC || "https://rpc.carbium.io";
const CARBIUM_WSS = process.env.CARBIUM_WSS || "wss://wss-rpc.carbium.io";
const USE_CARBIUM = process.env.USE_CARBIUM === "true";

// Default to Carbium for hackathon (fast + MEV protection)
const RPC_URL = USE_CARBIUM ? CARBIUM_RPC : (process.env.RPC_URL || "https://api.devnet.solana.com");

// For subscriptions, use WS endpoint
const WS_URL = USE_CARBIUM ? CARBIUM_WSS : undefined;
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "67cu15Nf1rEaTMMEyda3TcvRMArUGRmH94etRTBJ7sSB"
);

const CONFIG = {
  checkInterval: 5000,
  maxConcurrentLiquidations: 3,
  priorityFee: 10000,
  commitment: "confirmed" as const,
};

const loadWallet = (): Keypair => {
  const keypairPath = process.env.KEYPAIR_PATH || "./wallet.json";
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

const wallet = loadWallet();
const connection = new Connection(RPC_URL, CONFIG.commitment);
const provider = new anchor.AnchorProvider(connection, new Wallet(wallet), {
  commitment: CONFIG.commitment,
});

const idlPath = process.env.IDL_PATH || "../target/idl/ginva.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const program = new Program(idl as Idl, PROGRAM_ID, provider);

console.log(chalk.bold.blue("╔══════════════════════════════════════╗"));
console.log(chalk.bold.blue("║    GINVA KEEPER BOT v5.1           ║"));
console.log(chalk.bold.blue("║    (Pinocchio Protocol)            ║"));
console.log(chalk.bold.blue("╚══════════════════════════════════════╝"));
console.log(chalk.gray(`Wallet: ${wallet.publicKey.toBase58()}`));
console.log(chalk.gray(`Program: ${PROGRAM_ID.toBase58()}`));

// Carbium status display
if (USE_CARBIUM) {
  console.log("");
  console.log(chalk.green("🚀 CARBIUM INFRASTRUCTURE ENABLED"));
  console.log(chalk.gray(`   RPC: ${CARBIUM_RPC}`));
  console.log(chalk.gray(`   WSS: ${CARBIUM_WSS}`));
  console.log(chalk.gray("   Benefits: Sub-50ms latency + MEV Protection"));
} else {
  console.log(chalk.gray("\n💡 Tip: Set USE_CARBIUM=true for faster RPC + MEV protection"));
}
console.log("");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LoanAccount {
  discriminator: number[];
  loanId: number[];
  borrower: number[];
  status: number;
  collateralAmount: anchor.BN;
  loanAmount: anchor.BN;
  cumulativeInterest: anchor.BN;
  lastInterestUpdate: anchor.BN;
  loanStartTime: anchor.BN;
  loanMaturityTime: anchor.BN;
  isLiquidated: number;
  liquidationProcessed: number;
  liquidationBonusBps: number;
  liquidationInitiatedTime: anchor.BN;
  collateralPriceAtLiquidation: anchor.BN;
  seizedCollateralAmount: anchor.BN;
  swappedToCollateral: number;
  autoSwapExecuted: number;
  debtAccumulated: anchor.BN;
  lastDebtAccumulationUpdate: anchor.BN;
  isInitialized: number;
  assetConfig: number[];
  isRestricted: number;
  debtAccumulationLastUpdate: anchor.BN;
}

interface SystemConfig {
  discriminator: number[];
  admin: number[];
  capitalWalletAuthority: number[];
  vaultWalletAuthority: number[];
  revenueWalletAuthority: number[];
  seizedAssetsAuthority: number[];
  collateralMint: number[];
  loanMint: number[];
  depositFeeBps: number;
  isActive: number;
  totalBorrowed: anchor.BN;
  totalCollateral: anchor.BN;
  opsWallet: number[];
  totalStaked: anchor.BN;
  accRewardPerShare: anchor.BN;
  isPaused: number;
  pauseReason: number[];
}

class KeeperBot {
  private isRunning = false;
  private activeLiquidations = 0;
  private stats = { checked: 0, liquidated: 0, errors: 0 };

  async start() {
    this.isRunning = true;
    console.log(chalk.green("🟢 Keeper Bot: Starting..."));
    console.log(chalk.gray(`   Check Interval: ${CONFIG.checkInterval}ms`));
    console.log("");

    while (this.isRunning) {
      try {
        await this.scanAndLiquidate();
        this.stats.checked++;
      } catch (error) {
        this.stats.errors++;
        console.error(chalk.red("❌ Error:"), error);
      }
      await sleep(CONFIG.checkInterval);
    }
  }

  stop() {
    this.isRunning = false;
    console.log(chalk.yellow("\n🛑 Keeper Bot: Stopped"));
    console.log(chalk.gray(`   Stats: Checked=${this.stats.checked}, Liquidated=${this.stats.liquidated}, Errors=${this.stats.errors}`));
  }

  private async scanAndLiquidate() {
    const loans = await program.account.loanAccount.all();
    const systemConfig = await this.getSystemConfigPDA();
    const systemConfigData = await program.account.systemConfig.fetch(systemConfig) as unknown as SystemConfig;
    const loanMint = new PublicKey(systemConfigData.loanMint);
    const collateralMint = new PublicKey(systemConfigData.collateralMint);

    const liquidatorCollateralATA = await getAssociatedTokenAddress(collateralMint, wallet.publicKey);
    const liquidatorRepayATA = await getAssociatedTokenAddress(loanMint, wallet.publicKey);

    for (const loan of loans) {
      if (this.activeLiquidations >= CONFIG.maxConcurrentLiquidations) break;

      const loanData = loan.account as unknown as LoanAccount;

      if (!this.isLiquidatable(loanData)) continue;

      await this.executeLiquidation(
        loan.publicKey,
        loanData,
        systemConfig,
        liquidatorCollateralATA,
        liquidatorRepayATA
      );
    }
  }

  private isLiquidatable(loan: LoanAccount): boolean {
    return (
      loan.isInitialized === 1 &&
      loan.status === 1 &&
      loan.isLiquidated === 0
    );
  }

  private async getSystemConfigPDA(): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    )[0];
  }

  private async getAssetConfigPDA(assetConfigBytes: number[]): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("asset_config"), Buffer.from(assetConfigBytes.slice(0, 32))],
      PROGRAM_ID
    )[0];
  }

  private async getReserveWalletPDA(assetConfigBytes: number[]): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("reserve_wallet"), Buffer.from(assetConfigBytes.slice(0, 32))],
      PROGRAM_ID
    )[0];
  }

  private bytesToU64(bytes: number[]): anchor.BN {
    return new anchor.BN(Buffer.from(bytes.slice(0, 8)), 10, "le");
  }

  private async executeLiquidation(
    loanAddress: PublicKey,
    loanData: LoanAccount,
    systemConfig: PublicKey,
    liquidatorCollateralATA: PublicKey,
    liquidatorRepayATA: PublicKey
  ) {
    try {
      this.activeLiquidations++;

      const assetConfigPDA = await this.getAssetConfigPDA(loanData.assetConfig);
      const reserveWallet = await this.getReserveWalletPDA(loanData.assetConfig);

      const loanId = this.bytesToU64(loanData.loanId);

      console.log(chalk.yellow("🔨 Liquidating..."));
      console.log(chalk.gray(`   Loan: ${loanAddress.toBase58().slice(0, 16)}...`));
      console.log(chalk.gray(`   Loan ID: ${loanId.toString()}`));
      console.log(chalk.gray(`   Collateral: ${loanData.collateralAmount.toString()}`));
      console.log(chalk.gray(`   Debt: ${loanData.loanAmount.toString()}`));

      const tx = new Transaction();
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: CONFIG.priorityFee,
        })
      );

      const instruction = await program.methods
        .liquidate(loanId)
        .accounts({
          liquidator: wallet.publicKey,
          loanAccount: loanAddress,
          assetConfig: assetConfigPDA,
          systemConfig: systemConfig,
          liquidatorCollateralAccount: liquidatorCollateralATA,
          liquidatorRepayAccount: liquidatorRepayATA,
          reserveWallet: reserveWallet,
        })
        .instruction();

      tx.add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      tx.sign(wallet);
      const sig = await connection.sendRawTransaction(tx.serialize());

      console.log(chalk.green("✅ Liquidation Sent!"));
      console.log(chalk.gray(`   Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`));
      this.stats.liquidated++;

    } catch (error: any) {
      console.error(chalk.red("❌ Liquidation failed:"), error.message || error);
    } finally {
      this.activeLiquidations--;
    }
  }
}

async function main() {
  const bot = new KeeperBot();

  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n\n🛑 Shutting down..."));
    bot.stop();
    process.exit(0);
  });

  console.log(chalk.green("✅ Keeper bot initialized!"));
  console.log(chalk.gray("Press Ctrl+C to stop\n"));

  await bot.start();
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
