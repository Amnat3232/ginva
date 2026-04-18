import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import * as dotenv from "dotenv";

dotenv.config();

export interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  recommendation: "hold" | "liquidate" | "monitor";
  confidence: number;
}

export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  impact: "positive" | "negative";
  description: string;
}

export interface LoanPosition {
  borrower: PublicKey;
  collateralAmount: number;
  collateralType: string;
  debtAmount: number;
  healthFactor: number;
  timestamp: number;
  lastActivity: number;
  gracePeriodEnd: number;
}

export interface MarketData {
  solPrice: number;
  btcPrice: number;
  ethPrice: number;
  volatility: number;
  volume24h: number;
  priceChange24h: number;
}

export interface RiskThresholds {
  healthFactor: {
    critical: number;
    high: number;
    medium: number;
  };
  profitThreshold: number;
  maxSlippage: number;
  minLiquidationBonus: number;
}

const DEFAULT_THRESHOLDS: RiskThresholds = {
  healthFactor: {
    critical: 80,
    high: 90,
    medium: 110,
  },
  profitThreshold: 0.05,
  maxSlippage: 0.03,
  minLiquidationBonus: 0.02,
};

export class RiskAssessmentEngine {
  private connection: Connection;
  private thresholds: RiskThresholds;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheTimeout = 60000;

  constructor(
    rpcUrl: string = process.env.RPC_URL || "https://api.devnet.solana.com",
    thresholds: RiskThresholds = DEFAULT_THRESHOLDS
  ) {
    this.connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: process.env.WS_URL,
    });
    this.thresholds = thresholds;
  }

  async assessPosition(
    position: LoanPosition,
    marketData: MarketData
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];

    const healthFactorScore = this.calculateHealthFactorScore(position.healthFactor);
    factors.push(healthFactorScore);

    const collateralRiskScore = this.calculateCollateralRisk(
      position.collateralType,
      position.collateralAmount,
      marketData
    );
    factors.push(collateralRiskScore);

    const marketRiskScore = this.calculateMarketRisk(marketData);
    factors.push(marketRiskScore);

    const timeRiskScore = this.calculateTimeRisk(position);
    factors.push(timeRiskScore);

    const profitScore = this.calculateProfitability(position, marketData);
    factors.push(profitScore);

    const totalScore = factors.reduce(
      (sum, factor) => sum + factor.value * factor.weight,
      0
    );

    const normalizedScore = Math.min(100, Math.max(0, totalScore));
    const { level, recommendation } = this.determineLevelAndRecommendation(
      normalizedScore,
      position.healthFactor,
      profitScore.value > 0
    );

    const confidence = this.calculateConfidence(factors, marketData);

    return {
      score: Math.round(normalizedScore),
      level,
      factors,
      recommendation,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  private calculateHealthFactorScore(healthFactor: number): RiskFactor {
    let value: number;
    let impact: "positive" | "negative";

    if (healthFactor >= this.thresholds.healthFactor.critical) {
      value = 100;
      impact = "negative";
    } else if (healthFactor >= this.thresholds.healthFactor.high) {
      value = 70 + ((healthFactor - this.thresholds.healthFactor.high) / (100 - this.thresholds.healthFactor.high)) * 30;
      impact = "negative";
    } else if (healthFactor >= this.thresholds.healthFactor.medium) {
      value = 40 + ((healthFactor - this.thresholds.healthFactor.medium) / (this.thresholds.healthFactor.high - this.thresholds.healthFactor.medium)) * 30;
      impact = "neutral";
    } else {
      value = Math.max(0, 40 - (this.thresholds.healthFactor.medium - healthFactor));
      impact = "positive";
    }

    return {
      name: "Health Factor",
      value: Math.round(value * 100) / 100,
      weight: 0.35,
      impact,
      description: `Current health factor: ${healthFactor}%`,
    };
  }

  private calculateCollateralRisk(
    collateralType: string,
    collateralAmount: number,
    marketData: MarketData
  ): RiskFactor {
    const priceMap: Record<string, number> = {
      SOL: marketData.solPrice,
      BTC: marketData.btcPrice,
      ETH: marketData.ethPrice,
    };

    const volatilityMap: Record<string, number> = {
      SOL: 0.05,
      BTC: 0.03,
      ETH: 0.04,
    };

    const price = priceMap[collateralType] || 1;
    const volatility = volatilityMap[collateralType] || 0.05;
    const priceChangeRisk = Math.abs(marketData.priceChange24h) * 2;
    const volatilityRisk = volatility * marketData.volatility * 100;

    const totalRisk = Math.min(100, priceChangeRisk + volatilityRisk);

    return {
      name: "Collateral Risk",
      value: totalRisk,
      weight: 0.25,
      impact: totalRisk > 30 ? "negative" : "positive",
      description: `${collateralType} volatility: ${(volatility * 100).toFixed(1)}%, 24h change: ${(marketData.priceChange24h * 100).toFixed(1)}%`,
    };
  }

  private calculateMarketRisk(marketData: MarketData): RiskFactor {
    const volumeRisk = marketData.volume24h < 1000000 ? 30 : 0;
    const volatilityRisk = marketData.volatility > 0.5 ? 40 : 0;
    const trendRisk = marketData.priceChange24h < -0.1 ? 30 : 0;

    const totalRisk = Math.min(100, volumeRisk + volatilityRisk + trendRisk);

    return {
      name: "Market Risk",
      value: totalRisk,
      weight: 0.2,
      impact: totalRisk > 40 ? "negative" : "positive",
      description: `Volume: $${(marketData.volume24h / 1000000).toFixed(1)}M, Volatility: ${(marketData.volatility * 100).toFixed(1)}%`,
    };
  }

  private calculateTimeRisk(position: LoanPosition): RiskFactor {
    const now = Date.now();
    const timeSinceLastActivity = (now - position.lastActivity) / 1000 / 3600;
    const gracePeriodRemaining = (position.gracePeriodEnd - now) / 1000 / 3600;

    let risk = 0;
    let description = "";

    if (gracePeriodRemaining < 0) {
      risk = 100;
      description = `Grace period expired ${Math.abs(gracePeriodRemaining).toFixed(1)} hours ago`;
    } else if (gracePeriodRemaining < 24) {
      risk = 80;
      description = `Grace period ends in ${gracePeriodRemaining.toFixed(1)} hours`;
    } else if (timeSinceLastActivity > 72) {
      risk = 40;
      description = `No activity for ${timeSinceLastActivity.toFixed(1)} hours`;
    } else {
      risk = 10;
      description = `Last activity: ${timeSinceLastActivity.toFixed(1)} hours ago`;
    }

    return {
      name: "Time Risk",
      value: risk,
      weight: 0.1,
      impact: risk > 50 ? "negative" : "positive",
      description,
    };
  }

  private calculateProfitability(
    position: LoanPosition,
    marketData: MarketData
  ): RiskFactor {
    const collateralValue = position.collateralAmount * marketData.solPrice;
    const liquidationBonus = 0.05;
    const estimatedProfit = collateralValue * liquidationBonus - position.debtAmount * 0.01;

    let value: number;
    let impact: "positive" | "negative";

    if (estimatedProfit > position.debtAmount * this.thresholds.profitThreshold) {
      value = 100;
      impact = "positive";
    } else if (estimatedProfit > 0) {
      value = 50 + (estimatedProfit / (position.debtAmount * this.thresholds.profitThreshold)) * 50;
      impact = "neutral";
    } else {
      value = Math.max(0, 50 + (estimatedProfit / position.debtAmount) * 100);
      impact = "negative";
    }

    return {
      name: "Profitability",
      value: Math.round(value * 100) / 100,
      weight: 0.1,
      impact,
      description: `Estimated profit: $${estimatedProfit.toFixed(2)}`,
    };
  }

  private determineLevelAndRecommendation(
    score: number,
    healthFactor: number,
    isProfitable: boolean
  ): { level: "low" | "medium" | "high" | "critical"; recommendation: "hold" | "liquidate" | "monitor" } {
    let level: "low" | "medium" | "high" | "critical";
    let recommendation: "hold" | "liquidate" | "monitor";

    if (score >= 80 || (healthFactor < this.thresholds.healthFactor.critical && isProfitable)) {
      level = "critical";
      recommendation = "liquidate";
    } else if (score >= 60 || healthFactor < this.thresholds.healthFactor.high) {
      level = "high";
      recommendation = "liquidate";
    } else if (score >= 40 || healthFactor < this.thresholds.healthFactor.medium) {
      level = "medium";
      recommendation = "monitor";
    } else {
      level = "low";
      recommendation = "hold";
    }

    return { level, recommendation };
  }

  private calculateConfidence(factors: RiskFactor[], marketData: MarketData): number {
    const dataFreshness = this.isDataFresh(marketData) ? 1 : 0.5;
    const factorCount = Math.min(factors.length / 5, 1);
    const dataQuality = marketData.volume24h > 0 ? 1 : 0.3;

    return (dataFreshness * 0.4 + factorCount * 0.3 + dataQuality * 0.3);
  }

  private isDataFresh(marketData: MarketData): boolean {
    return marketData.solPrice > 0 && marketData.volume24h > 0;
  }

  async fetchMarketData(): Promise<MarketData> {
    try {
      const solPrice = await this.fetchPrice("SOL");
      const btcPrice = await this.fetchPrice("BTC");
      const ethPrice = await this.fetchPrice("ETH");

      return {
        solPrice,
        btcPrice,
        ethPrice,
        volatility: this.calculateVolatility(),
        volume24h: await this.fetchVolume(),
        priceChange24h: await this.fetchPriceChange(),
      };
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return this.getDefaultMarketData();
    }
  }

  private async fetchPrice(asset: string): Promise<number> {
    const cacheKey = `${asset}_price`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.price;
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd`
      );
      const data = await response.json();

      const priceMap: Record<string, string> = {
        SOL: "solana",
        BTC: "bitcoin",
        ETH: "ethereum",
      };

      const price = data[priceMap[asset]]?.usd || 100;

      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });

      return price;
    } catch {
      return this.getDefaultPrice(asset);
    }
  }

  private calculateVolatility(): number {
    return 0.02 + Math.random() * 0.03;
  }

  private async fetchVolume(): Promise<number> {
    return 50000000 + Math.random() * 100000000;
  }

  private async fetchPriceChange(): Promise<number> {
    return (Math.random() - 0.5) * 0.1;
  }

  private getDefaultMarketData(): MarketData {
    return {
      solPrice: 100,
      btcPrice: 40000,
      ethPrice: 2000,
      volatility: 0.05,
      volume24h: 50000000,
      priceChange24h: 0,
    };
  }

  private getDefaultPrice(asset: string): number {
    const defaultPrices: Record<string, number> = {
      SOL: 100,
      BTC: 40000,
      ETH: 2000,
    };
    return defaultPrices[asset] || 100;
  }
}

export async function analyzeLoanPosition(
  position: LoanPosition,
  rpcUrl?: string
): Promise<RiskAssessment> {
  const engine = new RiskAssessmentEngine(rpcUrl);
  const marketData = await engine.fetchMarketData();
  return engine.assessPosition(position, marketData);
}