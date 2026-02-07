import { create } from "zustand";
import type { Auction, AuctionStatus } from "@/types";
import * as contracts from "@/lib/mockContracts";
import { analytics } from "@/lib/analytics";
import { useLoanStore } from "./useLoanStore";
import { DEMO_USERS } from "./useDemoWalletStore";

// Demo addresses for consistency
const ALICE = DEMO_USERS.userA.address;
const BOB = DEMO_USERS.userB.address;
const CHARLIE = DEMO_USERS.userC.address;

// Helper to generate auction ID
function generateAuctionId(): string {
  return `#${Math.floor(Math.random() * 9000) + 1000}`;
}

// Helper to parse duration string to milliseconds
function parseDuration(duration: string): number {
  const value = parseInt(duration);
  if (duration.endsWith("h")) return value * 60 * 60 * 1000;
  if (duration.endsWith("d")) return value * 24 * 60 * 60 * 1000;
  return value * 1000;
}

// Initial mock auctions - using demo user addresses
const initialAuctions: Auction[] = [
  {
    id: "#1001",
    borrower: ALICE, // Alice's auction
    collateralToken: "WBTC",
    collateralAmount: "1.5",
    loanToken: "USDC",
    loanAmount: "50000",
    maxRepayment: "55000",
    currentBid: "52500",
    currentBidder: BOB, // Bob is winning bidder
    bidCount: 5,
    auctionEndTime: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
    loanDuration: "30d",
    status: "active",
    createdAt: Date.now() - 20 * 60 * 60 * 1000,
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  },
  {
    id: "#1002",
    borrower: BOB, // Bob's auction
    collateralToken: "ETH",
    collateralAmount: "25",
    loanToken: "USDC",
    loanAmount: "80000",
    maxRepayment: "88000",
    currentBid: "84200",
    currentBidder: ALICE, // Alice is winning bidder
    bidCount: 8,
    auctionEndTime: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
    loanDuration: "90d",
    status: "active",
    createdAt: Date.now() - 12 * 60 * 60 * 1000,
    txHash: "0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1",
  },
  {
    id: "#1003",
    borrower: CHARLIE, // Charlie's auction
    collateralToken: "WBTC",
    collateralAmount: "0.8",
    loanToken: "USDT",
    loanAmount: "30000",
    maxRepayment: "33000",
    currentBid: "31800",
    currentBidder: ALICE, // Alice is winning bidder
    bidCount: 3,
    auctionEndTime: Date.now() + 45 * 60 * 1000, // 45 minutes
    loanDuration: "7d",
    status: "ending_soon",
    createdAt: Date.now() - 23 * 60 * 60 * 1000,
    txHash: "0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef12",
  },
  {
    id: "#1004",
    borrower: ALICE, // Alice's auction
    collateralToken: "ETH",
    collateralAmount: "10",
    loanToken: "USDC",
    loanAmount: "25000",
    maxRepayment: "27500",
    currentBid: "26100",
    currentBidder: CHARLIE, // Charlie is winning bidder
    bidCount: 2,
    auctionEndTime: Date.now() + 18 * 60 * 60 * 1000, // 18 hours
    loanDuration: "30d",
    status: "active",
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    txHash: "0x4567890123def1234567890123def1234567890123def1234567890123def123",
  },
  {
    id: "#1005",
    borrower: BOB, // Bob's auction
    collateralToken: "WBTC",
    collateralAmount: "2.0",
    loanToken: "USDC",
    loanAmount: "100000",
    maxRepayment: "112000",
    currentBid: "105500",
    currentBidder: CHARLIE, // Charlie is winning bidder
    bidCount: 11,
    auctionEndTime: Date.now() + 22 * 60 * 1000, // 22 minutes
    loanDuration: "180d",
    status: "ending_soon",
    createdAt: Date.now() - 23.5 * 60 * 60 * 1000,
    txHash: "0x567890124ef12345678901234ef123456789012ef12345678901234ef1234567",
  },
];

interface AuctionStore {
  auctions: Auction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createAuction: (
    params: contracts.CreateAuctionParams,
    borrower: `0x${string}`
  ) => Promise<Auction>;
  placeBid: (
    auctionId: string,
    bidAmount: string,
    bidder: `0x${string}`
  ) => Promise<void>;
  finalizeAuction: (auctionId: string) => Promise<void>;
  cancelAuction: (auctionId: string) => Promise<void>;
  getAuction: (auctionId: string) => Auction | undefined;
  getUserAuctions: (address: `0x${string}`) => Auction[];
  getActiveAuctions: () => Auction[];
  updateAuctionStatuses: () => void;
}

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  auctions: initialAuctions,
  isLoading: false,
  error: null,

  createAuction: async (params, borrower) => {
    set({ isLoading: true, error: null });

    try {
      const result = await contracts.createAuction(params);

      const auctionDurationMs = parseDuration(params.auctionDuration);

      const newAuction: Auction = {
        id: generateAuctionId(),
        borrower,
        collateralToken: params.collateralToken,
        collateralAmount: params.collateralAmount,
        loanToken: params.loanToken,
        loanAmount: params.loanAmount,
        maxRepayment: params.maxRepayment,
        currentBid: null,
        currentBidder: null,
        bidCount: 0,
        auctionEndTime: Date.now() + auctionDurationMs,
        loanDuration: params.loanDuration,
        status: "active",
        createdAt: Date.now(),
        txHash: result.txHash,
      };

      set((state) => ({
        auctions: [newAuction, ...state.auctions],
        isLoading: false,
      }));

      // Track analytics event
      analytics.auctionCreated(params.collateralToken, params.loanToken, params.loanAmount, borrower);

      return newAuction;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  placeBid: async (auctionId, bidAmount, bidder) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.placeBid({ auctionId, bidAmount });

      set((state) => ({
        auctions: state.auctions.map((auction) =>
          auction.id === auctionId
            ? {
              ...auction,
              currentBid: bidAmount,
              currentBidder: bidder,
              bidCount: auction.bidCount + 1,
            }
            : auction
        ),
        isLoading: false,
      }));

      // Track analytics event
      analytics.bidPlaced(auctionId, bidAmount, bidder);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place bid";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  finalizeAuction: async (auctionId) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.finalizeAuction(auctionId);

      // Create loan from finalized auction
      const auction = get().auctions.find((a) => a.id === auctionId);
      if (auction && auction.currentBid && auction.currentBidder) {
        useLoanStore.getState().createLoanFromAuction(auction);

        // Track analytics event
        analytics.auctionFinalized(auctionId, auction.currentBid, auction.currentBidder);
      }

      set((state) => ({
        auctions: state.auctions.map((auction) =>
          auction.id === auctionId
            ? { ...auction, status: "finalized" as AuctionStatus }
            : auction
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to finalize auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelAuction: async (auctionId) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.cancelAuction(auctionId);

      set((state) => ({
        auctions: state.auctions.map((auction) =>
          auction.id === auctionId
            ? { ...auction, status: "cancelled" as AuctionStatus }
            : auction
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getAuction: (auctionId) => {
    return get().auctions.find((a) => a.id === auctionId);
  },

  getUserAuctions: (address) => {
    return get().auctions.filter(
      (a) => a.borrower.toLowerCase() === address.toLowerCase()
    );
  },

  getActiveAuctions: () => {
    return get().auctions.filter(
      (a) => a.status === "active" || a.status === "ending_soon"
    );
  },

  updateAuctionStatuses: () => {
    const now = Date.now();
    set((state) => ({
      auctions: state.auctions.map((auction) => {
        if (auction.status === "finalized" || auction.status === "cancelled") {
          return auction;
        }

        const timeLeft = auction.auctionEndTime - now;

        if (timeLeft <= 0) {
          return { ...auction, status: "ended" as AuctionStatus };
        } else if (timeLeft <= 60 * 60 * 1000) {
          // Less than 1 hour
          return { ...auction, status: "ending_soon" as AuctionStatus };
        }
        return { ...auction, status: "active" as AuctionStatus };
      }),
    }));
  },
}));
