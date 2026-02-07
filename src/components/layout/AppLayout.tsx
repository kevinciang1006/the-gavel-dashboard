import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CustomConnectButton } from "@/components/wallet/CustomConnectButton";
import { DemoUserSwitcher } from "@/components/wallet/DemoUserSwitcher";
import { useDemoWalletStore } from "@/store/useDemoWalletStore";

const AppLayout = () => {
  const isDemoMode = useDemoWalletStore((state) => state.isDemoMode);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8" />
              </div>

              {/* Wallet/Demo Section */}
              <div className="flex items-center gap-3">
                {isDemoMode ? (
                  <DemoUserSwitcher />
                ) : (
                  <>
                    <DemoUserSwitcher />
                    <CustomConnectButton />
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
