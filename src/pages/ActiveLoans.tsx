import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
	ChevronDown,
	DollarSign,
	TrendingUp,
	Percent,
	ExternalLink,
	Loader2,
	Wallet,
	AlertTriangle,
} from "lucide-react";
import { useLoanStore } from "@/store/useLoanStore";
import type { Loan } from "@/types";

type Role = "borrower" | "lender";

// Format time remaining
function formatTimeLeft(endTime: number): string {
	const now = Date.now();
	const diff = endTime - now;

	if (diff <= 0) return "Overdue";

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	if (days > 0) {
		return `${days}d ${hours}h remaining`;
	}
	return `${hours}h remaining`;
}

// Get loan status based on time
function getLoanDisplayStatus(loan: Loan): {
	status: string;
	color: string;
	progressColor: string;
	progress: number;
} {
	const now = Date.now();
	const totalDuration = loan.maturityTime - loan.startTime;
	const elapsed = now - loan.startTime;
	const progress = Math.min(100, (elapsed / totalDuration) * 100);

	if (loan.status === "repaid") {
		return {
			status: "Repaid",
			color: "text-success",
			progressColor: "bg-success",
			progress: 100,
		};
	}
	if (loan.status === "defaulted") {
		return {
			status: "Defaulted",
			color: "text-destructive",
			progressColor: "bg-destructive",
			progress: 100,
		};
	}
	if (now > loan.gracePeriodEnd) {
		return {
			status: "Overdue",
			color: "text-destructive",
			progressColor: "bg-destructive",
			progress: 100,
		};
	}
	if (now > loan.maturityTime) {
		return {
			status: "Grace Period",
			color: "text-warning",
			progressColor: "bg-warning",
			progress: 100,
		};
	}
	if (loan.maturityTime - now < 24 * 60 * 60 * 1000) {
		return {
			status: "Approaching",
			color: "text-warning",
			progressColor: "bg-warning",
			progress,
		};
	}
	return {
		status: "Healthy",
		color: "text-success",
		progressColor: "bg-success",
		progress,
	};
}

const ActiveLoans = () => {
	const { address, isConnected } = useWallet();
	const { openConnectModal } = useConnectModal();
	const loans = useLoanStore((state) => state.loans);
	const repayLoan = useLoanStore((state) => state.repayLoan);
	const claimCollateral = useLoanStore((state) => state.claimCollateral);
	const updateLoanStatuses = useLoanStore(
		(state) => state.updateLoanStatuses,
	);

	const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
	const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
	const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
	const [actionType, setActionType] = useState<"repay" | "claim" | null>(
		null,
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const [, setTick] = useState(0);

	// Update statuses every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setTick((t) => t + 1);
			updateLoanStatuses();
		}, 60000);
		return () => clearInterval(interval);
	}, [updateLoanStatuses]);

	// Filter active loans (not repaid or defaulted)
	const activeLoans = useMemo(() => {
		return loans.filter(
			(l) => l.status !== "repaid" && l.status !== "defaulted",
		);
	}, [loans]);

	const filtered = useMemo(() => {
		return activeLoans.filter((l) => {
			if (roleFilter === "all") return true;
			if (roleFilter === "borrower") {
				return (
					address &&
					l.borrower.toLowerCase() === address.toLowerCase()
				);
			}
			if (roleFilter === "lender") {
				return (
					address && l.lender.toLowerCase() === address.toLowerCase()
				);
			}
			return true;
		});
	}, [activeLoans, roleFilter, address]);

	// Calculate summary stats
	const stats = useMemo(() => {
		const totalLoaned = filtered.reduce(
			(sum, l) => sum + parseFloat(l.loanAmount),
			0,
		);
		const totalInterest = filtered.reduce(
			(sum, l) =>
				sum +
				(parseFloat(l.repaymentAmount) - parseFloat(l.loanAmount)),
			0,
		);
		const avgApr =
			filtered.length > 0
				? filtered.reduce((sum, l) => {
						const interest =
							parseFloat(l.repaymentAmount) -
							parseFloat(l.loanAmount);
						const apr = (interest / parseFloat(l.loanAmount)) * 100;
						return sum + apr;
					}, 0) / filtered.length
				: 0;

		return {
			totalLoaned: `$${(totalLoaned / 1000).toFixed(0)}K`,
			totalInterest: `$${(totalInterest / 1000).toFixed(1)}K`,
			avgApr: `${avgApr.toFixed(1)}%`,
		};
	}, [filtered]);

	const handleRepay = (loan: Loan) => {
		if (!isConnected) {
			openConnectModal?.();
			return;
		}
		// Only borrower can repay
		if (!address || loan.borrower.toLowerCase() !== address.toLowerCase()) {
			toast.error("Only the borrower can repay this loan");
			return;
		}
		setSelectedLoan(loan);
		setActionType("repay");
	};

	const handleClaim = (loan: Loan) => {
		if (!isConnected) {
			openConnectModal?.();
			return;
		}
		// Only lender can claim
		if (!address || loan.lender.toLowerCase() !== address.toLowerCase()) {
			toast.error("Only the lender can claim collateral");
			return;
		}
		setSelectedLoan(loan);
		setActionType("claim");
	};

	const confirmAction = async () => {
		if (!selectedLoan || !actionType) return;

		setIsProcessing(true);
		try {
			if (actionType === "repay") {
				await repayLoan(selectedLoan.id);
				toast.success("Loan repaid successfully!", {
					description: `Your ${selectedLoan.collateralAmount} ${selectedLoan.collateralToken} has been returned`,
				});
			} else {
				await claimCollateral(selectedLoan.id);
				toast.success("Collateral claimed!", {
					description: `You received ${selectedLoan.collateralAmount} ${selectedLoan.collateralToken}`,
				});
			}
			setSelectedLoan(null);
			setActionType(null);
		} catch (error) {
			console.error("Action failed:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	const getUserRole = (loan: Loan): Role | null => {
		if (!address) return null;
		if (loan.borrower.toLowerCase() === address.toLowerCase())
			return "borrower";
		if (loan.lender.toLowerCase() === address.toLowerCase())
			return "lender";
		return null;
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container py-8">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
					<h1 className="text-2xl font-bold">Your Active Loans</h1>
					<div className="flex items-center gap-3">
						<div className="flex rounded-lg border border-border overflow-hidden">
							{[
								{ value: "all", label: "All" },
								{ value: "borrower", label: "Borrower" },
								{ value: "lender", label: "Lender" },
							].map((opt) => (
								<button
									key={opt.value}
									onClick={() =>
										setRoleFilter(
											opt.value as typeof roleFilter,
										)
									}
									className={`px-4 py-2 text-sm font-medium transition-colors ${
										roleFilter === opt.value
											? "gradient-primary text-primary-foreground"
											: "bg-secondary text-muted-foreground hover:text-foreground"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
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
							<p className="text-sm font-medium">
								Wallet not connected
							</p>
							<p className="text-xs text-muted-foreground">
								Connect to view your loans
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => openConnectModal?.()}
						>
							Connect
						</Button>
					</motion.div>
				)}

				{/* Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
					{[
						{
							label: "Total Loaned",
							value: stats.totalLoaned,
							icon: DollarSign,
						},
						{
							label: "Interest Earned",
							value: stats.totalInterest,
							icon: TrendingUp,
						},
						{
							label: "Avg APR",
							value: stats.avgApr,
							icon: Percent,
						},
					].map((card, i) => (
						<motion.div
							key={card.label}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.08 }}
							className="rounded-xl border border-border bg-card p-5"
						>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-muted-foreground">
									{card.label}
								</span>
								<card.icon className="h-4 w-4 text-accent" />
							</div>
							<p className="text-3xl font-bold font-mono-numbers">
								{card.value}
							</p>
						</motion.div>
					))}
				</div>

				{/* Loans Table */}
				{filtered.length > 0 ? (
					<div className="rounded-xl border border-border bg-card overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="border-border hover:bg-transparent">
									<TableHead className="text-muted-foreground w-8" />
									<TableHead className="text-muted-foreground">
										ID
									</TableHead>
									<TableHead className="text-muted-foreground">
										Role
									</TableHead>
									<TableHead className="text-muted-foreground">
										Collateral
									</TableHead>
									<TableHead className="text-muted-foreground hidden md:table-cell">
										Loan
									</TableHead>
									<TableHead className="text-muted-foreground hidden lg:table-cell">
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
								{filtered.map((loan) => {
									const displayStatus =
										getLoanDisplayStatus(loan);
									const isExpanded = expandedLoan === loan.id;
									const userRole = getUserRole(loan);
									const timeLeft = formatTimeLeft(
										loan.maturityTime,
									);
									const apr = (
										((parseFloat(loan.repaymentAmount) -
											parseFloat(loan.loanAmount)) /
											parseFloat(loan.loanAmount)) *
										100
									).toFixed(1);

									return (
										<React.Fragment key={loan.id}>
											<TableRow
												className="border-border hover:bg-secondary/30 transition-colors cursor-pointer"
												onClick={() =>
													setExpandedLoan(
														isExpanded
															? null
															: loan.id,
													)
												}
											>
												<TableCell>
													<ChevronDown
														className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
													/>
												</TableCell>
												<TableCell>
													<Badge
														variant="muted"
														className="font-mono-numbers"
													>
														{loan.id}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															userRole ===
															"borrower"
																? "default"
																: "accent"
														}
													>
														{userRole === "borrower"
															? "Borrower"
															: userRole ===
																  "lender"
																? "Lender"
																: "—"}
													</Badge>
												</TableCell>
												<TableCell>
													<span className="flex items-center gap-2">
														<span className="text-lg">
															{loan.collateralToken ===
															"WBTC"
																? "₿"
																: "Ξ"}
														</span>
														<span className="font-mono-numbers text-sm">
															{
																loan.collateralAmount
															}{" "}
															{
																loan.collateralToken
															}
														</span>
													</span>
												</TableCell>
												<TableCell className="hidden md:table-cell font-mono-numbers text-sm">
													{parseFloat(
														loan.loanAmount,
													).toLocaleString()}{" "}
													{loan.loanToken}
												</TableCell>
												<TableCell className="hidden lg:table-cell">
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
														{apr}%
													</Badge>
												</TableCell>
												<TableCell>
													<div className="space-y-1.5 min-w-[120px]">
														<div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
															<div
																className={`h-full rounded-full transition-all ${displayStatus.progressColor}`}
																style={{
																	width: `${displayStatus.progress}%`,
																}}
															/>
														</div>
														<span
															className={`text-xs font-medium ${displayStatus.color}`}
														>
															{timeLeft}
														</span>
													</div>
												</TableCell>
												<TableCell
													className="text-right"
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													{userRole === "borrower" &&
													loan.status !== "repaid" ? (
														<Button
															variant="gradient"
															size="sm"
															onClick={() =>
																handleRepay(
																	loan,
																)
															}
														>
															Repay Loan
														</Button>
													) : userRole === "lender" &&
													  (loan.status ===
															"overdue" ||
															Date.now() >
																loan.gracePeriodEnd) ? (
														<Button
															variant="accent"
															size="sm"
															onClick={() =>
																handleClaim(
																	loan,
																)
															}
														>
															Claim
														</Button>
													) : (
														<Button
															variant="outline"
															size="sm"
															disabled
														>
															Waiting
														</Button>
													)}
												</TableCell>
											</TableRow>
											{isExpanded && (
												<TableRow
													key={`${loan.id}-details`}
													className="border-border bg-secondary/20 hover:bg-secondary/20"
												>
													<TableCell
														colSpan={8}
														className="p-4"
													>
														<motion.div
															initial={{
																opacity: 0,
																height: 0,
															}}
															animate={{
																opacity: 1,
																height: "auto",
															}}
															className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
														>
															<div>
																<span className="text-muted-foreground block text-xs mb-0.5">
																	Loan Start
																</span>
																<span className="font-medium">
																	{new Date(
																		loan.startTime,
																	).toLocaleDateString()}
																</span>
															</div>
															<div>
																<span className="text-muted-foreground block text-xs mb-0.5">
																	Maturity
																	Date
																</span>
																<span className="font-medium">
																	{new Date(
																		loan.maturityTime,
																	).toLocaleDateString()}
																</span>
															</div>
															<div>
																<span className="text-muted-foreground block text-xs mb-0.5">
																	Transaction
																</span>
																<a
																	href="#"
																	className="font-mono-numbers text-xs text-accent flex items-center gap-1 hover:underline"
																>
																	{loan.txHash.slice(
																		0,
																		10,
																	)}
																	...
																	{loan.txHash.slice(
																		-6,
																	)}{" "}
																	<ExternalLink className="h-3 w-3" />
																</a>
															</div>
															<div>
																<span className="text-muted-foreground block text-xs mb-0.5">
																	NFT
																	Positions
																</span>
																<span className="font-mono-numbers text-xs">
																	B:{" "}
																	{
																		loan.borrowerNftId
																	}{" "}
																	/ L:{" "}
																	{
																		loan.lenderNftId
																	}
																</span>
															</div>
														</motion.div>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
						<DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-1">
							No active loans
						</h3>
						<p className="text-sm text-muted-foreground">
							{isConnected
								? "Your loans will appear here"
								: "Connect wallet to view your loans"}
						</p>
					</div>
				)}
			</main>

			{/* Confirmation Dialog */}
			<Dialog
				open={!!selectedLoan && !!actionType}
				onOpenChange={(open) => !open && setSelectedLoan(null)}
			>
				<DialogContent className="bg-card border-border max-w-md">
					<DialogHeader>
						<DialogTitle className="text-xl">
							{actionType === "repay"
								? "Repay Loan"
								: "Claim Collateral"}
						</DialogTitle>
						<DialogDescription>
							{actionType === "repay"
								? "Confirm loan repayment to get your collateral back"
								: "Claim the collateral from this defaulted loan"}
						</DialogDescription>
					</DialogHeader>

					{selectedLoan && (
						<div className="space-y-4">
							<div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Loan ID
									</span>
									<span className="font-mono-numbers">
										{selectedLoan.id}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Collateral
									</span>
									<span className="font-mono-numbers">
										{selectedLoan.collateralAmount}{" "}
										{selectedLoan.collateralToken}
									</span>
								</div>
								{actionType === "repay" && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Repayment Amount
										</span>
										<span className="font-mono-numbers font-bold">
											{parseFloat(
												selectedLoan.repaymentAmount,
											).toLocaleString()}{" "}
											{selectedLoan.loanToken}
										</span>
									</div>
								)}
							</div>

							{actionType === "repay" && (
								<div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
									<AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
									<p className="text-xs text-muted-foreground">
										This will transfer{" "}
										{parseFloat(
											selectedLoan.repaymentAmount,
										).toLocaleString()}{" "}
										{selectedLoan.loanToken} from your
										wallet
									</p>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setSelectedLoan(null)}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							variant="gradient"
							onClick={confirmAction}
							disabled={isProcessing}
						>
							{isProcessing ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
									Processing...
								</>
							) : actionType === "repay" ? (
								"Confirm Repayment"
							) : (
								"Claim Collateral"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ActiveLoans;
