import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { User } from "@supabase/supabase-js";
import { Wifi, WifiOff, Info, LayoutDashboard, Car, ShoppingCart, Receipt, BarChart3, Settings, Menu, UserPlus, CreditCard, ReceiptText, CalendarClock, FileText, Bell, LogOut } from "lucide-react";
import { Calculator } from "lucide-react";
import EMICalculatorDialog from "@/components/EMICalculatorDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StickyNote } from "lucide-react";
import StickyNotesPanel from "@/components/StickyNotesPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import GlobalSearch from "@/components/layout/GlobalSearch";
import TopBarUserMenu from "@/components/layout/TopBarUserMenu";

const applyThemeByIndex = (index: number) => {
  const themeColors = [
    { sidebar: "0 0% 8%", primary: "0 0% 12%", accent: "217 91% 60%" },
    { sidebar: "210 50% 15%", primary: "210 100% 40%", accent: "199 89% 48%" },
    { sidebar: "150 30% 12%", primary: "142 71% 35%", accent: "142 71% 45%" },
    { sidebar: "270 30% 15%", primary: "262 83% 48%", accent: "262 83% 58%" },
    { sidebar: "20 30% 12%", primary: "25 95% 45%", accent: "38 92% 50%" },
    { sidebar: "340 30% 15%", primary: "339 90% 41%", accent: "339 90% 51%" },
    { sidebar: "240 20% 8%", primary: "240 30% 20%", accent: "221 83% 53%" },
    { sidebar: "30 10% 12%", primary: "30 10% 25%", accent: "38 92% 50%" },
    { sidebar: "173 50% 12%", primary: "173 80% 35%", accent: "173 80% 40%" },
    { sidebar: "0 30% 12%", primary: "0 72% 45%", accent: "0 72% 51%" },
    { sidebar: "245 30% 12%", primary: "245 58% 48%", accent: "245 58% 58%" },
    { sidebar: "160 30% 10%", primary: "160 84% 35%", accent: "160 84% 39%" },
  ];

  const theme = themeColors[index];
  if (!theme) return;

  document.documentElement.style.setProperty("--sidebar-background", theme.sidebar);
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--chart-1", theme.accent);
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [infoOpen, setInfoOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [emiCalcOpen, setEmiCalcOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const savedTheme = localStorage.getItem("theme-index");
    if (savedTheme !== null) {
      applyThemeByIndex(Number(savedTheme));
    }

    const darkMode = localStorage.getItem("dark-mode") === "true";
    document.documentElement.classList.toggle("dark", darkMode);
  }, [user]);

  const checkInternet = async () => {
    if (!navigator.onLine) return false;
    try {
      const { error } = await supabase
        .from("settings")
        .select("id")
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateStatus = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      const backendOk = await checkInternet();
      setIsOnline(backendOk);
    };

    updateStatus();
    interval = setInterval(updateStatus, 8000);

    const handleOnline = () => updateStatus();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchShopName = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("settings")
        .select("dealer_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.dealer_name) {
        setShopName(data.dealer_name);
      }
    };
    fetchShopName();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mobile bottom nav items
  const bottomNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
    { title: "Vehicles", icon: Car, url: "/vehicles" },
    { title: "Sales", icon: Receipt, url: "/sales" },
    { title: "Leads", icon: UserPlus, url: "/leads" },
  ];

  const moreMenuItems = [
    { title: "Purchases", icon: ShoppingCart, url: "/purchases" },
    { title: "Payments", icon: CreditCard, url: "/payments" },
    { title: "Expenses", icon: ReceiptText, url: "/expenses" },
    { title: "EMI", icon: CalendarClock, url: "/emi" },
    { title: "Documents", icon: FileText, url: "/documents" },
    { title: "Reports", icon: BarChart3, url: "/reports" },
    { title: "Marketplace Hub", icon: BarChart3, url: "/marketplace-hub" },
    { title: "Alerts", icon: Bell, url: "/alerts" },
    { title: "Settings", icon: Settings, url: "/settings" },
  ];

  const isActive = (url: string) => location.pathname === url;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background pb-16 md:pb-0 overflow-x-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
          {/* Zoho-style Top Header */}
          <header className="h-14 border-b border-border bg-card flex items-center px-3 sm:px-6 sticky top-0 z-[60] shadow-sm">
            {!isOnline && (
              <div className="absolute top-14 left-0 right-0 bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-2 text-sm flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>You're offline. Reconnect to access the platform.</span>
              </div>
            )}

            {/* Desktop: Sidebar trigger */}
            <div className="hidden md:block">
              <SidebarTrigger className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted active:scale-95 transition-transform" />
            </div>

            {/* Mobile: Brand */}
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">VahanHub</span>
            </div>

            {/* Global Search - Zoho Style */}
            <div className="ml-4 flex-1">
              <GlobalSearch />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 mx-2 border-l border-r border-border px-3">
              <button
                onClick={() => setNotesOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Sticky Notes"
              >
                <StickyNote className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setInfoOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors hidden sm:flex"
                title="Platform Info"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setEmiCalcOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="EMI Calculator"
              >
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Online Status */}
            <div
              className={`hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mr-3 ${
                isOnline
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" /> Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> Offline
                </>
              )}
            </div>

            {/* User Menu with Settings, Alerts, Logout */}
            <TopBarUserMenu shopName={shopName} userEmail={user.email} />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto transition-[opacity] duration-200 scrollbar-hide bg-muted/30">
            <div className="max-w-[1920px] mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
          <div className="grid grid-cols-5 h-16">
            {bottomNavItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={`flex flex-col items-center justify-center gap-0.5 ${
                  isActive(item.url) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isActive(item.url) ? "bg-primary/10" : ""
                }`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.title}</span>
              </Link>
            ))}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center">
                <Menu className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>

        {/* Mobile More Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                    isActive(item.url) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium text-center leading-tight">{item.title}</span>
                </Link>
              ))}
              {/* Logout button in mobile menu */}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/auth");
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-[10px] font-medium text-center leading-tight">Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Platform Usage & Guidelines</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">📌 General Usage</h4>
              <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                <li>Keep your internet connection active for real-time sync</li>
                <li>Avoid refreshing during form submissions</li>
                <li>Always mark vehicles as Sold instead of deleting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">🚗 Inventory Best Practices</h4>
              <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                <li>Upload clear images for better lead conversion</li>
                <li>Do not delete sold vehicles (affects reports)</li>
                <li>Use public page only for available stock</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">📊 Reports & Data</h4>
              <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                <li>Reports are calculated from sold vehicles</li>
                <li>Deleting historical data may affect profits</li>
                <li>Export data regularly for backup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">⚡ Tips</h4>
              <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                <li>Use search & filters to manage large data</li>
                <li>Keep vendor & customer data updated</li>
                <li>Use notes for internal tracking</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StickyNotesPanel open={notesOpen} onOpenChange={setNotesOpen} />
      <EMICalculatorDialog open={emiCalcOpen} onOpenChange={setEmiCalcOpen} />
    </SidebarProvider>
  );
};

export default Layout;
