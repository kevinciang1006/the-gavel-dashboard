import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image as ImageIcon, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useNFTStore, type NFTAuction } from "@/store/useNFTStore";
import * as contracts from "@/lib/mockContracts";

interface PlaceNFTBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: NFTAuction;
}

const PlaceNFTBidModal = ({ open, onOpenChange, auction }: PlaceNFTBidModalProps) => {
  const { address } = useWallet();
  const placeBidOnNFT = useNFTStore((state) => state.placeBidOnNFT);

  const [bidAmount, setBidAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate current max bid (lowest wins for borrower)
  const currentMaxBid = useMemo(() => {
    if (auction.currentBid) {
      return parseFloat(auction.currentBid);
    }
    return parseFloat(auction.maxRepayment);
  }, [auction]);

  const loanAmount = parseFloat(auction.loanAmount);

  // Validate bid
  const bidValidation = useMemo(() => {
    const bid = parseFloat(bidAmount);
    if (!bidAmount || isNaN(bid)) {
      return { valid: false, message: "Enter a bid amount", type: "neutral" };
    }
    if (bid < loanAmount) {
      return { valid: false, message: "Bid cannot be less than loan amount", type: "error" };
    }
    if (bid >= currentMaxBid) {
      return { valid: false, message: "Bid must be lower than current winning bid", type: "error" };
    }
    return { valid: true, message: "Your bid wins!", type: "success" };
  }, [bidAmount, loanAmount, currentMaxBid]);

  // Calculate APR from bid
  const bidAPR = useMemo(() => {
    const bid = parseFloat(bidAmount);
    if (!bid || isNaN(bid)) return 0;
    return ((bid - loanAmount) / loanAmount) * 100;
  }, [bidAmount, loanAmount]);

  // Format time left
  const timeLeft = useMemo(() => {
    const diff = auction.auctionEndTime - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [auction.auctionEndTime]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setBidAmount("");
      setIsApproved(false);
    }
  }, [open]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await contracts.approveToken(auction.loanToken, "AuctionHouse", bidAmount);
      setIsApproved(true);
      toast.success(`${auction.loanToken} approved`);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!address || !bidValidation.valid) return;

    setIsSubmitting(true);
    try {
      await placeBidOnNFT(auction.id, bidAmount, address);
      toast.success("Bid placed!", {
        description: `You are now the winning bidder at ${parseFloat(bidAmount).toLocaleString()} ${auction.loanToken}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Bid failed:", error);
      toast.error("Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBidding = isApproving || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Place Bid</DialogTitle>
          <DialogDescription>
            Bid a lower repayment amount to win this NFT loan auction
          </DialogDescription>
        </DialogHeader>

        {/* NFT Preview */}
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{auction.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{auction.tokenId}</p>
            </div>
            <Badge variant={auction.status === "ending_soon" ? "warning" : "success"}>
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft}
            </Badge>
          </div>

          {/* Auction Details */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Loan Amount</p>
              <p className="font-mono-numbers font-medium">
                {parseFloat(auction.loanAmount).toLocaleString()} {auction.loanToken}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Repayment</p>
              <p className="font-mono-numbers font-medium">
                {parseFloat(auction.maxRepayment).toLocaleString()} {auction.loanToken}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Current Bid</p>
              <p className="font-mono-numbers font-medium text-success">
                {auction.currentBid
                  ? `${parseFloat(auction.currentBid).toLocaleString()} ${auction.loanToken}`
                  : "No bids"}
              </p>
            </div>
          </div>
        </div>

        {/* Bid Input */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Bid (Repayment Amount)</label>
            <div className="relative">
              <Input
                type="number"
                placeholder={`Enter amount (< ${currentMaxBid.toLocaleString()})`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="bg-input border-border pr-16"
                disabled={isBidding}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {auction.loanToken}
              </span>
            </div>
          </div>

          {/* Bid Validation Feedback */}
          {bidAmount && (
            <div className={`flex items-center gap-2 text-sm ${
              bidValidation.type === "success" ? "text-success" :
              bidValidation.type === "error" ? "text-destructive" :
              "text-muted-foreground"
            }`}>
              {bidValidation.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : bidValidation.type === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : null}
              {bidValidation.message}
            </div>
          )}

          {/* APR Display */}
          {bidValidation.valid && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex justify-between items-center">
                <span className="text-sm">Your earning rate:</span>
                <Badge variant="success" className="font-mono-numbers">
                  {bidAPR.toFixed(1)}% APR
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                If you win, you'll receive {parseFloat(bidAmount).toLocaleString()} {auction.loanToken} at loan maturity
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBidding}>
            Cancel
          </Button>
          {!isApproved ? (
            <Button
              variant="accent"
              onClick={handleApprove}
              disabled={!bidValidation.valid || isApproving}
            >
              {isApproving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                `Approve ${auction.loanToken}`
              )}
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleSubmitBid}
              disabled={!bidValidation.valid || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit Bid"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceNFTBidModal;
