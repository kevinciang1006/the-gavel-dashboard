import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDemoWalletStore } from "@/store/useDemoWalletStore";
import { ChevronDown, Wallet, TestTube2 } from "lucide-react";

export function CustomConnectButton() {
	const { isDemoMode, connectDemo, disconnectDemo } = useDemoWalletStore();

	// If in demo mode, show demo wallet button
	if (isDemoMode) {
		return (
			<ConnectButton.Custom>
				{({ account, chain, openChainModal, mounted }) => {
					const connected = mounted && account && chain;

					return (
						<div
							{...(!mounted && {
								"aria-hidden": true,
								style: {
									opacity: 0,
									pointerEvents: "none",
									userSelect: "none",
								},
							})}
						>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="gap-2">
										<TestTube2 className="h-4 w-4 text-accent" />
										<span className="hidden sm:inline">
											Demo:
										</span>
										<span className="font-mono text-xs">
											{account?.address
												? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
												: "0xd8dA...6045"}
										</span>
										<ChevronDown className="h-4 w-4 opacity-50" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-48"
								>
									<DropdownMenuItem
										onClick={disconnectDemo}
										className="cursor-pointer"
									>
										<TestTube2 className="h-4 w-4 mr-2" />
										Disconnect Demo
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				}}
			</ConnectButton.Custom>
		);
	}

	// Not in demo mode - show connect options
	return (
		<ConnectButton.Custom>
			{({
				account,
				chain,
				openAccountModal,
				openChainModal,
				openConnectModal,
				mounted,
			}) => {
				const connected = mounted && account && chain;

				return (
					<div
						{...(!mounted && {
							"aria-hidden": true,
							style: {
								opacity: 0,
								pointerEvents: "none",
								userSelect: "none",
							},
						})}
					>
						{(() => {
							// Connected to real wallet
							if (connected) {
								return (
									<div className="flex items-center gap-2">
										{chain.unsupported ? (
											<Button
												onClick={openChainModal}
												variant="destructive"
												size="sm"
											>
												Wrong network
											</Button>
										) : (
											<Button
												onClick={openChainModal}
												variant="ghost"
												size="sm"
												className="hidden sm:flex gap-1.5"
											>
												{chain.hasIcon &&
													chain.iconUrl && (
														<img
															alt={
																chain.name ??
																"Chain icon"
															}
															src={chain.iconUrl}
															className="h-4 w-4"
														/>
													)}
												{chain.name}
											</Button>
										)}

										<Button
											onClick={openAccountModal}
											variant="outline"
											className="gap-2"
										>
											<Wallet className="h-4 w-4" />
											<span className="font-mono text-xs">
												{account.displayName}
											</span>
											<span className="hidden sm:inline font-mono text-xs opacity-70">
												{account.displayBalance}
											</span>
										</Button>
									</div>
								);
							}

							// Not connected - show dropdown with options
							return (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="gradient"
											className="gap-2"
										>
											<Wallet className="h-4 w-4" />
											Connect Wallet
											<ChevronDown className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-56"
									>
										<DropdownMenuItem
											onClick={openConnectModal}
											className="cursor-pointer"
										>
											<Wallet className="h-4 w-4 mr-2" />
											<div className="flex flex-col">
												<span className="font-medium">
													Connect Wallet
												</span>
												<span className="text-xs text-muted-foreground">
													Use your own wallet
												</span>
											</div>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={connectDemo}
											className="cursor-pointer"
										>
											<TestTube2 className="h-4 w-4 mr-2 text-accent" />
											<div className="flex flex-col">
												<span className="font-medium">
													Connect Demo Wallet
												</span>
												<span className="text-xs text-muted-foreground">
													Try with test balances
												</span>
											</div>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							);
						})()}
					</div>
				);
			}}
		</ConnectButton.Custom>
	);
}
