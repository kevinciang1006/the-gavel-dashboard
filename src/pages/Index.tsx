import Header from "@/components/layout/Header";
import HeroSection from "@/components/dashboard/HeroSection";
import WalletBalances from "@/components/dashboard/WalletBalances";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentAuctions from "@/components/dashboard/RecentAuctions";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <QuickStats />
        <WalletBalances />
        <RecentAuctions />
      </main>
    </div>
  );
};

export default Index;