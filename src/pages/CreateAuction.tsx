import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Check,
	Info,
	Loader2,
	Wallet,
	AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useDemoWalletStore } from "@/store/useDemoWalletStore";
import * as contracts from "@/lib/mockContracts";

const steps = [
	{ number: 1, label: "Collateral" },
	{ number: 2, label: "Loan Terms" },
	{ number: 3, label: "Review" },
];

const CreateAuction = () => {
	const navigate = useNavigate();
	const { address, isConnected, isDemoMode } = useWallet();
	const { openConnectModal } = useConnectModal();
	const createAuction = useAuctionStore((state) => state.createAuction);
	const demoBalances = useDemoWalletStore((state) => state.demoBalances);

	// Form state
	const [collateralToken, setCollateralToken] = useState<"WBTC" | "ETH">(
		"WBTC",
	);
	const [collateralAmount, setCollateralAmount] = useState("");
	const [loanToken, setLoanToken] = useState<"USDC" | "USDT">("USDC");
	const [loanAmount, setLoanAmount] = useState("");
	const [maxRepayment, setMaxRepayment] = useState("");
	const [loanDuration, setLoanDuration] = useState("");
	const [auctionDuration, setAuctionDuration] = useState("");
	const [useListingService, setUseListingService] = useState(false);

	// Transaction state
	const [isApproving, setIsApproving] = useState(false);
	const [isApproved, setIsApproved] = useState(false);
	const [isDepositing, setIsDepositing] = useState(false);
	const [isDeposited, setIsDeposited] = useState(false);
	const [depositedAmount, setDepositedAmount] = useState("0");
	const [isCreating, setIsCreating] = useState(false);

	const activeStep = useMemo(() => {
		if (!collateralToken || !collateralAmount) return 1;
		if (
			!loanToken ||
			!loanAmount ||
			!maxRepayment ||
			!loanDuration ||
			!auctionDuration
		)
			return 2;
		return 3;
	}, [
		collateralToken,
		collateralAmount,
		loanToken,
		loanAmount,
		maxRepayment,
		loanDuration,
		auctionDuration,
	]);

	const isValid =
		collateralAmount &&
		loanAmount &&
		maxRepayment &&
		loanDuration &&
		auctionDuration;

	const interestRate = useMemo(() => {
		if (!loanAmount || !maxRepayment) return null;
		const loan = parseFloat(loanAmount);
		const repay = parseFloat(maxRepayment);

		if (loan > 0 && repay >= loan) {
			const interestPct = ((repay - loan) / loan) * 100;
			let apr = interestPct;

			// Calculate annualized APR if duration is selected
			if (loanDuration) {
				const days = parseInt(loanDuration);
				if (!isNaN(days) && days > 0) {
					apr = interestPct * (365 / days);
				}
			}

			return {
				simple: interestPct.toFixed(1),
				apr: apr.toFixed(1),
			};
		}
		return null;
	}, [loanAmount, maxRepayment, loanDuration]);

	// Get wallet balance for selected collateral token
	const walletBalance = useMemo(() => {
		if (isDemoMode) {
			return parseFloat(demoBalances[collateralToken] || "0");
		}
		// For real wallet, mock balance for demo purposes
		return collateralToken === "WBTC" ? 2.5 : 15.0;
	}, [isDemoMode, demoBalances, collateralToken]);

	const collateralAmountNum = parseFloat(collateralAmount) || 0;
	const hasInsufficientBalance = collateralAmountNum > walletBalance;

	// Validation
	const validationErrors = useMemo(() => {
		const errors: string[] = [];
		if (collateralAmount && parseFloat(collateralAmount) <= 0) {
			errors.push("Collateral amount must be greater than 0");
		}
		if (loanAmount && parseFloat(loanAmount) <= 0) {
			errors.push("Loan amount must be greater than 0");
		}
		if (
			loanAmount &&
			maxRepayment &&
			parseFloat(maxRepayment) <= parseFloat(loanAmount)
		) {
			errors.push("Max repayment must be greater than loan amount");
		}
		return errors;
	}, [collateralAmount, loanAmount, maxRepayment]);

	const handleApprove = async () => {
		if (!isConnected) {
			openConnectModal?.();
			return;
		}

		setIsApproving(true);
		try {
			await contracts.approveToken(
				collateralToken,
				"AuctionHouse",
				collateralAmount,
			);
			setIsApproved(true);
		} catch (error) {
			console.error("Approval failed:", error);
		} finally {
			setIsApproving(false);
		}
	};

	const handleDeposit = async () => {
		if (!isApproved) {
			toast.error("Please approve token first");
			return;
		}

		setIsDepositing(true);
		try {
			// Simulate deposit transaction
			await new Promise((resolve) => setTimeout(resolve, 2000));
			toast.success("Collateral deposited!", {
				description: `${collateralAmount} ${collateralToken} deposited`,
			});
			setIsDeposited(true);
			setDepositedAmount(collateralAmount);
		} catch (error) {
			console.error("Deposit failed:", error);
			toast.error("Deposit failed");
		} finally {
			setIsDepositing(false);
		}
	};

	const handleCreateAuction = async () => {
		if (!isConnected || !address) {
			openConnectModal?.();
			return;
		}

		if (!isDeposited) {
			toast.error("Please deposit collateral first");
			return;
		}

		if (validationErrors.length > 0) {
			validationErrors.forEach((error) => toast.error(error));
			return;
		}

		setIsCreating(true);
		try {
			const auction = await createAuction(
				{
					collateralToken,
					collateralAmount,
					loanToken,
					loanAmount,
					maxRepayment,
					loanDuration,
					auctionDuration,
				},
				address,
			);

			toast.success("Auction created!", {
				description: `Auction ${auction.id} is now live`,
			});

			// Navigate to auctions page
			navigate("/auctions");
		} catch (error) {
			console.error("Create auction failed:", error);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="container py-8 max-w-5xl">
			<Button variant="ghost" size="sm" asChild className="mb-6 gap-1.5">
				<Link to="/">
					<ArrowLeft className="h-4 w-4" /> Back to Dashboard
				</Link>
			</Button>

			<h1 className="text-2xl font-bold mb-8">Create Auction</h1>

			{/* Wallet Connection Warning */}
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
							Connect your wallet to create an auction
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

			{/* Stepper */}
			<div className="flex items-center gap-2 mb-10">
				{steps.map((step, i) => (
					<div key={step.number} className="flex items-center gap-2">
						<div
							className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
								activeStep >= step.number
									? "gradient-primary text-primary-foreground"
									: "bg-secondary text-muted-foreground"
							}`}
						>
							{activeStep > step.number ? (
								<Check className="h-4 w-4" />
							) : (
								<span className="font-mono-numbers">
									{step.number}
								</span>
							)}
							<span className="hidden sm:inline">
								{step.label}
							</span>
						</div>
						{i < steps.length - 1 && (
							<div
								className={`w-8 h-px ${activeStep > step.number ? "bg-primary" : "bg-border"}`}
							/>
						)}
					</div>
				))}
			</div>

			<div className="grid lg:grid-cols-[1fr_340px] gap-6">
				{/* Form */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-8"
				>
					{/* Section 1: Collateral */}
					<div className="rounded-xl border border-border bg-card p-6">
						<h3 className="text-base font-semibold mb-5">
							Collateral
						</h3>
						<div className="space-y-4">
							<div>
								<Label htmlFor="collateral-token">
									Collateral Token
								</Label>
								<Select
									value={collateralToken}
									onValueChange={(v) =>
										setCollateralToken(v as "WBTC" | "ETH")
									}
								>
									<SelectTrigger className="mt-1.5 bg-input border-border">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="WBTC">
											₿ WBTC
										</SelectItem>
										<SelectItem value="ETH">
											Ξ ETH
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1.5">
									Wallet: {walletBalance.toFixed(4)}{" "}
									{collateralToken} | Deposited:{" "}
									{depositedAmount} {collateralToken}
								</p>
							</div>
							<div>
								<Label htmlFor="collateral-amount">
									Collateral Amount
								</Label>
								<Input
									id="collateral-amount"
									type="number"
									placeholder="0.0000"
									value={collateralAmount}
									onChange={(e) =>
										setCollateralAmount(e.target.value)
									}
									className="mt-1.5 bg-input border-border font-mono-numbers"
									disabled={isDeposited}
								/>
								<p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
									<Info className="h-3 w-3" />
									How much {collateralToken} to lock as
									collateral
								</p>
								{hasInsufficientBalance &&
									collateralAmountNum > 0 && (
										<p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
											<AlertCircle className="h-3 w-3" />
											Insufficient balance. You have{" "}
											{walletBalance.toFixed(4)}{" "}
											{collateralToken}
										</p>
									)}
							</div>

							{/* Approval & Deposit Flow */}
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleApprove}
									disabled={
										!collateralAmount ||
										isApproved ||
										isApproving ||
										!isConnected
									}
									className="flex-1"
								>
									{isApproving ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
											Approving...
										</>
									) : isApproved ? (
										<>
											<Check className="h-4 w-4 mr-2" />{" "}
											Approved
										</>
									) : (
										"1. Approve"
									)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDeposit}
									disabled={
										!isApproved ||
										isDeposited ||
										isDepositing ||
										hasInsufficientBalance
									}
									className="flex-1"
								>
									{isDepositing ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
											Depositing...
										</>
									) : isDeposited ? (
										<>
											<Check className="h-4 w-4 mr-2" />{" "}
											Deposited
										</>
									) : (
										"2. Deposit"
									)}
								</Button>
							</div>
						</div>
					</div>

					{/* Section 2: Loan Terms */}
					<div className="rounded-xl border border-border bg-card p-6">
						<h3 className="text-base font-semibold mb-5">
							Loan Terms
						</h3>
						<div className="grid sm:grid-cols-2 gap-4">
							<div>
								<Label>Loan Token</Label>
								<Select
									value={loanToken}
									onValueChange={(v) =>
										setLoanToken(v as "USDC" | "USDT")
									}
								>
									<SelectTrigger className="mt-1.5 bg-input border-border">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USDC">
											◉ USDC
										</SelectItem>
										<SelectItem value="USDT">
											₮ USDT
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="loan-amount">
									Loan Amount ({loanToken})
								</Label>
								<Input
									id="loan-amount"
									type="number"
									placeholder="0.00"
									value={loanAmount}
									onChange={(e) =>
										setLoanAmount(e.target.value)
									}
									className="mt-1.5 bg-input border-border font-mono-numbers"
								/>
							</div>
							<div className="sm:col-span-2">
								<Label htmlFor="max-repayment">
									Max Repayment ({loanToken})
								</Label>
								<Input
									id="max-repayment"
									type="number"
									placeholder="0.00"
									value={maxRepayment}
									onChange={(e) =>
										setMaxRepayment(e.target.value)
									}
									className="mt-1.5 bg-input border-border font-mono-numbers"
								/>
								<p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
									<Info className="h-3 w-3" />
									Maximum you're willing to repay
								</p>
							</div>
							<div>
								<Label>Loan Duration</Label>
								<Select
									value={loanDuration}
									onValueChange={setLoanDuration}
								>
									<SelectTrigger className="mt-1.5 bg-input border-border">
										<SelectValue placeholder="Select duration" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="7d">
											7 days
										</SelectItem>
										<SelectItem value="30d">
											30 days
										</SelectItem>
										<SelectItem value="90d">
											90 days
										</SelectItem>
										<SelectItem value="180d">
											180 days
										</SelectItem>
										<SelectItem value="365d">
											365 days
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Auction Duration</Label>
								<Select
									value={auctionDuration}
									onValueChange={setAuctionDuration}
								>
									<SelectTrigger className="mt-1.5 bg-input border-border">
										<SelectValue placeholder="Select duration" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1h">
											1 hour
										</SelectItem>
										<SelectItem value="6h">
											6 hours
										</SelectItem>
										<SelectItem value="12h">
											12 hours
										</SelectItem>
										<SelectItem value="24h">
											24 hours
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Listing Service */}
					<div className="flex items-start gap-3 px-1">
						<Checkbox
							id="listing-service"
							checked={useListingService}
							onCheckedChange={(checked) =>
								setUseListingService(checked as boolean)
							}
							className="mt-0.5"
						/>
						<label
							htmlFor="listing-service"
							className="text-sm leading-relaxed cursor-pointer"
						>
							<span className="font-medium">
								Use ListingService
							</span>
							<span className="text-muted-foreground">
								{" "}
								(0.1% fee, whitelisted tokens only)
							</span>
						</label>
					</div>

					{/* Validation Errors */}
					{validationErrors.length > 0 && (
						<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
							{validationErrors.map((error, i) => (
								<p key={i} className="text-sm text-destructive">
									{error}
								</p>
							))}
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center gap-3">
						<Button
							variant="gradient"
							size="lg"
							disabled={
								!isValid ||
								!isDeposited ||
								validationErrors.length > 0 ||
								isCreating ||
								!isConnected
							}
							onClick={handleCreateAuction}
							className="flex-1 sm:flex-none"
						>
							{isCreating ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
									Creating Auction...
								</>
							) : !isConnected ? (
								"Connect Wallet"
							) : !isDeposited ? (
								"Deposit Collateral First"
							) : (
								"Create Auction"
							)}
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link to="/">Cancel</Link>
						</Button>
					</div>
				</motion.div>

				{/* Summary */}
				<motion.div
					initial={{ opacity: 0, x: 12 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className="hidden lg:block"
				>
					<div className="rounded-xl border border-border bg-card p-6 sticky top-24">
						<h3 className="text-base font-semibold mb-5">
							Summary
						</h3>
						<div className="space-y-4 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									You'll Receive
								</span>
								<span className="font-mono-numbers font-medium">
									{loanAmount
										? `${Number(loanAmount).toLocaleString()} ${loanToken}`
										: "—"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									You'll Repay
								</span>
								<span className="font-mono-numbers font-medium">
									{maxRepayment
										? `Up to ${Number(maxRepayment).toLocaleString()} ${loanToken}`
										: "—"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Max Interest
								</span>
								<span className="font-mono-numbers font-medium text-accent">
									{interestRate ? (
										<div className="text-right">
											<div>
												~{interestRate.simple}% Return
											</div>
											<div className="text-xs text-muted-foreground font-normal">
												({interestRate.apr}% APR)
											</div>
										</div>
									) : (
										"—"
									)}
								</span>
							</div>
							<div className="h-px bg-border" />
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Collateral
								</span>
								<span className="font-mono-numbers font-medium">
									{collateralAmount
										? `${collateralAmount} ${collateralToken}`
										: "—"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Deposited
								</span>
								<span
									className={`font-mono-numbers font-medium ${isDeposited ? "text-success" : ""}`}
								>
									{isDeposited ? (
										<>
											<Check className="h-3 w-3 inline mr-1" />
											{depositedAmount} {collateralToken}
										</>
									) : (
										"Not yet"
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Auction Ends
								</span>
								<span className="font-mono-numbers font-medium">
									{auctionDuration || "—"}
								</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
};

export default CreateAuction;
