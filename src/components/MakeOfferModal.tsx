import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import * as contracts from "@/lib/mockContracts";
import type { MarketplaceListing } from "@/types";

interface MakeOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MarketplaceListing;
}

const MakeOfferModal = ({ open, onOpenChange, listing }: MakeOfferModalProps) => {
  const { isConnected } = useWallet();
  const { openConnectModal } = useConnectModal();

  const [offerAmount, setOfferAmount] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const offerNum = parseFloat(offerAmount) || 0;
  const askingPrice = parseFloat(listing.price);
  const walletBalance = 100000; // Mock balance
  const hasSufficient = walletBalance >= offerNum;
  const isValid = offerNum > 0 && hasSufficient;

  const diffFromAsking = offerNum > 0 ? ((offerNum - askingPrice) / askingPrice * 100).toFixed(1) : null;
  const isBelowAsking = offerNum > 0 && offerNum < askingPrice;

  const expiryMap: Record<string, string> = {
    "1h": "1 hour",
    "6h": "6 hours",
    "24h": "24 hours",
    "3d": "3 days",
    "7d": "7 days",
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await contracts.makeOffer({
        listingId: listing.id,
        amount: offerAmount,
        expiresIn: expiry,
      });

      toast.success("Offer submitted!", {
        description: `Your offer of ${offerNum.toLocaleString()} ${listing.loanToken} has been sent`,
      });

      onOpenChange(false);
      // Reset form
      setOfferAmount("");
      setMessage("");
    } catch (error) {
      console.error("Offer failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">Make an Offer</DialogTitle>
            <Badge variant="muted" className="font-mono-numbers">{listing.id}</Badge>
          </div>
          <DialogDescription>Submit your offer for this position</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position Details (condensed) */}
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant={listing.nftType === "borrower" ? "default" : "accent"} className="text-[10px]">
                {listing.nftType === "borrower" ? "Borrower" : "Lender"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collateral</span>
              <span className="font-mono-numbers">{listing.loan.collateralAmount} {listing.loan.collateralToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan</span>
              <span className="font-mono-numbers">{parseFloat(listing.loan.loanAmount).toLocaleString()} {listing.loanToken}</span>
            </div>
          </div>

          {/* Offer Input */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your Offer ({listing.loanToken})</label>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="bg-input border-border font-mono-numbers text-lg h-12"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Asking price: {askingPrice.toLocaleString()} {listing.loanToken}
            </p>
            {offerNum > 0 && diffFromAsking && (
              <div className="mt-2">
                {isBelowAsking ? (
                  <span className="flex items-center gap-1.5 text-sm text-warning">
                    <AlertCircle className="h-4 w-4" />
                    Your offer: {offerNum.toLocaleString()} {listing.loanToken} ({diffFromAsking}% below asking)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    At or above asking price — consider buying now
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Expiry */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Offer Expires In</label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(expiryMap).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message to Seller (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="e.g., Quick settlement, willing to negotiate..."
              className="bg-input border-border resize-none h-20"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
          </div>

          {/* Wallet Check */}
          <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-mono-numbers">{walletBalance.toLocaleString()} {listing.loanToken}</span>
            </div>
            {offerNum > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offer Amount</span>
                  <span className="font-mono-numbers">{offerNum.toLocaleString()} {listing.loanToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {hasSufficient ? (
                    <span className="text-success text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Sufficient balance
                    </span>
                  ) : (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Insufficient balance
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!isValid || isSubmitting || !isConnected}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Submit Offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
