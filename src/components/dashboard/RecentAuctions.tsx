import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const auctions = [
  {
    id: "#1",
    collateral: "1.5 WBTC",
    collateralIcon: "₿",
    loanAmount: "50,000 USDC",
    currentBid: "52,500 USDC",
    bids: 5,
    timeLeft: "4h 23m",
    status: "Active",
  },
  {
    id: "#2",
    collateral: "25 ETH",
    collateralIcon: "Ξ",
    loanAmount: "80,000 USDC",
    currentBid: "84,200 USDC",
    bids: 8,
    timeLeft: "12h 10m",
    status: "Active",
  },
  {
    id: "#3",
    collateral: "0.8 WBTC",
    collateralIcon: "₿",
    loanAmount: "30,000 USDT",
    currentBid: "31,800 USDT",
    bids: 3,
    timeLeft: "45m",
    status: "Ending Soon",
  },
];

const RecentAuctions = () => {
  return (
    <section className="py-8 pb-16">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Auctions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auctions" className="gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Collateral</TableHead>
                <TableHead className="text-muted-foreground">Loan Amount</TableHead>
                <TableHead className="text-muted-foreground">Current Bid</TableHead>
                <TableHead className="text-muted-foreground">Time Left</TableHead>
                <TableHead className="text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctions.map((auction) => (
                <TableRow key={auction.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <Badge variant="muted" className="font-mono-numbers">{auction.id}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{auction.collateralIcon}</span>
                      <span className="font-mono-numbers">{auction.collateral}</span>
                    </span>
                  </TableCell>
                  <TableCell className="font-mono-numbers">{auction.loanAmount}</TableCell>
                  <TableCell>
                    <span className="font-mono-numbers">{auction.currentBid}</span>
                    <span className="text-xs text-muted-foreground ml-1">({auction.bids} bids)</span>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1.5 font-mono-numbers text-sm ${
                      auction.status === "Ending Soon" ? "text-warning" : "text-foreground"
                    }`}>
                      <Clock className="h-3.5 w-3.5" />
                      {auction.timeLeft}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="gradient" size="sm" asChild>
                      <Link to="/auctions">Place Bid</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default RecentAuctions;