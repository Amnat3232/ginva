export type CollateralType = "SOL" | "BTC" | "ETH";

export type LoanStatus = "active" | "liquidated" | "repaid" | "seized";

export interface Loan {
  id: string;
  user_wallet: string;
  collateral_type: CollateralType;
  collateral_amount: number;
  collateral_value_usd: number;
  borrowed_amount: number;
  interest_rate: number;
  start_time: number;
  maturity_time: number;
  health_factor: number;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: "health_factor" | "maturity" | "liquidation";
  threshold?: number;
  enabled: boolean;
  created_at: string;
}

export interface PortfolioSummary {
  totalCollateralUsd: number;
  totalBorrowedUsd: number;
  totalHealthFactor: number;
  activeLoans: number;
}

export interface DashboardStats {
  tvl: number;
  activeLoans: number;
  totalBorrowers: number;
  supporterApy: number;
}
