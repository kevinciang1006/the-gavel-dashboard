import { useState } from "react";
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
import { Search, Filter, RefreshCw, Clock, Gavel } from "lucide-react";

const allAuctions = [
  {
    id: "#1",
    collateral: "1.5 WBTC",
    collateralIcon: "₿",
    loan: "50,000 USDC",
    maxRepay: "55,000 USDC",
    aprBadge: "~10%",
    currentBid: "52,500 USDC",
    bids: 5,
    timeLeft: "4h 23m",
    status: "Active" as const,
    type: "WBTC",
    currentBidder: "0x1234...5678",
  },
  {
    id: "#2",
    collateral: "25 ETH",
    collateralIcon: "Ξ",
    loan: "80,000 USDC",
    maxRepay: "88,000 USDC",
    aprBadge: "~10%",
    currentBid: "84,200 USDC",
    bids: 8,
    timeLeft: "12h 10m",
    status: "Active" as const,
    type: "ETH",
    currentBidder: "0xABCD...EF01",
  },
  {
    id: "#3",
    collateral: "0.8 WBTC",
    collateralIcon: "₿",
    loan: "30,000 USDT",
    maxRepay: "33,000 USDT",
    aprBadge: "~10%",
    currentBid: "31,800 USDT",
    bids: 3,
    timeLeft: "45m",
    status: "Ending Soon" as const,
    type: "WBTC",
    currentBidder: "0x9876...5432",
  },
  {
    id: "#4",
    collateral: "10 ETH",
    collateralIcon: "Ξ",
    loan: "25,000 USDC",
    maxRepay: "27,500 USDC",
    aprBadge: "~10%",
    currentBid: "26,100 USDC",
    bids: 2,
    timeLeft: "18h 45m",
    status: "Active" as const,
    type: "ETH",
    currentBidder: "0xDEAD...BEEF",
  },
  {
    id: "#5",
    collateral: "2.0 WBTC",
    collateralIcon: "₿",
    loan: "100,000 USDC",
    maxRepay: "112,000 USDC",
    aprBadge: "~12%",
    currentBid: "105,500 USDC",
    bids: 11,
    timeLeft: "22m",
    status: "Ending Soon" as const,
    type: "WBTC",
    currentBidder: "0xFACE...1234",
  },
];

const OpenAuctions = () => {
  const [search, setSearch] = useState("");
  const [collateralFilter, setCollateralFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<typeof allAuctions[0] | null>(null);

  const filtered = allAuctions.filter((a) => {
    if (collateralFilter !== "All" && a.type !== collateralFilter) return false;
    if (search && !a.id.includes(search) && !a.collateral.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
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
                {filtered.map((auction) => (
                  <TableRow
                    key={auction.id}
                    className="border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <TableCell>
                      <Badge variant="muted" className="font-mono-numbers">{auction.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{auction.collateralIcon}</span>
                        <span className="font-mono-numbers text-sm">{auction.collateral}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono-numbers text-sm">{auction.loan}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono-numbers text-sm">{auction.maxRepay}</span>
                      <Badge variant="accent" className="ml-2 text-[10px]">{auction.aprBadge}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono-numbers text-sm">{auction.currentBid}</span>
                      <span className="text-xs text-muted-foreground block">({auction.bids} bids)</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`flex items-center gap-1.5 font-mono-numbers text-sm ${
                        auction.status === "Ending Soon" ? "text-warning" : ""
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {auction.timeLeft}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={auction.status === "Ending Soon" ? "warning" : "success"}>
                        {auction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => setSelectedAuction(auction)}
                      >
                        Place Bid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No auctions match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => { setSearch(""); setCollateralFilter("All"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      {selectedAuction && (
        <PlaceBidModal
          open={!!selectedAuction}
          onOpenChange={(open) => !open && setSelectedAuction(null)}
          auction={{
            id: selectedAuction.id,
            collateral: selectedAuction.collateral,
            loanAmount: selectedAuction.loan.replace(" USDC", "").replace(" USDT", ""),
            currentBid: selectedAuction.currentBid.replace(" USDC", "").replace(" USDT", ""),
            currentBidder: selectedAuction.currentBidder,
            maxRepayment: selectedAuction.maxRepay.replace(" USDC", "").replace(" USDT", ""),
          }}
        />
      )}
    </div>
  );
};

export default OpenAuctions;