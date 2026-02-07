import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Image as ImageIcon } from "lucide-react";
import * as contracts from "@/lib/mockContracts";

interface CreateNFTAuctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    collection: string;
    tokenId: string;
    image: string;
  };
}

const CreateNFTAuctionModal = ({ open, onOpenChange, nft }: CreateNFTAuctionModalProps) => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [loanToken, setLoanToken] = useState<"USDC" | "USDT">("USDC");
  const [loanAmount, setLoanAmount] = useState("");
  const [maxRepayment, setMaxRepayment] = useState("");
  const [loanDuration, setLoanDuration] = useState("30d");
  const [auctionDuration, setAuctionDuration] = useState("24h");
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loanNum = parseFloat(loanAmount) || 0;
  const maxRepayNum = parseFloat(maxRepayment) || 0;
  const isValid = loanNum > 0 && maxRepayNum > loanNum;
  const apr = loanNum > 0 && maxRepayNum > loanNum
    ? (((maxRepayNum - loanNum) / loanNum) * 100).toFixed(1)
    : null;

  const handleApprove = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setIsApproving(true);
    try {
      await contracts.approveToken("NFT", "AuctionHouse", "1");
      setIsApproved(true);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await contracts.createAuction({
        collateralToken: "ETH", // NFT is the collateral
        collateralAmount: "1", // 1 NFT
        loanToken,
        loanAmount,
        maxRepayment,
        loanDuration,
        auctionDuration,
      });

      toast.success("NFT Auction created!", {
        description: `Auction for ${nft.collection} ${nft.tokenId} is now live`,
      });

      onOpenChange(false);
      // Reset form
      setLoanAmount("");
      setMaxRepayment("");
      setIsApproved(false);
    } catch (error) {
      console.error("Create auction failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create NFT Auction</DialogTitle>
          <DialogDescription>Use your NFT as collateral for a loan</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* NFT Preview */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {nft.image ? (
                <img src={nft.image} alt={nft.collection} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div>
              <p className="font-medium">{nft.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{nft.tokenId}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Loan Token</label>
              <Select value={loanToken} onValueChange={(v) => setLoanToken(v as "USDC" | "USDT")}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Loan Amount ({loanToken})</label>
              <Input
                type="number"
                placeholder="e.g., 10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="bg-input border-border font-mono-numbers"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Max Repayment ({loanToken})</label>
              <Input
                type="number"
                placeholder="e.g., 11500"
                value={maxRepayment}
                onChange={(e) => setMaxRepayment(e.target.value)}
                className="bg-input border-border font-mono-numbers"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Loan Duration</label>
                <Select value={loanDuration} onValueChange={setLoanDuration}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Auction Duration</label>
                <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Approval */}
          {!isApproved && isConnected && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <p className="text-sm font-medium mb-2">Step 1: Approve NFT transfer</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                ) : (
                  "Approve NFT"
                )}
              </Button>
            </div>
          )}

          {/* Summary */}
          {isValid && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Using</span>
                <span className="font-medium">{nft.collection} {nft.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrowing</span>
                <span className="font-mono-numbers font-medium">{loanNum.toLocaleString()} {loanToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Repaying up to</span>
                <span className="font-mono-numbers">{maxRepayNum.toLocaleString()} {loanToken}</span>
              </div>
              {apr && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Interest</span>
                  <span className="font-mono-numbers text-accent">~{apr}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!isValid || !isApproved || isSubmitting || !isConnected}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              "Create Auction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNFTAuctionModal;
