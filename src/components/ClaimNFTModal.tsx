import { useState } from "react";
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
import { Image as ImageIcon, Loader2, AlertTriangle, ArrowRight, Gavel } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useNFTStore, type NFTLoan } from "@/store/useNFTStore";

interface ClaimNFTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: NFTLoan;
}

const ClaimNFTModal = ({ open, onOpenChange, loan }: ClaimNFTModalProps) => {
  const { address } = useWallet();
  const claimNFT = useNFTStore((state) => state.claimNFT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClaim = async () => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      await claimNFT(loan.id, address);
      toast.success("NFT claimed!", {
        description: "The NFT collateral is now in your wallet",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error("Failed to claim NFT");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate how long overdue
  const overdueTime = Date.now() - loan.gracePeriodEnd;
  const overdueDays = Math.floor(overdueTime / (1000 * 60 * 60 * 24));
  const overdueHours = Math.floor((overdueTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Gavel className="h-5 w-5 text-accent" />
            Claim NFT Collateral
          </DialogTitle>
          <DialogDescription>
            The borrower failed to repay. You can now claim the NFT.
          </DialogDescription>
        </DialogHeader>

        {/* NFT Preview */}
        <div className="rounded-lg bg-secondary/50 p-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{loan.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{loan.tokenId}</p>
              <Badge variant="destructive" className="mt-2 gap-1">
                <AlertTriangle className="h-3 w-3" />
                Defaulted
              </Badge>
            </div>
          </div>
        </div>

        {/* Default Info */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Borrower Failed to Repay</p>
                <p className="text-xs text-muted-foreground">
                  Grace period ended {overdueDays > 0 ? `${overdueDays}d ` : ""}{overdueHours}h ago
                </p>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground text-xs">Amount Lent</p>
              <p className="font-mono-numbers font-medium">
                {parseFloat(loan.loanAmount).toLocaleString()} {loan.loanToken}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground text-xs">Expected Repayment</p>
              <p className="font-mono-numbers font-medium line-through text-muted-foreground">
                {parseFloat(loan.repaymentAmount).toLocaleString()} {loan.loanToken}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground text-xs">Borrower</p>
            <p className="font-mono text-sm truncate">
              {loan.borrower.slice(0, 10)}...{loan.borrower.slice(-8)}
            </p>
          </div>
        </div>

        {/* What You'll Receive */}
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="font-medium text-accent mb-2">You will receive:</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-medium">{loan.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{loan.tokenId}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            <span className="text-sm font-medium">Your Wallet</span>
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <p className="text-xs text-muted-foreground">
            By claiming this NFT, you acknowledge that the loan is in default and you are exercising your right as lender to take possession of the collateral.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleClaim}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Claiming...</>
            ) : (
              "Claim NFT"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimNFTModal;
