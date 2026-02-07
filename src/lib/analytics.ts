import ReactGA from "react-ga4";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";

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
  | { name: "auction_created"; params: { collateralToken: string; loanToken: string; amount: string; user: string } }
  | { name: "bid_placed"; params: { auctionId: string; amount: string; user: string } }
  | { name: "auction_finalized"; params: { auctionId: string; amount: string; user: string } }
  | { name: "loan_repaid"; params: { loanId: string; amount: string; user: string } }
  | { name: "collateral_claimed"; params: { loanId: string; amount: string; user: string } }
  | { name: "position_listed"; params: { listingId: string; price: string; nftType: string; user: string } }
  | { name: "position_bought"; params: { listingId: string; price: string; user: string } }
  | { name: "position_sold"; params: { listingId: string; price: string; user: string } }
  | { name: "offer_made"; params: { listingId: string; amount: string; user: string } }
  | { name: "nft_minted"; params: { collection: string; tokenId: string; user: string } };

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
    trackEvent("wallet_connected", { address, connector });
  },

  auctionCreated: (collateralToken: string, loanToken: string, amount: string, user: string) => {
    trackEvent("auction_created", { collateralToken, loanToken, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Auction Created",
      user,
      amount: `${amount} ${loanToken}`,
      details: `${collateralToken} Collateral`
    });
  },

  bidPlaced: (auctionId: string, amount: string, user: string) => {
    trackEvent("bid_placed", { auctionId, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Bid Placed",
      user,
      amount: amount, // Assume units are handled at call site or we can guess
      relatedId: auctionId
    });
  },

  auctionFinalized: (auctionId: string, amount: string, user: string) => {
    trackEvent("auction_finalized", { auctionId, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Auction Finalized",
      user,
      amount: amount,
      relatedId: auctionId
    });
  },

  loanRepaid: (loanId: string, amount: string, user: string) => {
    trackEvent("loan_repaid", { loanId, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Loan Repaid",
      user,
      amount: amount,
      relatedId: loanId
    });
  },

  collateralClaimed: (loanId: string, amount: string, user: string) => {
    trackEvent("collateral_claimed", { loanId, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Collateral Claimed",
      user,
      amount: amount,
      relatedId: loanId
    });
  },

  positionListed: (listingId: string, price: string, nftType: string, user: string) => {
    trackEvent("position_listed", { listingId, price, nftType, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Position Listed",
      user,
      amount: price,
      relatedId: listingId,
      details: `${nftType === "borrower" ? "Borrower" : "Lender"} Position`
    });
  },

  positionBought: (listingId: string, price: string, user: string) => {
    trackEvent("position_bought", { listingId, price, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Position Bought",
      user,
      amount: price,
      relatedId: listingId
    });
  },

  positionSold: (listingId: string, price: string, user: string) => {
    trackEvent("position_sold", { listingId, price, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Position Sold",
      user,
      amount: price,
      relatedId: listingId
    });
  },

  offerMade: (listingId: string, amount: string, user: string) => {
    trackEvent("offer_made", { listingId, amount, user });
    useAnalyticsStore.getState().addTransaction({
      action: "Offer Made",
      user,
      amount: amount,
      relatedId: listingId
    });
  },

  nftMinted: (collection: string, tokenId: string, user: string) => {
    trackEvent("nft_minted", { collection, tokenId, user });
    useAnalyticsStore.getState().addTransaction({
      action: "NFT Minted",
      user,
      amount: "-",
      details: `${collection} #${tokenId}`
    });
  },
};
