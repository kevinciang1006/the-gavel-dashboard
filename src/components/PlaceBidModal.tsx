import { useState } from "react";
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
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface PlaceBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: {
    id: string;
    collateral: string;
    loanAmount: string;
    currentBid: string;
    currentBidder: string;
    maxRepayment: string;
  };
}

const PlaceBidModal = ({ open, onOpenChange, auction }: PlaceBidModalProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBidNum = parseFloat(auction.currentBid.replace(/,/g, ""));
  const loanAmountNum = parseFloat(auction.loanAmount.replace(/,/g, ""));
  const bidNum = parseFloat(bidAmount) || 0;

  const isValidBid = bidNum > 0 && bidNum >= loanAmountNum && bidNum < currentBidNum;
  const isBetter = bidNum > 0 && bidNum < currentBidNum;
  const interest = bidNum > 0 && loanAmountNum > 0 ? ((bidNum - loanAmountNum) / loanAmountNum * 100).toFixed(1) : null;
  const profit = bidNum > 0 ? (bidNum - loanAmountNum).toFixed(0) : null;
  const roi = bidNum > 0 && loanAmountNum > 0 ? ((bidNum - loanAmountNum) / bidNum * 100).toFixed(1) : null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
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
              <span className="font-mono-numbers font-medium">{auction.collateral}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-mono-numbers font-medium">{auction.loanAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Best Bid</span>
              <span className="font-mono-numbers font-medium">{auction.currentBid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Bidder</span>
              <span className="font-mono-numbers text-xs">{auction.currentBidder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Wallet</span>
              <span className="font-mono-numbers font-medium text-accent">100,000 USDC</span>
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
              Lower = Better for Borrower | Min: {auction.loanAmount}
            </p>
            {bidNum > 0 && (
              <div className="mt-2">
                {isBetter ? (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> Your bid wins!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-destructive">
                    <XCircle className="h-4 w-4" /> Must be lower than current bid
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Calculations */}
          {bidNum > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-mono-numbers text-accent">~{interest}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Profit</span>
                <span className="font-mono-numbers font-medium">
                  {Number(profit).toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI</span>
                <span className="font-mono-numbers font-medium">{roi}%</span>
              </div>
            </div>
          )}

          {/* Approval */}
          {!isApproved && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">First, approve USDC spending</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsApproved(true)}
                >
                  Approve USDC
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!isValidBid || !isApproved || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceBidModal;