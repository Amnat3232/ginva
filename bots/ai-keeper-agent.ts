#!/usr/bin/env npx tsx

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import chalk from "chalk";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const CARBIUM_RPC = process.env.CARBIUM_RPC || "https://rpc.carbium.io";
const CARBIUM_WSS = process.env.CARBIUM_WSS || "wss://wss-rpc.carbium.io";
const CARBIUM_GRPC = process.env.CARBIUM_GRPC || "grpc://grpc.carbium.io:443";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "GiqfoYyeQuNEPRiZbdKCtMCeYvKVpQyDWUiSDB6U9bzC"
);

const GINVA_PROGRAM_ID = new PublicKey(
  process.env.GINVA_PROGRAM_ID || "GiqfoYyeQuNEPRiZbdKCtMCeYvKVpQyDWUiSDB6U9bzC"
);

const OWNER_FEE = 0.45;
const AGENT_FEE = 0.35;
const PROTOCOL_FEE = 0.2;

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_RETRIES = 5;
const HEALTH_CHECK_INTERVAL = 30000;

interface LiquidationOpportunity {
  borrower: PublicKey;
  collateralAmount: number;
  debtAmount: number;
  healthFactor: number;
  timestamp: number;
}

interface AgentState {
  status: "idle" | "scanning" | "executing" | "error";
  lastScan: number;
  opportunitiesFound: number;
  executionsSuccess: number;
  executionsFailed: number;
  totalProfit: number;
}

class RetryableError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "RetryableError";
  }
}

class CarbiumClient {
  private connection: Connection;

  constructor(rpc: string, grpc: string, wss: string) {
    this.connection = new Connection(rpc, {
      commitment: "confirmed",
      wsEndpoint: wss,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log(chalk.gray(`   RPC Version: ${version["solana-core"]}`));
      return true;
    } catch {
      return false;
    }
  }

  async programSubscribe(
    programId: PublicKey,
    callback: (account: any) => void
  ): Promise<() => void> {
    console.log(chalk.gray(`   Subscribing to program: ${programId.toBase58()}`));
    
    const subscription = this.connection.onProgramAccountChange(
      programId,
      (updatedAccountInfo) => {
        callback(updatedAccountInfo);
      },
      "confirmed"
    );

    return () => {
      this.connection.removeProgramAccountChangeListener(subscription);
    };
  }

  async executeSwap(
    user: PublicKey,
    inAmount: number,
    outMint: PublicKey,
    slippage: number
  ): Promise<string> {
    const quoteResponse = await fetch(
      `${CARBIUM_RPC}/swap/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outMint.toBase58()}&amount=${inAmount}&slippage=${slippage}`
    );

    if (!quoteResponse.ok) {
      throw new RetryableError("Failed to get quote", true);
    }

    const quote = await quoteResponse.json();
    
    const swapResponse = await fetch(`${CARBIUM_RPC}/swap/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: user.toBase58(),
        prioritizationFeeLamports: 5000,
      }),
    });

    if (!swapResponse.ok) {
      throw new RetryableError("Swap execution failed", true);
    }

    const swapResult = await swapResponse.json();
    return (swapResult as any).transactionHash ?? (swapResult as any).txHash ?? "";
  }

  async getRecentPriorityFees(): Promise<number> {
    try {
      const fees = await this.connection.getRecentPrioritizationFees();
      const avgFee = fees.reduce((a: number, b: any) => a + b.prioritizationFee, 0) / fees.length;
      return Math.max(avgFee, 5000);
    } catch {
      return 5000;
    }
  }
}

class AIKeeperAgent {
  private client: CarbiumClient;
  private wallet: Keypair;
  private state: AgentState;
  private program: Program | null = null;
  private idl: Idl | null = null;
  private subscriptionCleanup: (() => void) | null = null;
  private alerts: AlertService;
  private dashboard: DashboardLogger;

  constructor() {
    this.client = new CarbiumClient(CARBIUM_RPC, CARBIUM_GRPC, CARBIUM_WSS);
    this.wallet = this.loadWallet();
    this.state = {
      status: "idle",
      lastScan: 0,
      opportunitiesFound: 0,
      executionsSuccess: 0,
      executionsFailed: 0,
      totalProfit: 0,
    };
    this.alerts = new AlertService();
    this.dashboard = new DashboardLogger();
  }

  private loadWallet(): Keypair {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const keyArray = JSON.parse(privateKey);
      return Keypair.fromSecretKey(new Uint8Array(keyArray));
    }

    const keypairPath = process.env.KEYPAIR_PATH || "./keypair.json";
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
  }

  async initialize(): Promise<void> {
    console.log(chalk.bold.cyan("╔══════════════════════════════════════════╗"));
    console.log(chalk.bold.cyan("║   GINVA AI KEEPER AGENT v1.0          ║"));
    console.log(chalk.bold.cyan("║   (Powered by Carbium Infrastructure) ║"));
    console.log(chalk.bold.cyan("╚══════════════════════════════════════════╝"));
    console.log(chalk.gray(`Wallet: ${this.wallet.publicKey.toBase58()}`));
    console.log(chalk.gray(`Program: ${GINVA_PROGRAM_ID.toBase58()}`));
    console.log(chalk.gray(`gRPC: ${CARBIUM_GRPC}`));
    console.log("");

    const idlPath = process.env.IDL_PATH || "../target/idl/ginva.json";
    this.idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

    const connection = new Connection(CARBIUM_RPC, "confirmed");
    const walletAdapter = {
      publicKey: this.wallet.publicKey,
      signTransaction: async <T extends Transaction>(tx: T): Promise<T> => {
        if ("sign" in tx) {
          tx.sign(this.wallet);
        }
        return tx;
      },
      signAllTransactions: async <T extends Transaction>(txs: T[]): Promise<T[]> => {
        for (const tx of txs) {
          if ("sign" in tx) {
            tx.sign(this.wallet);
          }
        }
        return txs;
      },
    } as anchor.Wallet;
    const provider = new anchor.AnchorProvider(connection, walletAdapter, {
      commitment: "confirmed",
    });

    this.program = new Program(this.idl as Idl, GINVA_PROGRAM_ID, provider);

    console.log(chalk.green("✅ Agent initialized"));
    console.log(chalk.gray(`   Revenue Split: Owner ${OWNER_FEE * 100}% | Agent ${AGENT_FEE * 100}% | Protocol ${PROTOCOL_FEE * 100}%`));
    console.log("");
  }

  async healthCheck(): Promise<boolean> {
    const healthy = await this.client.healthCheck();
    this.state.status = healthy ? "idle" : "error";
    return healthy;
  }

  async start(): Promise<void> {
    console.log(chalk.bold.green("🚀 Starting AI Keeper Agent..."));
    console.log("");

    this.dashboard.log("Agent started", this.state);

    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      console.log(chalk.red("❌ Health check failed, retrying in 30s..."));
      await this.alerts.sendAlert("HEALTH_CHECK_FAILED", "Agent health check failed");
      setTimeout(() => this.start(), HEALTH_CHECK_INTERVAL);
      return;
    }

    this.subscribeToProgram();
    this.startHealthCheckLoop();
  }

  private subscribeToProgram(): void {
    console.log(chalk.blue("📡 Subscribing to GINVA program events..."));

    this.client.programSubscribe(GINVA_PROGRAM_ID, async (account) => {
      this.state.status = "scanning";
      this.state.lastScan = Date.now();

      try {
        const opportunity = await this.analyzeAccount(account);
        if (opportunity && this.isProfitable(opportunity)) {
          this.state.opportunitiesFound++;
          this.dashboard.log("Opportunity found", opportunity);

          console.log(chalk.yellow(`\n⚡ Liquidation Opportunity Found!`));
          console.log(chalk.gray(`   Borrower: ${opportunity.borrower.toBase58()}`));
          console.log(chalk.gray(`   Debt: ${opportunity.debtAmount} USDC`));
          console.log(chalk.gray(`   Health Factor: ${opportunity.healthFactor}`));

          await this.executeLiquidation(opportunity);
        }
      } catch (error) {
        console.log(chalk.red(`   Analysis error: ${error}`));
      }

      this.state.status = "idle";
    });
  }

  private async analyzeAccount(account: any): Promise<LiquidationOpportunity | null> {
    try {
      const decoded = this.program?.coder?.accounts?.decode(
        "loan",
        account.account.data
      );

      if (!decoded) return null;

      const healthFactor = this.calculateHealthFactor(decoded);
      
      if (healthFactor < 100) {
        return {
          borrower: account.pubkey,
          collateralAmount: decoded.collateralAmount,
          debtAmount: decoded.debtAmount,
          healthFactor,
          timestamp: Date.now(),
        };
      }
    } catch {
      // Account parse error, skip
    }

    return null;
  }

  private calculateHealthFactor(loan: any): number {
    const collateralValue = Number(loan.collateralAmount) * Number(loan.collateralPrice);
    const debtValue = Number(loan.debtAmount);
    
    if (debtValue === 0) return 1000;
    return (collateralValue / debtValue) * 100;
  }

  private isProfitable(opportunity: LiquidationOpportunity): boolean {
    const minProfit = Number(process.env.MIN_PROFIT || 0.1);
    const expectedProfit = opportunity.debtAmount * 0.02;
    return expectedProfit >= minProfit;
  }

  private async executeLiquidation(opportunity: LiquidationOpportunity): Promise<void> {
    this.state.status = "executing";

    try {
      const tx = await this.withRetry(async () => {
        const priorityFee = await this.client.getRecentPriorityFees();

        const transaction = new Transaction();
        transaction.add({
          keys: [
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: opportunity.borrower, isSigner: false, isWritable: true },
          ],
          programId: GINVA_PROGRAM_ID,
          data: Buffer.from([]),
        });

        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee,
          })
        );

        return sendAndConfirmTransaction(
          new Connection(CARBIUM_RPC),
          transaction,
          [this.wallet]
        );
      });

      this.state.executionsSuccess++;
      this.state.totalProfit += opportunity.debtAmount * AGENT_FEE;

      console.log(chalk.green(`✅ Liquidation executed!`));
      console.log(chalk.gray(`   TX: ${tx}`));
      console.log(chalk.gray(`   Profit: ${opportunity.debtAmount * AGENT_FEE} USDC`));

      this.dashboard.log("Liquidation executed", {
        tx,
        profit: opportunity.debtAmount * AGENT_FEE,
      });

      await this.alerts.sendAlert(
        "LIQUIDATION_SUCCESS",
        `Executed liquidation: ${opportunity.debtAmount} USDC, profit: ${opportunity.debtAmount * AGENT_FEE} USDC`
      );
    } catch (error) {
      this.state.executionsFailed++;
      console.log(chalk.red(`❌ Liquidation failed: ${error}`));
      
      await this.alerts.sendAlert(
        "LIQUIDATION_FAILED",
        `Failed: ${error}`
      );
    }

    this.state.status = "idle";
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (error instanceof RetryableError && error.retryable) {
          const delay = RETRY_DELAYS[Math.min(i, RETRY_DELAYS.length - 1)];
          console.log(chalk.yellow(`   Retry ${i + 1}/${MAX_RETRIES} in ${delay}ms...`));
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private startHealthCheckLoop(): void {
    setInterval(async () => {
      const healthy = await this.healthCheck();
      
      if (!healthy) {
        console.log(chalk.red("❌ Health check failed, attempting restart..."));
        await this.alerts.sendAlert("HEALTH_CHECK_FAILED", "Agent unhealthy");
        
        this.subscriptionCleanup?.();
        await this.subscribeToProgram();
      }

      this.dashboard.log("Health check", this.state);
    }, HEALTH_CHECK_INTERVAL);
  }

  getState(): AgentState {
    return this.state;
  }
}

class AlertService {
  private discordWebhook?: string;
  private telegramBot?: string;
  private telegramChatId?: string;

  constructor() {
    this.discordWebhook = process.env.DISCORD_WEBHOOK;
    this.telegramBot = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
  }

  async sendAlert(type: string, message: string): Promise<void> {
    const payload = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    if (this.discordWebhook) {
      await this.sendDiscord(payload);
    }

    if (this.telegramBot && this.telegramChatId) {
      await this.sendTelegram(payload);
    }
  }

  private async sendDiscord(payload: any): Promise<void> {
    try {
      await fetch(this.discordWebhook!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `🤖 GINVA Keeper: ${payload.type}`,
              description: payload.message,
              color: payload.type.includes("SUCCESS") ? 3066993 : 15158332,
              timestamp: payload.timestamp,
            },
          ],
        }),
      });
    } catch (error) {
      console.log(chalk.red(`   Discord alert failed: ${error}`));
    }
  }

  private async sendTelegram(payload: any): Promise<void> {
    try {
      await fetch(
        `https://api.telegram.org/bot${this.telegramBot}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: `🤖 *GINVA Keeper*\n\n*${payload.type}*\n${payload.message}`,
            parse_mode: "Markdown",
          }),
        }
      );
    } catch (error) {
      console.log(chalk.red(`   Telegram alert failed: ${error}`));
    }
  }
}

class DashboardLogger {
  private logFile: string;

  constructor() {
    this.logFile = process.env.LOG_FILE || "./keeper-agent.log";
  }

  log(action: string, data: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      ...data,
    };

    console.log(chalk.gray(`   [${entry.timestamp}] ${action}`));

    try {
      const existing = fs.existsSync(this.logFile)
        ? JSON.parse(fs.readFileSync(this.logFile, "utf8"))
        : [];
      
      existing.push(entry);
      
      const trimmed = existing.slice(-1000);
      fs.writeFileSync(this.logFile, JSON.stringify(trimmed, null, 2));
    } catch {
      // Logging failed, continue
    }
  }
}

async function main() {
  const agent = new AIKeeperAgent();
  
  await agent.initialize();
  
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n\n🛑 Shutting down..."));
    const state = agent.getState();
    console.log(chalk.gray(`   Opportunities: ${state.opportunitiesFound}`));
    console.log(chalk.gray(`   Success: ${state.executionsSuccess}`));
    console.log(chalk.gray(`   Failed: ${state.executionsFailed}`));
    console.log(chalk.gray(`   Total Profit: ${state.totalProfit} USDC`));
    process.exit(0);
  });

  await agent.start();
}

main().catch(console.error);
