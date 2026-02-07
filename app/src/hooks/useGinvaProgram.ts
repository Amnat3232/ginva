import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "../utils/constants";
import { useMemo } from "react";

export const useGinvaProgram = () => {
  const { connection } = useConnection();

  const programInfo = useMemo(() => {
    return {
      PROGRAM_ID,
      connection,
      // Mock program object - will be replaced with real Anchor program
      program: {
        account: {
          loanAccount: {
            all: async (_filters?: any[]) => {
              // Return mock data for now
              return [];
            },
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
      } as any,
    };
  }, [connection]);

  return programInfo;
};

export const useSystemConfig = () => {
  const systemConfig = {
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
