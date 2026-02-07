import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Percent,
  Activity,
  ExternalLink,
} from "lucide-react";
import { useAuctionStore } from "@/store/useAuctionStore";
import { useLoanStore } from "@/store/useLoanStore";
import { useMarketplaceStore } from "@/store/useMarketplaceStore";

// KPI Data
const kpis = [
  {
    label: "Total Volume",
    value: "$1,247,850",
    change: "+12.5%",
    positive: true,
    icon: DollarSign,
    sparkline: [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 90],
  },
  {
    label: "Active Loans",
    value: "24",
    change: "+8.3%",
    positive: true,
    icon: Activity,
    sparkline: [10, 12, 11, 15, 14, 16, 18, 17, 20, 19, 22, 24],
  },
  {
    label: "Total Value Locked",
    value: "$3,450,000",
    change: "+5.2%",
    positive: true,
    icon: Lock,
    sparkline: [200, 220, 240, 230, 260, 280, 290, 310, 300, 330, 340, 345],
  },
  {
    label: "Average APR",
    value: "9.5%",
    change: "-1.2%",
    positive: false,
    icon: Percent,
    sparkline: [12, 11.5, 11, 10.8, 10.5, 10.2, 10, 9.8, 9.7, 9.6, 9.5, 9.5],
  },
];

// Chart Data
const interestRateData = [
  { day: "Mon", wbtc: 10.2, eth: 9.5, stable: 7.8 },
  { day: "Tue", wbtc: 10.5, eth: 9.8, stable: 7.5 },
  { day: "Wed", wbtc: 9.8, eth: 9.2, stable: 7.2 },
  { day: "Thu", wbtc: 10.0, eth: 9.6, stable: 8.0 },
  { day: "Fri", wbtc: 9.5, eth: 9.0, stable: 7.6 },
  { day: "Sat", wbtc: 9.2, eth: 8.8, stable: 7.4 },
  { day: "Sun", wbtc: 9.8, eth: 9.4, stable: 7.8 },
];

const volumeByCollateral = [
  { name: "WBTC", value: 808000, color: "hsl(263, 90%, 66%)" },
  { name: "ETH", value: 312000, color: "hsl(189, 94%, 43%)" },
  { name: "Other", value: 125000, color: "hsl(233, 30%, 40%)" },
];

const auctionActivityData = [
  { day: "Mon", completed: 3, active: 5, cancelled: 1 },
  { day: "Tue", completed: 5, active: 4, cancelled: 0 },
  { day: "Wed", completed: 2, active: 6, cancelled: 2 },
  { day: "Thu", completed: 4, active: 3, cancelled: 1 },
  { day: "Fri", completed: 6, active: 7, cancelled: 0 },
  { day: "Sat", completed: 3, active: 4, cancelled: 1 },
  { day: "Sun", completed: 4, active: 5, cancelled: 0 },
];

const borrowLendData = [
  { day: "Mon", borrow: 120000, lend: 140000 },
  { day: "Tue", borrow: 150000, lend: 130000 },
  { day: "Wed", borrow: 110000, lend: 160000 },
  { day: "Thu", borrow: 180000, lend: 150000 },
  { day: "Fri", borrow: 200000, lend: 180000 },
  { day: "Sat", borrow: 160000, lend: 170000 },
  { day: "Sun", borrow: 190000, lend: 200000 },
];

const yieldCurveData = [
  { duration: "7d", wbtc: 6.5, eth: 5.8, stable: 4.2 },
  { duration: "30d", wbtc: 8.2, eth: 7.5, stable: 5.8 },
  { duration: "90d", wbtc: 9.8, eth: 9.0, stable: 7.2 },
  { duration: "180d", wbtc: 10.5, eth: 9.8, stable: 8.0 },
  { duration: "365d", wbtc: 11.2, eth: 10.5, stable: 8.5 },
];

const recentTransactions = [
  { time: "2m ago", action: "Auction Created", user: "0x1234...5678", amount: "50,000 USDC" },
  { time: "5m ago", action: "Bid Placed", user: "0xABCD...EF01", amount: "48,500 USDC" },
  { time: "12m ago", action: "Loan Repaid", user: "0x9876...5432", amount: "33,000 USDT" },
  { time: "18m ago", action: "Auction Created", user: "0xDEAD...BEEF", amount: "80,000 USDC" },
  { time: "25m ago", action: "Bid Placed", user: "0xFACE...1234", amount: "105,000 USDC" },
  { time: "30m ago", action: "Loan Repaid", user: "0xBEEF...CAFE", amount: "27,500 USDC" },
  { time: "42m ago", action: "Position Listed", user: "0x1111...2222", amount: "48,000 USDC" },
  { time: "50m ago", action: "Bid Placed", user: "0x3333...4444", amount: "16,100 USDC" },
  { time: "1h ago", action: "Auction Created", user: "0x5555...6666", amount: "25,000 USDC" },
  { time: "1h ago", action: "NFT Collateralized", user: "0x7777...8888", amount: "10,000 USDC" },
];

const actionColors: Record<string, string> = {
  "Auction Created": "default",
  "Bid Placed": "accent",
  "Loan Repaid": "success",
  "Position Listed": "warning",
  "NFT Collateralized": "muted",
};

const interestChartConfig = {
  wbtc: { label: "WBTC", color: "hsl(263, 90%, 66%)" },
  eth: { label: "ETH", color: "hsl(189, 94%, 43%)" },
  stable: { label: "Stablecoin", color: "hsl(142, 76%, 46%)" },
};

const auctionChartConfig = {
  completed: { label: "Completed", color: "hsl(142, 76%, 46%)" },
  active: { label: "Active", color: "hsl(263, 90%, 66%)" },
  cancelled: { label: "Cancelled", color: "hsl(233, 30%, 40%)" },
};

const borrowLendConfig = {
  borrow: { label: "Borrow Demand", color: "hsl(263, 90%, 66%)" },
  lend: { label: "Lend Supply", color: "hsl(189, 94%, 43%)" },
};

const yieldCurveConfig = {
  wbtc: { label: "WBTC", color: "hsl(263, 90%, 66%)" },
  eth: { label: "ETH", color: "hsl(189, 94%, 43%)" },
  stable: { label: "Stablecoin", color: "hsl(142, 76%, 46%)" },
};

const Analytics = () => {
  const [dateRange, setDateRange] = useState("7d");

  // Get data from stores
  const auctions = useAuctionStore((state) => state.auctions);
  const loans = useLoanStore((state) => state.loans);
  const listings = useMarketplaceStore((state) => state.listings);

  // Calculate dynamic KPIs
  const dynamicKpis = useMemo(() => {
    // Total Volume: sum of all loan amounts
    const totalVolume = loans.reduce((sum, l) => sum + parseFloat(l.loanAmount), 0);

    // Active Loans count
    const activeLoansCount = loans.filter(l => l.status === "active" || l.status === "grace_period").length;

    // Total Value Locked (collateral in active loans + auctions)
    const auctionTVL = auctions
      .filter(a => a.status === "active" || a.status === "ending_soon")
      .reduce((sum, a) => {
        const amount = parseFloat(a.collateralAmount);
        // Rough USD conversion: WBTC ~$60k, ETH ~$3k
        const usdValue = a.collateralToken === "WBTC" ? amount * 60000 : amount * 3000;
        return sum + usdValue;
      }, 0);
    const loanTVL = loans
      .filter(l => l.status === "active" || l.status === "grace_period")
      .reduce((sum, l) => {
        const amount = parseFloat(l.collateralAmount);
        const usdValue = l.collateralToken === "WBTC" ? amount * 60000 : amount * 3000;
        return sum + usdValue;
      }, 0);
    const tvl = auctionTVL + loanTVL;

    // Average APR across all loans
    const avgApr = loans.length > 0
      ? loans.reduce((sum, l) => {
          const interest = parseFloat(l.repaymentAmount) - parseFloat(l.loanAmount);
          const apr = (interest / parseFloat(l.loanAmount)) * 100;
          return sum + apr;
        }, 0) / loans.length
      : 0;

    return [
      {
        label: "Total Volume",
        value: `$${(totalVolume / 1000).toFixed(0)}K`,
        change: "+12.5%",
        positive: true,
        icon: DollarSign,
        sparkline: [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, Math.round(totalVolume / 1000)],
      },
      {
        label: "Active Loans",
        value: activeLoansCount.toString(),
        change: "+8.3%",
        positive: true,
        icon: Activity,
        sparkline: [10, 12, 11, 15, 14, 16, 18, 17, 20, 19, 22, activeLoansCount],
      },
      {
        label: "Total Value Locked",
        value: tvl >= 1000000 ? `$${(tvl / 1000000).toFixed(2)}M` : `$${(tvl / 1000).toFixed(0)}K`,
        change: "+5.2%",
        positive: true,
        icon: Lock,
        sparkline: [200, 220, 240, 230, 260, 280, 290, 310, 300, 330, 340, Math.round(tvl / 10000)],
      },
      {
        label: "Average APR",
        value: `${avgApr.toFixed(1)}%`,
        change: "-1.2%",
        positive: false,
        icon: Percent,
        sparkline: [12, 11.5, 11, 10.8, 10.5, 10.2, 10, 9.8, 9.7, 9.6, 9.5, avgApr],
      },
    ];
  }, [auctions, loans]);

  // Calculate volume by collateral type from actual loans
  const dynamicVolumeByCollateral = useMemo(() => {
    const wbtcVolume = loans
      .filter(l => l.collateralToken === "WBTC")
      .reduce((sum, l) => sum + parseFloat(l.loanAmount), 0);
    const ethVolume = loans
      .filter(l => l.collateralToken === "ETH")
      .reduce((sum, l) => sum + parseFloat(l.loanAmount), 0);
    const total = wbtcVolume + ethVolume;

    if (total === 0) return volumeByCollateral; // Use mock data if no loans

    return [
      { name: "WBTC", value: wbtcVolume, color: "hsl(263, 90%, 66%)" },
      { name: "ETH", value: ethVolume, color: "hsl(189, 94%, 43%)" },
    ];
  }, [loans]);

  return (
    <div className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Protocol Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time lending market insights</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dynamicKpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold font-mono-numbers">{kpi.value}</p>
                      <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.positive ? "text-success" : "text-destructive"}`}>
                        {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {kpi.change}
                      </div>
                    </div>
                    {/* Mini sparkline */}
                    <div className="h-8 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpi.sparkline.map((v, j) => ({ v, i: j }))}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={kpi.positive ? "hsl(142, 76%, 46%)" : "hsl(0, 84%, 60%)"}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Interest Rate Trends */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Interest Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={interestChartConfig} className="h-[280px]">
                <LineChart data={interestRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233, 25%, 24%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="wbtc" name="WBTC" stroke="hsl(263, 90%, 66%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="eth" name="ETH" stroke="hsl(189, 94%, 43%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stable" name="Stablecoin" stroke="hsl(142, 76%, 46%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Auction Activity */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Daily Auction Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={auctionChartConfig} className="h-[280px]">
                <BarChart data={auctionActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233, 25%, 24%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="hsl(142, 76%, 46%)" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="active" name="Active" fill="hsl(263, 90%, 66%)" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="cancelled" name="Cancelled" fill="hsl(233, 30%, 40%)" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Loan Volume by Collateral (Pie) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Loan Volume by Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicVolumeByCollateral}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                    >
                      {dynamicVolumeByCollateral.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Borrower vs Lender Volume (Area) */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Borrower vs Lender Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={borrowLendConfig} className="h-[280px]">
                <AreaChart data={borrowLendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233, 25%, 24%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} tickFormatter={(v) => `$${v / 1000}K`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area type="monotone" dataKey="borrow" name="Borrow Demand" fill="hsl(263, 90%, 66%)" fillOpacity={0.3} stroke="hsl(263, 90%, 66%)" strokeWidth={2} />
                  <Area type="monotone" dataKey="lend" name="Lend Supply" fill="hsl(189, 94%, 43%)" fillOpacity={0.3} stroke="hsl(189, 94%, 43%)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Yield Curve */}
        <Card className="border-border bg-card mb-8">
          <CardHeader>
            <CardTitle className="text-base">Yield Curve by Duration</CardTitle>
            <p className="text-xs text-muted-foreground">Market-driven rates for different loan terms</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={yieldCurveConfig} className="h-[300px]">
              <LineChart data={yieldCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(233, 25%, 24%)" />
                <XAxis dataKey="duration" tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 15%, 60%)" }} unit="%" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="wbtc" name="WBTC" stroke="hsl(263, 90%, 66%)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="eth" name="ETH" stroke="hsl(189, 94%, 43%)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="stable" name="Stablecoin" stroke="hsl(142, 76%, 46%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Time</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">User</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-right hidden sm:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx, i) => (
                    <TableRow key={i} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="text-sm text-muted-foreground">{tx.time}</TableCell>
                      <TableCell>
                        <Badge variant={(actionColors[tx.action] || "muted") as any}>
                          {tx.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono-numbers text-xs hidden sm:table-cell">{tx.user}</TableCell>
                      <TableCell className="font-mono-numbers text-sm">{tx.amount}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <a href="#" className="text-accent text-xs flex items-center gap-1 justify-end hover:underline">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default Analytics;
