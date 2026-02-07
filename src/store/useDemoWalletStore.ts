import { create } from "zustand";
import { persist } from "zustand/middleware";

// Demo user definitions
export type DemoUserId = "userA" | "userB" | "userC";

export interface DemoUser {
  id: DemoUserId;
  name: string;
  address: `0x${string}`;
  shortAddress: string;
  color: string;
  bgColor: string;
  initials: string;
  balances: Record<string, string>;
}

// Pre-defined demo users with distinct addresses
export const DEMO_USERS: Record<DemoUserId, DemoUser> = {
  userA: {
    id: "userA",
    name: "Alice",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    shortAddress: "0xd8dA...6045",
    color: "text-blue-400",
    bgColor: "bg-blue-500",
    initials: "A",
    balances: {
      WBTC: "3.5",
      ETH: "25.0",
      USDC: "450000",
      USDT: "250000",
    },
  },
  userB: {
    id: "userB",
    name: "Bob",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    shortAddress: "0x71C7...976F",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500",
    initials: "B",
    balances: {
      WBTC: "1.2",
      ETH: "15.0",
      USDC: "280000",
      USDT: "150000",
    },
  },
  userC: {
    id: "userC",
    name: "Charlie",
    address: "0xaB5409b0E5a66AcC9D63f668414539A60a5917C1",
    shortAddress: "0xaB54...17C1",
    color: "text-purple-400",
    bgColor: "bg-purple-500",
    initials: "C",
    balances: {
      WBTC: "0.8",
      ETH: "8.0",
      USDC: "120000",
      USDT: "80000",
    },
  },
};

interface DemoWalletStore {
  // State
  isDemoMode: boolean;
  currentDemoUser: DemoUserId;
  demoAddress: `0x${string}` | null;
  demoBalances: Record<string, string>;

  // Computed getter
  getCurrentUser: () => DemoUser;

  // Actions
  connectDemo: () => void;
  disconnectDemo: () => void;
  switchDemoUser: (userId: DemoUserId) => void;
  toggleDemoMode: () => void;
  setDemoBalance: (token: string, amount: string) => void;
}

export const useDemoWalletStore = create<DemoWalletStore>()(
  persist(
    (set, get) => ({
      isDemoMode: true, // Default to demo mode on for easy testing
      currentDemoUser: "userA",
      demoAddress: DEMO_USERS.userA.address,
      demoBalances: DEMO_USERS.userA.balances,

      getCurrentUser: () => {
        const userId = get().currentDemoUser;
        return DEMO_USERS[userId];
      },

      connectDemo: () => {
        const userId = get().currentDemoUser;
        const user = DEMO_USERS[userId];
        set({
          isDemoMode: true,
          demoAddress: user.address,
          demoBalances: user.balances,
        });
      },

      disconnectDemo: () => {
        set({
          isDemoMode: false,
          demoAddress: null,
          demoBalances: {},
        });
      },

      switchDemoUser: (userId: DemoUserId) => {
        const user = DEMO_USERS[userId];
        set({
          currentDemoUser: userId,
          demoAddress: user.address,
          demoBalances: user.balances,
        });
      },

      toggleDemoMode: () => {
        const state = get();
        if (state.isDemoMode) {
          set({
            isDemoMode: false,
            demoAddress: null,
            demoBalances: {},
          });
        } else {
          const user = DEMO_USERS[state.currentDemoUser];
          set({
            isDemoMode: true,
            demoAddress: user.address,
            demoBalances: user.balances,
          });
        }
      },

      setDemoBalance: (token, amount) => {
        set((state) => ({
          demoBalances: {
            ...state.demoBalances,
            [token]: amount,
          },
        }));
      },
    }),
    {
      name: "demo-wallet-storage",
    }
  )
);
