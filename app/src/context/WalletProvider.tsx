import React from "react";

export const useWalletContext = () => {
  return {
    connected: false,
    connecting: false,
    publicKey: null,
    connect: async () => {
      console.log("Connect wallet");
    },
    disconnect: async () => {
      console.log("Disconnect wallet");
    },
  };
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
