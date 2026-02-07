import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Trophy, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNFTStore, type NFTAuction } from "@/store/useNFTStore";

interface FinalizeNFTAuctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: NFTAuction;
}

const FinalizeNFTAuctionModal = ({ open, onOpenChange, auction }: FinalizeNFTAuctionModalProps) => {
  const finalizeNFTAuction = useNFTStore((state) => state.finalizeNFTAuction);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate winning bid details
  const winningBidDetails = useMemo(() => {
    if (!auction.currentBid || !auction.currentBidder) return null;

    const loanAmount = parseFloat(auction.loanAmount);
    const repaymentAmount = parseFloat(auction.currentBid);
    const interest = repaymentAmount - loanAmount;
    const apr = (interest / loanAmount) * 100;

    return {
      bidder: auction.currentBidder,
      repaymentAmount,
      interest,
      apr,
      loanDuration: auction.loanDuration,
    };
  }, [auction]);

  const handleFinalize = async () => {
    if (!winningBidDetails) return;

    setIsSubmitting(true);
    try {
      await finalizeNFTAuction(auction.id);
      toast.success("NFT auction finalized!", {
        description: "Loan has been created from the winning bid",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Finalize failed:", error);
      toast.error("Failed to finalize auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!winningBidDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>No Bids</DialogTitle>
            <DialogDescription>This auction has no bids to finalize.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Finalize Auction
          </DialogTitle>
          <DialogDescription>
            Accept the winning bid and create your NFT-backed loan
          </DialogDescription>
        </DialogHeader>

        {/* NFT Preview */}
        <div className="rounded-lg bg-secondary/50 p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{auction.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{auction.tokenId}</p>
            </div>
          </div>
        </div>

        {/* Winning Bid Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <Trophy className="h-3 w-3" /> Winning Bid
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground text-xs">You'll Receive</p>
              <p className="font-mono-numbers font-medium text-lg text-success">
                {parseFloat(auction.loanAmount).toLocaleString()} {auction.loanToken}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground text-xs">You'll Repay</p>
              <p className="font-mono-numbers font-medium text-lg">
                {winningBidDetails.repaymentAmount.toLocaleString()} {auction.loanToken}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Interest</p>
              <p className="font-mono-numbers font-medium">
                {winningBidDetails.interest.toLocaleString()} {auction.loanToken}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">APR</p>
              <Badge variant="accent" className="font-mono-numbers">
                {winningBidDetails.apr.toFixed(1)}%
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Duration</p>
              <p className="font-mono-numbers font-medium">{auction.loanDuration}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Lender</p>
            <p className="font-mono text-sm truncate">
              {winningBidDetails.bidder.slice(0, 10)}...{winningBidDetails.bidder.slice(-8)}
            </p>
          </div>
        </div>

        {/* Confirmation Info */}
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <p className="font-medium text-warning mb-1">What happens next:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-success" />
              You receive {parseFloat(auction.loanAmount).toLocaleString()} {auction.loanToken} immediately
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              NFT stays locked as collateral
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              Repay within {auction.loanDuration} to get your NFT back
            </li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleFinalize} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalizing...</>
            ) : (
              "Finalize & Get Loan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizeNFTAuctionModal;
