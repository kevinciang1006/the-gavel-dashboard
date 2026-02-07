import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateAuction from "./pages/CreateAuction";
import OpenAuctions from "./pages/OpenAuctions";
import ActiveLoans from "./pages/ActiveLoans";
import Marketplace from "./pages/Marketplace";
import NFTLending from "./pages/NFTLending";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/create-auction" element={<CreateAuction />} />
        <Route path="/auctions" element={<OpenAuctions />} />
        <Route path="/loans" element={<ActiveLoans />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/nft-lending" element={<NFTLending />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
