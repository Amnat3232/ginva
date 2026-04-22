import { create } from 'zustand';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  connect: () => void;
  disconnect: () => void;
  setBalance: (balance: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  balance: 0,
  connect: () => {
    // In a real app, this would use Solana Wallet Adapter
    // For demo: simulate connection
    set({
      connected: true,
      publicKey: '7x9Kj2LmNpqRsTuVwXyZaBcDeFgHiJkL3mP2QrStUvWx',
    });
  },
  disconnect: () => {
    set({ connected: false, publicKey: null, balance: 0 });
  },
  setBalance: (balance) => set({ balance }),
}));
