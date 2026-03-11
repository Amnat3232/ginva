import { createContext, useContext, ReactNode } from "react";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";

interface WalletContextType extends WalletContextState {
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
