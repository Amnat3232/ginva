import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

// Query Keys
export const queryKeys = {
  // Account queries
  loanAccount: (pubkey: string) => ["loan", pubkey] as const,
  stakingAccount: (pubkey: string) => ["staking", pubkey] as const,
  agentAccount: (pubkey: string) => ["agent", pubkey] as const,
  systemConfig: () => ["systemConfig"] as const,

  // Price queries
  prices: () => ["prices"] as const,
  price: (symbol: string) => ["price", symbol] as const,

  // User queries
  userBalance: (pubkey: string) => ["balance", pubkey] as const,
  userLoans: (pubkey: string) => ["userLoans", pubkey] as const,

  // Global queries
  globalStats: () => ["globalStats"] as const,
  recentLiquidations: () => ["recentLiquidations"] as const,
};

// Connection hook
export const useSolanaConnection = () => {
  const { connection } = useConnection();
  return connection;
};

// Fetch loan account data
export const useLoanAccount = (userPubkey: string | null) => {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: queryKeys.loanAccount(userPubkey || ""),
    queryFn: async () => {
      if (!userPubkey || !connection) return null;

      try {
        const programId = new PublicKey(
          "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
        );
        const [loanAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("loan"), new PublicKey(userPubkey).toBuffer()],
          programId
        );

        const accountInfo = await connection.getParsedAccountInfo(loanAccount);
        return accountInfo.value;
      } catch (error) {
        console.error("Error fetching loan account:", error);
        return null;
      }
    },
    enabled: !!userPubkey && !!connection,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
  });
};

// Fetch staking account data
export const useStakingAccount = (userPubkey: string | null) => {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: queryKeys.stakingAccount(userPubkey || ""),
    queryFn: async () => {
      if (!userPubkey || !connection) return null;

      try {
        const programId = new PublicKey(
          "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
        );
        const [stakingAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("staking"), new PublicKey(userPubkey).toBuffer()],
          programId
        );

        const accountInfo = await connection.getParsedAccountInfo(
          stakingAccount
        );
        return accountInfo.value;
      } catch (error) {
        console.error("Error fetching staking account:", error);
        return null;
      }
    },
    enabled: !!userPubkey && !!connection,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Fetch user balance
export const useUserBalance = (pubkey: string | null) => {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: queryKeys.userBalance(pubkey || ""),
    queryFn: async () => {
      if (!pubkey || !connection) return null;

      try {
        const balance = await connection.getBalance(new PublicKey(pubkey));
        return balance / 1e9; // Convert lamports to SOL
      } catch (error) {
        console.error("Error fetching balance:", error);
        return null;
      }
    },
    enabled: !!pubkey && !!connection,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000,
  });
};

// Fetch system config
export const useSystemConfig = () => {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: queryKeys.systemConfig(),
    queryFn: async () => {
      if (!connection) return null;

      try {
        const programId = new PublicKey(
          "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
        );
        const [configAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("system_config")],
          programId
        );

        const accountInfo = await connection.getParsedAccountInfo(
          configAccount
        );
        return accountInfo.value;
      } catch (error) {
        console.error("Error fetching system config:", error);
        return null;
      }
    },
    enabled: !!connection,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch token prices from CoinGecko
export const useCryptoPrices = (
  symbols: string[] = ["solana", "bitcoin", "ethereum"]
) => {
  const tokenToCoingecko: Record<string, string> = {
    solana: "solana",
    btc: "bitcoin",
    eth: "ethereum",
  };

  return useQuery({
    queryKey: queryKeys.prices(),
    queryFn: async () => {
      try {
        const ids = symbols
          .map((s) => tokenToCoingecko[s.toLowerCase()] || s)
          .join(",");
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching prices:", error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
    retry: 2,
  });
};

// Fetch global protocol stats
export const useGlobalStats = () => {
  const connection = useSolanaConnection();

  return useQuery({
    queryKey: queryKeys.globalStats(),
    queryFn: async () => {
      if (!connection) return null;

      try {
        // Get program account
        const programId = new PublicKey(
          "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
        );
        const programAccounts = await connection.getParsedProgramAccounts(
          programId
        );

        // Calculate stats
        const stats = {
          totalLoans: programAccounts.filter((a) =>
            a.pubkey.toBase58().includes("loan")
          ).length,
          totalStaking: programAccounts.filter((a) =>
            a.pubkey.toBase58().includes("staking")
          ).length,
          totalAgents: programAccounts.filter((a) =>
            a.pubkey.toBase58().includes("agent")
          ).length,
        };

        return stats;
      } catch (error) {
        console.error("Error fetching global stats:", error);
        return null;
      }
    },
    enabled: !!connection,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
