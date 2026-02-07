import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialize GA4
export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

// Custom event types
type AnalyticsEvent =
  | { name: "wallet_connected"; params: { address: string; connector?: string } }
  | { name: "auction_created"; params: { collateralToken: string; loanToken: string; amount: string } }
  | { name: "bid_placed"; params: { auctionId: string; amount: string } }
  | { name: "loan_repaid"; params: { loanId: string; amount: string } }
  | { name: "position_listed"; params: { listingId: string; price: string; nftType: string } }
  | { name: "position_bought"; params: { listingId: string; price: string } }
  | { name: "offer_made"; params: { listingId: string; amount: string } }
  | { name: "nft_minted"; params: { collection: string; tokenId: string } };

// Track custom events
export const trackEvent = <T extends AnalyticsEvent["name"]>(
  name: T,
  params: Extract<AnalyticsEvent, { name: T }>["params"]
) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event(name, params);
  }
};

// Convenience functions for common events
export const analytics = {
  walletConnected: (address: string, connector?: string) => {
    trackEvent("wallet_connected", { address: address.slice(0, 10) + "...", connector });
  },

  auctionCreated: (collateralToken: string, loanToken: string, amount: string) => {
    trackEvent("auction_created", { collateralToken, loanToken, amount });
  },

  bidPlaced: (auctionId: string, amount: string) => {
    trackEvent("bid_placed", { auctionId, amount });
  },

  loanRepaid: (loanId: string, amount: string) => {
    trackEvent("loan_repaid", { loanId, amount });
  },

  positionListed: (listingId: string, price: string, nftType: string) => {
    trackEvent("position_listed", { listingId, price, nftType });
  },

  positionBought: (listingId: string, price: string) => {
    trackEvent("position_bought", { listingId, price });
  },

  offerMade: (listingId: string, amount: string) => {
    trackEvent("offer_made", { listingId, amount });
  },

  nftMinted: (collection: string, tokenId: string) => {
    trackEvent("nft_minted", { collection, tokenId });
  },
};
