import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

const tokens = [
  { name: "WBTC", icon: "₿", balance: "0.0000", usd: "$0.00", color: "text-warning" },
  { name: "USDC", icon: "◉", balance: "0.0000", usd: "$0.00", color: "text-accent" },
  { name: "USDT", icon: "₮", balance: "0.0000", usd: "$0.00", color: "text-success" },
];

const WalletBalances = () => {
  return (
    <section className="py-8">
      <div className="container">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-accent" />
          Wallet Balances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tokens.map((token, i) => (
            <motion.div
              key={token.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl ${token.color}`}>{token.icon}</span>
                <span className="font-semibold">{token.name}</span>
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-2xl font-mono-numbers font-semibold">{token.balance}</p>
                <p className="text-sm text-muted-foreground">{token.usd}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Mint Test Tokens
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WalletBalances;