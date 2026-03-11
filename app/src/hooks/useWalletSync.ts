import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore, User } from "../store/useAppStore";
import { useConnection } from "@solana/wallet-adapter-react";

export const useWalletSync = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, connected } = wallet;

  const setUser = useAppStore((state) => state.setUser);
  const resetUser = useAppStore((state) => state.resetUser);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return null;
    try {
      const lamports = await connection.getBalance(publicKey);
      return lamports / 1e9;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  }, [publicKey, connection]);

  useEffect(() => {
    let isMounted = true;

    const syncWallet = async () => {
      if (!isMounted) return;

      if (connected && publicKey) {
        const solBalance = await fetchBalance();

        const user: User = {
          publicKey: publicKey.toBase58(),
          isConnected: true,
          balance: solBalance ?? 0,
        };
        setUser(user);
      } else {
        resetUser();
      }
    };

    syncWallet();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey, fetchBalance, setUser, resetUser]);

  return {
    syncBalance: fetchBalance,
  };
};

export const useSyncedUser = () => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  return {
    user,
    updateBalance: setUser,
  };
};
