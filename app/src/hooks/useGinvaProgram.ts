import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../utils/constants";

export const useGinvaProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  // ✅ ใช้ useMemo เพื่อสร้าง Program instance แค่ตอนจำเป็นเท่านั้น
  const program = useMemo(() => {
    // ถ้ากระเป๋ายังไม่เชื่อมต่อ ให้ return null ไปก่อน
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      return null;
    }

    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    // Try to load IDL, fallback to mock if not available
    try {
      const idl = require("../idl/ginva.json");
      return new Program(idl as any, PROGRAM_ID, provider);
    } catch (e) {
      // Mock program object for development
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
  ]); // 🔒 สร้างใหม่เฉพาะตอนเปลี่ยนเครือข่าย หรือ เปลี่ยนกระเป๋า

  return { program };
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
