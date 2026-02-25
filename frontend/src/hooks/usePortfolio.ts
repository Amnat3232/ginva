import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Loan, PortfolioSummary } from "../types";

interface PortfolioData {
  loans: Loan[];
  summary: PortfolioSummary | null;
}

interface UsePortfolioResult {
  loading: boolean;
  error: Error | null;
  portfolio: PortfolioData | null;
  refetch: () => Promise<void>;
}

function calculateSummary(loans: Loan[]): PortfolioSummary {
  const activeLoans = loans.filter((loan) => loan.status === "active");

  const totalCollateralUsd = activeLoans.reduce(
    (sum, loan) => sum + loan.collateral_value_usd,
    0
  );

  const totalBorrowedUsd = activeLoans.reduce(
    (sum, loan) => sum + loan.borrowed_amount,
    0
  );

  const avgHealthFactor =
    activeLoans.length > 0
      ? activeLoans.reduce((sum, loan) => sum + loan.health_factor, 0) /
        activeLoans.length
      : 0;

  return {
    totalCollateralUsd,
    totalBorrowedUsd,
    totalHealthFactor: avgHealthFactor,
    activeLoans: activeLoans.length,
  };
}

export function usePortfolio(walletAddress: string): UsePortfolioResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("loans")
        .select("*")
        .eq("user_wallet", walletAddress);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const loans = (data as Loan[]) || [];
      const summary = calculateSummary(loans);

      setPortfolio({ loans, summary });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolio();
  }, [walletAddress, fetchPortfolio]);

  return {
    loading,
    error,
    portfolio,
    refetch: fetchPortfolio,
  };
}
