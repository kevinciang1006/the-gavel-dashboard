import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Auctions", path: "/auctions" },
  { label: "Loans", path: "/loans" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "NFT", path: "/nft-lending" },
  { label: "Analytics", path: "/analytics" },
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🔨</span>
            <span className="text-xl font-bold tracking-tight">The Gavel</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button variant="gradient" size="default" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    </header>
  );
};

export default Header;