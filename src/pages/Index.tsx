import HeroSection from "@/components/dashboard/HeroSection";
import WalletBalances from "@/components/dashboard/WalletBalances";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentAuctions from "@/components/dashboard/RecentAuctions";

const Index = () => {
  return (
    <main>
      <HeroSection />
      <QuickStats />
      <WalletBalances />
      <RecentAuctions />
    </main>
  );
};

export default Index;
