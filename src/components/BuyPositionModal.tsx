import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
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
import { AlertTriangle, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { useMarketplaceStore } from "@/store/useMarketplaceStore";
import type { MarketplaceListing } from "@/types";
import * as contracts from "@/lib/mockContracts";

interface BuyPositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MarketplaceListing;
}

const BuyPositionModal = ({ open, onOpenChange, listing }: BuyPositionModalProps) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const buyPosition = useMarketplaceStore((state) => state.buyPosition);

  const [agreed, setAgreed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletBalance = 100000; // Mock balance
  const askingPrice = parseFloat(listing.price);
  const loanValue = parseFloat(listing.loan.loanAmount);
  const repaymentValue = parseFloat(listing.loan.repaymentAmount);
  const discount = loanValue - askingPrice;
  const discountPct = ((discount / loanValue) * 100).toFixed(1);
  const afterPurchase = walletBalance - askingPrice;
  const hasSufficient = walletBalance >= askingPrice;
  const projectedProfit = repaymentValue - askingPrice;

  const handleCopy = () => {
    navigator.clipboard.writeText(listing.seller);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApprove = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setIsApproving(true);
    try {
      await contracts.approveToken(listing.loanToken, "Marketplace", listing.price);
      setIsApproved(true);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePurchase = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await buyPosition(listing.id, address);
      toast.success("Position purchased!", {
        description: `You now own ${listing.nftType} position ${listing.loanId}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsSubmitting(false);
    }
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
              <Badge variant={listing.nftType === "borrower" ? "default" : "accent"}>
                {listing.nftType === "borrower" ? "Borrower" : "Lender"} Position
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-mono-numbers font-medium">
                {listing.loan.collateralAmount} {listing.loan.collateralToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-mono-numbers font-medium">
                {parseFloat(listing.loan.loanAmount).toLocaleString()} {listing.loanToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Repayment</span>
              <span className="font-mono-numbers font-medium">
                {parseFloat(listing.loan.repaymentAmount).toLocaleString()} {listing.loanToken}
              </span>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="rounded-lg border border-border p-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Seller</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 font-mono-numbers text-xs hover:text-accent transition-colors">
                {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asking Price</span>
              <span className="font-mono-numbers text-lg font-bold">{askingPrice.toLocaleString()} {listing.loanToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Value</span>
              <span className="font-mono-numbers">{loanValue.toLocaleString()} {listing.loanToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Discount</span>
              <span className={`font-mono-numbers font-medium ${discount > 0 ? "text-success" : "text-destructive"}`}>
                {discount.toLocaleString()} {listing.loanToken} ({discount > 0 ? "-" : "+"}{Math.abs(parseFloat(discountPct))}%)
              </span>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available {listing.loanToken}</span>
              <span className="font-mono-numbers font-medium">{walletBalance.toLocaleString()} {listing.loanToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After Purchase</span>
              <span className="font-mono-numbers font-medium">{afterPurchase.toLocaleString()} {listing.loanToken}</span>
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
              <span className="font-mono-numbers font-bold">{askingPrice.toLocaleString()} {listing.loanToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You Receive</span>
              <span className="font-medium">{listing.nftType === "borrower" ? "Borrower" : "Lender"} Position NFT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Return</span>
              <span className="font-mono-numbers">{repaymentValue.toLocaleString()} {listing.loanToken} at maturity</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projected Profit</span>
              <span className="font-mono-numbers text-success font-medium">{projectedProfit.toLocaleString()} {listing.loanToken}</span>
            </div>
          </div>

          {/* Approval */}
          {!isApproved && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Step 1: Approve {listing.loanToken} spending</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleApprove}
                  disabled={isApproving || !isConnected}
                >
                  {isApproving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                  ) : (
                    `Approve ${listing.loanToken}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">{listing.loanToken} approved for spending</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
            I understand this is a final sale
          </label>
          <div className="flex gap-2 w-full sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={!agreed || !isApproved || !hasSufficient || isSubmitting || !isConnected}
              onClick={handlePurchase}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyPositionModal;
