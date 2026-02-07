import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";

// Define the config for wagmi + RainbowKit
export const config = getDefaultConfig({
  appName: "The Gavel",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arbitrumSepolia],
  ssr: false,
});

// Export chain for easy access
export const supportedChains = [arbitrumSepolia] as const;

// Contract addresses for Arbitrum Sepolia (placeholders for now)
export const contracts = {
  // Core protocol contracts
  auctionHouse: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  lendingPool: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  marketplace: "0x0000000000000000000000000000000000000000" as `0x${string}`,

  // Token addresses on Arbitrum Sepolia
  tokens: {
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`,
    WETH: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73" as `0x${string}`,
    // Add more tokens as needed
  },
} as const;
