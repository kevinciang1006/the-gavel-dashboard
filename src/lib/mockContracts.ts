// Mock smart contract interactions for demo purposes
// These simulate blockchain transactions with realistic delays

import { toast } from "sonner";
import type { TxResult } from "@/types";

// Generate a fake transaction hash
function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Simulate blockchain delay (2-4 seconds)
function simulateDelay(): Promise<void> {
  const delay = 2000 + Math.random() * 2000;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Generic transaction wrapper with toast notifications
async function executeTransaction<T>(
  operation: string,
  execute: () => Promise<T>
): Promise<T> {
  const toastId = toast.loading(`${operation}...`, {
    description: "Waiting for confirmation",
  });

  try {
    await simulateDelay();
    const result = await execute();

    toast.success(`${operation} successful!`, {
      id: toastId,
      description: "Transaction confirmed",
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction failed";
    toast.error(`${operation} failed`, {
      id: toastId,
      description: message,
    });
    throw error;
  }
}

// ============================================
// AUCTION CONTRACTS
// ============================================

export interface CreateAuctionParams {
  collateralToken: "WBTC" | "ETH";
  collateralAmount: string;
  loanToken: "USDC" | "USDT";
  loanAmount: string;
  maxRepayment: string;
  loanDuration: string;
  auctionDuration: string;
}

export async function createAuction(params: CreateAuctionParams): Promise<TxResult> {
  // Validate inputs
  if (parseFloat(params.collateralAmount) <= 0) {
    throw new Error("Collateral amount must be greater than 0");
  }
  if (parseFloat(params.loanAmount) <= 0) {
    throw new Error("Loan amount must be greater than 0");
  }
  if (parseFloat(params.maxRepayment) <= parseFloat(params.loanAmount)) {
    throw new Error("Max repayment must be greater than loan amount");
  }

  return executeTransaction("Creating auction", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export interface PlaceBidParams {
  auctionId: string;
  bidAmount: string;
}

export async function placeBid(params: PlaceBidParams): Promise<TxResult> {
  if (parseFloat(params.bidAmount) <= 0) {
    throw new Error("Bid amount must be greater than 0");
  }

  return executeTransaction("Placing bid", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function finalizeAuction(auctionId: string): Promise<TxResult> {
  return executeTransaction("Finalizing auction", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function cancelAuction(auctionId: string): Promise<TxResult> {
  return executeTransaction("Cancelling auction", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

// ============================================
// LOAN CONTRACTS
// ============================================

export async function repayLoan(loanId: string): Promise<TxResult> {
  return executeTransaction("Repaying loan", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function claimCollateral(loanId: string): Promise<TxResult> {
  return executeTransaction("Claiming collateral", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

// ============================================
// MARKETPLACE CONTRACTS
// ============================================

export interface ListPositionParams {
  loanId: string;
  nftType: "borrower" | "lender";
  price: string;
}

export async function listPosition(params: ListPositionParams): Promise<TxResult> {
  if (parseFloat(params.price) <= 0) {
    throw new Error("Price must be greater than 0");
  }

  return executeTransaction("Listing position", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function buyPosition(listingId: string): Promise<TxResult> {
  return executeTransaction("Buying position", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export interface MakeOfferParams {
  listingId: string;
  amount: string;
  expiresIn: string; // e.g., "24h"
}

export async function makeOffer(params: MakeOfferParams): Promise<TxResult> {
  if (parseFloat(params.amount) <= 0) {
    throw new Error("Offer amount must be greater than 0");
  }

  return executeTransaction("Making offer", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function cancelListing(listingId: string): Promise<TxResult> {
  return executeTransaction("Cancelling listing", async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

// ============================================
// TOKEN CONTRACTS (Approvals, Minting)
// ============================================

export async function approveToken(
  token: string,
  spender: string,
  amount: string
): Promise<TxResult> {
  return executeTransaction(`Approving ${token}`, async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

export async function mintTestTokens(token: string, amount: string): Promise<TxResult> {
  return executeTransaction(`Minting ${amount} ${token}`, async () => {
    const txHash = generateTxHash();
    return { success: true, txHash };
  });
}

// ============================================
// NFT CONTRACTS
// ============================================

export async function mintTestNFT(collection: string): Promise<TxResult & { tokenId: string }> {
  return executeTransaction("Minting NFT", async () => {
    const txHash = generateTxHash();
    const tokenId = Math.floor(Math.random() * 10000).toString();
    return { success: true, txHash, tokenId };
  });
}
