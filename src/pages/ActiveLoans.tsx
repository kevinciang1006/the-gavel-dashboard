import { useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  DollarSign,
  TrendingUp,
  Percent,
  ExternalLink,
} from "lucide-react";

type Role = "borrower" | "lender";

const summaryCards = [
  { label: "Total Loaned", value: "$125K", icon: DollarSign },
  { label: "Interest Earned", value: "$8.2K", icon: TrendingUp },
  { label: "Avg APR", value: "9.5%", icon: Percent },
];

const loans = [
  {
    id: "#7",
    role: "borrower" as Role,
    collateral: "1.5 WBTC",
    collateralIcon: "₿",
    loan: "50,000 USDC",
    repayment: "54,500 USDC",
    apr: "9.0%",
    progress: 72,
    timeLeft: "2d 4h remaining",
    status: "healthy" as const,
    startDate: "Dec 20, 2025",
    maturityDate: "Jan 20, 2026",
    txHash: "0xabc123...def456",
    borrowerNFT: "#1042",
    lenderNFT: "#1043",
  },
  {
    id: "#12",
    role: "lender" as Role,
    collateral: "25 ETH",
    collateralIcon: "Ξ",
    loan: "80,000 USDC",
    repayment: "86,400 USDC",
    apr: "8.0%",
    progress: 95,
    timeLeft: "18h remaining",
    status: "approaching" as const,
    startDate: "Dec 15, 2025",
    maturityDate: "Jan 15, 2026",
    txHash: "0x789abc...123def",
    borrowerNFT: "#1050",
    lenderNFT: "#1051",
  },
  {
    id: "#15",
    role: "borrower" as Role,
    collateral: "0.5 WBTC",
    collateralIcon: "₿",
    loan: "20,000 USDT",
    repayment: "21,800 USDT",
    apr: "9.0%",
    progress: 100,
    timeLeft: "Grace Period",
    status: "grace" as const,
    startDate: "Nov 30, 2025",
    maturityDate: "Dec 30, 2025",
    txHash: "0xdef789...abc123",
    borrowerNFT: "#1058",
    lenderNFT: "#1059",
  },
  {
    id: "#18",
    role: "lender" as Role,
    collateral: "15 ETH",
    collateralIcon: "Ξ",
    loan: "45,000 USDC",
    repayment: "49,500 USDC",
    apr: "10.0%",
    progress: 100,
    timeLeft: "Overdue",
    status: "overdue" as const,
    startDate: "Nov 15, 2025",
    maturityDate: "Dec 15, 2025",
    txHash: "0x456def...789abc",
    borrowerNFT: "#1062",
    lenderNFT: "#1063",
  },
];

const statusConfig = {
  healthy: { color: "text-success", progressColor: "bg-success" },
  approaching: { color: "text-warning", progressColor: "bg-warning" },
  grace: { color: "text-warning", progressColor: "bg-warning" },
  overdue: { color: "text-destructive", progressColor: "bg-destructive" },
};

const ActiveLoans = () => {
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  const filtered = loans.filter((l) => roleFilter === "all" || l.role === roleFilter);

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
                  onClick={() => setRoleFilter(opt.value as typeof roleFilter)}
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
            <span className="text-sm text-muted-foreground hidden sm:block">
              Total Value: <span className="text-foreground font-semibold font-mono-numbers">$125,000</span>
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className="h-4 w-4 text-accent" />
              </div>
              <p className="text-3xl font-bold font-mono-numbers">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Loans Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-8" />
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Collateral</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Loan</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Repayment</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((loan) => {
                const config = statusConfig[loan.status];
                const isExpanded = expandedLoan === loan.id;

                return (
                  <>
                    <TableRow
                      key={loan.id}
                      className="border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                    >
                      <TableCell>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="muted" className="font-mono-numbers">{loan.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={loan.role === "borrower" ? "default" : "accent"}>
                          {loan.role === "borrower" ? "Borrower" : "Lender"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{loan.collateralIcon}</span>
                          <span className="font-mono-numbers text-sm">{loan.collateral}</span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono-numbers text-sm">{loan.loan}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-mono-numbers text-sm">{loan.repayment}</span>
                        <Badge variant="accent" className="ml-2 text-[10px]">{loan.apr}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[120px]">
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${config.progressColor}`}
                              style={{ width: `${Math.min(loan.progress, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${config.color}`}>{loan.timeLeft}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {loan.role === "borrower" ? (
                          <Button variant="gradient" size="sm">Repay Loan</Button>
                        ) : loan.status === "overdue" ? (
                          <Button variant="accent" size="sm">Claim</Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>Waiting</Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${loan.id}-details`} className="border-border bg-secondary/20 hover:bg-secondary/20">
                        <TableCell colSpan={8} className="p-4">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
                          >
                            <div>
                              <span className="text-muted-foreground block text-xs mb-0.5">Loan Start</span>
                              <span className="font-medium">{loan.startDate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-0.5">Maturity Date</span>
                              <span className="font-medium">{loan.maturityDate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-0.5">Transaction</span>
                              <a href="#" className="font-mono-numbers text-xs text-accent flex items-center gap-1 hover:underline">
                                {loan.txHash} <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-0.5">NFT Positions</span>
                              <span className="font-mono-numbers text-xs">
                                B: {loan.borrowerNFT} / L: {loan.lenderNFT}
                              </span>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default ActiveLoans;