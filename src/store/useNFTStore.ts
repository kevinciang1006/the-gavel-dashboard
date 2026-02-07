import { create } from "zustand";
import * as contracts from "@/lib/mockContracts";
import { analytics } from "@/lib/analytics";

// ============================================
// TYPES
// ============================================

export interface NFT {
  id: string;
  collection: string;
  tokenId: string;
  image: string;
  whitelisted: boolean;
  floorPrice: string;
  category: string;
  owner: string;
}

export interface NFTBid {
  bidder: string;
  amount: string; // Repayment amount (lower is better for borrower)
  apr: number;
  timestamp: number;
}

export type NFTAuctionStatus = "active" | "ending_soon" | "ended" | "finalized" | "cancelled";

export interface NFTAuction {
  id: string;
  nftId: string;
  collection: string;
  tokenId: string;
  borrower: string;
  loanAmount: string;
  loanToken: string;
  maxRepayment: string;
  currentBid: string | null;
  currentBidder: string | null;
  bids: NFTBid[];
  bidCount: number;
  auctionEndTime: number;
  loanDuration: string;
  status: NFTAuctionStatus;
  createdAt: number;
}

export type NFTLoanStatus = "active" | "grace_period" | "overdue" | "repaid" | "defaulted";

export interface NFTLoan {
  id: string;
  nftId: string;
  collection: string;
  tokenId: string;
  borrower: string;
  lender: string;
  loanAmount: string;
  loanToken: string;
  repaymentAmount: string;
  apr: number;
  startTime: number;
  maturityTime: number;
  gracePeriodEnd: number; // 24 hours after maturity
  status: NFTLoanStatus;
}

// ============================================
// INITIAL DATA
// ============================================

import { DEMO_USERS } from "./useDemoWalletStore";

// Use addresses from the demo wallet store for consistency
const DEMO_ADDRESSES = {
  alice: DEMO_USERS.userA.address,
  bob: DEMO_USERS.userB.address,
  charlie: DEMO_USERS.userC.address,
};

const initialNFTs: NFT[] = [
  {
    id: "nft-1",
    collection: "Bored Ape Yacht Club",
    tokenId: "#1234",
    image: "",
    whitelisted: true,
    floorPrice: "~45 ETH",
    category: "PFP",
    owner: DEMO_ADDRESSES.alice,
  },
  {
    id: "nft-2",
    collection: "CryptoPunks",
    tokenId: "#5678",
    image: "",
    whitelisted: true,
    floorPrice: "~38 ETH",
    category: "PFP",
    owner: DEMO_ADDRESSES.alice,
  },
  {
    id: "nft-3",
    collection: "Art Blocks Curated",
    tokenId: "#901",
    image: "",
    whitelisted: true,
    floorPrice: "~12 ETH",
    category: "Art",
    owner: DEMO_ADDRESSES.alice,
  },
  {
    id: "nft-4",
    collection: "Decentraland Land",
    tokenId: "#2345",
    image: "",
    whitelisted: false,
    floorPrice: "~2 ETH",
    category: "Gaming",
    owner: DEMO_ADDRESSES.bob,
  },
  {
    id: "nft-5",
    collection: "ENS Domains",
    tokenId: "gavel.eth",
    image: "",
    whitelisted: false,
    floorPrice: "~0.5 ETH",
    category: "Domains",
    owner: DEMO_ADDRESSES.bob,
  },
];

const initialAuctions: NFTAuction[] = [
  {
    id: "nft-auction-1",
    nftId: "nft-in-auction-1",
    collection: "Bored Ape Yacht Club",
    tokenId: "#4567",
    borrower: DEMO_ADDRESSES.alice,
    loanAmount: "10000",
    loanToken: "USDC",
    maxRepayment: "11500",
    currentBid: "10800",
    currentBidder: DEMO_ADDRESSES.bob,
    bids: [
      { bidder: DEMO_ADDRESSES.bob, amount: "10800", apr: 8.0, timestamp: Date.now() - 15 * 60 * 1000 },
      { bidder: DEMO_ADDRESSES.charlie, amount: "11100", apr: 11.0, timestamp: Date.now() - 45 * 60 * 1000 },
      { bidder: DEMO_ADDRESSES.bob, amount: "11300", apr: 13.0, timestamp: Date.now() - 90 * 60 * 1000 },
    ],
    bidCount: 3,
    auctionEndTime: Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000, // 2h 15m
    loanDuration: "30d",
    status: "active",
    createdAt: Date.now() - 22 * 60 * 60 * 1000,
  },
  {
    id: "nft-auction-2",
    nftId: "nft-in-auction-2",
    collection: "CryptoPunks",
    tokenId: "#8901",
    borrower: DEMO_ADDRESSES.bob,
    loanAmount: "15000",
    loanToken: "USDC",
    maxRepayment: "17250",
    currentBid: "16100",
    currentBidder: DEMO_ADDRESSES.alice,
    bids: [
      { bidder: DEMO_ADDRESSES.alice, amount: "16100", apr: 7.3, timestamp: Date.now() - 10 * 60 * 1000 },
      { bidder: DEMO_ADDRESSES.charlie, amount: "16400", apr: 9.3, timestamp: Date.now() - 30 * 60 * 1000 },
    ],
    bidCount: 7,
    auctionEndTime: Date.now() + 8 * 60 * 60 * 1000 + 40 * 60 * 1000, // 8h 40m
    loanDuration: "60d",
    status: "active",
    createdAt: Date.now() - 15 * 60 * 60 * 1000,
  },
  {
    id: "nft-auction-3",
    nftId: "nft-in-auction-3",
    collection: "Art Blocks Curated",
    tokenId: "#234",
    borrower: DEMO_ADDRESSES.alice,
    loanAmount: "5000",
    loanToken: "USDC",
    maxRepayment: "5750",
    currentBid: "5200",
    currentBidder: DEMO_ADDRESSES.charlie,
    bids: [
      { bidder: DEMO_ADDRESSES.charlie, amount: "5200", apr: 4.0, timestamp: Date.now() - 5 * 60 * 1000 },
    ],
    bidCount: 1,
    auctionEndTime: Date.now() + 45 * 60 * 1000, // 45m - ending soon
    loanDuration: "14d",
    status: "ending_soon",
    createdAt: Date.now() - 23 * 60 * 60 * 1000,
  },
];

const initialLoans: NFTLoan[] = [
  {
    id: "nft-loan-1",
    nftId: "nft-in-loan-1",
    collection: "Bored Ape Yacht Club",
    tokenId: "#7890",
    borrower: DEMO_ADDRESSES.alice,
    lender: DEMO_ADDRESSES.bob,
    loanAmount: "10000",
    loanToken: "USDC",
    repaymentAmount: "11500",
    apr: 15.0,
    startTime: Date.now() - 18 * 24 * 60 * 60 * 1000, // 18 days ago
    maturityTime: Date.now() + 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000, // 12d 5h from now
    gracePeriodEnd: Date.now() + 13 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000,
    status: "active",
  },
  {
    id: "nft-loan-2",
    nftId: "nft-in-loan-2",
    collection: "CryptoPunks",
    tokenId: "#3456",
    borrower: DEMO_ADDRESSES.bob,
    lender: DEMO_ADDRESSES.alice,
    loanAmount: "8000",
    loanToken: "USDC",
    repaymentAmount: "8960",
    apr: 12.0,
    startTime: Date.now() - 27 * 24 * 60 * 60 * 1000, // 27 days ago
    maturityTime: Date.now() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000, // 3d 8h from now
    gracePeriodEnd: Date.now() + 4 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000,
    status: "active",
  },
  {
    id: "nft-loan-3",
    nftId: "nft-in-loan-3",
    collection: "Art Blocks Curated",
    tokenId: "#567",
    borrower: DEMO_ADDRESSES.charlie,
    lender: DEMO_ADDRESSES.alice,
    loanAmount: "5000",
    loanToken: "USDC",
    repaymentAmount: "5400",
    apr: 8.0,
    startTime: Date.now() - 32 * 24 * 60 * 60 * 1000,
    maturityTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // Overdue by 2 days
    gracePeriodEnd: Date.now() - 1 * 24 * 60 * 60 * 1000, // Grace period ended 1 day ago
    status: "overdue",
  },
];

// ============================================
// STORE
// ============================================

interface NFTStore {
  // State
  nfts: NFT[];
  auctions: NFTAuction[];
  loans: NFTLoan[];
  isLoading: boolean;
  error: string | null;

  // NFT Actions
  mintNFT: (owner: string) => Promise<NFT>;
  getUserNFTs: (address: string) => NFT[];

  // Auction Actions
  createNFTAuction: (params: {
    nftId: string;
    borrower: string;
    loanAmount: string;
    loanToken: string;
    maxRepayment: string;
    loanDuration: string;
    auctionDuration: string;
  }) => Promise<NFTAuction>;
  placeBidOnNFT: (auctionId: string, bidAmount: string, bidder: string) => Promise<void>;
  finalizeNFTAuction: (auctionId: string) => Promise<NFTLoan>;
  cancelNFTAuction: (auctionId: string) => Promise<void>;
  getUserAuctions: (address: string) => NFTAuction[];
  getActiveAuctions: () => NFTAuction[];
  updateAuctionStatuses: () => void;

  // Loan Actions
  repayNFTLoan: (loanId: string, borrower: string) => Promise<void>;
  claimNFT: (loanId: string, lender: string) => Promise<void>;
  getUserLoans: (address: string) => NFTLoan[];
  updateLoanStatuses: () => void;
}

// Helper to generate IDs
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to parse duration string to milliseconds
function parseDuration(duration: string): number {
  const value = parseInt(duration);
  if (duration.endsWith("h")) return value * 60 * 60 * 1000;
  if (duration.endsWith("d")) return value * 24 * 60 * 60 * 1000;
  return value * 1000;
}

export const useNFTStore = create<NFTStore>((set, get) => ({
  nfts: initialNFTs,
  auctions: initialAuctions,
  loans: initialLoans,
  isLoading: false,
  error: null,

  // ============================================
  // NFT ACTIONS
  // ============================================

  mintNFT: async (owner) => {
    set({ isLoading: true, error: null });

    try {
      const result = await contracts.mintTestNFT("Test Collection");

      const newNFT: NFT = {
        id: generateId("nft"),
        collection: "Test Collection",
        tokenId: `#${result.tokenId}`,
        image: "",
        whitelisted: true,
        floorPrice: "~0.1 ETH",
        category: "Art",
        owner: owner.toLowerCase(),
      };

      set((state) => ({
        nfts: [...state.nfts, newNFT],
        isLoading: false,
      }));

      analytics.nftMinted(newNFT.collection, newNFT.tokenId, owner);

      return newNFT;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mint NFT";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getUserNFTs: (address) => {
    return get().nfts.filter(
      (nft) => nft.owner.toLowerCase() === address.toLowerCase()
    );
  },

  // ============================================
  // AUCTION ACTIONS
  // ============================================

  createNFTAuction: async (params) => {
    set({ isLoading: true, error: null });

    try {
      // Find the NFT
      const nft = get().nfts.find((n) => n.id === params.nftId);
      if (!nft) throw new Error("NFT not found");

      // Call mock contract
      await contracts.createAuction({
        collateralToken: "ETH", // NFT treated as ETH for mock
        collateralAmount: "1",
        loanToken: params.loanToken as "USDC" | "USDT",
        loanAmount: params.loanAmount,
        maxRepayment: params.maxRepayment,
        loanDuration: params.loanDuration,
        auctionDuration: params.auctionDuration,
      });

      const auctionDurationMs = parseDuration(params.auctionDuration);

      const newAuction: NFTAuction = {
        id: generateId("nft-auction"),
        nftId: params.nftId,
        collection: nft.collection,
        tokenId: nft.tokenId,
        borrower: params.borrower.toLowerCase(),
        loanAmount: params.loanAmount,
        loanToken: params.loanToken,
        maxRepayment: params.maxRepayment,
        currentBid: null,
        currentBidder: null,
        bids: [],
        bidCount: 0,
        auctionEndTime: Date.now() + auctionDurationMs,
        loanDuration: params.loanDuration,
        status: "active",
        createdAt: Date.now(),
      };

      // Remove NFT from user's collection (it's now in auction)
      set((state) => ({
        nfts: state.nfts.filter((n) => n.id !== params.nftId),
        auctions: [...state.auctions, newAuction],
        isLoading: false,
      }));

      analytics.auctionCreated("NFT", params.loanToken, params.loanAmount, params.borrower);

      return newAuction;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  placeBidOnNFT: async (auctionId, bidAmount, bidder) => {
    set({ isLoading: true, error: null });

    try {
      const auction = get().auctions.find((a) => a.id === auctionId);
      if (!auction) throw new Error("Auction not found");

      // Validate bid (must be lower than current bid for NFT auctions)
      const currentBidAmount = auction.currentBid ? parseFloat(auction.currentBid) : parseFloat(auction.maxRepayment);
      if (parseFloat(bidAmount) >= currentBidAmount) {
        throw new Error("Bid must be lower than current winning bid");
      }

      if (parseFloat(bidAmount) < parseFloat(auction.loanAmount)) {
        throw new Error("Bid cannot be lower than loan amount");
      }

      await contracts.placeBid({ auctionId, bidAmount });

      const loanAmount = parseFloat(auction.loanAmount);
      const apr = ((parseFloat(bidAmount) - loanAmount) / loanAmount) * 100;

      const newBid: NFTBid = {
        bidder: bidder.toLowerCase(),
        amount: bidAmount,
        apr,
        timestamp: Date.now(),
      };

      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auctionId
            ? {
              ...a,
              currentBid: bidAmount,
              currentBidder: bidder.toLowerCase(),
              bids: [newBid, ...a.bids],
              bidCount: a.bidCount + 1,
            }
            : a
        ),
        isLoading: false,
      }));

      analytics.bidPlaced(auctionId, bidAmount, bidder);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place bid";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  finalizeNFTAuction: async (auctionId) => {
    set({ isLoading: true, error: null });

    try {
      const auction = get().auctions.find((a) => a.id === auctionId);
      if (!auction) throw new Error("Auction not found");
      if (!auction.currentBid || !auction.currentBidder) {
        throw new Error("No bids to finalize");
      }

      await contracts.finalizeAuction(auctionId);

      const loanAmount = parseFloat(auction.loanAmount);
      const repaymentAmount = parseFloat(auction.currentBid);
      const loanDurationDays = parseInt(auction.loanDuration) || 30;
      const apr = ((repaymentAmount - loanAmount) / loanAmount) * (365 / loanDurationDays) * 100;

      const maturityTime = Date.now() + parseDuration(auction.loanDuration);
      const gracePeriodEnd = maturityTime + 24 * 60 * 60 * 1000; // 24 hours grace

      const newLoan: NFTLoan = {
        id: generateId("nft-loan"),
        nftId: auction.nftId,
        collection: auction.collection,
        tokenId: auction.tokenId,
        borrower: auction.borrower,
        lender: auction.currentBidder,
        loanAmount: auction.loanAmount,
        loanToken: auction.loanToken,
        repaymentAmount: auction.currentBid,
        apr,
        startTime: Date.now(),
        maturityTime,
        gracePeriodEnd,
        status: "active",
      };

      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auctionId ? { ...a, status: "finalized" as NFTAuctionStatus } : a
        ),
        loans: [...state.loans, newLoan],
        isLoading: false,
      }));

      // Track analytics
      if (auction.currentBid && auction.currentBidder) {
        analytics.auctionFinalized(auctionId, auction.currentBid, auction.currentBidder);
      }

      return newLoan;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to finalize auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelNFTAuction: async (auctionId) => {
    set({ isLoading: true, error: null });

    try {
      const auction = get().auctions.find((a) => a.id === auctionId);
      if (!auction) throw new Error("Auction not found");

      await contracts.cancelAuction(auctionId);

      // Return NFT to owner
      const returnedNFT: NFT = {
        id: auction.nftId,
        collection: auction.collection,
        tokenId: auction.tokenId,
        image: "",
        whitelisted: true,
        floorPrice: "~1 ETH",
        category: "Art",
        owner: auction.borrower,
      };

      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auctionId ? { ...a, status: "cancelled" as NFTAuctionStatus } : a
        ),
        nfts: [...state.nfts, returnedNFT],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel auction";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getUserAuctions: (address) => {
    return get().auctions.filter(
      (a) => a.borrower.toLowerCase() === address.toLowerCase() &&
        (a.status === "active" || a.status === "ending_soon" || a.status === "ended")
    );
  },

  getActiveAuctions: () => {
    return get().auctions.filter(
      (a) => a.status === "active" || a.status === "ending_soon" || a.status === "ended"
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
          return { ...auction, status: "ended" as NFTAuctionStatus };
        } else if (timeLeft <= 60 * 60 * 1000) {
          return { ...auction, status: "ending_soon" as NFTAuctionStatus };
        }
        return { ...auction, status: "active" as NFTAuctionStatus };
      }),
    }));
  },

  // ============================================
  // LOAN ACTIONS
  // ============================================

  repayNFTLoan: async (loanId, borrower) => {
    set({ isLoading: true, error: null });

    try {
      const loan = get().loans.find((l) => l.id === loanId);
      if (!loan) throw new Error("Loan not found");
      if (loan.borrower.toLowerCase() !== borrower.toLowerCase()) {
        throw new Error("Only the borrower can repay this loan");
      }
      if (loan.status === "repaid" || loan.status === "defaulted") {
        throw new Error("Loan is already closed");
      }

      await contracts.repayLoan(loanId);

      // Return NFT to borrower
      const returnedNFT: NFT = {
        id: loan.nftId,
        collection: loan.collection,
        tokenId: loan.tokenId,
        image: "",
        whitelisted: true,
        floorPrice: "~1 ETH",
        category: "Art",
        owner: loan.borrower,
      };

      set((state) => ({
        loans: state.loans.map((l) =>
          l.id === loanId ? { ...l, status: "repaid" as NFTLoanStatus } : l
        ),
        nfts: [...state.nfts, returnedNFT],
        isLoading: false,
      }));

      analytics.loanRepaid(loanId, loan.repaymentAmount, loan.borrower);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to repay loan";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  claimNFT: async (loanId, lender) => {
    set({ isLoading: true, error: null });

    try {
      const loan = get().loans.find((l) => l.id === loanId);
      if (!loan) throw new Error("Loan not found");
      if (loan.lender.toLowerCase() !== lender.toLowerCase()) {
        throw new Error("Only the lender can claim this NFT");
      }
      if (loan.status !== "overdue") {
        throw new Error("Loan is not in default");
      }
      if (Date.now() < loan.gracePeriodEnd) {
        throw new Error("Grace period has not ended yet");
      }

      await contracts.claimCollateral(loanId);

      // Transfer NFT to lender
      const claimedNFT: NFT = {
        id: loan.nftId,
        collection: loan.collection,
        tokenId: loan.tokenId,
        image: "",
        whitelisted: true,
        floorPrice: "~1 ETH",
        category: "Art",
        owner: loan.lender,
      };

      set((state) => ({
        loans: state.loans.map((l) =>
          l.id === loanId ? { ...l, status: "defaulted" as NFTLoanStatus } : l
        ),
        nfts: [...state.nfts, claimedNFT],
        isLoading: false,
      }));

      // Track analytics
      if (loan) {
        analytics.collateralClaimed(loanId, "NFT", loan.lender);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to claim NFT";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getUserLoans: (address) => {
    return get().loans.filter(
      (l) =>
        (l.borrower.toLowerCase() === address.toLowerCase() ||
          l.lender.toLowerCase() === address.toLowerCase()) &&
        (l.status === "active" || l.status === "grace_period" || l.status === "overdue")
    );
  },

  updateLoanStatuses: () => {
    const now = Date.now();
    set((state) => ({
      loans: state.loans.map((loan) => {
        if (loan.status === "repaid" || loan.status === "defaulted") {
          return loan;
        }

        if (now > loan.gracePeriodEnd) {
          return { ...loan, status: "overdue" as NFTLoanStatus };
        } else if (now > loan.maturityTime) {
          return { ...loan, status: "grace_period" as NFTLoanStatus };
        }
        return { ...loan, status: "active" as NFTLoanStatus };
      }),
    }));
  },
}));
