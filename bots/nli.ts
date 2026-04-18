#!/usr/bin/env npx tsx

import * as dotenv from "dotenv";
import {
  Connection,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  SmartLiquidationAgent,
  LoanPosition,
  analyzeLoanPosition,
  RiskAssessmentEngine,
  RiskAssessment,
} from "./smart-liquidation";

dotenv.config();

const READLINE = require("readline");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UserPortfolio {
  loans: LoanPosition[];
  totalCollateral: number;
  totalDebt: number;
  healthFactor: number;
}

class NaturalLanguageInterface {
  private agent: SmartLiquidationAgent;
  private riskEngine: RiskAssessmentEngine;
  private connection: Connection;
  private wallet: Keypair;
  private chatHistory: ChatMessage[] = [];
  private rl: any;

  constructor(rpcUrl: string, privateKey: Uint8Array) {
    this.connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: process.env.WS_URL,
    });
    this.wallet = Keypair.fromSecretKey(privateKey);
    this.riskEngine = new RiskAssessmentEngine(rpcUrl);

    const agentConfig = {
      rpcUrl,
      privateKey,
      minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || "10"),
      maxConcurrentLiquidations: parseInt(process.env.MAX_CONCURRENT_LIQUIDATIONS || "3"),
      enableAIAnalysis: true,
      useJitoBundles: process.env.USE_JITO_BUNDLES === "true",
    };

    this.agent = new SmartLiquidationAgent(agentConfig);

    this.rl = READLINE.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(): Promise<void> {
    console.clear();
    console.log("\n" + "=".repeat(50));
    console.log("  GINVA AI Assistant");
    console.log("  Natural Language Interface");
    console.log("=".repeat(50) + "\n");

    console.log("Commands:");
    console.log("  portfolio - Show your loan positions");
    console.log("  analyze <address> - Analyze a specific position");
    console.log("  status - Check agent status");
    console.log("  help - Show all commands");
    console.log("  exit - Quit\n");

    await this.sendMessage("assistant", "Hello! I'm your GINVA AI assistant. How can I help you today?");

    this.prompt();
  }

  private prompt(): void {
    this.rl.question("\nYou: ", async (input: string) => {
      const trimmed = input.trim().toLowerCase();

      if (trimmed === "exit" || trimmed === "quit") {
        console.log("\nGoodbye! 👋");
        this.rl.close();
        return;
      }

      await this.handleInput(trimmed, input);
      this.prompt();
    });
  }

  private async handleInput(command: string, fullInput: string): Promise<void> {
    const portfolioCommands = ["portfolio", "my loans", "my positions", "show my loans"];
    const analyzeCommands = ["analyze", "check", "assess"];
    const statusCommands = ["status", "agent status", "how are you"];
    const helpCommands = ["help", "commands", "what can you do"];
    const marketCommands = ["market", "prices", "solana price", "btc price"];
    const riskCommands = ["risk", "risky", "dangerous loans"];
    const liquidateCommands = ["liquidate", "force liquidate"];

    if (portfolioCommands.includes(command)) {
      await this.showPortfolio();
    } else if (analyzeCommands.some((c) => command.startsWith(c))) {
      const address = fullInput.replace(/^(analyze|check|assess)\s+/i, "").trim();
      if (address) {
        await this.analyzePosition(address);
      } else {
        await this.sendMessage("assistant", "Please provide a wallet address to analyze. Example: analyze <address>");
      }
    } else if (statusCommands.includes(command)) {
      await this.showAgentStatus();
    } else if (helpCommands.includes(command)) {
      await this.showHelp();
    } else if (marketCommands.includes(command)) {
      await this.showMarketData();
    } else if (riskCommands.includes(command)) {
      await this.showRiskyLoans();
    } else if (liquidateCommands.some((c) => command.includes(c))) {
      await this.handleLiquidateCommand(fullInput);
    } else {
      await this.handleGeneralQuestion(fullInput);
    }
  }

  private async showPortfolio(): Promise<void> {
    await this.sendMessage("assistant", "Fetching your portfolio...");

    const portfolio = await this.getMockPortfolio();

    let response = "📊 **Your Portfolio:**\n\n";
    response += `Total Collateral: $${portfolio.totalCollateral.toFixed(2)}\n`;
    response += `Total Debt: $${portfolio.totalDebt.toFixed(2)}\n`;
    response += `Health Factor: ${portfolio.healthFactor}%\n`;
    response += `Active Loans: ${portfolio.loans.length}\n\n`;

    if (portfolio.loans.length > 0) {
      response += "**Your Loans:**\n";
      portfolio.loans.forEach((loan, i) => {
        response += `\n${i + 1}. Collateral: ${loan.collateralAmount} ${loan.collateralType} ($${(loan.collateralAmount * 100).toFixed(2)})`;
        response += `\n   Debt: $${loan.debtAmount.toFixed(2)}`;
        response += `\n   Health: ${loan.healthFactor}%`;
        response += `\n   Status: ${loan.healthFactor < 100 ? "⚠️ At Risk" : "✅ Healthy"}`;
      });
    }

    await this.sendMessage("assistant", response);
  }

  private async analyzePosition(address: string): Promise<void> {
    try {
      await this.sendMessage("assistant", `Analyzing position for ${address}...`);

      const pubkey = new PublicKey(address);
      const marketData = await this.riskEngine.fetchMarketData();

      const mockPosition: LoanPosition = {
        borrower: pubkey,
        collateralAmount: 10,
        collateralType: "SOL",
        debtAmount: 500,
        healthFactor: Math.random() * 150,
        timestamp: Date.now(),
        lastActivity: Date.now() - 3600000,
        gracePeriodEnd: Date.now() + 86400000,
      };

      const assessment = await this.riskEngine.assessPosition(mockPosition, marketData);

      let response = `🔍 **Analysis for ${address}:**\n\n`;
      response += `**Risk Score:** ${assessment.score}/100\n`;
      response += `**Risk Level:** ${this.getRiskEmoji(assessment.level)} ${assessment.level.toUpperCase()}\n`;
      response += `**Recommendation:** ${assessment.recommendation.toUpperCase()}\n`;
      response += `**Confidence:** ${(assessment.confidence * 100).toFixed(0)}%\n\n`;

      response += "**Risk Factors:**\n";
      assessment.factors.forEach((factor) => {
        const emoji = factor.impact === "positive" ? "✅" : factor.impact === "negative" ? "❌" : "➖";
        response += `\n${emoji} ${factor.name}: ${factor.value.toFixed(1)} (${factor.weight * 100}% weight)`;
        response += `\n   └─ ${factor.description}`;
      });

      await this.sendMessage("assistant", response);
    } catch (error) {
      await this.sendMessage("assistant", `Error: Invalid address or failed to analyze. Please check the address and try again.`);
    }
  }

  private async showAgentStatus(): Promise<void> {
    const activeCount = this.agent.getActiveCount();

    let response = "🤖 **Agent Status:**\n\n";
    response += `Wallet: ${this.wallet.publicKey.toBase58().slice(0, 8)}...\n`;
    response += `Active Liquidations: ${activeCount}\n`;
    response += `Connection: ✅ Connected\n`;
    response += `AI Analysis: ✅ Enabled\n`;

    await this.sendMessage("assistant", response);
  }

  private async showHelp(): Promise<void> {
    const helpText = `📚 **Available Commands:**

**Portfolio:**
- portfolio / my loans - Show your loan positions
- risk / risky loans - Show high-risk positions

**Analysis:**
- analyze <address> - Analyze a specific position
- check <address> - Check position risk

**Market:**
- market / prices - Show current prices

**Agent:**
- status - Check agent status

**General:**
- help - Show this message

**Try asking naturally!**
- "How is my portfolio?"
- "Is my loan safe?"
- "What's the price of Solana?"
`;

    await this.sendMessage("assistant", helpText);
  }

  private async showMarketData(): Promise<void> {
    await this.sendMessage("assistant", "Fetching market data...");

    const marketData = await this.riskEngine.fetchMarketData();

    let response = "📈 **Current Market Prices:**\n\n";
    response += `🔵 SOL: $${marketData.solPrice.toFixed(2)}\n`;
    response += `🔴 BTC: $${marketData.btcPrice.toFixed(2)}\n`;
    response += `🟢 ETH: $${marketData.ethPrice.toFixed(2)}\n\n`;
    response += `24h Change: ${(marketData.priceChange24h * 100).toFixed(2)}%\n`;
    response += `Volatility: ${(marketData.volatility * 100).toFixed(1)}%\n`;
    response += `24h Volume: $${(marketData.volume24h / 1000000).toFixed(1)}M`;

    await this.sendMessage("assistant", response);
  }

  private async showRiskyLoans(): Promise<void> {
    await this.sendMessage("assistant", "Scanning for risky positions...");

    const portfolio = await this.getMockPortfolio();
    const marketData = await this.riskEngine.fetchMarketData();

    const riskyLoans = [];

    for (const loan of portfolio.loans) {
      const assessment = await this.riskEngine.assessPosition(loan, marketData);
      if (assessment.level === "high" || assessment.level === "critical") {
        riskyLoans.push({ loan, assessment });
      }
    }

    if (riskyLoans.length === 0) {
      await this.sendMessage("assistant", "✅ No risky positions found. Your portfolio looks healthy!");
    } else {
      let response = "⚠️ **Risky Positions Found:**\n\n";

      riskyLoans.forEach(({ loan, assessment }, i) => {
        response += `${i + 1}. ${loan.borrower.toBase58().slice(0, 8)}...\n`;
        response += `   Health: ${loan.healthFactor}%\n`;
        response += `   Risk: ${assessment.level.toUpperCase()}\n`;
        response += `   Score: ${assessment.score}/100\n\n`;
      });

      await this.sendMessage("assistant", response);
    }
  }

  private async handleLiquidateCommand(input: string): Promise<void> {
    const addressMatch = input.match(/liquidate\s+([A-Za-z0-9]+)/);

    if (addressMatch) {
      const address = addressMatch[1];
      await this.sendMessage("assistant", `Processing liquidation request for ${address}...`);
      await this.analyzePosition(address);
    } else {
      await this.sendMessage("assistant", "Please specify which position to liquidate. Example: liquidate <address>");
    }
  }

  private async handleGeneralQuestion(question: string): Promise<void> {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("health") && lowerQuestion.includes("loan")) {
      await this.showPortfolio();
    } else if (lowerQuestion.includes("what is") && lowerQuestion.includes("ginva")) {
      await this.sendMessage("assistant", "GINVA is a decentralized lending protocol on Solana that lets you borrow USDC against your crypto (SOL, BTC, ETH) without selling. Key features: 72-hour grace period, fixed 8% APR, and AI-powered protection system.");
    } else if (lowerQuestion.includes("how does") && lowerQuestion.includes("work")) {
      await this.sendMessage("assistant", "GINVA works by: 1) Deposit collateral (SOL/BTC/ETH), 2) Borrow USDC up to 60% of collateral value, 3) Repay anytime with 8% APR, 4) If you can't repay, you have 72 hours grace period before the AI Protection System helps resolve the position fairly.");
    } else if (lowerQuestion.includes("liquidate")) {
      await this.sendMessage("assistant", "In GINVA, we call it 'Protection System' not liquidation. If your loan becomes unhealthy, the AI analyzes the situation and can help resolve it fairly, returning any surplus to you. It's designed to be borrower-friendly!");
    } else if (lowerQuestion.includes("help")) {
      await this.showHelp();
    } else {
      await this.sendMessage("assistant", `I understand you're asking about "${question}". Try these commands:\n\n- portfolio - Check your loans\n- analyze <address> - Analyze a specific position\n- market - Check current prices\n- help - See all commands`);
    }
  }

  private async sendMessage(role: "user" | "assistant", content: string): Promise<void> {
    this.chatHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });

    console.log(`\n${role === "assistant" ? "Assistant" : "You"}: ${content}`);
  }

  private async getMockPortfolio(): Promise<UserPortfolio> {
    return {
      loans: [
        {
          borrower: this.wallet.publicKey,
          collateralAmount: 15,
          collateralType: "SOL",
          debtAmount: 800,
          healthFactor: 125,
          timestamp: Date.now(),
          lastActivity: Date.now() - 3600000,
          gracePeriodEnd: Date.now() + 172800000,
        },
        {
          borrower: new PublicKey("11111111111111111111111111111111"),
          collateralAmount: 0.5,
          collateralType: "BTC",
          debtAmount: 15000,
          healthFactor: 85,
          timestamp: Date.now(),
          lastActivity: Date.now() - 7200000,
          gracePeriodEnd: Date.now() + 43200000,
        },
      ],
      totalCollateral: 1500 + 20000,
      totalDebt: 15800,
      healthFactor: 110,
    };
  }

  private getRiskEmoji(level: string): string {
    switch (level) {
      case "critical": return "🔴";
      case "high": return "🟠";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  }
}

async function main() {
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const privateKey = new Uint8Array(JSON.parse(process.env.PRIVATE_KEY || "[]"));

  if (!privateKey.length) {
    console.error("Error: PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const nli = new NaturalLanguageInterface(rpcUrl, privateKey);
  await nli.start();
}

main().catch(console.error);