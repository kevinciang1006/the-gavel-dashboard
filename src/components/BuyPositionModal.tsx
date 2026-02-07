import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Copy, CheckCircle2 } from "lucide-react";

interface BuyPositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    type: "Borrower" | "Lender";
    collateral: string;
    loan: string;
    repayment: string;
    apr: string;
    askingPrice: number;
    marketValue: number;
    seller: string;
    timeLeft: string;
  };
}

const BuyPositionModal = ({ open, onOpenChange, listing }: BuyPositionModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletBalance = 100000;
  const discount = listing.marketValue - listing.askingPrice;
  const discountPct = ((discount / listing.marketValue) * 100).toFixed(1);
  const afterPurchase = walletBalance - listing.askingPrice;
  const hasSufficient = walletBalance >= listing.askingPrice;
  const projectedProfit = parseFloat(listing.repayment.replace(/[^0-9.]/g, "")) - listing.askingPrice;

  const handleCopy = () => {
    navigator.clipboard.writeText(listing.seller);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePurchase = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">Purchase Position</DialogTitle>
            <Badge variant="muted" className="font-mono-numbers">{listing.id}</Badge>
          </div>
          <DialogDescription>Review and confirm your purchase</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position Details */}
          <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant={listing.type === "Borrower" ? "default" : "accent"}>{listing.type} Position</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-mono-numbers font-medium">{listing.collateral}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-mono-numbers font-medium">{listing.loan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Repayment</span>
              <span className="font-mono-numbers font-medium">{listing.repayment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Remaining</span>
              <span className="font-mono-numbers">{listing.timeLeft}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest</span>
              <Badge variant="accent" className="text-[10px]">{listing.apr}</Badge>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="rounded-lg border border-border p-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Seller</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 font-mono-numbers text-xs hover:text-accent transition-colors">
                {listing.seller}
                {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asking Price</span>
              <span className="font-mono-numbers text-lg font-bold">{listing.askingPrice.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Value</span>
              <span className="font-mono-numbers">{listing.marketValue.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Discount</span>
              <span className={`font-mono-numbers font-medium ${discount > 0 ? "text-success" : "text-destructive"}`}>
                {discount.toLocaleString()} USDC ({discount > 0 ? "-" : "+"}{Math.abs(parseFloat(discountPct))}%)
              </span>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available USDC</span>
              <span className="font-mono-numbers font-medium">{walletBalance.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After Purchase</span>
              <span className="font-mono-numbers font-medium">{afterPurchase.toLocaleString()} USDC</span>
            </div>
            {!hasSufficient && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Insufficient balance</span>
              </div>
            )}
          </div>

          {/* Transaction Summary */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Transaction Summary</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You Pay</span>
              <span className="font-mono-numbers font-bold">{listing.askingPrice.toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You Receive</span>
              <span className="font-medium">{listing.type} Position NFT {listing.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Return</span>
              <span className="font-mono-numbers">{listing.repayment} at maturity</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projected Profit</span>
              <span className="font-mono-numbers text-success font-medium">{projectedProfit.toLocaleString()} USDC</span>
            </div>
          </div>

          {/* Approval */}
          {!isApproved && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Step 1: Approve USDC spending</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsApproved(true)}>
                  Approve USDC
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
            I understand this is a final sale
          </label>
          <div className="flex gap-2 w-full sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="gradient"
              disabled={!agreed || !isApproved || !hasSufficient || isSubmitting}
              onClick={handlePurchase}
            >
              {isSubmitting ? "Processing..." : "Confirm Purchase"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyPositionModal;
