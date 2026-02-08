import { useState, useMemo, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

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
import PlaceNFTBidModal from "@/components/PlaceNFTBidModal";
import ViewBidsModal from "@/components/ViewBidsModal";
import FinalizeNFTAuctionModal from "@/components/FinalizeNFTAuctionModal";
import RepayNFTLoanModal from "@/components/RepayNFTLoanModal";
import ClaimNFTModal from "@/components/ClaimNFTModal";
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
	User,
	AlertTriangle,
} from "lucide-react";
import {
	useNFTStore,
	type NFT,
	type NFTAuction,
	type NFTLoan,
} from "@/store/useNFTStore";

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimeLeft(endTime: number): string {
	const diff = endTime - Date.now();
	if (diff <= 0) return "Ended";

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

	if (days > 0) return `${days}d ${hours}h`;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function getLoanProgress(loan: NFTLoan): number {
	const totalDuration = loan.maturityTime - loan.startTime;
	const elapsed = Date.now() - loan.startTime;
	return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
}

const statusColors = {
	active: {
		text: "text-success",
		bar: "bg-success",
		badge: "success" as const,
	},
	grace_period: {
		text: "text-warning",
		bar: "bg-warning",
		badge: "warning" as const,
	},
	overdue: {
		text: "text-destructive",
		bar: "bg-destructive",
		badge: "destructive" as const,
	},
	repaid: {
		text: "text-muted-foreground",
		bar: "bg-muted",
		badge: "muted" as const,
	},
	defaulted: {
		text: "text-muted-foreground",
		bar: "bg-muted",
		badge: "muted" as const,
	},
};

// ============================================
// MAIN COMPONENT
// ============================================

const NFTLending = () => {
	const { address, isConnected } = useWallet();
	const { openConnectModal } = useConnectModal();

	// Store state
	const nfts = useNFTStore((state) => state.nfts);
	const auctions = useNFTStore((state) => state.auctions);
	const loans = useNFTStore((state) => state.loans);
	const mintNFT = useNFTStore((state) => state.mintNFT);
	const updateAuctionStatuses = useNFTStore(
		(state) => state.updateAuctionStatuses,
	);
	const updateLoanStatuses = useNFTStore((state) => state.updateLoanStatuses);

	// Local state
	const [activeTab, setActiveTab] = useState("collection");
	const [loanRoleFilter, setLoanRoleFilter] = useState<
		"all" | "borrower" | "lender"
	>("all");
	const [nftFilter, setNftFilter] = useState("All");
	const [isMinting, setIsMinting] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Modal states
	const [auctionNFT, setAuctionNFT] = useState<NFT | null>(null);
	const [placeBidAuction, setPlaceBidAuction] = useState<NFTAuction | null>(
		null,
	);
	const [finalizeAuction, setFinalizeAuction] = useState<NFTAuction | null>(
		null,
	);
	const [repayLoan, setRepayLoan] = useState<NFTLoan | null>(null);
	const [claimLoan, setClaimLoan] = useState<NFTLoan | null>(null);
	const [viewBidsAuction, setViewBidsAuction] = useState<NFTAuction | null>(
		null,
	);

	// Update statuses periodically
	useEffect(() => {
		const interval = setInterval(() => {
			updateAuctionStatuses();
			updateLoanStatuses();
		}, 1000);
		return () => clearInterval(interval);
	}, [updateAuctionStatuses, updateLoanStatuses]);

	// Filter user's NFTs
	const userNFTs = useMemo(() => {
		if (!address) return nfts; // Show all for demo when not connected
		return nfts.filter(
			(nft) => nft.owner.toLowerCase() === address.toLowerCase(),
		);
	}, [nfts, address]);

	const filteredNFTs = useMemo(() => {
		return userNFTs.filter(
			(nft) => nftFilter === "All" || nft.category === nftFilter,
		);
	}, [userNFTs, nftFilter]);

	// Filter active auctions (show all for bidding, highlight owned)
	const activeAuctions = useMemo(() => {
		return auctions.filter(
			(a) =>
				a.status === "active" ||
				a.status === "ending_soon" ||
				a.status === "ended",
		);
	}, [auctions]);

	// Filter user's loans
	const userLoans = useMemo(() => {
		if (!address)
			return loans.filter(
				(l) => l.status !== "repaid" && l.status !== "defaulted",
			);
		return loans.filter(
			(l) =>
				(l.borrower.toLowerCase() === address.toLowerCase() ||
					l.lender.toLowerCase() === address.toLowerCase()) &&
				(l.status === "active" ||
					l.status === "grace_period" ||
					l.status === "overdue"),
		);
	}, [loans, address]);

	const filteredLoans = useMemo(() => {
		if (loanRoleFilter === "all") return userLoans;
		return userLoans.filter((loan) => {
			if (!address) return true;
			if (loanRoleFilter === "borrower") {
				return loan.borrower.toLowerCase() === address.toLowerCase();
			}
			return loan.lender.toLowerCase() === address.toLowerCase();
		});
	}, [userLoans, loanRoleFilter, address]);

	// Check ownership
	const isAuctionOwner = (auction: NFTAuction) => {
		if (!address) return false;
		return auction.borrower.toLowerCase() === address.toLowerCase();
	};

	const isBorrower = (loan: NFTLoan) => {
		if (!address) return false;
		return loan.borrower.toLowerCase() === address.toLowerCase();
	};

	const isLender = (loan: NFTLoan) => {
		if (!address) return false;
		return loan.lender.toLowerCase() === address.toLowerCase();
	};

	// Handlers
	const handleMintNFT = async () => {
		if (!isConnected || !address) {
			openConnectModal?.();
			return;
		}

		setIsMinting(true);
		try {
			const newNFT = await mintNFT(address);
			toast.success("NFT Minted!", {
				description: `You received ${newNFT.collection} ${newNFT.tokenId}`,
			});
		} catch (error) {
			console.error("Mint failed:", error);
		} finally {
			setIsMinting(false);
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		updateAuctionStatuses();
		updateLoanStatuses();
		await new Promise((r) => setTimeout(r, 500));
		setIsRefreshing(false);
		toast.success("Data refreshed");
	};

	// Get auction button state
	const getAuctionButton = (auction: NFTAuction) => {
		const isOwner = isAuctionOwner(auction);
		const hasEnded = auction.status === "ended";
		const hasBids = auction.bidCount > 0;

		if (isOwner) {
			if (hasEnded && hasBids) {
				return {
					label: "Finalize",
					variant: "gradient" as const,
					action: () => setFinalizeAuction(auction),
					disabled: false,
				};
			}
			if (hasEnded && !hasBids) {
				return {
					label: "No Bids",
					variant: "outline" as const,
					action: () => {},
					disabled: true,
				};
			}
			return {
				label: "Waiting...",
				variant: "outline" as const,
				action: () => {},
				disabled: true,
			};
		} else {
			if (hasEnded) {
				return {
					label: "Ended",
					variant: "outline" as const,
					action: () => {},
					disabled: true,
				};
			}
			return {
				label: "Place Bid",
				variant: "gradient" as const,
				action: () => setPlaceBidAuction(auction),
				disabled: !isConnected,
			};
		}
	};

	// Get loan button state
	const getLoanButton = (loan: NFTLoan) => {
		const borrower = isBorrower(loan);
		const lender = isLender(loan);
		const canClaim =
			loan.status === "overdue" && Date.now() > loan.gracePeriodEnd;

		if (borrower) {
			if (loan.status === "grace_period") {
				return {
					label: "Repay Now",
					variant: "destructive" as const,
					action: () => setRepayLoan(loan),
					disabled: false,
					urgent: true,
				};
			}
			if (loan.status === "overdue") {
				return {
					label: "Overdue",
					variant: "destructive" as const,
					action: () => {},
					disabled: true,
				};
			}
			return {
				label: "Repay Loan",
				variant: "gradient" as const,
				action: () => setRepayLoan(loan),
				disabled: false,
			};
		}

		if (lender) {
			if (canClaim) {
				return {
					label: "Claim NFT",
					variant: "accent" as const,
					action: () => setClaimLoan(loan),
					disabled: false,
				};
			}
			return {
				label: "Waiting",
				variant: "outline" as const,
				action: () => {},
				disabled: true,
			};
		}

		return {
			label: "View",
			variant: "outline" as const,
			action: () => {},
			disabled: true,
		};
	};

	return (
		<div className="container py-8">
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
								<p>
									Lenders bid on interest rates — no oracles
									needed!
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<p className="text-sm text-muted-foreground mt-1">
						Borrow stablecoins using your NFTs as collateral
					</p>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="bg-secondary mb-6">
					<TabsTrigger value="collection">Your NFTs</TabsTrigger>
					<TabsTrigger value="auctions">
						Active Auctions
						{activeAuctions.length > 0 && (
							<Badge
								variant="accent"
								className="ml-2 text-[10px]"
							>
								{activeAuctions.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="loans">
						Active Loans
						{userLoans.length > 0 && (
							<Badge
								variant="accent"
								className="ml-2 text-[10px]"
							>
								{userLoans.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				{/* ============================================ */}
				{/* SECTION 1: NFT Collection */}
				{/* ============================================ */}
				<TabsContent value="collection">
					<div className="flex items-center justify-between mb-4">
						<div className="flex gap-1.5">
							{["All", "Art", "Gaming", "PFP", "Domains"].map(
								(cat) => (
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
								),
							)}
						</div>
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5"
							onClick={handleMintNFT}
							disabled={isMinting}
						>
							{isMinting ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
									Minting...
								</>
							) : (
								<>
									<Plus className="h-3.5 w-3.5" /> Mint Test
									NFT
								</>
							)}
						</Button>
					</div>

					{filteredNFTs.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{filteredNFTs.map((nft, i) => (
								<motion.div
									key={nft.id}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.05 }}
								>
									<Card className="border-border bg-card hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group">
										<div className="aspect-square bg-muted flex items-center justify-center relative">
											<ImageIcon className="h-12 w-12 text-muted-foreground/30" />
											<div className="absolute top-2 right-2">
												<Badge
													variant={
														nft.whitelisted
															? "success"
															: "muted"
													}
													className="text-[10px]"
												>
													{nft.whitelisted
														? "Whitelisted"
														: "Not Whitelisted"}
												</Badge>
											</div>
										</div>
										<CardContent className="p-4 space-y-2">
											<p className="font-medium text-sm truncate">
												{nft.collection}
											</p>
											<p className="text-xs text-muted-foreground font-mono-numbers">
												{nft.tokenId}
											</p>
											<p className="text-xs text-muted-foreground">
												Floor: {nft.floorPrice}
											</p>
											<Button
												variant={
													nft.whitelisted
														? "gradient"
														: "outline"
												}
												size="sm"
												className="w-full mt-2"
												disabled={!nft.whitelisted}
												onClick={() => {
													if (!isConnected) {
														openConnectModal?.();
														return;
													}
													if (nft.whitelisted)
														setAuctionNFT(nft);
												}}
											>
												{nft.whitelisted
													? "Use as Collateral"
													: "Not Supported"}
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
									<h3 className="text-lg font-semibold mb-1">
										Connect your wallet
									</h3>
									<p className="text-sm text-muted-foreground mb-3">
										Connect to view your NFT collection
									</p>
									<Button
										variant="gradient"
										size="sm"
										onClick={() => openConnectModal?.()}
									>
										Connect Wallet
									</Button>
								</>
							) : (
								<>
									<ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-1">
										No NFTs found in your wallet
									</h3>
									<Button
										variant="outline"
										size="sm"
										className="mt-3 gap-1.5"
										onClick={handleMintNFT}
										disabled={isMinting}
									>
										{isMinting ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
												Minting...
											</>
										) : (
											<>
												<Plus className="h-3.5 w-3.5" />{" "}
												Mint Test NFT
											</>
										)}
									</Button>
								</>
							)}
						</div>
					)}
				</TabsContent>

				{/* ============================================ */}
				{/* SECTION 2: Active NFT Auctions */}
				{/* ============================================ */}
				<TabsContent value="auctions">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold">
							Active NFT Auctions
						</h2>
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={handleRefresh}
							disabled={isRefreshing}
						>
							<RefreshCw
								className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>

					{activeAuctions.length > 0 ? (
						<div className="rounded-xl border border-border bg-card overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="border-border hover:bg-transparent">
										<TableHead className="text-muted-foreground">
											NFT
										</TableHead>
										<TableHead className="text-muted-foreground">
											Loan
										</TableHead>
										<TableHead className="text-muted-foreground hidden md:table-cell">
											Max Repay
										</TableHead>
										<TableHead className="text-muted-foreground">
											Current Bid
										</TableHead>
										<TableHead className="text-muted-foreground hidden sm:table-cell">
											Time Left
										</TableHead>
										<TableHead className="text-muted-foreground text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{activeAuctions.map((auction) => {
										const buttonState =
											getAuctionButton(auction);
										const isOwner = isAuctionOwner(auction);
										const timeLeft = formatTimeLeft(
											auction.auctionEndTime,
										);
										const isEndingSoon =
											auction.status === "ending_soon";
										const hasEnded =
											auction.status === "ended";

										return (
											<TableRow
												key={auction.id}
												className={`border-border hover:bg-secondary/30 transition-colors ${
													isOwner
														? "bg-primary/5"
														: ""
												}`}
											>
												<TableCell>
													<div className="flex items-center gap-2">
														<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
															<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
														</div>
														<div>
															<div className="flex items-center gap-2">
																<p className="text-sm font-medium truncate max-w-[120px]">
																	{
																		auction.collection
																	}
																</p>
																{isOwner && (
																	<Badge
																		variant="accent"
																		className="text-[10px] gap-1"
																	>
																		<User className="h-3 w-3" />{" "}
																		Yours
																	</Badge>
																)}
															</div>
															<p className="text-xs text-muted-foreground font-mono-numbers">
																{
																	auction.tokenId
																}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="font-mono-numbers text-sm">
													{parseFloat(
														auction.loanAmount,
													).toLocaleString()}{" "}
													{auction.loanToken}
												</TableCell>
												<TableCell className="font-mono-numbers text-sm hidden md:table-cell">
													{parseFloat(
														auction.maxRepayment,
													).toLocaleString()}{" "}
													{auction.loanToken}
												</TableCell>
												<TableCell>
													<span className="font-mono-numbers text-sm">
														{auction.currentBid
															? `${parseFloat(auction.currentBid).toLocaleString()} ${auction.loanToken}`
															: "No bids"}
													</span>
													<span className="text-xs text-muted-foreground block">
														({auction.bidCount}{" "}
														bids)
													</span>
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													<Badge
														variant={
															hasEnded
																? "muted"
																: isEndingSoon
																	? "warning"
																	: "success"
														}
														className="gap-1"
													>
														<Clock className="h-3 w-3" />
														{timeLeft}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																setViewBidsAuction(
																	auction,
																)
															}
														>
															View Bids
														</Button>
														<Button
															variant={
																buttonState.variant
															}
															size="sm"
															onClick={
																buttonState.action
															}
															disabled={
																buttonState.disabled
															}
														>
															{buttonState.label}
														</Button>
													</div>
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
							<h3 className="text-lg font-semibold mb-1">
								No active auctions
							</h3>
							<p className="text-sm text-muted-foreground">
								Create your first NFT auction above
							</p>
						</div>
					)}
				</TabsContent>

				<ViewBidsModal
					open={!!viewBidsAuction}
					onOpenChange={(open) => !open && setViewBidsAuction(null)}
					auction={viewBidsAuction}
				/>

				{/* ============================================ */}
				{/* SECTION 3: Active NFT Loans */}
				{/* ============================================ */}
				<TabsContent value="loans">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<h2 className="text-lg font-semibold">
								Active NFT Loans
							</h2>
							<div className="flex rounded-lg border border-border overflow-hidden">
								{(["all", "borrower", "lender"] as const).map(
									(opt) => (
										<button
											key={opt}
											onClick={() =>
												setLoanRoleFilter(opt)
											}
											className={`px-3 py-1 text-xs font-medium transition-colors ${
												loanRoleFilter === opt
													? "gradient-primary text-primary-foreground"
													: "bg-secondary text-muted-foreground hover:text-foreground"
											}`}
										>
											{opt === "all"
												? "All"
												: opt.charAt(0).toUpperCase() +
													opt.slice(1)}
										</button>
									),
								)}
							</div>
						</div>
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={handleRefresh}
							disabled={isRefreshing}
						>
							<RefreshCw
								className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>

					{filteredLoans.length > 0 ? (
						<div className="rounded-xl border border-border bg-card overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="border-border hover:bg-transparent">
										<TableHead className="text-muted-foreground">
											NFT
										</TableHead>
										<TableHead className="text-muted-foreground">
											Role
										</TableHead>
										<TableHead className="text-muted-foreground">
											Loan
										</TableHead>
										<TableHead className="text-muted-foreground hidden md:table-cell">
											Repayment
										</TableHead>
										<TableHead className="text-muted-foreground">
											Status
										</TableHead>
										<TableHead className="text-muted-foreground text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredLoans.map((loan) => {
										const buttonState = getLoanButton(loan);
										const progress = getLoanProgress(loan);
										const config =
											statusColors[loan.status];
										const role = isBorrower(loan)
											? "borrower"
											: "lender";
										const timeLeft = formatTimeLeft(
											loan.status === "grace_period"
												? loan.gracePeriodEnd
												: loan.maturityTime,
										);

										return (
											<TableRow
												key={loan.id}
												className="border-border hover:bg-secondary/30 transition-colors"
											>
												<TableCell>
													<div className="flex items-center gap-2">
														<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
															<ImageIcon className="h-4 w-4 text-muted-foreground/50" />
														</div>
														<div>
															<p className="text-sm font-medium truncate max-w-[120px]">
																{
																	loan.collection
																}
															</p>
															<p className="text-xs text-muted-foreground font-mono-numbers">
																{loan.tokenId}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															role === "borrower"
																? "default"
																: "accent"
														}
													>
														{role === "borrower"
															? "Borrower"
															: "Lender"}
													</Badge>
												</TableCell>
												<TableCell className="font-mono-numbers text-sm">
													{parseFloat(
														loan.loanAmount,
													).toLocaleString()}{" "}
													{loan.loanToken}
												</TableCell>
												<TableCell className="hidden md:table-cell">
													<span className="font-mono-numbers text-sm">
														{parseFloat(
															loan.repaymentAmount,
														).toLocaleString()}{" "}
														{loan.loanToken}
													</span>
													<Badge
														variant="accent"
														className="ml-2 text-[10px]"
													>
														{loan.apr.toFixed(1)}%
														APR
													</Badge>
												</TableCell>
												<TableCell>
													<div className="space-y-1.5 min-w-[100px]">
														<div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
															<div
																className={`h-full rounded-full transition-all ${config.bar}`}
																style={{
																	width: `${Math.min(progress, 100)}%`,
																}}
															/>
														</div>
														<div className="flex items-center gap-1">
															{loan.status ===
																"grace_period" && (
																<AlertTriangle className="h-3 w-3 text-warning" />
															)}
															{loan.status ===
																"overdue" && (
																<AlertTriangle className="h-3 w-3 text-destructive" />
															)}
															<span
																className={`text-xs font-medium ${config.text}`}
															>
																{loan.status ===
																"grace_period"
																	? `Grace: ${timeLeft}`
																	: loan.status ===
																		  "overdue"
																		? "Overdue"
																		: timeLeft}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant={
															buttonState.variant
														}
														size="sm"
														onClick={
															buttonState.action
														}
														disabled={
															buttonState.disabled
														}
													>
														{buttonState.label}
													</Button>
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
							<h3 className="text-lg font-semibold mb-1">
								No active NFT loans
							</h3>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* ============================================ */}
			{/* MODALS */}
			{/* ============================================ */}

			{/* Create NFT Auction Modal */}
			{auctionNFT && (
				<CreateNFTAuctionModal
					open={!!auctionNFT}
					onOpenChange={(open) => !open && setAuctionNFT(null)}
					nft={auctionNFT}
				/>
			)}

			{/* Place Bid Modal */}
			{placeBidAuction && (
				<PlaceNFTBidModal
					open={!!placeBidAuction}
					onOpenChange={(open) => !open && setPlaceBidAuction(null)}
					auction={placeBidAuction}
				/>
			)}

			{/* Finalize Auction Modal */}
			{finalizeAuction && (
				<FinalizeNFTAuctionModal
					open={!!finalizeAuction}
					onOpenChange={(open) => !open && setFinalizeAuction(null)}
					auction={finalizeAuction}
				/>
			)}

			{/* Repay Loan Modal */}
			{repayLoan && (
				<RepayNFTLoanModal
					open={!!repayLoan}
					onOpenChange={(open) => !open && setRepayLoan(null)}
					loan={repayLoan}
				/>
			)}

			{/* Claim NFT Modal */}
			{claimLoan && (
				<ClaimNFTModal
					open={!!claimLoan}
					onOpenChange={(open) => !open && setClaimLoan(null)}
					loan={claimLoan}
				/>
			)}
		</div>
	);
};

export default NFTLending;
