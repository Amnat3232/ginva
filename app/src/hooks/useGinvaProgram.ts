import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../utils/constants";

export const useGinvaProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Use memo to create Program instance only when needed
  const program = useMemo(() => {
    // Return null if wallet is not connected
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      return null;
    }

    // Create provider with type-safe wallet
    const provider = new AnchorProvider(
      connection,
      // @ts-ignore - Using wallet adapter with AnchorProvider
      wallet,
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );

    // Try to load IDL, fallback to mock if not available
    try {
      const idl = require("../idl/ginva.json");
      if (!idl || !idl.metadata || !idl.metadata.name) {
        throw new Error("Invalid IDL format");
      }
      console.log("Using REAL IDL from ../idl/ginva.json");
      // @ts-ignore - Using pattern from working code
      return new Program(idl, PROGRAM_ID, provider);
    } catch (e) {
      // Mock program object for development
      console.warn(
        "WARNING: Using MOCK program data for development. This should NOT be used in production!"
      );
      console.warn("Please ensure the IDL file exists at ../idl/ginva.json");

      return {
        account: {
          loanAccount: {
            all: async (_filters?: any[]) => [],
          },
          systemConfig: {
            fetch: async () => ({
              targetReserves: { toNumber: () => 500000000000 },
              protectionPeriod: { toNumber: () => 1296000 },
              loanMint: PROGRAM_ID,
              totalBorrowed: { toNumber: () => 0 },
            }),
          },
          userStake: {
            fetch: async () => ({
              stakedAmount: { toNumber: () => 1000000000 },
              lastDepositTime: {
                toNumber: () => Math.floor(Date.now() / 1000) - 432000,
              },
            }),
          },
        },
        methods: {
          repayLoan: () => ({
            accounts: (_accounts: any) => ({
              rpc: async () => "mock_tx_signature",
            }),
          }),
          extendLoan: () => ({
            accounts: (_accounts: any) => ({
              rpc: async () => "mock_tx_signature",
            }),
          }),
        },
      } as any;
    }
  }, [
    connection,
    wallet.publicKey,
    wallet.signTransaction,
    wallet.signAllTransactions,
  ]); // Recreate only when network or wallet changes

  return { program, connection };
};

// Type for system config
interface SystemConfig {
  pubkey: string;
  account: {
    admin: string;
    capitalWallet: string;
    opsWallet: string;
    revenueWallet: string;
    isPaused: boolean;
    totalBorrowed: number;
    totalCollateral: number;
  };
}

export const useSystemConfig = (): SystemConfig => {
  console.warn(
    "WARNING: Using MOCK system config. This should NOT be used in production!"
  );

  const systemConfig: SystemConfig = {
    pubkey: "11111111111111111111111111111112",
    account: {
      admin: "11111111111111111111111111111112",
      capitalWallet: "11111111111111111111111111111112",
      opsWallet: "11111111111111111111111111111112",
      revenueWallet: "11111111111111111111111111111112",
      isPaused: false,
      totalBorrowed: 0,
      totalCollateral: 0,
    },
  };

  return systemConfig;
};
