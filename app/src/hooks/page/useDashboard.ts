import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useLoanAccount,
  useStakingAccount,
  useSystemConfig,
  useCryptoPrices,
  useGlobalStats,
} from "../../services/queries";

export interface DashboardData {
  tvl: number;
  activeLoans: number;
  userActiveLoans: number;
  userCollateral: number;
  userStaked: number;
  userRewards: number;
  solPrice: number;
  btcPrice: number;
  ethPrice: number;
  priceChange24h: {
    sol: number;
    btc: number;
    eth: number;
  };
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const useDashboard = (): DashboardData => {
  const { publicKey } = useWallet();
  const userPubkey = publicKey?.toString() || null;

  const {
    data: loanAccount,
    isLoading: loanLoading,
    refetch: refetchLoan,
  } = useLoanAccount(userPubkey);
  const {
    data: stakingAccount,
    isLoading: stakingLoading,
    refetch: refetchStaking,
  } = useStakingAccount(userPubkey);
  const { data: systemConfig, isLoading: configLoading } = useSystemConfig();
  const { data: prices, isLoading: pricesLoading } = useCryptoPrices([
    "solana",
    "bitcoin",
    "ethereum",
  ]);
  const { data: globalStats, isLoading: statsLoading } = useGlobalStats();

  const data = useMemo(() => {
    const solPriceData = prices?.solana?.usd || 0;
    const btcPriceData = prices?.bitcoin?.usd || 0;
    const ethPriceData = prices?.ethereum?.usd || 0;

    const solChange = prices?.solana?.usd_24h_change || 0;
    const btcChange = prices?.bitcoin?.usd_24h_change || 0;
    const ethChange = prices?.ethereum?.usd_24h_change || 0;

    let userCollateral = 0;
    let userActiveLoans = 0;
    if (loanAccount?.data) {
      try {
        const parsed = loanAccount.data as any;
        userCollateral = parsed?.collateralAmount?.toNumber() || 0;
        userActiveLoans = parsed?.loanAmount?.toNumber() || 0;
      } catch {
        // Handle parsing error
      }
    }

    let userStaked = 0;
    let userRewards = 0;
    if (stakingAccount?.data) {
      try {
        const parsed = stakingAccount.data as any;
        userStaked = parsed?.stakedAmount?.toNumber() || 0;
        userRewards = parsed?.rewardsEarned?.toNumber() || 0;
      } catch {
        // Handle parsing error
      }
    }

    let tvl = 0;
    if (systemConfig?.data) {
      try {
        const parsed = systemConfig.data as any;
        const totalBorrowed = parsed?.totalBorrowed?.toNumber() || 0;
        const totalCollateral = parsed?.totalCollateral?.toNumber() || 0;
        tvl = totalBorrowed / 1e6 + (totalCollateral / 1e9) * solPriceData;
      } catch {
        // Handle parsing error
      }
    }

    return {
      tvl,
      activeLoans: globalStats?.totalLoans || 0,
      userActiveLoans: userActiveLoans / 1e6,
      userCollateral: userCollateral / 1e9,
      userStaked: userStaked / 1e9,
      userRewards: userRewards / 1e9,
      solPrice: solPriceData,
      btcPrice: btcPriceData,
      ethPrice: ethPriceData,
      priceChange24h: {
        sol: solChange,
        btc: btcChange,
        eth: ethChange,
      },
    };
  }, [loanAccount, stakingAccount, systemConfig, prices, globalStats]);

  const isLoading =
    loanLoading ||
    stakingLoading ||
    configLoading ||
    pricesLoading ||
    statsLoading;

  return {
    ...data,
    isLoading,
    isError: false,
    refetch: () => {
      refetchLoan();
      refetchStaking();
    },
  };
};
