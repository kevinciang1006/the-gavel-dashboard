import { useState, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuctionStore } from "@/store/useAuctionStore";
import * as contracts from "@/lib/mockContracts";
import type { Auction } from "@/types";

interface PlaceBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: Auction;
}

const PlaceBidModal = ({ open, onOpenChange, auction }: PlaceBidModalProps) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const placeBid = useAuctionStore((state) => state.placeBid);

  const [bidAmount, setBidAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get USDC balance (mock for demo)
  const { data: balance } = useBalance({
    address,
    // Use USDC address for Arbitrum Sepolia
    token: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  });

  const userBalance = balance ? parseFloat(balance.formatted) : 100000; // Mock 100k for demo

  const currentBidNum = auction.currentBid ? parseFloat(auction.currentBid) : parseFloat(auction.maxRepayment);
  const loanAmountNum = parseFloat(auction.loanAmount);
  const bidNum = parseFloat(bidAmount) || 0;

  // Validation
  const validation = useMemo(() => {
    if (!bidAmount || bidNum <= 0) {
      return { valid: false, message: "Enter a bid amount" };
    }
    if (bidNum < loanAmountNum) {
      return { valid: false, message: `Bid must be at least ${loanAmountNum.toLocaleString()} ${auction.loanToken}` };
    }
    if (bidNum >= currentBidNum) {
      return { valid: false, message: `Bid must be lower than current bid (${currentBidNum.toLocaleString()})` };
    }
    if (bidNum > userBalance) {
      return { valid: false, message: "Insufficient balance" };
    }
    return { valid: true, message: "Your bid wins!" };
  }, [bidAmount, bidNum, loanAmountNum, currentBidNum, userBalance, auction.loanToken]);

  // Calculate returns
  const interest = bidNum >= loanAmountNum ? ((bidNum - loanAmountNum) / loanAmountNum * 100).toFixed(1) : null;
  const profit = bidNum >= loanAmountNum ? (bidNum - loanAmountNum).toFixed(0) : null;
  const roi = bidNum >= loanAmountNum ? ((bidNum - loanAmountNum) / bidNum * 100).toFixed(1) : null;

  const handleApprove = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setIsApproving(true);
    try {
      await contracts.approveToken(auction.loanToken, "AuctionHouse", bidAmount);
      setIsApproved(true);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (!validation.valid) return;

    setIsSubmitting(true);
    try {
      await placeBid(auction.id, bidAmount, address);
      onOpenChange(false);
      // Reset state
      setBidAmount("");
      setIsApproved(false);
    } catch (error) {
      console.error("Bid failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Place Your Bid</DialogTitle>
          <DialogDescription>Auction {auction.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Auction Details */}
          <div className="rounded-lg bg-secondary/50 p-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-mono-numbers font-medium">
                {auction.collateralAmount} {auction.collateralToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-mono-numbers font-medium">
                {parseFloat(auction.loanAmount).toLocaleString()} {auction.loanToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Best Bid</span>
              <span className="font-mono-numbers font-medium">
                {auction.currentBid
                  ? `${parseFloat(auction.currentBid).toLocaleString()} ${auction.loanToken}`
                  : `${parseFloat(auction.maxRepayment).toLocaleString()} ${auction.loanToken} (max)`}
              </span>
            </div>
            {auction.currentBidder && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Bidder</span>
                <span className="font-mono-numbers text-xs">
                  {auction.currentBidder.slice(0, 6)}...{auction.currentBidder.slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Wallet</span>
              <span className="font-mono-numbers font-medium text-accent">
                {userBalance.toLocaleString()} {auction.loanToken}
              </span>
            </div>
          </div>

          {/* Bid Input */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your Bid (Repayment Amount)</label>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="bg-input border-border font-mono-numbers text-lg h-12"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Lower = Better for Borrower | Min: {loanAmountNum.toLocaleString()} {auction.loanToken}
            </p>
            {bidNum > 0 && (
              <div className="mt-2">
                {validation.valid ? (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> {validation.message}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-destructive">
                    <XCircle className="h-4 w-4" /> {validation.message}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Calculations */}
          {bidNum >= loanAmountNum && (
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-mono-numbers text-accent">~{interest}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Profit</span>
                <span className="font-mono-numbers font-medium">
                  {Number(profit).toLocaleString()} {auction.loanToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI</span>
                <span className="font-mono-numbers font-medium">{roi}%</span>
              </div>
            </div>
          )}

          {/* Approval */}
          {!isApproved && isConnected && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">First, approve {auction.loanToken} spending</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleApprove}
                  disabled={isApproving || !bidAmount}
                >
                  {isApproving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                  ) : (
                    `Approve ${auction.loanToken}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">{auction.loanToken} approved for spending</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!validation.valid || !isApproved || isSubmitting || !isConnected}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              "Submit Bid"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceBidModal;
