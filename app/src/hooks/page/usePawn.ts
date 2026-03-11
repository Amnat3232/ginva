import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useLoanAccount,
  useCryptoPrices,
  useSystemConfig,
} from "../../services/queries";

export interface PawnData {
  collateralBalance: number;
  borrowedAmount: number;
  loanToValue: number;
  maxBorrow: number;
  nextPaymentDue: number | null;
  liquidationPrice: number;
  isHealthy: boolean;
  solPrice: number;
  ltvOptions: {
    label: string;
    value: number;
    percentage: number;
  }[];
  durationOptions: {
    label: string;
    value: number;
    days: number;
  }[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const usePawn = (): PawnData => {
  const { publicKey } = useWallet();
  const userPubkey = publicKey?.toString() || null;

  const {
    data: loanAccount,
    isLoading: loanLoading,
    refetch: refetchLoan,
  } = useLoanAccount(userPubkey);
  const { data: prices, isLoading: pricesLoading } = useCryptoPrices([
    "solana",
  ]);
  const {
    data: _systemConfig,
    isLoading: configLoading,
    refetch: refetchConfig,
  } = useSystemConfig();

  const data = useMemo(() => {
    const solPrice = prices?.solana?.usd || 0;

    let collateralBalance = 0;
    let borrowedAmount = 0;
    let loanStartTime = 0;
    let loanDuration = 0;

    if (loanAccount?.data) {
      try {
        const parsed = loanAccount.data as any;
        collateralBalance = parsed?.collateralAmount?.toNumber() || 0;
        borrowedAmount = parsed?.loanAmount?.toNumber() || 0;
        loanStartTime = parsed?.loanStartTime?.toNumber() || 0;
        loanDuration = parsed?.loanDuration?.toNumber() || 0;
      } catch {
        // Handle parsing error
      }
    }

    const collateralInSol = collateralBalance / 1e9;
    const collateralInUsd = collateralInSol * solPrice;
    const borrowedInUsdc = borrowedAmount / 1e6;

    const ltv =
      collateralInUsd > 0 ? (borrowedInUsdc / collateralInUsd) * 100 : 0;
    const maxBorrow = collateralInUsd * 0.5;

    let nextPaymentDue: number | null = null;
    if (loanStartTime > 0 && loanDuration > 0) {
      nextPaymentDue = (loanStartTime + loanDuration) * 1000;
    }

    const liquidationPrice =
      borrowedInUsdc > 0 ? (borrowedInUsdc * 2) / collateralInSol : 0;

    const isHealthy = ltv < 80;

    const ltvOptions = [
      { label: "Conservative", value: 1, percentage: 30 },
      { label: "Moderate", value: 2, percentage: 50 },
      { label: "Aggressive", value: 3, percentage: 70 },
    ];

    const durationOptions = [
      { label: "7 Days", value: 1, days: 7 },
      { label: "14 Days", value: 2, days: 14 },
      { label: "30 Days", value: 3, days: 30 },
      { label: "60 Days", value: 4, days: 60 },
      { label: "90 Days", value: 5, days: 90 },
    ];

    return {
      collateralBalance: collateralInSol,
      borrowedAmount: borrowedInUsdc,
      loanToValue: ltv,
      maxBorrow,
      nextPaymentDue,
      liquidationPrice,
      isHealthy,
      solPrice,
      ltvOptions,
      durationOptions,
    };
  }, [loanAccount, prices]);

  const isLoading = loanLoading || pricesLoading || configLoading;

  return {
    ...data,
    isLoading,
    isError: false,
    refetch: () => {
      refetchLoan();
      refetchConfig();
    },
  };
};
