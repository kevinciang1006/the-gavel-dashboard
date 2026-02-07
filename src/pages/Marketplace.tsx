import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BuyPositionModal from "@/components/BuyPositionModal";
import MakeOfferModal from "@/components/MakeOfferModal";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ShoppingCart,
  Tag,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
} from "lucide-react";
import { useLoanStore } from "@/store/useLoanStore";
import { useMarketplaceStore } from "@/store/useMarketplaceStore";
import type { Loan, MarketplaceListing } from "@/types";

const Marketplace = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const loans = useLoanStore((state) => state.loans);
  const listings = useMarketplaceStore((state) => state.listings);
  const listPosition = useMarketplaceStore((state) => state.listPosition);
  const isLoading = useMarketplaceStore((state) => state.isLoading);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tabFilter, setTabFilter] = useState("all");
  const [collateralFilter, setCollateralFilter] = useState("All");

  // Listing form state
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [positionType, setPositionType] = useState<"borrower" | "lender">("lender");
  const [askingPrice, setAskingPrice] = useState("");
  const [listingExpiry, setListingExpiry] = useState("7d");
  const [isListing, setIsListing] = useState(false);

  // Modal state
  const [buyListing, setBuyListing] = useState<MarketplaceListing | null>(null);
  const [offerListing, setOfferListing] = useState<MarketplaceListing | null>(null);

  // Get user's loans that can be listed
  const userLoans = useMemo(() => {
    if (!address) return [];
    return loans.filter((l) => {
      const isBorrower = l.borrower.toLowerCase() === address.toLowerCase();
      const isLender = l.lender.toLowerCase() === address.toLowerCase();
      const isActive = l.status === "active" || l.status === "grace_period";
      return (isBorrower || isLender) && isActive;
    });
  }, [loans, address]);

  // Filter active listings
  const activeListings = useMemo(() => {
    return listings.filter((l) => l.status === "active");
  }, [listings]);

  const filteredListings = useMemo(() => {
    return activeListings.filter((l) => {
      if (tabFilter === "borrower" && l.nftType !== "borrower") return false;
      if (tabFilter === "lender" && l.nftType !== "lender") return false;
      if (collateralFilter !== "All" && l.loan.collateralToken !== collateralFilter) return false;
      if (search && !l.id.includes(search) && !l.loan.collateralAmount.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeListings, tabFilter, collateralFilter, search]);

  const selectedLoan = userLoans.find((l) => l.id === selectedLoanId);
  const askingPriceNum = parseFloat(askingPrice) || 0;
  const positionValue = selectedLoan ? parseFloat(selectedLoan.loanAmount) : 0;
  const priceDiff = askingPriceNum > 0 && positionValue > 0
    ? ((askingPriceNum - positionValue) / positionValue * 100).toFixed(1)
    : null;

  const handleListPosition = async () => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (!selectedLoan || askingPriceNum <= 0) {
      toast.error("Please select a position and set a price");
      return;
    }

    setIsListing(true);
    try {
      await listPosition(selectedLoan, positionType, askingPrice, address);
      toast.success("Position listed!", {
        description: `Listed for ${askingPriceNum.toLocaleString()} ${selectedLoan.loanToken}`,
      });
      // Reset form
      setSelectedLoanId(null);
      setAskingPrice("");
    } catch (error) {
      console.error("Listing failed:", error);
    } finally {
      setIsListing(false);
    }
  };

  // Format time left
  const formatTimeLeft = (endTime: number): string => {
    const diff = endTime - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Secondary Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">Trade loan positions as NFTs</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Wallet Warning */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-center gap-3"
          >
            <Wallet className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium">Wallet not connected</p>
              <p className="text-xs text-muted-foreground">Connect to list positions or make purchases</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openConnectModal?.()}>
              Connect
            </Button>
          </motion.div>
        )}

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
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
            </div>
          </motion.div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: List Your Position */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-accent" />
                  List Your Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Step 1: Select Position */}
                <div>
                  <p className="text-sm font-medium mb-2">Step 1: Select Position to Sell</p>
                  <Select
                    value={positionType}
                    onValueChange={(v) => setPositionType(v as "borrower" | "lender")}
                  >
                    <SelectTrigger className="bg-input border-border mb-3">
                      <SelectValue placeholder="Select Position Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lender">Lender Position</SelectItem>
                      <SelectItem value="borrower">Borrower Position</SelectItem>
                    </SelectContent>
                  </Select>

                  {userLoans.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs w-8" />
                            <TableHead className="text-muted-foreground text-xs">ID</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Collateral</TableHead>
                            <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">Loan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userLoans.map((loan) => (
                            <TableRow
                              key={loan.id}
                              className={`border-border cursor-pointer transition-colors ${
                                selectedLoanId === loan.id ? "bg-primary/10" : "hover:bg-secondary/30"
                              }`}
                              onClick={() => setSelectedLoanId(loan.id)}
                            >
                              <TableCell>
                                <div className={`h-4 w-4 rounded-full border-2 ${
                                  selectedLoanId === loan.id ? "border-primary bg-primary" : "border-muted-foreground"
                                }`} />
                              </TableCell>
                              <TableCell className="font-mono-numbers text-xs">{loan.id}</TableCell>
                              <TableCell className="font-mono-numbers text-xs">
                                {loan.collateralAmount} {loan.collateralToken}
                              </TableCell>
                              <TableCell className="font-mono-numbers text-xs hidden sm:table-cell">
                                {parseFloat(loan.loanAmount).toLocaleString()} {loan.loanToken}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {isConnected ? "You have no positions to sell" : "Connect wallet to see your positions"}
                    </p>
                  )}
                </div>

                {/* Step 2: Set Price */}
                {selectedLoanId && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-sm font-medium mb-2">Step 2: Set Price</p>
                    <Input
                      type="number"
                      placeholder={`Asking Price (${selectedLoan?.loanToken || "USDC"})`}
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      className="bg-input border-border font-mono-numbers mb-2"
                    />
                    <p className="text-xs text-muted-foreground mb-3">
                      Position value: ~{positionValue.toLocaleString()} {selectedLoan?.loanToken}
                    </p>

                    {askingPriceNum > 0 && (
                      <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Position Value</span>
                          <span className="font-mono-numbers">{positionValue.toLocaleString()} {selectedLoan?.loanToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Price</span>
                          <span className="font-mono-numbers font-bold">{askingPriceNum.toLocaleString()} {selectedLoan?.loanToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Difference</span>
                          <span className={`font-mono-numbers font-medium ${
                            parseFloat(priceDiff || "0") < 0 ? "text-success" : "text-destructive"
                          }`}>
                            {priceDiff}%
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Expiration */}
                {selectedLoanId && askingPriceNum > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-sm font-medium mb-2">Step 3: Expiration</p>
                    <Select value={listingExpiry} onValueChange={setListingExpiry}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">1 day</SelectItem>
                        <SelectItem value="3d">3 days</SelectItem>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSelectedLoanId(null); setAskingPrice(""); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    disabled={!selectedLoanId || askingPriceNum <= 0 || isListing || !isConnected}
                    onClick={handleListPosition}
                  >
                    {isListing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Listing...</>
                    ) : (
                      "List for Sale"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Positions For Sale */}
          <div className="lg:col-span-3">
            <Tabs value={tabFilter} onValueChange={setTabFilter}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-secondary">
                  <TabsTrigger value="all">All Listings</TabsTrigger>
                  <TabsTrigger value="borrower">Borrower</TabsTrigger>
                  <TabsTrigger value="lender">Lender</TabsTrigger>
                </TabsList>
                <span className="text-sm text-muted-foreground">
                  {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
                </span>
              </div>

              <TabsContent value={tabFilter} className="mt-0">
                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredListings.map((listing, i) => {
                      const loanValue = parseFloat(listing.loan.loanAmount);
                      const price = parseFloat(listing.price);
                      const discount = loanValue - price;
                      const discountPct = ((discount / loanValue) * 100).toFixed(1);
                      const isDiscount = discount > 0;
                      const timeLeft = formatTimeLeft(listing.loan.maturityTime);

                      return (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="border-border bg-card hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant={listing.nftType === "borrower" ? "default" : "accent"}>
                                  {listing.nftType === "borrower" ? "Borrower" : "Lender"}
                                </Badge>
                                <span className="font-mono-numbers text-sm text-muted-foreground">{listing.id}</span>
                              </div>

                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Collateral</span>
                                  <span className="font-mono-numbers flex items-center gap-1">
                                    <span className="text-base">{listing.loan.collateralToken === "WBTC" ? "₿" : "Ξ"}</span>
                                    {listing.loan.collateralAmount} {listing.loan.collateralToken}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Loan</span>
                                  <span className="font-mono-numbers">
                                    {parseFloat(listing.loan.loanAmount).toLocaleString()} {listing.loanToken}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="font-mono-numbers text-lg font-bold">
                                  {price.toLocaleString()} {listing.loanToken}
                                </span>
                                <Badge
                                  variant={isDiscount ? "success" : "destructive"}
                                  className="flex items-center gap-0.5"
                                >
                                  {isDiscount ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                  {isDiscount ? "-" : "+"}{Math.abs(parseFloat(discountPct))}%
                                </Badge>
                              </div>

                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Seller</span>
                                  <span className="font-mono-numbers">
                                    {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Loan Time Left</span>
                                  <span className="font-mono-numbers flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {timeLeft}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setOfferListing(listing)}
                                  disabled={!isConnected}
                                >
                                  Make Offer
                                </Button>
                                <Button
                                  variant="gradient"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setBuyListing(listing)}
                                  disabled={!isConnected}
                                >
                                  Buy Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No positions for sale</h3>
                    <p className="text-sm text-muted-foreground">Be the first to list!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Modals */}
      {buyListing && (
        <BuyPositionModal
          open={!!buyListing}
          onOpenChange={(open) => !open && setBuyListing(null)}
          listing={buyListing}
        />
      )}
      {offerListing && (
        <MakeOfferModal
          open={!!offerListing}
          onOpenChange={(open) => !open && setOfferListing(null)}
          listing={offerListing}
        />
      )}
    </div>
  );
};

export default Marketplace;
