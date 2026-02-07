// Core types for The Gavel DeFi Lending Protocol

export type AuctionStatus = "active" | "ending_soon" | "ended" | "finalized" | "cancelled";
export type LoanStatus = "active" | "grace_period" | "overdue" | "repaid" | "defaulted";
export type ListingStatus = "active" | "sold" | "cancelled";

export interface Auction {
  id: string;
  borrower: `0x${string}`;
  collateralToken: "WBTC" | "ETH";
  collateralAmount: string;
  loanToken: "USDC" | "USDT";
  loanAmount: string;
  maxRepayment: string;
  currentBid: string | null;
  currentBidder: `0x${string}` | null;
  bidCount: number;
  auctionEndTime: number; // Unix timestamp
  loanDuration: string; // e.g., "30d"
  status: AuctionStatus;
  createdAt: number;
  txHash: string;
}

export interface Loan {
  id: string;
  auctionId: string;
  borrower: `0x${string}`;
  lender: `0x${string}`;
  collateralToken: "WBTC" | "ETH";
  collateralAmount: string;
  loanToken: "USDC" | "USDT";
  loanAmount: string;
  repaymentAmount: string;
  startTime: number;
  maturityTime: number;
  gracePeriodEnd: number;
  status: LoanStatus;
  borrowerNftId: string;
  lenderNftId: string;
  txHash: string;
}

export interface MarketplaceListing {
  id: string;
  loanId: string;
  seller: `0x${string}`;
  nftType: "borrower" | "lender";
  price: string;
  loanToken: "USDC" | "USDT";
  status: ListingStatus;
  createdAt: number;
  loan: Loan;
}

export interface Offer {
  id: string;
  listingId: string;
  offerer: `0x${string}`;
  amount: string;
  expiresAt: number;
  status: "pending" | "accepted" | "rejected" | "expired";
}

// Transaction result from mock contracts
export interface TxResult {
  success: boolean;
  txHash: string;
  error?: string;
}
