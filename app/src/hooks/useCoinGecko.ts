import { useState, useEffect, useCallback } from "react";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

const POPULAR_COINS = [
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
  { id: "tether", symbol: "USDT", name: "Tether" },
];

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
}

interface UseCoinGeckoResult {
  prices: CoinPrice[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export const useCoinGecko = (
  autoRefreshInterval = 30000
): UseCoinGeckoResult => {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const coinIds = POPULAR_COINS.map((c) => c.id).join(",");
      const res = await fetch(
        `${COINGECKO_API}/simple/price?` +
          `ids=${coinIds}&` +
          `vs_currencies=usd&` +
          `include_24hr_change=true&` +
          `include_market_cap=true`
      );

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      const formatted: CoinPrice[] = POPULAR_COINS.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        usd: data[coin.id]?.usd ?? 0,
        usd_24h_change: data[coin.id]?.usd_24h_change ?? 0,
        usd_market_cap: data[coin.id]?.usd_market_cap ?? 0,
      }));

      setPrices(formatted);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();

    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchPrices, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, autoRefreshInterval]);

  return { prices, loading, error, lastUpdate, refresh: fetchPrices };
};

export const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(6);
};

export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export const formatMarketCap = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};
