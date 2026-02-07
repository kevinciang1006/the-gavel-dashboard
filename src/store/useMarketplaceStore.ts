import { create } from "zustand";
import type { MarketplaceListing, Loan, ListingStatus } from "@/types";
import * as contracts from "@/lib/mockContracts";

// Helper to generate listing ID
function generateListingId(): string {
  return `MKT-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Mock loan for listings
const mockLoan: Loan = {
  id: "L1999",
  auctionId: "#0995",
  borrower: "0x9876543210fedcba9876543210fedcba98765432",
  lender: "0xfedcba9876543210fedcba9876543210fedcba98",
  collateralToken: "ETH",
  collateralAmount: "3.5",
  loanToken: "USDC",
  loanAmount: "8000",
  repaymentAmount: "8640",
  startTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
  maturityTime: Date.now() + 20 * 24 * 60 * 60 * 1000,
  gracePeriodEnd: Date.now() + 21 * 24 * 60 * 60 * 1000,
  status: "active",
  borrowerNftId: "NFT-20001",
  lenderNftId: "NFT-20002",
  txHash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
};

// Initial mock listings
const initialListings: MarketplaceListing[] = [
  {
    id: "MKT-3001",
    loanId: "L1999",
    seller: "0xfedcba9876543210fedcba9876543210fedcba98",
    nftType: "lender",
    price: "9000",
    loanToken: "USDC",
    status: "active",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    loan: mockLoan,
  },
  {
    id: "MKT-3002",
    loanId: "L2001",
    seller: "0xabcdef1234567890abcdef1234567890abcdef12",
    nftType: "lender",
    price: "22000",
    loanToken: "USDC",
    status: "active",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    loan: {
      id: "L2001",
      auctionId: "#0998",
      borrower: "0x1234567890abcdef1234567890abcdef12345678",
      lender: "0xabcdef1234567890abcdef1234567890abcdef12",
      collateralToken: "WBTC",
      collateralAmount: "0.5",
      loanToken: "USDC",
      loanAmount: "20000",
      repaymentAmount: "21500",
      startTime: Date.now() - 15 * 24 * 60 * 60 * 1000,
      maturityTime: Date.now() + 15 * 24 * 60 * 60 * 1000,
      gracePeriodEnd: Date.now() + 16 * 24 * 60 * 60 * 1000,
      status: "active",
      borrowerNftId: "NFT-10001",
      lenderNftId: "NFT-10002",
      txHash: "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
    },
  },
];

interface MarketplaceStore {
  listings: MarketplaceListing[];
  isLoading: boolean;
  error: string | null;

  // Actions
  listPosition: (
    loan: Loan,
    nftType: "borrower" | "lender",
    price: string,
    seller: `0x${string}`
  ) => Promise<MarketplaceListing>;
  buyPosition: (listingId: string, buyer: `0x${string}`) => Promise<void>;
  cancelListing: (listingId: string) => Promise<void>;
  getListing: (listingId: string) => MarketplaceListing | undefined;
  getActiveListings: () => MarketplaceListing[];
  getUserListings: (address: `0x${string}`) => MarketplaceListing[];
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  listings: initialListings,
  isLoading: false,
  error: null,

  listPosition: async (loan, nftType, price, seller) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.listPosition({
        loanId: loan.id,
        nftType,
        price,
      });

      const newListing: MarketplaceListing = {
        id: generateListingId(),
        loanId: loan.id,
        seller,
        nftType,
        price,
        loanToken: loan.loanToken,
        status: "active",
        createdAt: Date.now(),
        loan,
      };

      set((state) => ({
        listings: [newListing, ...state.listings],
        isLoading: false,
      }));

      return newListing;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list position";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  buyPosition: async (listingId, buyer) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.buyPosition(listingId);

      set((state) => ({
        listings: state.listings.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: "sold" as ListingStatus }
            : listing
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to buy position";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelListing: async (listingId) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.cancelListing(listingId);

      set((state) => ({
        listings: state.listings.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: "cancelled" as ListingStatus }
            : listing
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel listing";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getListing: (listingId) => {
    return get().listings.find((l) => l.id === listingId);
  },

  getActiveListings: () => {
    return get().listings.filter((l) => l.status === "active");
  },

  getUserListings: (address) => {
    return get().listings.filter(
      (l) => l.seller.toLowerCase() === address.toLowerCase()
    );
  },
}));
