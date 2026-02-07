import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Transaction {
    id: string;
    timestamp: number;
    action: "Auction Created" | "Bid Placed" | "Auction Finalized" | "Loan Repaid" | "Collateral Claimed" | "Position Listed" | "Position Sold" | "Position Bought" | "Offer Made" | "NFT Minted";
    user: string;
    amount: string;
    details?: string;
    txHash?: string;
    relatedId?: string; // auction ID, loan ID, etc.
}

interface AnalyticsStore {
    transactions: Transaction[];
    addTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => void;
    getRecentTransactions: (limit?: number) => Transaction[];
    getTransactionsByUser: (address: string) => Transaction[];
    clearTransactions: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>()(
    persist(
        (set, get) => ({
            transactions: [
                // Initial mock transactions for demo purposes
                {
                    id: "tx-100",
                    timestamp: Date.now() - 2 * 60 * 1000,
                    action: "Auction Created",
                    user: "0x1234...5678",
                    amount: "50,000 USDC",
                    relatedId: "#1001"
                },
                {
                    id: "tx-101",
                    timestamp: Date.now() - 5 * 60 * 1000,
                    action: "Bid Placed",
                    user: "0xABCD...EF01",
                    amount: "48,500 USDC",
                    relatedId: "#1001"
                },
                {
                    id: "tx-102",
                    timestamp: Date.now() - 15 * 60 * 1000,
                    action: "Loan Repaid",
                    user: "0x9876...5432",
                    amount: "33,000 USDT",
                    relatedId: "L2001"
                },
                {
                    id: "tx-103",
                    timestamp: Date.now() - 45 * 60 * 1000,
                    action: "Position Listed",
                    user: "0x1111...2222",
                    amount: "48,000 USDC",
                    relatedId: "L2002"
                },
                {
                    id: "tx-104",
                    timestamp: Date.now() - 60 * 60 * 1000,
                    action: "Auction Finalized",
                    user: "0x5555...6666",
                    amount: "25,000 USDC",
                    relatedId: "#1003"
                }
            ],

            addTransaction: (tx) => {
                const newTx: Transaction = {
                    ...tx,
                    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    timestamp: Date.now(),
                };

                set((state) => ({
                    transactions: [newTx, ...state.transactions].slice(0, 100), // Keep last 100
                }));
            },

            getRecentTransactions: (limit = 10) => {
                return get().transactions.slice(0, limit);
            },

            getTransactionsByUser: (address) => {
                if (!address) return [];
                const lowerAddress = address.toLowerCase();
                return get().transactions.filter(
                    (tx) => tx.user.toLowerCase() === lowerAddress ||
                        tx.user.toLowerCase().includes(lowerAddress.slice(2, 8)) // Handle partial match for formatted addresses
                );
            },

            clearTransactions: () => set({ transactions: [] }),
        }),
        {
            name: "the-gavel-analytics",
        }
    )
);
