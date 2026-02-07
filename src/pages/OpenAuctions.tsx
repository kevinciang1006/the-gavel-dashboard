import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PlaceBidModal from "@/components/PlaceBidModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, Clock, Gavel, Plus, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuctionStore } from "@/store/useAuctionStore";
import type { Auction } from "@/types";

// Format time remaining
function formatTimeLeft(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Get token icon
function getTokenIcon(token: string): string {
  switch (token) {
    case "WBTC": return "₿";
    case "ETH": return "Ξ";
    case "USDC": return "◉";
    case "USDT": return "₮";
    default: return "●";
  }
}

const OpenAuctions = () => {
  const { address, isConnected } = useWallet();
  const allAuctions = useAuctionStore((state) => state.auctions);
  const updateAuctionStatuses = useAuctionStore((state) => state.updateAuctionStatuses);
  const finalizeAuction = useAuctionStore((state) => state.finalizeAuction);

  // Filter active auctions (memoized to avoid infinite loop)
  const auctions = useMemo(() => {
    return allAuctions.filter(
      (a) => a.status === "active" || a.status === "ending_soon"
    );
  }, [allAuctions]);

  const [search, setSearch] = useState("");
  const [collateralFilter, setCollateralFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Check if current user owns an auction
  const isOwner = (auction: Auction) => {
    if (!address) return false;
    return auction.borrower.toLowerCase() === address.toLowerCase();
  };

  const handleFinalize = async (auction: Auction) => {
    if (!isOwner(auction)) {
      toast.error("Only the auction creator can finalize");
      return;
    }
    if (!auction.currentBid) {
      toast.error("No bids to finalize");
      return;
    }

    setFinalizingId(auction.id);
    try {
      await finalizeAuction(auction.id);
      toast.success("Auction finalized!", {
        description: `Loan created from winning bid`,
      });
    } catch (error) {
      console.error("Finalize failed:", error);
    } finally {
      setFinalizingId(null);
    }
  };

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      updateAuctionStatuses();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateAuctionStatuses]);

  // Filter auctions
  const filtered = useMemo(() => {
    return auctions.filter((a) => {
      if (collateralFilter !== "All" && a.collateralToken !== collateralFilter) return false;
      if (search && !a.id.includes(search) && !a.collateralAmount.toLowerCase().includes(search.toLowerCase())) return false;

      // Time filter
      if (timeFilter !== "All") {
        const timeLeft = a.auctionEndTime - Date.now();
        const hours = timeLeft / (1000 * 60 * 60);
        if (timeFilter === "1h" && hours > 1) return false;
        if (timeFilter === "6h" && hours > 6) return false;
        if (timeFilter === "24h" && hours > 24) return false;
      }

      return true;
    });
  }, [auctions, collateralFilter, search, timeFilter]);

  const handleRefresh = () => {
    updateAuctionStatuses();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Open Auctions</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search auctions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="gradient" size="sm" asChild className="gap-1.5">
              <Link to="/create-auction">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Auction</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border bg-card">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Collateral Type</label>
                <div className="flex gap-1.5">
                  {["All", "WBTC", "ETH"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCollateralFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        collateralFilter === type
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Time Remaining</label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-32 bg-input border-border h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="1h">&lt; 1 hour</SelectItem>
                    <SelectItem value="6h">&lt; 6 hours</SelectItem>
                    <SelectItem value="24h">&lt; 24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Auctions</p>
            <p className="text-2xl font-bold font-mono-numbers">{auctions.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Ending Soon</p>
            <p className="text-2xl font-bold font-mono-numbers text-warning">
              {auctions.filter((a) => a.status === "ending_soon").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Bids</p>
            <p className="text-2xl font-bold font-mono-numbers">
              {auctions.reduce((sum, a) => sum + a.bidCount, 0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold font-mono-numbers text-accent">
              ${auctions.reduce((sum, a) => sum + parseFloat(a.loanAmount), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Collateral</TableHead>
                  <TableHead className="text-muted-foreground">Loan</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Max Repay</TableHead>
                  <TableHead className="text-muted-foreground">Current Bid</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Time Left</TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((auction) => {
                  const timeLeft = formatTimeLeft(auction.auctionEndTime);
                  const isEndingSoon = auction.status === "ending_soon";
                  const isAuctionOwner = isOwner(auction);
                  const interestRate = auction.currentBid
                    ? ((parseFloat(auction.currentBid) - parseFloat(auction.loanAmount)) / parseFloat(auction.loanAmount) * 100).toFixed(1)
                    : ((parseFloat(auction.maxRepayment) - parseFloat(auction.loanAmount)) / parseFloat(auction.loanAmount) * 100).toFixed(1);

                  return (
                    <TableRow
                      key={auction.id}
                      className={`border-border hover:bg-secondary/30 transition-colors cursor-pointer ${isAuctionOwner ? "bg-primary/5" : ""}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="muted" className="font-mono-numbers">{auction.id}</Badge>
                          {isAuctionOwner && (
                            <Badge variant="accent" className="text-[10px] gap-1">
                              <User className="h-3 w-3" /> Yours
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getTokenIcon(auction.collateralToken)}</span>
                          <span className="font-mono-numbers text-sm">{auction.collateralAmount} {auction.collateralToken}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-mono-numbers text-sm">
                        {parseFloat(auction.loanAmount).toLocaleString()} {auction.loanToken}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono-numbers text-sm">
                          {parseFloat(auction.maxRepayment).toLocaleString()} {auction.loanToken}
                        </span>
                        <Badge variant="accent" className="ml-2 text-[10px]">~{interestRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono-numbers text-sm">
                          {auction.currentBid
                            ? `${parseFloat(auction.currentBid).toLocaleString()} ${auction.loanToken}`
                            : "No bids"}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          ({auction.bidCount} bids)
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`flex items-center gap-1.5 font-mono-numbers text-sm ${
                          isEndingSoon ? "text-warning" : ""
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {timeLeft}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={isEndingSoon ? "warning" : "success"}>
                          {isEndingSoon ? "Ending Soon" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAuctionOwner ? (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleFinalize(auction)}
                            disabled={!auction.currentBid || finalizingId === auction.id}
                          >
                            {finalizingId === auction.id ? (
                              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Finalizing</>
                            ) : (
                              "Finalize"
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => setSelectedAuction(auction)}
                            disabled={!isConnected}
                          >
                            {isConnected ? "Place Bid" : "Connect"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No auctions match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSearch(""); setCollateralFilter("All"); setTimeFilter("All"); }}>
                Clear Filters
              </Button>
              <Button variant="gradient" asChild>
                <Link to="/create-auction">Create Auction</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {selectedAuction && (
        <PlaceBidModal
          open={!!selectedAuction}
          onOpenChange={(open) => !open && setSelectedAuction(null)}
          auction={selectedAuction}
        />
      )}
    </div>
  );
};

export default OpenAuctions;
