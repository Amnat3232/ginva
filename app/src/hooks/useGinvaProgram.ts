import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "../utils/constants";

export const useGinvaProgram = () => {
  const connection = useConnection();

  const programInfo = {
    PROGRAM_ID,
    connection,
  };

  return programInfo;
};

export const useSystemConfig = () => {
  const connection = useConnection();

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
