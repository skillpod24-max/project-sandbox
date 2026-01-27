import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Car,
  ShoppingCart,
  Users,
  UsersRound,
  UserPlus,
  UserCircle,
  Receipt,
  ReceiptText,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  CalendarClock,
  DollarSign,
  Wrench,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const transactionMenuItems = [
  { title: "Purchases", icon: ShoppingCart, url: "/purchases" },
  { title: "Sales", icon: Receipt, url: "/sales" },
  { title: "Payments", icon: CreditCard, url: "/payments" },
  { title: "Expenses", icon: ReceiptText, url: "/expenses" },
  { title: "EMI", icon: CalendarClock, url: "/emi" },
  
];


const managementMenuItems = [
  {
    title: "Documents",
    icon: FileText,
    url: "/documents",
  },
  {
    title: "Reports",
    icon: BarChart3,
    url: "/reports",
  },
  {
  title: "Public Page Analytics",
  icon: BarChart3,
  url: "/analytics/public-page",
},
  {
    title: "Alerts",
    icon: Bell,
    url: "/alerts",
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    fetchNewLeadsCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("leads-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => fetchNewLeadsCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset count when user visits leads page
  useEffect(() => {
    if (location.pathname === "/leads") {
      // Mark all new leads as viewed after a short delay
      const markAsViewed = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("leads")
          .update({ last_viewed_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("status", "new")
          .is("last_viewed_at", null);
        
        fetchNewLeadsCount();
      };
      
      const timeout = setTimeout(markAsViewed, 1000);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  const fetchNewLeadsCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Only count leads that are new AND have not been viewed yet
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "new")
      .is("last_viewed_at", null);

    setNewLeadsCount(count || 0);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    }
  };

  const mainMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard", badge: 0 },
  { title: "Vehicles", icon: Car, url: "/vehicles", badge: 0 },
  { title: "Customers", icon: UsersRound, url: "/customers", badge: 0 },
  { title: "Vendors", icon: UserCircle, url: "/vendors", badge: 0 },
  { title: "Leads", icon: UserPlus, url: "/leads", badge: newLeadsCount },
];


  return (
    <Sidebar
  collapsible="icon"
  className="transition-none"
>
      <SidebarContent className="bg-sidebar flex flex-col h-full">
  {/* ───────── TOP: LOGO (FIXED) ───────── */}
  <div className="p-4 border-b border-sidebar-border">
    <div className="flex items-center gap-2">
      <Car className="h-6 w-6 text-sidebar-foreground flex-shrink-0" />
      <span
  className={`
    text-lg font-bold text-sidebar-foreground
    transition-all duration-300 ease-in-out
    ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
  `}
>
  VahanHub
</span>

    </div>
  </div>

  {/* ───────── MIDDLE: SCROLLABLE MENU ───────── */}
  <div className="flex-1 overflow-y-auto">
    {/* Main */}
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">
        Main
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
  to={item.url}
  className={({ isActive }) =>
    `
    hover:bg-sidebar-accent transition-colors text-sidebar-foreground
    ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
    `
  }
>

                  <item.icon className="h-5 w-5" />
                  <span
  className={`
    transition-all duration-200
    ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
  `}
>
  {item.title}
</span>

                  {item.badge > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>

    {/* Transactions */}
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">
        Transactions
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {transactionMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
  to={item.url}
  className={({ isActive }) =>
    `
    hover:bg-sidebar-accent transition-colors text-sidebar-foreground
    ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
    `
  }
>

                  <item.icon className="h-5 w-5" />
                  <span
  className={`
    transition-all duration-200
    ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
  `}
>
  {item.title}
</span>

                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>

    {/* Management */}
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">
        Management
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {managementMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
  to={item.url}
  className={({ isActive }) =>
    `
    hover:bg-sidebar-accent transition-colors text-sidebar-foreground
    ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
    `
  }
>

                  <item.icon className="h-5 w-5" />
                  <span
  className={`
    transition-all duration-200
    ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
  `}
>
  {item.title}
</span>

                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </div>

  {/* ───────── BOTTOM: SETTINGS & LOGOUT (FIXED) ───────── */}
  <div className="border-t border-sidebar-border">
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
  to="/settings"
  className={({ isActive }) =>
    `
    hover:bg-sidebar-accent transition-colors text-sidebar-foreground
    ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
    `
  }
>

            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleLogout}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </div>
</SidebarContent>

    </Sidebar>
  );
}
