import { useState } from "react";
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
} from "lucide-react";

// User's positions for listing
const userPositions = [
  { id: "#7", type: "Borrower" as const, collateral: "1.5 WBTC", loan: "50,000 USDC", timeLeft: "12d 4h" },
  { id: "#12", type: "Lender" as const, collateral: "25 ETH", loan: "80,000 USDC", timeLeft: "18h" },
  { id: "#15", type: "Borrower" as const, collateral: "0.5 WBTC", loan: "20,000 USDT", timeLeft: "5d 2h" },
];

// Marketplace listings
const allListings = [
  {
    id: "#42",
    type: "Lender" as const,
    collateral: "1.5 WBTC",
    collateralIcon: "₿",
    loan: "50,000 USDC",
    repayment: "52,500 USDC",
    apr: "~5% APR",
    askingPrice: 48000,
    marketValue: 50000,
    seller: "0x1234...5678",
    timeLeft: "15d 4h",
    expires: "In 2 days",
    collateralType: "WBTC",
  },
  {
    id: "#38",
    type: "Borrower" as const,
    collateral: "25 ETH",
    collateralIcon: "Ξ",
    loan: "80,000 USDC",
    repayment: "86,400 USDC",
    apr: "~8% APR",
    askingPrice: 82000,
    marketValue: 80000,
    seller: "0xABCD...EF01",
    timeLeft: "8d 12h",
    expires: "In 5 days",
    collateralType: "ETH",
  },
  {
    id: "#55",
    type: "Lender" as const,
    collateral: "0.8 WBTC",
    collateralIcon: "₿",
    loan: "30,000 USDT",
    repayment: "33,000 USDT",
    apr: "~10% APR",
    askingPrice: 28500,
    marketValue: 30000,
    seller: "0x9876...5432",
    timeLeft: "22d 8h",
    expires: "In 7 days",
    collateralType: "WBTC",
  },
  {
    id: "#61",
    type: "Borrower" as const,
    collateral: "10 ETH",
    collateralIcon: "Ξ",
    loan: "25,000 USDC",
    repayment: "27,500 USDC",
    apr: "~10% APR",
    askingPrice: 24000,
    marketValue: 25000,
    seller: "0xDEAD...BEEF",
    timeLeft: "3d 16h",
    expires: "In 1 day",
    collateralType: "ETH",
  },
  {
    id: "#73",
    type: "Lender" as const,
    collateral: "2.0 WBTC",
    collateralIcon: "₿",
    loan: "100,000 USDC",
    repayment: "112,000 USDC",
    apr: "~12% APR",
    askingPrice: 105000,
    marketValue: 100000,
    seller: "0xFACE...1234",
    timeLeft: "28d 0h",
    expires: "In 30 days",
    collateralType: "WBTC",
  },
  {
    id: "#29",
    type: "Borrower" as const,
    collateral: "15 ETH",
    collateralIcon: "Ξ",
    loan: "45,000 USDC",
    repayment: "49,500 USDC",
    apr: "~10% APR",
    askingPrice: 43000,
    marketValue: 45000,
    seller: "0xBEEF...CAFE",
    timeLeft: "6d 20h",
    expires: "In 3 days",
    collateralType: "ETH",
  },
];

const Marketplace = () => {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tabFilter, setTabFilter] = useState("all");
  const [collateralFilter, setCollateralFilter] = useState("All");

  // Listing form state
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [positionTypeFilter, setPositionTypeFilter] = useState("all");
  const [askingPrice, setAskingPrice] = useState("");
  const [listingExpiry, setListingExpiry] = useState("7d");

  // Modal state
  const [buyListing, setBuyListing] = useState<typeof allListings[0] | null>(null);
  const [offerListing, setOfferListing] = useState<typeof allListings[0] | null>(null);

  const filteredListings = allListings.filter((l) => {
    if (tabFilter === "borrower" && l.type !== "Borrower") return false;
    if (tabFilter === "lender" && l.type !== "Lender") return false;
    if (collateralFilter !== "All" && l.collateralType !== collateralFilter) return false;
    if (search && !l.id.includes(search) && !l.collateral.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedPos = userPositions.find((p) => p.id === selectedPosition);
  const askingPriceNum = parseFloat(askingPrice) || 0;
  const positionValue = selectedPos ? parseFloat(selectedPos.loan.replace(/[^0-9.]/g, "")) : 0;
  const priceDiff = askingPriceNum > 0 && positionValue > 0 ? ((askingPriceNum - positionValue) / positionValue * 100).toFixed(1) : null;

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
                  <Select value={positionTypeFilter} onValueChange={setPositionTypeFilter}>
                    <SelectTrigger className="bg-input border-border mb-3">
                      <SelectValue placeholder="Select Position Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="Borrower">Borrower Position</SelectItem>
                      <SelectItem value="Lender">Lender Position</SelectItem>
                    </SelectContent>
                  </Select>

                  {userPositions.filter(p => positionTypeFilter === "all" || p.type === positionTypeFilter).length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs w-8" />
                            <TableHead className="text-muted-foreground text-xs">ID</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                            <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">Loan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userPositions
                            .filter(p => positionTypeFilter === "all" || p.type === positionTypeFilter)
                            .map((pos) => (
                              <TableRow
                                key={pos.id}
                                className={`border-border cursor-pointer transition-colors ${
                                  selectedPosition === pos.id ? "bg-primary/10" : "hover:bg-secondary/30"
                                }`}
                                onClick={() => setSelectedPosition(pos.id)}
                              >
                                <TableCell>
                                  <div className={`h-4 w-4 rounded-full border-2 ${
                                    selectedPosition === pos.id ? "border-primary bg-primary" : "border-muted-foreground"
                                  }`} />
                                </TableCell>
                                <TableCell className="font-mono-numbers text-xs">{pos.id}</TableCell>
                                <TableCell>
                                  <Badge variant={pos.type === "Borrower" ? "default" : "accent"} className="text-[10px]">
                                    {pos.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono-numbers text-xs hidden sm:table-cell">{pos.loan}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">You have no positions to sell</p>
                  )}
                </div>

                {/* Step 2: Set Price */}
                {selectedPosition && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-sm font-medium mb-2">Step 2: Set Price</p>
                    <Input
                      type="number"
                      placeholder="Asking Price (USDC)"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      className="bg-input border-border font-mono-numbers mb-2"
                    />
                    <p className="text-xs text-muted-foreground mb-3">
                      Current floor price: ~{positionValue.toLocaleString()} USDC
                    </p>

                    {askingPriceNum > 0 && (
                      <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Position Value</span>
                          <span className="font-mono-numbers">{positionValue.toLocaleString()} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Price</span>
                          <span className="font-mono-numbers font-bold">{askingPriceNum.toLocaleString()} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
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
                {selectedPosition && askingPriceNum > 0 && (
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
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedPosition(null); setAskingPrice(""); }}>
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    disabled={!selectedPosition || askingPriceNum <= 0}
                  >
                    List for Sale
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
                      const discount = listing.marketValue - listing.askingPrice;
                      const discountPct = ((discount / listing.marketValue) * 100).toFixed(1);
                      const isDiscount = discount > 0;

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
                                <Badge variant={listing.type === "Borrower" ? "default" : "accent"}>
                                  {listing.type}
                                </Badge>
                                <span className="font-mono-numbers text-sm text-muted-foreground">{listing.id}</span>
                              </div>

                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Collateral</span>
                                  <span className="font-mono-numbers flex items-center gap-1">
                                    <span className="text-base">{listing.collateralIcon}</span>
                                    {listing.collateral}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Loan</span>
                                  <span className="font-mono-numbers">{listing.loan}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="font-mono-numbers text-lg font-bold">
                                  {listing.askingPrice.toLocaleString()} USDC
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
                                  <span className="font-mono-numbers">{listing.seller}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Loan Time Left</span>
                                  <span className="font-mono-numbers flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {listing.timeLeft}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Listing Expires</span>
                                  <span>{listing.expires}</span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setOfferListing(listing)}
                                >
                                  Make Offer
                                </Button>
                                <Button
                                  variant="gradient"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setBuyListing(listing)}
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
