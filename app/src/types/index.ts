import { PublicKey } from "@solana/web3.js";

export interface LoanAccount {
  pubkey: PublicKey;
  account: {
    borrower: PublicKey;
    collateralMint: PublicKey;
    collateralAmount: number;
    loanAmount: number;
    interestRateBps: number;
    status: number;
    lastPaymentAt: number;
    totalInterestPaid: number;
  };
}

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

export type LoanStatus = "Active" | "Repaid" | "Liquidated";

export const LOAN_STATUS_LABELS: Record<number, LoanStatus> = {
  0: "Active",
  1: "Repaid",
  2: "Liquidated",
};

export const HEALTH_FACTOR_THRESHOLD = 100;
export const LIQUIDATION_THRESHOLD = 85;
