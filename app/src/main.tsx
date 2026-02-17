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

// Import Styles
import "@solana/wallet-adapter-react-ui/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";

// ---------------------------------------------------------
// 🔧 Fix Polyfills for Vite (fixes white screen due to Buffer/Global)
// ---------------------------------------------------------
import { Buffer } from "buffer";
if (!window.Buffer) {
  window.Buffer = Buffer;
}
window.global = window.global ?? window;

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
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);
