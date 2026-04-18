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
import chalk from "chalk";
import * as dotenv from "dotenv";
import {
  RiskAssessmentEngine,
  RiskAssessment,
  LoanPosition,
  MarketData,
  analyzeLoanPosition,
} from "./risk-assessment";

dotenv.config();

const PROGRAM_ID = new PublicKey(
  process.env.GINVA_PROGRAM_ID || "67cu15Nf1rEaTMMEyda3TcvRMArUGRmH94etRTBJ7sSB"
);

const OWNER_FEE = 0.45;
const AGENT_FEE = 0.35;
const PROTOCOL_FEE = 0.2;

interface LiquidationDecision {
  shouldLiquidate: boolean;
  confidence: number;
  riskAssessment: RiskAssessment;
  estimatedProfit: number;
  reasons: string[];
}

interface AgentConfig {
  rpcUrl: string;
  privateKey: Uint8Array;
  minProfitThreshold: number;
  maxConcurrentLiquidations: number;
  enableAIAnalysis: boolean;
  useJitoBundles: boolean;
}

interface LiquidationResult {
  success: boolean;
  transactionHash?: string;
  profit?: number;
  error?: string;
}

export class SmartLiquidationAgent {
  private connection: Connection;
  private wallet: Keypair;
  private riskEngine: RiskAssessmentEngine;
  private config: AgentConfig;
  private activeLiquidations: Map<string, boolean> = new Map();

  constructor(config: AgentConfig) {
    this.connection = new Connection(config.rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: process.env.WS_URL,
    });
    this.wallet = Keypair.fromSecretKey(config.privateKey);
    this.riskEngine = new RiskAssessmentEngine(config.rpcUrl);
    this.config = config;
  }

  async analyzeAndDecide(position: LoanPosition): Promise<LiquidationDecision> {
    if (this.activeLiquidations.has(position.borrower.toBase58())) {
      return {
        shouldLiquidate: false,
        confidence: 0,
        riskAssessment: {
          score: 0,
          level: "low",
          factors: [],
          recommendation: "hold",
          confidence: 0,
        },
        estimatedProfit: 0,
        reasons: ["Already processing liquidation for this position"],
      };
    }

    if (this.activeLiquidations.size >= this.config.maxConcurrentLiquidations) {
      return {
        shouldLiquidate: false,
        confidence: 0,
        riskAssessment: {
          score: 0,
          level: "low",
          factors: [],
          recommendation: "hold",
          confidence: 0,
        },
        estimatedProfit: 0,
        reasons: ["Maximum concurrent liquidations reached"],
      };
    }

    let riskAssessment: RiskAssessment;
    let marketData: MarketData;

    if (this.config.enableAIAnalysis) {
      marketData = await this.riskEngine.fetchMarketData();
      riskAssessment = await this.riskEngine.assessPosition(position, marketData);
    } else {
      riskAssessment = {
        score: position.healthFactor < 100 ? 80 : 30,
        level: position.healthFactor < 100 ? "critical" : "low",
        factors: [],
        recommendation: position.healthFactor < 100 ? "liquidate" : "hold",
        confidence: 0.5,
      };
      marketData = {
        solPrice: 100,
        btcPrice: 40000,
        ethPrice: 2000,
        volatility: 0.05,
        volume24h: 50000000,
        priceChange24h: 0,
      };
    }

    const collateralValue = position.collateralAmount * marketData.solPrice;
    const liquidationBonus = 0.05;
    const estimatedProfit = collateralValue * liquidationBonus - position.debtAmount * 0.01;
    const profitThresholdMet = estimatedProfit > this.config.minProfitThreshold;

    const reasons: string[] = [];

    if (riskAssessment.level === "critical") {
      reasons.push(`Health factor critical: ${position.healthFactor}%`);
    }
    if (riskAssessment.level === "high" && profitThresholdMet) {
      reasons.push(`High risk but profitable ($${estimatedProfit.toFixed(2)})`);
    }
    if (riskAssessment.recommendation === "liquidate") {
      reasons.push(`AI recommendation: ${riskAssessment.recommendation}`);
    }
    if (riskAssessment.confidence > 0.8) {
      reasons.push(`High confidence: ${(riskAssessment.confidence * 100).toFixed(0)}%`);
    }
    if (!profitThresholdMet) {
      reasons.push(`Below profit threshold ($${estimatedProfit.toFixed(2)} < $${this.config.minProfitThreshold})`);
    }

    const shouldLiquidate =
      riskAssessment.recommendation === "liquidate" &&
      profitThresholdMet &&
      riskAssessment.confidence > 0.6;

    return {
      shouldLiquidate,
      confidence: riskAssessment.confidence,
      riskAssessment,
      estimatedProfit,
      reasons,
    };
  }

  async executeLiquidation(
    borrower: PublicKey,
    riskAssessment: RiskAssessment
  ): Promise<LiquidationResult> {
    const borrowerStr = borrower.toBase58();

    if (this.activeLiquidations.has(borrowerStr)) {
      return { success: false, error: "Already processing" };
    }

    this.activeLiquidations.set(borrowerStr, true);

    try {
      console.log(chalk.blue(`Executing liquidation for ${borrowerStr}`));
      console.log(chalk.gray(`Risk Score: ${riskAssessment.score}, Level: ${riskAssessment.level}`));

      const instructions: TransactionInstruction[] = [];

      instructions.push(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 })
      );
      instructions.push(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: Math.floor(Math.random() * 5000) + 1000,
        })
      );

      const liquidationInstruction = await this.createLiquidationInstruction(borrower);
      instructions.push(liquidationInstruction);

      const transaction = new Transaction().add(...instructions);

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      if (this.config.useJitoBundles) {
        console.log(chalk.yellow("Jito bundle submission not implemented in this demo"));
      }

      const signature = await sendAndConfirmTransaction(this.connection, transaction, [this.wallet], {
        commitment: "confirmed",
        maxRetries: 3,
      });

      console.log(chalk.green(`Liquidation successful! TX: ${signature}`));

      return {
        success: true,
        transactionHash: signature,
        profit: riskAssessment.estimatedProfit,
      };
    } catch (error) {
      console.error(chalk.red(`Liquidation failed: ${error}`));
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.activeLiquidations.delete(borrowerStr);
    }
  }

  private async createLiquidationInstruction(borrower: PublicKey): Promise<TransactionInstruction> {
    const [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      PROGRAM_ID
    );

    const [loanAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), borrower.toBuffer()],
      PROGRAM_ID
    );

    const instructionData = Buffer.alloc(8);
    instructionData.writeUInt32LE(6, 0);

    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: borrower, isSigner: false, isWritable: true },
        { pubkey: systemConfig, isSigner: false, isWritable: true },
        { pubkey: loanAccount, isSigner: false, isWritable: true },
        { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false },
        { pubkey: new PublicKey("ComputeBudget111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });
  }

  async scanAndLiquidate(positions: LoanPosition[]): Promise<LiquidationResult[]> {
    const results: LiquidationResult[] = [];

    console.log(chalk.blue(`Scanning ${positions.length} positions for liquidation opportunities...`));

    for (const position of positions) {
      const decision = await this.analyzeAndDecide(position);

      console.log(chalk.cyan(`\nPosition: ${position.borrower.toBase58()}`));
      console.log(chalk.gray(`  Health Factor: ${position.healthFactor}%`));
      console.log(chalk.gray(`  Debt: $${position.debtAmount}`));
      console.log(chalk.gray(`  Collateral: ${position.collateralAmount} ${position.collateralType}`));
      console.log(chalk.gray(`  Decision: ${decision.shouldLiquidate ? "LIQUIDATE" : "HOLD"}`));
      console.log(chalk.gray(`  Confidence: ${(decision.confidence * 100).toFixed(0)}%`));
      decision.reasons.forEach((reason) => console.log(chalk.gray(`    - ${reason}`)));

      if (decision.shouldLiquidate) {
        const result = await this.executeLiquidation(position.borrower, decision.riskAssessment);
        results.push(result);

        if (result.success) {
          await this.distributeRewards(result.profit || 0);
        }
      }
    }

    return results;
  }

  private async distributeRewards(profit: number): Promise<void> {
    const ownerReward = profit * OWNER_FEE;
    const agentReward = profit * AGENT_FEE;
    const protocolReward = profit * PROTOCOL_FEE;

    console.log(chalk.green(`Rewards distributed:`));
    console.log(chalk.gray(`  Owner: $${ownerReward.toFixed(2)}`));
    console.log(chalk.gray(`  Agent: $${agentReward.toFixed(2)}`));
    console.log(chalk.gray(`  Protocol: $${protocolReward.toFixed(2)}`));
  }

  getActiveCount(): number {
    return this.activeLiquidations.size;
  }

  isProcessing(borrower: PublicKey): boolean {
    return this.activeLiquidations.has(borrower.toBase58());
  }
}

export async function createSmartAgent(config: {
  rpcUrl?: string;
  privateKey?: Uint8Array;
}): Promise<SmartLiquidationAgent> {
  const rpcUrl = config.rpcUrl || process.env.RPC_URL || "https://api.devnet.solana.com";
  const privateKey = config.privateKey || new Uint8Array(JSON.parse(process.env.PRIVATE_KEY || "[]"));

  return new SmartLiquidationAgent({
    rpcUrl,
    privateKey,
    minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || "10"),
    maxConcurrentLiquidations: parseInt(process.env.MAX_CONCURRENT_LIQUIDATIONS || "3"),
    enableAIAnalysis: process.env.ENABLE_AI_ANALYSIS !== "false",
    useJitoBundles: process.env.USE_JITO_BUNDLES === "true",
  });
}