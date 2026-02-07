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
import { Image as ImageIcon, Loader2, CheckCircle2, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { useNFTStore, type NFTLoan } from "@/store/useNFTStore";
import * as contracts from "@/lib/mockContracts";

interface RepayNFTLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: NFTLoan;
}

const RepayNFTLoanModal = ({ open, onOpenChange, loan }: RepayNFTLoanModalProps) => {
  const { address } = useWallet();
  const repayNFTLoan = useNFTStore((state) => state.repayNFTLoan);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate time remaining
  const timeInfo = useMemo(() => {
    const now = Date.now();
    const timeToMaturity = loan.maturityTime - now;
    const timeToGraceEnd = loan.gracePeriodEnd - now;

    if (timeToMaturity > 0) {
      const days = Math.floor(timeToMaturity / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeToMaturity % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return {
        status: "active",
        display: `${days}d ${hours}h remaining`,
        isUrgent: days < 3,
      };
    } else if (timeToGraceEnd > 0) {
      const hours = Math.floor(timeToGraceEnd / (1000 * 60 * 60));
      const minutes = Math.floor((timeToGraceEnd % (1000 * 60 * 60)) / (1000 * 60));
      return {
        status: "grace_period",
        display: `${hours}h ${minutes}m grace period left`,
        isUrgent: true,
      };
    }
    return {
      status: "overdue",
      display: "Grace period ended",
      isUrgent: true,
    };
  }, [loan]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await contracts.approveToken(loan.loanToken, "LendingPool", loan.repaymentAmount);
      setIsApproved(true);
      toast.success(`${loan.loanToken} approved`);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRepay = async () => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      await repayNFTLoan(loan.id, address);
      toast.success("Loan repaid!", {
        description: "Your NFT has been returned to your wallet",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Repay failed:", error);
      toast.error("Failed to repay loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isApproving || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Repay Loan</DialogTitle>
          <DialogDescription>
            Repay your loan to get your NFT collateral back
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
              <Badge
                variant={timeInfo.status === "grace_period" ? "warning" : timeInfo.isUrgent ? "warning" : "success"}
                className="mt-2 gap-1"
              >
                <Clock className="h-3 w-3" />
                {timeInfo.display}
              </Badge>
            </div>
          </div>
        </div>

        {/* Loan Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-muted-foreground text-xs">Loan Amount</p>
              <p className="font-mono-numbers font-medium">
                {parseFloat(loan.loanAmount).toLocaleString()} {loan.loanToken}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-muted-foreground text-xs">Repayment Amount</p>
              <p className="font-mono-numbers font-medium text-lg">
                {parseFloat(loan.repaymentAmount).toLocaleString()} {loan.loanToken}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Interest</p>
              <p className="font-mono-numbers">
                {(parseFloat(loan.repaymentAmount) - parseFloat(loan.loanAmount)).toLocaleString()} {loan.loanToken}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">APR</p>
              <Badge variant="accent" className="font-mono-numbers">
                {loan.apr.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Grace Period Warning */}
        {timeInfo.status === "grace_period" && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Grace Period Active</p>
                <p className="text-xs text-muted-foreground">
                  Repay before the grace period ends or the lender can claim your NFT
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What Happens */}
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
          <p className="font-medium text-success mb-1">After repayment:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Your NFT will be returned to your wallet
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Loan will be marked as repaid
            </li>
          </ul>
        </div>

        {/* You'll Receive */}
        <div className="p-4 rounded-lg bg-secondary/50 flex items-center justify-between">
          <span className="text-sm">You'll receive back:</span>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <span className="font-medium">{loan.collection} {loan.tokenId}</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          {!isApproved ? (
            <Button
              variant="accent"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                `Approve ${loan.loanToken}`
              )}
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleRepay}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Repaying...</>
              ) : (
                `Repay ${parseFloat(loan.repaymentAmount).toLocaleString()} ${loan.loanToken}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RepayNFTLoanModal;
