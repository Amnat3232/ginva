import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useStakingAccount,
  useCryptoPrices,
  useSystemConfig,
} from "../../services/queries";

export interface EarnData {
  stakedAmount: number;
  pendingRewards: number;
  totalEarned: number;
  apy: number;
  lockPeriod: number;
  nextRewardClaim: number | null;
  solPrice: number;
  totalValueStaked: number;
  estimatedDailyReward: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const useEarn = (): EarnData => {
  const { publicKey } = useWallet();
  const userPubkey = publicKey?.toString() || null;

  const {
    data: stakingAccount,
    isLoading: stakingLoading,
    refetch: refetchStaking,
  } = useStakingAccount(userPubkey);
  const { data: prices, isLoading: pricesLoading } = useCryptoPrices([
    "solana",
  ]);
  const {
    data: systemConfig,
    isLoading: configLoading,
    refetch: refetchConfig,
  } = useSystemConfig();

  const data = useMemo(() => {
    const solPrice = prices?.solana?.usd || 0;

    let stakedAmount = 0;
    let rewardsEarned = 0;
    let totalEarned = 0;
    let lastDepositTime = 0;
    let lockPeriod = 0;

    if (stakingAccount?.data) {
      try {
        const parsed = stakingAccount.data as any;
        stakedAmount = parsed?.stakedAmount?.toNumber() || 0;
        rewardsEarned = parsed?.rewardsEarned?.toNumber() || 0;
        totalEarned = parsed?.totalEarned?.toNumber() || 0;
        lastDepositTime = parsed?.lastDepositTime?.toNumber() || 0;
        lockPeriod = parsed?.lockPeriod?.toNumber() || 0;
      } catch {
        // Handle parsing error
      }
    }

    const stakedInSol = stakedAmount / 1e9;
    const totalValueStaked = stakedInSol * solPrice;

    const rewardsInSol = rewardsEarned / 1e9;
    const totalEarnedInSol = totalEarned / 1e9;

    const apy = 12.5;
    const estimatedDailyReward = totalValueStaked * (apy / 100 / 365);

    let nextRewardClaim: number | null = null;
    if (lastDepositTime > 0 && lockPeriod > 0) {
      nextRewardClaim = (lastDepositTime + lockPeriod) * 1000;
    }

    return {
      stakedAmount: stakedInSol,
      pendingRewards: rewardsInSol,
      totalEarned: totalEarnedInSol,
      apy,
      lockPeriod,
      nextRewardClaim,
      solPrice,
      totalValueStaked,
      estimatedDailyReward,
    };
  }, [stakingAccount, prices, systemConfig]);

  const isLoading = stakingLoading || pricesLoading || configLoading;

  return {
    ...data,
    isLoading,
    isError: false,
    refetch: () => {
      refetchStaking();
      refetchConfig();
    },
  };
};
