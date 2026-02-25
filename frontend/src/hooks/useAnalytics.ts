import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { DashboardStats, Loan } from "../types";

interface UseAnalyticsResult {
  loading: boolean;
  error: Error | null;
  stats: DashboardStats | null;
  historicalData: { date: string; tvl: number; loans: number }[];
  topCollateral: { type: string; percentage: number }[];
  refetch: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [historicalData, setHistoricalData] = useState<
    { date: string; tvl: number; loans: number }[]
  >([]);
  const [topCollateral, setTopCollateral] = useState<
    { type: string; percentage: number }[]
  >([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*");

      if (loansError) {
        throw new Error(loansError.message);
      }

      const loans = (loansData as Loan[]) || [];
      const activeLoans = loans.filter((loan) => loan.status === "active");

      const totalCollateral = activeLoans.reduce(
        (sum, loan) => sum + loan.collateral_value_usd,
        0
      );
      const totalBorrowed = activeLoans.reduce(
        (sum, loan) => sum + loan.borrowed_amount,
        0
      );

      const uniqueBorrowers = new Set(
        activeLoans.map((loan) => loan.user_wallet)
      );

      setStats({
        tvl: totalCollateral,
        activeLoans: activeLoans.length,
        totalBorrowers: uniqueBorrowers.size,
        supporterApy: 8.5,
      });

      const mockHistorical = [
        { date: "2024-01", tvl: 125000, loans: 45 },
        { date: "2024-02", tvl: 180000, loans: 62 },
        { date: "2024-03", tvl: 245000, loans: 89 },
      ];
      setHistoricalData(mockHistorical);

      const collateralTypes: Record<string, number> = {};
      activeLoans.forEach((loan) => {
        collateralTypes[loan.collateral_type] =
          (collateralTypes[loan.collateral_type] || 0) +
          loan.collateral_value_usd;
      });

      const collateralPercentages = Object.entries(collateralTypes).map(
        ([type, value]) => ({
          type,
          percentage: totalCollateral > 0 ? (value / totalCollateral) * 100 : 0,
        })
      );

      setTopCollateral(collateralPercentages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    loading,
    error,
    stats,
    historicalData,
    topCollateral,
    refetch: fetchAnalytics,
  };
}
