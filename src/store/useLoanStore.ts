import { create } from "zustand";
import type { Loan, LoanStatus, Auction } from "@/types";
import * as contracts from "@/lib/mockContracts";

// Helper to generate loan ID
function generateLoanId(): string {
  return `L${Math.floor(Math.random() * 9000) + 1000}`;
}

// Helper to generate NFT ID
function generateNftId(): string {
  return `NFT-${Math.floor(Math.random() * 90000) + 10000}`;
}

// Initial mock loans
const initialLoans: Loan[] = [
  {
    id: "L2001",
    auctionId: "#0998",
    borrower: "0x1234567890abcdef1234567890abcdef12345678",
    lender: "0xabcdef1234567890abcdef1234567890abcdef12",
    collateralToken: "WBTC",
    collateralAmount: "0.5",
    loanToken: "USDC",
    loanAmount: "20000",
    repaymentAmount: "21500",
    startTime: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    maturityTime: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
    gracePeriodEnd: Date.now() + 16 * 24 * 60 * 60 * 1000,
    status: "active",
    borrowerNftId: "NFT-10001",
    lenderNftId: "NFT-10002",
    txHash: "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
  },
  {
    id: "L2002",
    auctionId: "#0997",
    borrower: "0x2345678901bcdef12345678901bcdef123456789",
    lender: "0xbcdef12345678901bcdef12345678901bcdef123",
    collateralToken: "ETH",
    collateralAmount: "5",
    loanToken: "USDC",
    loanAmount: "10000",
    repaymentAmount: "10800",
    startTime: Date.now() - 28 * 24 * 60 * 60 * 1000, // 28 days ago
    maturityTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
    gracePeriodEnd: Date.now() + 3 * 24 * 60 * 60 * 1000,
    status: "active",
    borrowerNftId: "NFT-10003",
    lenderNftId: "NFT-10004",
    txHash: "0xdef456789abc123def456789abc123def456789abc123def456789abc123def4",
  },
  {
    id: "L2003",
    auctionId: "#0996",
    borrower: "0x3456789012cdef123456789012cdef1234567890",
    lender: "0xcdef123456789012cdef123456789012cdef1234",
    collateralToken: "WBTC",
    collateralAmount: "1.0",
    loanToken: "USDT",
    loanAmount: "40000",
    repaymentAmount: "43200",
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    maturityTime: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago (grace period)
    gracePeriodEnd: Date.now() + 12 * 60 * 60 * 1000,
    status: "grace_period",
    borrowerNftId: "NFT-10005",
    lenderNftId: "NFT-10006",
    txHash: "0x789abc123def456789abc123def456789abc123def456789abc123def456789a",
  },
];

interface LoanStore {
  loans: Loan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createLoanFromAuction: (auction: Auction) => Loan;
  repayLoan: (loanId: string) => Promise<void>;
  claimCollateral: (loanId: string) => Promise<void>;
  getLoan: (loanId: string) => Loan | undefined;
  getUserLoansAsBorrower: (address: `0x${string}`) => Loan[];
  getUserLoansAsLender: (address: `0x${string}`) => Loan[];
  getActiveLoans: () => Loan[];
  updateLoanStatuses: () => void;
}

export const useLoanStore = create<LoanStore>((set, get) => ({
  loans: initialLoans,
  isLoading: false,
  error: null,

  createLoanFromAuction: (auction) => {
    if (!auction.currentBid || !auction.currentBidder) {
      throw new Error("Auction has no winning bid");
    }

    // Parse loan duration
    const durationDays = parseInt(auction.loanDuration);
    const durationMs = durationDays * 24 * 60 * 60 * 1000;

    const newLoan: Loan = {
      id: generateLoanId(),
      auctionId: auction.id,
      borrower: auction.borrower,
      lender: auction.currentBidder,
      collateralToken: auction.collateralToken,
      collateralAmount: auction.collateralAmount,
      loanToken: auction.loanToken,
      loanAmount: auction.loanAmount,
      repaymentAmount: auction.currentBid,
      startTime: Date.now(),
      maturityTime: Date.now() + durationMs,
      gracePeriodEnd: Date.now() + durationMs + 24 * 60 * 60 * 1000, // +24h grace
      status: "active",
      borrowerNftId: generateNftId(),
      lenderNftId: generateNftId(),
      txHash: auction.txHash,
    };

    set((state) => ({
      loans: [newLoan, ...state.loans],
    }));

    return newLoan;
  },

  repayLoan: async (loanId) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.repayLoan(loanId);

      set((state) => ({
        loans: state.loans.map((loan) =>
          loan.id === loanId
            ? { ...loan, status: "repaid" as LoanStatus }
            : loan
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to repay loan";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  claimCollateral: async (loanId) => {
    set({ isLoading: true, error: null });

    try {
      await contracts.claimCollateral(loanId);

      set((state) => ({
        loans: state.loans.map((loan) =>
          loan.id === loanId
            ? { ...loan, status: "defaulted" as LoanStatus }
            : loan
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to claim collateral";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getLoan: (loanId) => {
    return get().loans.find((l) => l.id === loanId);
  },

  getUserLoansAsBorrower: (address) => {
    return get().loans.filter(
      (l) => l.borrower.toLowerCase() === address.toLowerCase()
    );
  },

  getUserLoansAsLender: (address) => {
    return get().loans.filter(
      (l) => l.lender.toLowerCase() === address.toLowerCase()
    );
  },

  getActiveLoans: () => {
    return get().loans.filter(
      (l) => l.status === "active" || l.status === "grace_period" || l.status === "overdue"
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
          return { ...loan, status: "overdue" as LoanStatus };
        } else if (now > loan.maturityTime) {
          return { ...loan, status: "grace_period" as LoanStatus };
        }
        return { ...loan, status: "active" as LoanStatus };
      }),
    }));
  },
}));
