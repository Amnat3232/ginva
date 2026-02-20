import { useState, useEffect, useCallback } from "react";
import { Connection } from "@solana/web3.js";

const PYTH_DEVNET_API = "https://hermes-beta.pyth.network";
const PYTH_MAINNET_API = "https://hermes.pyth.network";

const PRICE_FEEDS = {
  sol: {
    devnet:
      "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    mainnet:
      "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  },
  btc: {
    devnet:
      "0xca032730c5f10d0b8f5c6acf29f9e6e3e9e7c8c4c5e5c5c5c5c5c5c5c5c5c5c5c5c5c5",
    mainnet: "0x62e3f3e3a7b8d0a5c9d7e3e7c8c4c5e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5",
  },
  eth: {
    devnet: "0xd47d0d7e3e7c8e0a5c9d7e3e7c8c4c5e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5",
    mainnet:
      "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  },
  usdc: {
    devnet: "0x5bd42b2c2c8e0a5c9d7e3e7c8c4c5e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5",
    mainnet:
      "0x6555e93d6ce5c2c7e5d7e3e7c8c4c5e5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5",
  },
};

type PriceFeedKey = keyof typeof PRICE_FEEDS;

export const usePythPrice = (
  symbol: PriceFeedKey,
  connection: Connection | null,
  isDevnet = true
) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!connection) return;

    setLoading(true);
    setError(null);

    try {
      const feedId = PRICE_FEEDS[symbol][isDevnet ? "devnet" : "mainnet"];
      const pythApi = isDevnet ? PYTH_DEVNET_API : PYTH_MAINNET_API;

      const response = await fetch(`${pythApi}/api/v1/price_feed?id=${feedId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.price) {
        const priceValue = parseFloat(data.price);
        const exponent = data.exponent || -8;
        const actualPrice = priceValue * Math.pow(10, exponent);

        setPrice(actualPrice);
        setLastUpdate(new Date());
      } else {
        setError("No price data available");
      }
    } catch (err) {
      console.error("Error fetching Pyth price:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch price");
    } finally {
      setLoading(false);
    }
  }, [connection, symbol, isDevnet]);

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, 15000);

    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, error, lastUpdate, refetch: fetchPrice };
};

export const useMultiplePrices = (
  symbols: PriceFeedKey[],
  connection: Connection | null,
  isDevnet = true
) => {
  const [prices, setPrices] = useState<Record<PriceFeedKey, number | null>>({
    sol: null,
    btc: null,
    eth: null,
    usdc: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!connection) return;

    setLoading(true);
    setError(null);

    try {
      const pythApi = isDevnet ? PYTH_DEVNET_API : PYTH_MAINNET_API;

      const feedIds = symbols.map(
        (s) => PRICE_FEEDS[s][isDevnet ? "devnet" : "mainnet"]
      );
      const idsParam = feedIds.join(",");

      const response = await fetch(
        `${pythApi}/api/v1/price_feed?ids=${idsParam}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const newPrices: Record<PriceFeedKey, number | null> = {
          sol: null,
          btc: null,
          eth: null,
          usdc: null,
        };

        data.forEach(
          (
            item: { id: string; price: string; exponent: number },
            index: number
          ) => {
            const symbol = symbols[index];
            if (item && item.price) {
              const priceValue = parseFloat(item.price);
              const exponent = item.exponent || -8;
              newPrices[symbol] = priceValue * Math.pow(10, exponent);
            }
          }
        );

        setPrices(newPrices);
      }
    } catch (err) {
      console.error("Error fetching Pyth prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  }, [connection, symbols, isDevnet]);

  useEffect(() => {
    fetchPrices();

    const interval = setInterval(fetchPrices, 15000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, error, refetch: fetchPrices };
};

export const getPythPriceFeedId = (symbol: PriceFeedKey, isDevnet = true) => {
  return PRICE_FEEDS[symbol][isDevnet ? "devnet" : "mainnet"];
};

export const formatPrice = (price: number | null, decimals = 2) => {
  if (price === null) return "—";

  if (price >= 1000) {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return price.toFixed(decimals);
};

export default usePythPrice;
