import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

// Create a client for react-query
const queryClient = new QueryClient();

// Custom RainbowKit theme matching our dark purple design
const customTheme = darkTheme({
  accentColor: "#8B5CF6", // Purple-500
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

// Override specific colors to match The Gavel design
const theGavelTheme = {
  ...customTheme,
  colors: {
    ...customTheme.colors,
    modalBackground: "#0F0A1F", // Dark purple background
    modalBorder: "rgba(139, 92, 246, 0.2)", // Purple border with opacity
    profileForeground: "#1A1025", // Slightly lighter purple
    closeButton: "#A78BFA", // Purple-400
    closeButtonBackground: "rgba(139, 92, 246, 0.1)",
    connectButtonBackground: "#8B5CF6", // Purple-500
    connectButtonBackgroundError: "#EF4444", // Red for errors
    connectButtonInnerBackground: "#7C3AED", // Purple-600
    connectButtonText: "white",
    connectButtonTextError: "white",
  },
};

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theGavelTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
