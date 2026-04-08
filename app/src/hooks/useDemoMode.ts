import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

export interface DemoLoan {
  id: string;
  collateralAmount: number;
  collateralToken: string;
  borrowedAmount: number;
  loanToken: string;
  ltv: number;
  startTime: number;
  dueTime: number;
  status: "active" | "liquidatable" | "repaid" | "liquidated";
}

export interface DemoUserState {
  collateralBalance: number;
  loanBalance: number;
  loans: DemoLoan[];
  totalCollateral: number;
  totalBorrowed: number;
}

const INITIAL_USER_STATE: DemoUserState = {
  collateralBalance: 10, // 10 SOL
  loanBalance: 0,
  loans: [],
  totalCollateral: 0,
  totalBorrowed: 0,
};

const COLLATERAL_TOKEN_PRICES: Record<string, number> = {
  SOL: 175,
  JUP: 0.85,
  BTC: 65000,
  ETH: 3200,
};

const LOAN_TOKEN_PRICES: Record<string, number> = {
  USDC: 1,
};

const LTV_OPTIONS_MAP: Record<number, number> = {
  1: 0.2, // Safe 20%
  2: 0.4, // Standard 40%
  3: 0.6, // Max 60%
};

const PROTECTION_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
const DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export const useDemoMode = () => {
  const { publicKey } = useWallet();
  const [userState, setUserState] = useState<DemoUserState>(INITIAL_USER_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedDays, setSimulatedDays] = useState(0);

  // Time skip function to simulate days passing
  const skipDays = useCallback((days: number) => {
    setSimulatedDays((prev) => prev + days);

    setUserState((prev) => ({
      ...prev,
      loans: prev.loans.map((loan) => {
        if (loan.status !== "active" && loan.status !== "liquidatable")
          return loan;

        const newDueTime = loan.dueTime - days * 24 * 60 * 60;
        if (newDueTime < Math.floor(Date.now() / 1000)) {
          return {
            ...loan,
            status: "liquidatable" as const,
            dueTime: newDueTime,
          };
        }
        return { ...loan, dueTime: newDueTime };
      }),
    }));
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulatedDays(0);
  }, []);

  // Update loan statuses based on time
  useEffect(() => {
    if (userState.loans.length === 0) return;

    const now = Math.floor(Date.now() / 1000);
    setUserState((prev) => ({
      ...prev,
      loans: prev.loans.map((loan) => {
        if (loan.status !== "active") return loan;
        if (now > loan.dueTime)
          return { ...loan, status: "liquidatable" as const };
        if (now > loan.dueTime - PROTECTION_PERIOD) {
          return { ...loan, status: "liquidatable" as const };
        }
        return loan;
      }),
    }));
  }, [userState.loans.length]);

  const depositCollateral = useCallback(
    async (amount: number, token: string) => {
      if (!publicKey) {
        setError("Please connect wallet first");
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUserState((prev) => ({
        ...prev,
        collateralBalance: prev.collateralBalance + amount,
      }));

      const tx = `demo_${Date.now()}_deposit`;
      setLastTx(tx);
      setIsLoading(false);
      return tx;
    },
    [publicKey]
  );

  const borrow = useCallback(
    async (
      collateralAmount: number,
      ltvOption: number,
      collateralToken: string
    ) => {
      if (!publicKey) {
        setError("Please connect wallet first");
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const ltv = LTV_OPTIONS_MAP[ltvOption] || 0.4;
      const collateralValueUSD =
        collateralAmount * COLLATERAL_TOKEN_PRICES[collateralToken];
      const borrowAmount = collateralValueUSD * ltv;

      const now = Math.floor(Date.now() / 1000);
      const newLoan: DemoLoan = {
        id: `loan_${Date.now()}`,
        collateralAmount,
        collateralToken,
        borrowedAmount: borrowAmount,
        loanToken: "USDC",
        ltv: ltv * 100,
        startTime: now,
        dueTime: now + DURATION,
        status: "active",
      };

      setUserState((prev) => ({
        ...prev,
        collateralBalance: prev.collateralBalance - collateralAmount,
        loanBalance: prev.loanBalance + borrowAmount,
        loans: [...prev.loans, newLoan],
        totalCollateral:
          prev.totalCollateral +
          collateralAmount * COLLATERAL_TOKEN_PRICES[collateralToken],
        totalBorrowed: prev.totalBorrowed + borrowAmount,
      }));

      const tx = `demo_${Date.now()}_borrow`;
      setLastTx(tx);
      setIsLoading(false);
      return tx;
    },
    [publicKey]
  );

  const repay = useCallback(
    async (loanId: string) => {
      if (!publicKey) {
        setError("Please connect wallet first");
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const loan = userState.loans.find((l) => l.id === loanId);
      if (!loan) {
        setError("Loan not found");
        setIsLoading(false);
        return null;
      }

      // Calculate interest (simple 5% APR)
      const daysElapsed =
        (Math.floor(Date.now() / 1000) - loan.startTime) / (24 * 60 * 60);
      const interest = loan.borrowedAmount * 0.05 * (daysElapsed / 365);
      const totalRepay = loan.borrowedAmount + interest;

      setUserState((prev) => ({
        ...prev,
        collateralBalance: prev.collateralBalance + loan.collateralAmount,
        loanBalance: prev.loanBalance - loan.borrowedAmount,
        loans: prev.loans.map((l) =>
          l.id === loanId ? { ...l, status: "repaid" as const } : l
        ),
        totalCollateral:
          prev.totalCollateral -
          loan.collateralAmount * COLLATERAL_TOKEN_PRICES[loan.collateralToken],
        totalBorrowed: prev.totalBorrowed - loan.borrowedAmount,
      }));

      const tx = `demo_${Date.now()}_repay`;
      setLastTx(tx);
      setIsLoading(false);
      return tx;
    },
    [publicKey, userState.loans]
  );

  const extendLoan = useCallback(
    async (loanId: string) => {
      if (!publicKey) {
        setError("Please connect wallet first");
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUserState((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                dueTime: l.dueTime + 15 * 24 * 60 * 60,
                status: "active" as const,
              }
            : l
        ),
      }));

      const tx = `demo_${Date.now()}_extend`;
      setLastTx(tx);
      setIsLoading(false);
      return tx;
    },
    [publicKey]
  );

  const liquidate = useCallback(
    async (loanId: string) => {
      if (!publicKey) {
        setError("Please connect wallet first");
        return null;
      }

      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const loan = userState.loans.find((l) => l.id === loanId);
      if (!loan) {
        setError("Loan not found");
        setIsLoading(false);
        return null;
      }

      // Keeper gets 10% discount
      const liquidationPrice = loan.borrowedAmount * 0.9;
      const collateralValue =
        loan.collateralAmount * COLLATERAL_TOKEN_PRICES[loan.collateralToken];
      const keeperProfit = collateralValue - liquidationPrice;

      setUserState((prev) => ({
        ...prev,
        loanBalance: prev.loanBalance - loan.borrowedAmount,
        loans: prev.loans.map((l) =>
          l.id === loanId ? { ...l, status: "liquidated" as const } : l
        ),
        totalCollateral:
          prev.totalCollateral -
          loan.collateralAmount * COLLATERAL_TOKEN_PRICES[loan.collateralToken],
        totalBorrowed: prev.totalBorrowed - loan.borrowedAmount,
      }));

      const tx = `demo_${Date.now()}_liquidate`;
      setLastTx(tx);
      setIsLoading(false);
      return tx;
    },
    [publicKey, userState.loans]
  );

  const reset = useCallback(() => {
    setUserState(INITIAL_USER_STATE);
    setLastTx(null);
    setError(null);
  }, []);

  return {
    // State
    userState,
    isLoading,
    lastTx,
    error,
    simulatedDays,

    // Methods
    depositCollateral,
    borrow,
    repay,
    extendLoan,
    liquidate,
    reset,
    skipDays,
    resetSimulation,
    clearError: () => setError(null),
    clearTx: () => setLastTx(null),

    // Helpers
    getActiveLoans: () => userState.loans.filter((l) => l.status === "active"),
    getLiquidatableLoans: () =>
      userState.loans.filter((l) => l.status === "liquidatable"),
    getTotalHealth: () => {
      if (userState.totalCollateral === 0) return 100;
      return (
        ((userState.totalCollateral - userState.totalBorrowed) /
          userState.totalCollateral) *
        100
      );
    },
  };
};
