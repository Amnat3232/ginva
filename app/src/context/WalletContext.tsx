import { createContext, useContext, ReactNode } from "react";
import { useWallet, UseWalletReturnType } from "@solana/wallet-adapter-react";

interface WalletContextType extends UseWalletReturnType {
  isConnected: boolean;
  balance: number | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const wallet = useWallet();

  const value: WalletContextType = {
    ...wallet,
    isConnected: wallet.connected,
    balance: null,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
