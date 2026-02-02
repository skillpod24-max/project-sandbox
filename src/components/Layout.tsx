import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Info } from "lucide-react";
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




  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Check for existing session
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
  // If browser already says offline, trust it
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
    // Fast browser hint
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const backendOk = await checkInternet();
    setIsOnline(backendOk);
  };

  // Initial
  updateStatus();

  // Poll every 8s (not aggressive)
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



  // Fetch shop name from settings
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

  return (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Zoho-style Top Header */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 sticky top-0 z-[60] shadow-sm">
          {!isOnline && (
            <div className="absolute top-14 left-0 right-0 bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-2 text-sm flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Reconnect to access the platform.</span>
            </div>
          )}

          <SidebarTrigger
            className="
              transition-none
              flex items-center justify-center
              h-9 w-9
              rounded-lg
              hover:bg-muted
              active:scale-95
              will-change-transform
            "
          >
            <span className="sr-only">Toggle Sidebar</span>
          </SidebarTrigger>

          {/* Quick Actions - Zoho Style */}
          <div className="flex items-center gap-1 ml-3 border-l border-border pl-3">
            <button
              onClick={() => setNotesOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
              title="Sticky Notes"
            >
              <StickyNote className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setInfoOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
              title="Platform Info"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setEmiCalcOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors touch-target"
              title="EMI Calculator"
            >
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Right Side - User Info */}
          <div className="ml-auto flex items-center gap-3">
            {shopName ? (
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
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

                <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 shadow-sm rounded-lg text-xs">
                  {shopName}
                </Badge>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
            )}
          </div>
        </header>

        {/* Main Content Area - Zoho Style */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto transition-[opacity] duration-200 scrollbar-hide bg-muted/30">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>

    <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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