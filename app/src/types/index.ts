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
