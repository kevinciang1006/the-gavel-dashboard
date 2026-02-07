import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";

// Token configuration for Arbitrum Sepolia
const tokenConfig = [
  {
    name: "WBTC",
    icon: "₿",
    color: "text-warning",
    // Using a mock address for WBTC on testnet
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    decimals: 8,
    mockPrice: 97000, // Mock USD price
  },
  {
    name: "USDC",
    icon: "◉",
    color: "text-accent",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`,
    decimals: 6,
    mockPrice: 1,
  },
  {
    name: "USDT",
    icon: "₮",
    color: "text-success",
    // Using a mock address for USDT on testnet
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    decimals: 6,
    mockPrice: 1,
  },
];

// Format balance with proper decimals
function formatBalance(value: bigint | undefined, decimals: number): string {
  if (!value) return "0.0000";
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0").slice(0, 4);
  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

// Format USD value
function formatUsd(balance: string, price: number): string {
  const numBalance = parseFloat(balance.replace(/,/g, ""));
  const usdValue = numBalance * price;
  return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface TokenBalanceCardProps {
  token: (typeof tokenConfig)[0];
  index: number;
  address: `0x${string}` | undefined;
  isConnected: boolean;
}

function TokenBalanceCard({ token, index, address, isConnected }: TokenBalanceCardProps) {
  const { openConnectModal } = useConnectModal();

  // Fetch native ETH balance for comparison (always works)
  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  });

  // Fetch token balance
  const { data: tokenBalance, isLoading } = useBalance({
    address,
    token: token.address !== "0x0000000000000000000000000000000000000000" ? token.address : undefined,
    query: { enabled: isConnected && token.address !== "0x0000000000000000000000000000000000000000" },
  });

  // For tokens with mock addresses, show 0 or use ETH balance as demo
  const balance = token.address === "0x0000000000000000000000000000000000000000"
    ? "0.0000"
    : formatBalance(tokenBalance?.value, token.decimals);

  const usdValue = formatUsd(balance, token.mockPrice);

  const handleMintTestTokens = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    // Mock mint - will be replaced with actual contract call
    toast.success(`Minting test ${token.name}...`, {
      description: "This is a demo. Real minting requires deployed contracts.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-2xl ${token.color}`}>{token.icon}</span>
        <span className="font-semibold">{token.name}</span>
      </div>

      {!isConnected ? (
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Connect wallet to view
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2 mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        <div className="space-y-1 mb-4">
          <p className="text-2xl font-mono-numbers font-semibold">{balance}</p>
          <p className="text-sm text-muted-foreground">{usdValue}</p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={handleMintTestTokens}
      >
        {isConnected ? "Mint Test Tokens" : "Connect Wallet"}
      </Button>
    </motion.div>
  );
}

const WalletBalances = () => {
  const { address, isConnected } = useAccount();

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            Wallet Balances
          </h2>
          {isConnected && address && (
            <span className="text-xs text-muted-foreground font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tokenConfig.map((token, i) => (
            <TokenBalanceCard
              key={token.name}
              token={token}
              index={i}
              address={address}
              isConnected={isConnected}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WalletBalances;
