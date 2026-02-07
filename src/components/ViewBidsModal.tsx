import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Image as ImageIcon, Trophy, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Bid {
  bidder: string;
  amount: string;
  apr: number;
  timestamp: number;
}

interface NFTAuction {
  id: string;
  collection: string;
  tokenId: string;
  loan: string;
  maxRepay: string;
  currentBid: string;
  bids: number;
  timeLeft: string;
  status: "Active" | "Ended";
}

interface ViewBidsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: NFTAuction;
}

// Generate mock bids based on auction data
function generateMockBids(auction: NFTAuction): Bid[] {
  if (auction.bids === 0) return [];

  const loanAmount = parseFloat(auction.loan.replace(/[^0-9.]/g, ""));
  const currentBid = parseFloat(auction.currentBid.replace(/[^0-9.]/g, ""));
  const maxRepay = parseFloat(auction.maxRepay.replace(/[^0-9.]/g, ""));

  const bids: Bid[] = [];

  // Generate bids from highest to lowest (lowest repayment = best for borrower)
  for (let i = 0; i < auction.bids; i++) {
    const bidProgress = i / Math.max(auction.bids - 1, 1);
    const bidAmount = currentBid + (maxRepay - currentBid) * bidProgress * 0.5;
    const apr = ((bidAmount - loanAmount) / loanAmount) * 100;

    bids.push({
      bidder: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      amount: bidAmount.toFixed(0),
      apr,
      timestamp: Date.now() - (i + 1) * 15 * 60 * 1000, // 15 min apart
    });
  }

  return bids;
}

const ViewBidsModal = ({ open, onOpenChange, auction }: ViewBidsModalProps) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const bids = useMemo(() => generateMockBids(auction), [auction]);
  const loanAmount = parseFloat(auction.loan.replace(/[^0-9.]/g, ""));

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Auction Bids</DialogTitle>
          <DialogDescription>View all bids for this NFT auction</DialogDescription>
        </DialogHeader>

        {/* Auction Details */}
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{auction.collection}</p>
              <p className="text-sm text-muted-foreground font-mono-numbers">{auction.tokenId}</p>
            </div>
            <Badge variant={auction.status === "Active" ? "success" : "muted"}>
              {auction.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Loan Amount</p>
              <p className="font-mono-numbers font-medium">{auction.loan}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Repayment</p>
              <p className="font-mono-numbers font-medium">{auction.maxRepay}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Time Left</p>
              <p className="font-mono-numbers font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> {auction.timeLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Bids Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">All Bids ({bids.length})</h3>
            <p className="text-xs text-muted-foreground">
              Lower repayment = better for borrower
            </p>
          </div>

          {bids.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Rank</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Bidder</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Repayment</TableHead>
                    <TableHead className="text-muted-foreground text-xs">APR</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, index) => {
                    const isWinning = index === 0;
                    return (
                      <TableRow
                        key={index}
                        className={`border-border transition-colors ${
                          isWinning ? "bg-success/10 hover:bg-success/15" : "hover:bg-secondary/30"
                        }`}
                      >
                        <TableCell>
                          {isWinning ? (
                            <Badge variant="success" className="gap-1">
                              <Trophy className="h-3 w-3" /> 1st
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              #{index + 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleCopyAddress(bid.bidder)}
                            className="flex items-center gap-1 font-mono-numbers text-xs hover:text-accent transition-colors"
                          >
                            {bid.bidder}
                            {copiedAddress === bid.bidder ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono-numbers text-sm font-medium">
                            {parseFloat(bid.amount).toLocaleString()} USDC
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={bid.apr < 10 ? "success" : bid.apr < 15 ? "warning" : "destructive"}
                            className="font-mono-numbers"
                          >
                            {bid.apr.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimeAgo(bid.timestamp)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No bids yet</p>
              <p className="text-xs">Be the first to bid on this auction</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewBidsModal;
