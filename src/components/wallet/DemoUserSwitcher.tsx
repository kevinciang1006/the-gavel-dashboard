import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDemoWalletStore,
  DEMO_USERS,
  type DemoUserId,
} from "@/store/useDemoWalletStore";
import { ChevronDown, Check, Settings, User, Wallet, FlaskConical } from "lucide-react";

export function DemoUserSwitcher() {
  const { address: realAddress, isConnected: isRealWalletConnected } = useAccount();

  const {
    isDemoMode,
    currentDemoUser,
    switchDemoUser,
    toggleDemoMode,
  } = useDemoWalletStore();

  const currentUser = DEMO_USERS[currentDemoUser];

  const handleSwitchUser = (userId: DemoUserId) => {
    if (userId !== currentDemoUser) {
      switchDemoUser(userId);
      toast.success(`Switched to ${DEMO_USERS[userId].name}`, {
        description: `Now viewing as ${DEMO_USERS[userId].shortAddress}`,
        icon: <UserAvatar userId={userId} size="sm" />,
      });
    }
  };

  const handleToggleDemoMode = () => {
    toggleDemoMode();
    if (isDemoMode) {
      toast.info("Demo mode disabled", {
        description: "Connect a real wallet to continue",
      });
    } else {
      toast.success("Demo mode enabled", {
        description: `Viewing as ${DEMO_USERS[currentDemoUser].name}`,
      });
    }
  };

  if (!isDemoMode) {
    // Show minimal button to re-enable demo mode
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleDemoMode}
        className="gap-2"
      >
        <FlaskConical className="h-4 w-4" />
        Enable Demo
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Demo Mode Badge */}
      <Badge variant="accent" className="gap-1 text-[10px] hidden sm:flex">
        <FlaskConical className="h-3 w-3" />
        Demo Mode
      </Badge>

      {/* User Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 pl-2 pr-3">
            <UserAvatar userId={currentDemoUser} size="md" />
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-medium">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {currentUser.shortAddress}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
            <FlaskConical className="h-3 w-3" />
            Switch Demo User
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* User Options */}
          {(Object.keys(DEMO_USERS) as DemoUserId[]).map((userId) => {
            const user = DEMO_USERS[userId];
            const isActive = userId === currentDemoUser;

            return (
              <DropdownMenuItem
                key={userId}
                onClick={() => handleSwitchUser(userId)}
                className={`cursor-pointer gap-3 py-2.5 ${
                  isActive ? "bg-secondary" : ""
                }`}
              >
                <UserAvatar userId={userId} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {isActive && (
                      <Check className="h-3 w-3 text-success" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {user.shortAddress}
                  </span>
                </div>
                {isActive && (
                  <Badge variant="success" className="text-[10px]">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          {/* Settings & Account (placeholders) */}
          <DropdownMenuItem disabled className="gap-3 opacity-50">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="gap-3 opacity-50">
            <User className="h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Real Wallet Status */}
          <div className="px-2 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Wallet className="h-3 w-3" />
              <span>Actual Wallet</span>
            </div>
            {isRealWalletConnected && realAddress ? (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Wallet className="h-3 w-3 text-white" />
                </div>
                <span className="font-mono text-xs">
                  {realAddress.slice(0, 6)}...{realAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground px-2">
                Not connected
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Toggle Demo Mode */}
          <DropdownMenuItem
            onClick={handleToggleDemoMode}
            className="cursor-pointer gap-3 text-warning"
          >
            <FlaskConical className="h-4 w-4" />
            <span>Exit Demo Mode</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// User Avatar Component
interface UserAvatarProps {
  userId: DemoUserId;
  size?: "sm" | "md" | "lg";
}

function UserAvatar({ userId, size = "md" }: UserAvatarProps) {
  const user = DEMO_USERS[userId];

  const sizeClasses = {
    sm: "h-5 w-5 text-[10px]",
    md: "h-7 w-7 text-xs",
    lg: "h-9 w-9 text-sm",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${user.bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-sm`}
    >
      {user.initials}
    </div>
  );
}

export { UserAvatar };
