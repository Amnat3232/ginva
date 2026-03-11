import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { QueryProvider } from "./providers/QueryProvider";
import { WalletSync } from "./hooks/useWalletSync";

// Import Styles
import "@solana/wallet-adapter-react-ui/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";

// ---------------------------------------------------------
// 🔧 Fix Polyfills for Vite (fixes white screen due to Buffer/Global)
// ---------------------------------------------------------
import { Buffer as BufferPolyfill } from "buffer";
(globalThis as unknown as { Buffer: typeof BufferPolyfill }).Buffer =
  BufferPolyfill;

// ---------------------------------------------------------
// 🚀 Main Component with Providers
// ---------------------------------------------------------
const Main = () => {
  // Set Network (Devnet)
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Select supported wallets (Phantom, Solflare)
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );

  return (
    <React.StrictMode>
      <QueryProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <BrowserRouter>
                <WalletSync />
                <App />
              </BrowserRouter>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);
