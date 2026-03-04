import { useState, useEffect, useCallback } from "react";

export interface TokenPrice {
  value: number;
  updateUnixTime: number;
  updateHumanTime: string;
}

export interface BirdeyePriceResponse {
  success: boolean;
  data: {
    [address: string]: TokenPrice;
  };
}

export interface Prices {
  sol?: number;
  btc?: number;
  eth?: number;
  usdc?: number;
}

const BIRDEYE_API = "https://public-api.birdeye.so/defi/price";

const TOKEN_ADDRESSES: Record<keyof Prices, string> = {
  sol: "So11111111111111111111111111111111111111112",
  btc: "9n4nbM75f5Ui33ZbPYXn59EwSgEpxCGsCt2DoBeAiePa",
  eth: "2weMt25hQwE4rZ5BBQdhXP9YcmC1LhEhm9Ws1Lq3vY8",
  usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

export function useCryptoPrices(autoRefreshMs = 15000) {
  const [prices, setPrices] = useState<Prices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);

      const addresses = Object.values(TOKEN_ADDRESSES).join(",");
      const url = `${BIRDEYE_API}?address=${addresses}`;

      const res = await fetch(url, {
        headers: {
          "x birdeye public key": "free",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: BirdeyePriceResponse = await res.json();

      if (!data.success || !data.data) {
        throw new Error("Invalid response from Birdeye");
      }

      const priceMap: Prices = {};

      for (const [key, address] of Object.entries(TOKEN_ADDRESSES)) {
        if (data.data[address]) {
          priceMap[key as keyof Prices] = data.data[address].value;
        }
      }

      setPrices(priceMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Birdeye Error:", err);
      setError("Price data temporarily unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, autoRefreshMs);
    return () => clearInterval(interval);
  }, [fetchPrices, autoRefreshMs]);

  return { prices, loading, error, lastUpdate, refetch: fetchPrices };
}

export const formatPrice = (price: number | undefined): string => {
  if (price === undefined) return "--";
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
};

export const formatChange = (_change: number | undefined): string => {
  return "--";
};

export const getSolPrice = (prices: Prices): number => {
  return prices.sol ?? 0;
};
