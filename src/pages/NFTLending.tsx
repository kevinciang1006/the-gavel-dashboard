import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CreateNFTAuctionModal from "@/components/CreateNFTAuctionModal";
import { motion } from "framer-motion";
import {
  Info,
  RefreshCw,
  Image as ImageIcon,
  Gavel,
  Clock,
  Plus,
  Loader2,
  Wallet,
} from "lucide-react";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useLoanStore } from "@/store/useLoanStore";
import * as contracts from "@/lib/mockContracts";

type NFT = {
  collection: string;
  tokenId: string;
  image: string;
  whitelisted: boolean;
  floorPrice: string;
  category: string;
};

const sampleNFTs: NFT[] = [
  { collection: "Bored Ape Yacht Club", tokenId: "#1234", image: "", whitelisted: true, floorPrice: "~45 ETH", category: "PFP" },
  { collection: "CryptoPunks", tokenId: "#5678", image: "", whitelisted: true, floorPrice: "~38 ETH", category: "PFP" },
  { collection: "Art Blocks Curated", tokenId: "#901", image: "", whitelisted: true, floorPrice: "~12 ETH", category: "Art" },
  { collection: "Decentraland Land", tokenId: "#2345", image: "", whitelisted: false, floorPrice: "~2 ETH", category: "Gaming" },
  { collection: "ENS Domains", tokenId: "gavel.eth", image: "", whitelisted: false, floorPrice: "~0.5 ETH", category: "Domains" },
];

const activeAuctions = [
  {
    id: "#A1",
    collection: "Bored Ape Yacht Club",
    tokenId: "#1234",
    loan: "10,000 USDC",
    maxRepay: "11,500 USDC",
    currentBid: "10,800 USDC",
    bids: 3,
    timeLeft: "2h 15m",
    status: "Active" as const,
  },
  {
    id: "#A2",
    collection: "CryptoPunks",
    tokenId: "#5678",
    loan: "15,000 USDC",
    maxRepay: "17,250 USDC",
    currentBid: "16,100 USDC",
    bids: 7,
    timeLeft: "8h 40m",
    status: "Active" as const,
  },
  {
    id: "#A3",
    collection: "Art Blocks Curated",
    tokenId: "#901",
    loan: "5,000 USDC",
    maxRepay: "5,750 USDC",
    currentBid: "5,200 USDC",
    bids: 1,
    timeLeft: "45m",
    status: "Active" as const,
  },
];

const activeLoans = [
  {
    id: "#L1",
    collection: "Bored Ape Yacht Club",
    tokenId: "#4567",
    role: "borrower" as const,
    loan: "10,000 USDC",
    repayment: "11,500 USDC",
    apr: "~15% APR",
    timeLeft: "12d 5h",
    progress: 60,
    status: "healthy" as const,
  },
  {
    id: "#L2",
    collection: "CryptoPunks",
    tokenId: "#8901",
    role: "lender" as const,
    loan: "8,000 USDC",
    repayment: "8,960 USDC",
    apr: "~12% APR",
    timeLeft: "3d 8h",
    progress: 88,
    status: "approaching" as const,
  },
];

const statusColors = {
  healthy: { text: "text-success", bar: "bg-success" },
  approaching: { text: "text-warning", bar: "bg-warning" },
  grace: { text: "text-warning", bar: "bg-warning" },
  overdue: { text: "text-destructive", bar: "bg-destructive" },
};

const NFTLending = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [activeTab, setActiveTab] = useState("collection");
  const [loanRoleFilter, setLoanRoleFilter] = useState<"all" | "borrower" | "lender">("all");
  const [auctionNFT, setAuctionNFT] = useState<NFT | null>(null);
  const [nftFilter, setNftFilter] = useState("All");
  const [isMinting, setIsMinting] = useState(false);
  const [userNFTs, setUserNFTs] = useState<NFT[]>(sampleNFTs);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get auctions and loans from stores
  const allAuctions = useAuctionStore((state) => state.auctions);
  const finalizeAuction = useAuctionStore((state) => state.finalizeAuction);
  const allLoans = useLoanStore((state) => state.loans);
  const repayLoan = useLoanStore((state) => state.repayLoan);
  const claimCollateral = useLoanStore((state) => state.claimCollateral);

  // Filter user's NFT-backed auctions (mock: show all for demo)
  const nftAuctions = useMemo(() => {
    return allAuctions.filter(
      (a) => (a.status === "active" || a.status === "ending_soon") &&
             a.collateralToken === "ETH" // Simplified - in real app would filter by NFT
    ).slice(0, 3);
  }, [allAuctions]);

  // Filter user's NFT-backed loans
  const nftLoans = useMemo(() => {
    if (!address) return [];
    return allLoans.filter(
      (l) => l.status === "active" &&
             (l.borrower === address || l.lender === address)
    );
  }, [allLoans, address]);

  const filteredNFTs = userNFTs.filter(
    (nft) => nftFilter === "All" || nft.category === nftFilter
  );
  const filteredLoans = nftLoans.length > 0 ? nftLoans.filter(
    (l) => loanRoleFilter === "all" ||
           (loanRoleFilter === "borrower" && l.borrower === address) ||
           (loanRoleFilter === "lender" && l.lender === address)
  ) : activeLoans.filter(
    (l) => loanRoleFilter === "all" || l.role === loanRoleFilter
  );

  const handleMintNFT = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setIsMinting(true);
    try {
      const result = await contracts.mintTestNFT();
      // Add a new mock NFT to the user's collection
      const newNFT: NFT = {
        collection: "Test Collection",
        tokenId: `#${Math.floor(Math.random() * 10000)}`,
        image: "",
        whitelisted: true,
        floorPrice: "~0.1 ETH",
        category: "Art",
      };
      setUserNFTs((prev) => [...prev, newNFT]);
      toast.success("NFT Minted!", {
        description: `You received ${newNFT.collection} ${newNFT.tokenId}`,
      });
    } catch (error) {
      console.error("Mint failed:", error);
      toast.error("Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleFinalizeAuction = async (auctionId: string) => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    try {
      await finalizeAuction(auctionId);
      toast.success("Auction finalized!", {
        description: "Loan has been created from the winning bid",
      });
    } catch (error) {
      console.error("Finalize failed:", error);
    }
  };

  const handleRepayLoan = async (loanId: string) => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    try {
      await repayLoan(loanId, address);
      toast.success("Loan repaid!", {
        description: "Your NFT collateral has been returned",
      });
    } catch (error) {
      console.error("Repay failed:", error);
    }
  };

  const handleClaimCollateral = async (loanId: string) => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    try {
      await claimCollateral(loanId, address);
      toast.success("NFT claimed!", {
        description: "The NFT collateral is now yours",
      });
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">NFT Lending</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Lenders bid on interest rates — no oracles needed!</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Borrow stablecoins using your NFTs as collateral</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="collection">Your NFTs</TabsTrigger>
            <TabsTrigger value="auctions">Active Auctions</TabsTrigger>
            <TabsTrigger value="loans">Active Loans</TabsTrigger>
          </TabsList>

          {/* SECTION 1: NFT Collection */}
          <TabsContent value="collection">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5">
                {["All", "Art", "Gaming", "PFP", "Domains"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNftFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      nftFilter === cat
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleMintNFT}
                disabled={isMinting}
              >
                {isMinting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Minting...</>
                ) : (
                  <><Plus className="h-3.5 w-3.5" /> Mint Test NFT</>
                )}
              </Button>
            </div>

            {filteredNFTs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNFTs.map((nft, i) => (
                  <motion.div
                    key={`${nft.collection}-${nft.tokenId}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border-border bg-card hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group">
                      {/* Image placeholder */}
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={nft.whitelisted ? "success" : "muted"}
                            className="text-[10px]"
                          >
                            {nft.whitelisted ? "Whitelisted" : "Not Whitelisted"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium text-sm truncate">{nft.collection}</p>
                        <p className="text-xs text-muted-foreground font-mono-numbers">{nft.tokenId}</p>
                        <p className="text-xs text-muted-foreground">Floor: {nft.floorPrice}</p>
                        <Button
                          variant={nft.whitelisted ? "gradient" : "outline"}
                          size="sm"
                          className="w-full mt-2"
                          disabled={!nft.whitelisted}
                          onClick={() => {
                            if (!isConnected) {
                              openConnectModal?.();
                              return;
                            }
                            if (nft.whitelisted) setAuctionNFT(nft);
                          }}
                        >
                          {nft.whitelisted ? "Use as Collateral" : "Not Supported"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                {!isConnected ? (
                  <>
                    <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">Connect your wallet</h3>
                    <p className="text-sm text-muted-foreground mb-3">Connect to view your NFT collection</p>
                    <Button variant="gradient" size="sm" onClick={() => openConnectModal?.()}>
                      Connect Wallet
                    </Button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No NFTs found in your wallet</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1.5"
                      onClick={handleMintNFT}
                      disabled={isMinting}
                    >
                      {isMinting ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Minting...</>
                      ) : (
                        <><Plus className="h-3.5 w-3.5" /> Mint Test NFT</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* SECTION 2: Active NFT Auctions */}
          <TabsContent value="auctions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Active NFT Auctions</h2>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {activeAuctions.length > 0 ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">NFT</TableHead>
                      <TableHead className="text-muted-foreground">Loan</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Max Repay</TableHead>
                      <TableHead className="text-muted-foreground">Current Bid</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell">Time Left</TableHead>
                      <TableHead className="text-muted-foreground text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAuctions.map((auction) => (
                      <TableRow key={auction.id} className="border-border hover:bg-secondary/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[120px]">{auction.collection}</p>
                              <p className="text-xs text-muted-foreground font-mono-numbers">{auction.tokenId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono-numbers text-sm">{auction.loan}</TableCell>
                        <TableCell className="font-mono-numbers text-sm hidden md:table-cell">{auction.maxRepay}</TableCell>
                        <TableCell>
                          <span className="font-mono-numbers text-sm">{auction.currentBid}</span>
                          <span className="text-xs text-muted-foreground block">({auction.bids} bids)</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="flex items-center gap-1 font-mono-numbers text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {auction.timeLeft}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Button variant="outline" size="sm">View Bids</Button>
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => handleFinalizeAuction(auction.id)}
                            >
                              Finalize
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No active auctions</h3>
                <p className="text-sm text-muted-foreground">Create your first NFT auction above</p>
              </div>
            )}
          </TabsContent>

          {/* SECTION 3: Active NFT Loans */}
          <TabsContent value="loans">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Your Active NFT Loans</h2>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(["all", "borrower", "lender"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLoanRoleFilter(opt)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        loanRoleFilter === opt
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {filteredLoans.length > 0 ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">NFT</TableHead>
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Loan</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Repayment</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => {
                      const config = statusColors[loan.status];
                      return (
                        <TableRow key={loan.id} className="border-border hover:bg-secondary/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[120px]">{loan.collection}</p>
                                <p className="text-xs text-muted-foreground font-mono-numbers">{loan.tokenId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={loan.role === "borrower" ? "default" : "accent"}>
                              {loan.role === "borrower" ? "Borrower" : "Lender"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono-numbers text-sm">{loan.loan}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="font-mono-numbers text-sm">{loan.repayment}</span>
                            <Badge variant="accent" className="ml-2 text-[10px]">{loan.apr}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5 min-w-[100px]">
                              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${config.bar}`}
                                  style={{ width: `${Math.min(loan.progress, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${config.text}`}>{loan.timeLeft}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {loan.role === "borrower" ? (
                              <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => handleRepayLoan(loan.id)}
                              >
                                Repay Loan
                              </Button>
                            ) : (loan.status as string) === "overdue" ? (
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => handleClaimCollateral(loan.id)}
                              >
                                Claim NFT
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>Waiting</Button>
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
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No active NFT loans</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create NFT Auction Modal */}
      {auctionNFT && (
        <CreateNFTAuctionModal
          open={!!auctionNFT}
          onOpenChange={(open) => !open && setAuctionNFT(null)}
          nft={auctionNFT}
        />
      )}
    </div>
  );
};

export default NFTLending;
