import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DemoWalletStore {
    isDemoMode: boolean;
    demoAddress: `0x${string}` | null;
    demoBalances: Record<string, string>;

    // Actions
    connectDemo: () => void;
    disconnectDemo: () => void;
    setDemoBalance: (token: string, amount: string) => void;
}

export const useDemoWalletStore = create<DemoWalletStore>()(
    persist(
        (set) => ({
            isDemoMode: false,
            demoAddress: null,
            demoBalances: {},

            connectDemo: () => {
                const address = import.meta.env.VITE_DEMO_WALLET_ADDRESS as `0x${string}`;
                const balances = {
                    WBTC: import.meta.env.VITE_DEMO_WBTC_BALANCE || "3.5",
                    USDC: import.meta.env.VITE_DEMO_USDC_BALANCE || "450000",
                    USDT: import.meta.env.VITE_DEMO_USDT_BALANCE || "250000",
                    ETH: "10.0", // Default ETH balance for demo
                };

                set({
                    isDemoMode: true,
                    demoAddress: address,
                    demoBalances: balances,
                });
            },

            disconnectDemo: () => {
                set({
                    isDemoMode: false,
                    demoAddress: null,
                    demoBalances: {},
                });
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
