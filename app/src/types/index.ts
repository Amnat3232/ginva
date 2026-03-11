import { PublicKey } from "@solana/web3.js";

export interface PawnTicket {
  pubkey: PublicKey;
  account: {
    pawner: PublicKey;
    collateralMint: PublicKey;
    collateralAmount: number;
    loanAmount: number;
    interestRateBps: number;
    status: number;
    lastPaymentAt: number;
    totalInterestPaid: number;
    ticketId: number; // 🎫 Multi-Ticket: Unique ticket identifier
  };
}

export interface UserRateLimit {
  pubkey: PublicKey;
  account: {
    user: PublicKey;
    lastOperationBlock: number;
    operationsCount: number;
    windowStartTime: number;
    ticketCounter: number; // 🎫 Multi-Ticket: Next available ticket ID
  };
}

// Legacy alias for backward compatibility
export type LoanAccount = PawnTicket;

export interface AssetConfig {
  pubkey: PublicKey;
  account: {
    mint: PublicKey;
    feedId: number[];
    decimals: number;
    maxLtv: number;
    liquidationThreshold: number;
    isActive: boolean;
  };
}

export interface SystemConfig {
  pubkey: PublicKey;
  account: {
    admin: PublicKey;
    capitalWallet: PublicKey;
    opsWallet: PublicKey;
    revenueWallet: PublicKey;
    isPaused: boolean;
    totalBorrowed: number;
    totalCollateral: number;
  };
}

export type PawnTicketStatus = "Active" | "Redeemed" | "Forfeited";

// Legacy alias for backward compatibility
export type LoanStatus = PawnTicketStatus;

export const PAWN_TICKET_STATUS_LABELS: Record<number, PawnTicketStatus> = {
  0: "Active",
  1: "Redeemed",
  2: "Forfeited",
};

// Legacy alias for backward compatibility
export const LOAN_STATUS_LABELS = PAWN_TICKET_STATUS_LABELS;

export const HEALTH_FACTOR_THRESHOLD = 100;
export const LIQUIDATION_THRESHOLD = 85;

// ============================================================================
// AGENT KEEPER PROGRAM TYPES
// ============================================================================

export type AgentStatus =
  | "Active"
  | "Disabled"
  | "UnderReview"
  | "Suspended"
  | "Unregistered";

export type AgentRole = "KeeperA" | "KeeperB" | "KeeperC" | "All";

export interface AgentMetadata {
  name: string;
  description: string;
  framework: string;
  version: string;
  capabilities: string[];
  owner: PublicKey;
  contact: string;
}

export interface AgentPerformance {
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  avgResponseTimeMs: number;
  uptimePercent: number;
  lastOperationAt: number;
  totalEarnings: number;
}

export interface AgentSettings {
  maxConcurrentOps: number;
  rateLimitSeconds: number;
  minHealthFactor: number;
  maxSlippageBps: number;
  isEnabled: boolean;
  isPaused: boolean;
}

export interface AgentAccount {
  pubkey: PublicKey;
  account: {
    agentPubkey: PublicKey;
    metadata: AgentMetadata;
    status: AgentStatus;
    roles: AgentRole[];
    performance: AgentPerformance;
    settings: AgentSettings;
    usdcAccount: PublicKey;
    registeredAt: number;
    lastActiveAt: number;
    pendingRewards: number;
    version: number;
  };
}

export interface AgentRevenueDistribution {
  pubkey: PublicKey;
  account: {
    totalRevenue: number;
    humanShareAccumulated: number;
    aiShareAccumulated: number;
    safetyFundAccumulated: number;
    devFundAccumulated: number;
    lastDistributionAt: number;
    distributionCount: number;
  };
}

export interface AgentOperation {
  pubkey: PublicKey;
  account: {
    agentPubkey: PublicKey;
    loanAccount: PublicKey;
    operationType: number;
    rewardAmount: number;
    success: boolean;
    responseTimeMs: number;
    executedAt: number;
  };
}

// Agent Status Mapping
export const AGENT_STATUS_LABELS: Record<number, AgentStatus> = {
  0: "Active",
  1: "Disabled",
  2: "UnderReview",
  3: "Suspended",
  4: "Unregistered",
};

// Agent Role Mapping
export const AGENT_ROLE_LABELS: Record<number, AgentRole> = {
  0: "KeeperA",
  1: "KeeperB",
  2: "KeeperC",
  3: "All",
};

// Agent Operation Types
export const AGENT_OPERATION_TYPES = {
  LIQUIDATE: 1,
  BUY: 2,
  FINALIZE: 3,
} as const;

// Revenue Share Constants (basis points)
export const AGENT_REVENUE_SHARE = {
  HUMAN: 4500, // 45%
  AI_AGENT: 3500, // 35%
  SAFETY: 1500, // 15%
  DEV: 500, // 5%
} as const;

// Performance Thresholds
export const AGENT_PERFORMANCE_THRESHOLDS = {
  MIN_SUCCESS_RATE: 80, // 80%
  MAX_RESPONSE_TIME_MS: 5000, // 5 seconds
} as const;

// Rate Limit Constants
export const AGENT_RATE_LIMITS = {
  MIN_SECONDS: 1,
  MAX_SECONDS: 300,
  DEFAULT_SECONDS: 15,
} as const;

// ============================================================================
// APP STATE TYPES (Zustand + React Query)
// ============================================================================

/** Branded type for wallet public key to prevent string mixing */
export type WalletPubkey = string & { readonly __brand: "WalletPubkey" };

export const createWalletPubkey = (pubkey: string): WalletPubkey => {
  if (!pubkey) throw new Error("Public key is required");
  return pubkey as WalletPubkey;
};

export type TokenSymbol = "SOL" | "BTC" | "ETH" | "USDC";

export interface TokenPrice {
  symbol: TokenSymbol;
  price: number;
  change24h: number;
  lastUpdated: number;
}

export interface LoanDetails {
  id: number;
  collateralAmount: number;
  collateralSymbol: TokenSymbol;
  borrowedAmount: number;
  ltvOption: 20 | 40 | 60;
  startTime: number;
  endTime: number;
  status: "none" | "active" | "liquidating" | "liquidated" | "repaid";
  healthFactor: number;
  accruedInterest: number;
}

export interface StakingDetails {
  stakedAmount: number;
  pendingRewards: number;
  lastClaimTime: number;
  lockPeriodEnd: number;
  tier: "none" | "bronze" | "silver" | "gold";
}

export interface ProtocolConfig {
  interestRate: number;
  ltvSafe: 20;
  ltvStandard: 40;
  ltvMax: 60;
  gracePeriodSeconds: number;
  shieldFeePercent: number;
}

export interface ProtocolStats {
  totalValueLocked: number;
  totalBorrowed: number;
  totalLiquidations: number;
  activeLoans: number;
  totalStakers: number;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}
