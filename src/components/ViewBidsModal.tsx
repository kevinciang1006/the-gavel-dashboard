import { useMemo, useState } from "react";
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
import { Clock, Trophy, Copy, CheckCircle2, Bitcoin, Disc } from "lucide-react";
import type { Auction } from "@/types";
import type { NFTAuction } from "@/store/useNFTStore";
import { Image as ImageIcon } from "lucide-react";

interface Bid {
	bidder: string;
	amount: string;
	apr: number;
	timestamp: number;
}

interface ViewBidsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	auction: Auction | NFTAuction | null;
}

function isNFTAuction(auction: Auction | NFTAuction): auction is NFTAuction {
	return "collection" in auction;
}

// Generate mock bids based on auction data
function generateMockBids(auction: Auction | NFTAuction): Bid[] {
	// Use existing bids if available (for NFT auctions)
	if (isNFTAuction(auction) && auction.bids && auction.bids.length > 0) {
		return auction.bids.map((bid) => ({
			bidder: bid.bidder,
			amount: bid.amount,
			apr: bid.apr,
			timestamp: bid.timestamp,
		}));
	}

	if (auction.bidCount === 0 || !auction.currentBid) return [];

	const loanAmount = parseFloat(auction.loanAmount);
	const currentBid = parseFloat(auction.currentBid);
	const maxRepay = parseFloat(auction.maxRepayment);

	const bids: Bid[] = [];

	// Generate bids from highest to lowest (lowest repayment = best for borrower)
	// Ensure the winning bid matches the auction's current bid

	// Winning bid
	bids.push({
		bidder:
			auction.currentBidder ||
			`0x${Math.random().toString(16).substring(2, 42)}`,
		amount: auction.currentBid,
		apr: ((currentBid - loanAmount) / loanAmount) * 100,
		timestamp: Date.now() - 5 * 60 * 1000, // 5 min ago
	});

	// Other bids (higher repayment amounts = worse bids)
	for (let i = 1; i < auction.bidCount; i++) {
		const worseBidAmount =
			currentBid + (maxRepay - currentBid) * (i / auction.bidCount);
		// Add some randomness but keep it ordered
		const randomizedAmount = worseBidAmount * (1 + Math.random() * 0.05);
		const finalAmount = Math.min(randomizedAmount, maxRepay);

		const apr = ((finalAmount - loanAmount) / loanAmount) * 100;

		bids.push({
			bidder: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
			amount: finalAmount.toFixed(0),
			apr,
			timestamp: Date.now() - (i + 1) * 20 * 60 * 1000,
		});
	}

	return bids;
}

const ViewBidsModal = ({ open, onOpenChange, auction }: ViewBidsModalProps) => {
	const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

	const bids = useMemo(
		() => (auction ? generateMockBids(auction) : []),
		[auction],
	);

	if (!auction) return null;

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

	const formatTimeLeft = (endTime: number): string => {
		const diff = endTime - Date.now();
		if (diff <= 0) return "Ended";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor(
			(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
		);
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl">Auction Bids</DialogTitle>
					<DialogDescription>
						View all bids for this auction
					</DialogDescription>
				</DialogHeader>

				{/* Auction Details */}
				<div className="rounded-lg bg-secondary/50 p-4 space-y-3">
					<div className="flex items-center gap-4">
						<div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
							{isNFTAuction(auction) ? (
								<ImageIcon className="h-8 w-8 text-purple-500" />
							) : auction.collateralToken === "WBTC" ? (
								<Bitcoin className="h-8 w-8 text-orange-500" />
							) : (
								<Disc className="h-8 w-8 text-blue-500" />
							)}
						</div>
						<div className="flex-1">
							<p className="font-medium text-lg">
								{isNFTAuction(auction) ? (
									<>
										{auction.collection}{" "}
										<span className="text-muted-foreground">
											{auction.tokenId}
										</span>
									</>
								) : (
									<>
										{auction.collateralAmount}{" "}
										{auction.collateralToken}
									</>
								)}
							</p>
							<p className="text-sm text-muted-foreground font-mono-numbers">
								{auction.id}
							</p>
						</div>
						<Badge
							variant={
								auction.status === "active"
									? "success"
									: "muted"
							}
						>
							{auction.status}
						</Badge>
					</div>

					<div className="grid grid-cols-3 gap-4 text-sm">
						<div>
							<p className="text-muted-foreground text-xs">
								Loan Amount
							</p>
							<p className="font-mono-numbers font-medium">
								{parseFloat(
									auction.loanAmount,
								).toLocaleString()}{" "}
								{auction.loanToken}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								Max Repay
							</p>
							<p className="font-mono-numbers font-medium">
								{parseFloat(
									auction.maxRepayment,
								).toLocaleString()}{" "}
								{auction.loanToken}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								Time Left
							</p>
							<p className="font-mono-numbers font-medium flex items-center gap-1">
								<Clock className="h-3 w-3" />{" "}
								{formatTimeLeft(auction.auctionEndTime)}
							</p>
						</div>
					</div>
				</div>

				{/* Bids Table */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">
							All Bids ({bids.length})
						</h3>
						<p className="text-xs text-muted-foreground">
							Lower repayment = better for borrower
						</p>
					</div>

					{bids.length > 0 ? (
						<div className="rounded-lg border border-border overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="border-border hover:bg-transparent">
										<TableHead className="text-muted-foreground text-xs">
											Rank
										</TableHead>
										<TableHead className="text-muted-foreground text-xs">
											Bidder
										</TableHead>
										<TableHead className="text-muted-foreground text-xs">
											Repayment
										</TableHead>
										<TableHead className="text-muted-foreground text-xs">
											APR
										</TableHead>
										<TableHead className="text-muted-foreground text-xs">
											Time
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{bids.map((bid, index) => {
										const isWinning = index === 0;
										return (
											<TableRow
												key={index}
												className={`border-border transition-colors ${
													isWinning
														? "bg-success/10 hover:bg-success/15"
														: "hover:bg-secondary/30"
												}`}
											>
												<TableCell>
													{isWinning ? (
														<Badge
															variant="success"
															className="gap-1"
														>
															<Trophy className="h-3 w-3" />{" "}
															1st
														</Badge>
													) : (
														<span className="text-muted-foreground text-sm">
															#{index + 1}
														</span>
													)}
												</TableCell>
												<TableCell>
													<button
														onClick={() =>
															handleCopyAddress(
																bid.bidder,
															)
														}
														className="flex items-center gap-1 font-mono-numbers text-xs hover:text-accent transition-colors"
													>
														{bid.bidder.substring(
															0,
															6,
														)}
														...
														{bid.bidder.substring(
															bid.bidder.length -
																4,
														)}
														{copiedAddress ===
														bid.bidder ? (
															<CheckCircle2 className="h-3 w-3 text-success" />
														) : (
															<Copy className="h-3 w-3 opacity-50" />
														)}
													</button>
												</TableCell>
												<TableCell>
													<span className="font-mono-numbers text-sm font-medium">
														{parseFloat(
															bid.amount,
														).toLocaleString()}{" "}
														{auction.loanToken}
													</span>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															bid.apr < 10
																? "success"
																: bid.apr < 15
																	? "warning"
																	: "destructive"
														}
														className="font-mono-numbers"
													>
														{bid.apr.toFixed(1)}%
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{formatTimeAgo(
														bid.timestamp,
													)}
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
							<p className="text-xs">
								Be the first to bid on this auction
							</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ViewBidsModal;
