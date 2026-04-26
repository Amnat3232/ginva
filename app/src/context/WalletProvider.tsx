import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Cluster } from "@solana/web3.js";

export type Network = 'devnet' | 'mainnet' | 'testnet';

interface NetworkConfig {
  name: string;
  endpoint: string;
  wsEndpoint: string;
}

const NETWORKS: Record<Network, NetworkConfig> = {
  devnet: {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
  },
  testnet: {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    wsEndpoint: 'wss://api.testnet.solana.com',
  },
  mainnet: {
    name: 'Mainnet',
    endpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
  },
};

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  disconnect: () => void;
  connect: () => void;
  error: string | null;
  network: Network;
  setNetwork: (network: Network) => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  disconnect: () => {},
  connect: () => {},
  error: null,
  network: 'devnet',
  setNetwork: () => {},
});

export const useWalletContext = () => useContext(WalletContext);

function WalletHooks({ children }: { children: ReactNode }) {
  const { connected, connecting, publicKey, connect, disconnect: walletDisconnect } = useWallet();
  const [network, setNetworkState] = useState<Network>('devnet');
  const [error, setError] = useState<string | null>(null);

  const setNetwork = (newNetwork: Network) => {
    setNetworkState(newNetwork);
    // Store in localStorage for persistence
    localStorage.setItem('ginva-network', newNetwork);
  };

  const value = useMemo(
    () => ({
      connected,
      connecting,
      publicKey,
      connect,
      disconnect: walletDisconnect,
      error,
      network,
      setNetwork,
    }),
    [connected, connecting, publicKey, connect, walletDisconnect, error, network]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

interface GinvaWalletProviderProps {
  children: ReactNode;
  defaultNetwork?: Network;
}

export function GinvaWalletProvider({ children, defaultNetwork = 'devnet' }: GinvaWalletProviderProps) {
  const [network] = useState<Network>(() => {
    const stored = localStorage.getItem('ginva-network') as Network;
    return stored && NETWORKS[stored] ? stored : defaultNetwork;
  });

  const config = NETWORKS[network];

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={config.endpoint} config={{ wsEndpoint: config.wsEndpoint }}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletHooks>{children}</WalletHooks>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export { WalletMultiButton, WalletDisconnectButton, NETWORKS };
export default WalletMultiButton;