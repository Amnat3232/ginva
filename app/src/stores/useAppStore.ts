import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface User {
  publicKey: string;
  isConnected: boolean;
  balance: number;
}

export interface LoanState {
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  startTime: number;
  endTime: number;
  status: "none" | "active" | "liquidating" | "liquidated";
}

export interface StakingState {
  stakedAmount: number;
  pendingRewards: number;
  lastClaimTime: number;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;
  activeModal: string | null;
  theme: "light" | "dark";

  // User State
  user: User | null;
  loan: LoanState | null;
  staking: StakingState | null;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setUser: (user: User | null) => void;
  setLoan: (loan: LoanState | null) => void;
  setStaking: (staking: StakingState | null) => void;
  resetUser: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // UI State
        sidebarOpen: true,
        activeModal: null,
        theme: "dark",

        // User State
        user: null,
        loan: null,
        staking: null,

        // Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setActiveModal: (modal) => set({ activeModal: modal }),
        setTheme: (theme) => set({ theme }),
        toggleTheme: () =>
          set((state) => ({
            theme: state.theme === "light" ? "dark" : "light",
          })),

        setUser: (user) => set({ user }),
        setLoan: (loan) => set({ loan }),
        setStaking: (staking) => set({ staking }),
        resetUser: () => set({ user: null, loan: null, staking: null }),
      }),
      {
        name: "ginva-storage",
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
);

// Selective selectors for performance
export const useTheme = () => useAppStore((state) => state.theme);
export const useUser = () => useAppStore((state) => state.user);
export const useLoan = () => useAppStore((state) => state.loan);
export const useStaking = () => useAppStore((state) => state.staking);
export const useSidebar = () => useAppStore((state) => state.sidebarOpen);
export const useActiveModal = () => useAppStore((state) => state.activeModal);
