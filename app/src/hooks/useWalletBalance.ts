import { useCallback, useEffect, useState } from "react";

interface WalletBalance {
  SOL: number;
  USDC: number;
}

export const useWalletBalance = () => {
  const [balance, setBalance] = useState<WalletBalance>({ SOL: 0, USDC: 0 });
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      // Temporarily set default values
      setBalance({
        SOL: 0,
        USDC: 0,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();

    const interval = setInterval(fetchBalance, 10000);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
};
