import { useState, useEffect, useCallback } from "react";

interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export type UseWallet = WalletState & WalletActions;

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: {
        onlyIfTrusted?: boolean;
      }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: () => void) => void;
      removeListener: (event: string, callback: () => void) => void;
    };
  }
}

const WALLET_KEY = "ginva_wallet_address";

export function useWallet(): UseWallet {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    connecting: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.solana) {
      return;
    }

    try {
      const response = await window.solana.connect({ onlyIfTrusted: true });
      const address = response.publicKey.toString();

      setState({
        connected: true,
        address,
        connecting: false,
        error: null,
      });

      localStorage.setItem(WALLET_KEY, address);
    } catch {
      setState((prev) => ({
        ...prev,
        connected: false,
        address: null,
        connecting: false,
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") {
      setState((prev) => ({
        ...prev,
        error: "Wallet not available",
      }));
      return;
    }

    if (!window.solana) {
      setState((prev) => ({
        ...prev,
        error: "Please install Phantom wallet",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      connecting: true,
      error: null,
    }));

    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();

      setState({
        connected: true,
        address,
        connecting: false,
        error: null,
      });

      localStorage.setItem(WALLET_KEY, address);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        connected: false,
        address: null,
        connecting: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (window.solana) {
      try {
        await window.solana.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }

    setState({
      connected: false,
      address: null,
      connecting: false,
      error: null,
    });

    localStorage.removeItem(WALLET_KEY);
  }, []);

  useEffect(() => {
    checkConnection();

    if (window.solana?.on) {
      window.solana.on("disconnect", () => {
        setState({
          connected: false,
          address: null,
          connecting: false,
          error: null,
        });
        localStorage.removeItem(WALLET_KEY);
      });
    }

    return () => {
      if (window.solana?.removeListener) {
        window.solana.removeListener("disconnect", () => {});
      }
    };
  }, [checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
