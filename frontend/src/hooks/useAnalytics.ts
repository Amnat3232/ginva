import { useState, useEffect, useCallback } from "react";
import type { DashboardStats } from "../types";

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
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        // Use mock data if Supabase is not configured
        console.log("Supabase not configured, using mock analytics data");

        // Mock data based on real protocol metrics
        setStats({
          tvl: 12845620, // Match the value in LandingNew.tsx
          activeLoans: 47,
          totalBorrowers: 1847,
          supporterApy: 8.5,
        });

        const mockHistorical = [
          { date: "2024-01", tvl: 125000, loans: 45 },
          { date: "2024-02", tvl: 180000, loans: 62 },
          { date: "2024-03", tvl: 245000, loans: 89 },
        ];
        setHistoricalData(mockHistorical);

        const mockCollateral = [
          { type: "SOL", percentage: 65.2 },
          { type: "BTC", percentage: 22.8 },
          { type: "ETH", percentage: 12.0 },
        ];
        setTopCollateral(mockCollateral);

        setLoading(false);
        return;
      }

      // Dynamic import supabase only if URL is configured
      const { supabase } = await import("../lib/supabase");

      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*");

      if (loansError) {
        throw new Error(loansError.message);
      }

      const loans = (loansData as any[]) || [];
      const activeLoans = loans.filter((loan) => loan.status === "active");

      const totalCollateral = activeLoans.reduce(
        (sum, loan) => sum + (loan.collateral_value_usd || 0),
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

      // Mock historical data (could be replaced with real data from DB)
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
          (loan.collateral_value_usd || 0);
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
      // Also provide mock data on error
      setStats({
        tvl: 12845620,
        activeLoans: 47,
        totalBorrowers: 1847,
        supporterApy: 8.5,
      });
      setHistoricalData([
        { date: "2024-01", tvl: 125000, loans: 45 },
        { date: "2024-02", tvl: 180000, loans: 62 },
        { date: "2024-03", tvl: 245000, loans: 89 },
      ]);
      setTopCollateral([
        { type: "SOL", percentage: 65.2 },
        { type: "BTC", percentage: 22.8 },
        { type: "ETH", percentage: 12.0 },
      ]);
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
