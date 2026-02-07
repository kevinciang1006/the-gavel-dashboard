import { useAccount } from "wagmi";
import { useDemoWalletStore } from "@/store/useDemoWalletStore";

interface UseWalletReturn {
    address: `0x${string}` | undefined;
    isConnected: boolean;
    isDemoMode: boolean;
}

/**
 * Custom hook that abstracts wallet connection.
 * Returns demo wallet data when in demo mode, otherwise returns wagmi's useAccount data.
 */
export function useWallet(): UseWalletReturn {
    const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
    const { isDemoMode, demoAddress } = useDemoWalletStore();

    if (isDemoMode && demoAddress) {
        return {
            address: demoAddress,
            isConnected: true,
            isDemoMode: true,
        };
    }

    return {
        address: wagmiAddress,
        isConnected: wagmiConnected,
        isDemoMode: false,
    };
}
