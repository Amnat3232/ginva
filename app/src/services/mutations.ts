import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { GinvaProgram } from "../lib/ginvaProgram";
import { queryKeys } from "./queries";

// Deposit Collateral Mutation
export const useDepositCollateral = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.depositCollateral(new BN(amount));
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      // Invalidate related queries
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.loanAccount(wallet.publicKey.toString()),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(wallet.publicKey.toString()),
        });
      }
    },
  });
};

// Borrow USDC Mutation
export const useBorrowUsdc = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loanId,
      ltvOption,
      durationDays,
    }: {
      loanId: number;
      ltvOption: number;
      durationDays: number;
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.borrowUsdc(loanId, ltvOption, durationDays);
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.loanAccount(wallet.publicKey.toString()),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(wallet.publicKey.toString()),
        });
      }
    },
  });
};

// Repay Loan Mutation
export const useRepayLoan = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.repayLoan();
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.loanAccount(wallet.publicKey.toString()),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(wallet.publicKey.toString()),
        });
      }
    },
  });
};

// Stake LP Mutation
export const useStakeLp = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.stakeLp(new BN(amount));
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.stakingAccount(wallet.publicKey.toString()),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(wallet.publicKey.toString()),
        });
      }
    },
  });
};

// Unstake LP Mutation
export const useUnstakeLp = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.unstakeLp(new BN(amount));
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.stakingAccount(wallet.publicKey.toString()),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userBalance(wallet.publicKey.toString()),
        });
      }
    },
  });
};

// Register Agent Mutation
export const useRegisterAgent = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      framework,
      capabilities,
    }: {
      name: string;
      description: string;
      framework: string;
      capabilities: string;
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const ginva = await GinvaProgram.initialize(connection, wallet);

      const tx = await ginva.registerAgent(
        name,
        description,
        framework,
        capabilities
      );
      const signature = await ginva.signAndSendTransaction(tx);

      return signature;
    },
    onSuccess: () => {
      if (wallet.publicKey) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.agentAccount(wallet.publicKey.toString()),
        });
      }
    },
  });
};
