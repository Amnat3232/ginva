import { useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAppStore, User } from "../store/useAppStore";

/**
 * WalletSync Component - Syncs wallet state with Zustand store
 * Should be rendered inside WalletProvider
 */
export const WalletSync = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, connected } = wallet;

  const setUser = useAppStore((state) => state.setUser);
  const resetUser = useAppStore((state) => state.resetUser);

  useEffect(() => {
    let isMounted = true;

    const syncWallet = async () => {
      if (!isMounted) return;

      if (connected && publicKey) {
        let balance = 0;
        try {
          const lamports = await connection.getBalance(publicKey);
          balance = lamports / 1e9;
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }

        const user: User = {
          publicKey: publicKey.toBase58(),
          isConnected: true,
          balance,
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
  }, [connected, publicKey, connection, setUser, resetUser]);

  return null;
};

export const useWalletSync = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, connected } = wallet;

  const setUser = useAppStore((state) => state.setUser);
  const resetUser = useAppStore((state) => state.resetUser);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return null;
    try {
      const lamports = await connection.getBalance(publicKey);
      return lamports / 1e9;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  };

  return {
    fetchBalance,
    syncWallet: () => {
      if (connected && publicKey) {
        fetchBalance().then((balance) => {
          const user: User = {
            publicKey: publicKey.toBase58(),
            isConnected: true,
            balance: balance ?? 0,
          };
          setUser(user);
        });
      } else {
        resetUser();
      }
    },
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
