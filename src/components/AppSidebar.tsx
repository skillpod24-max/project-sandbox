import { useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  LayoutDashboard,
  Car,
  ShoppingCart,
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
  Tag,
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

// Memoized menu item component for performance
const MemoizedMenuItem = memo(({ 
  title, 
  icon: Icon, 
  url, 
  badge = 0, 
  isCollapsed 
}: { 
  title: string; 
  icon: any; 
  url: string; 
  badge?: number; 
  isCollapsed: boolean;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <NavLink
        to={url}
        className={({ isActive }) =>
          `hover:bg-sidebar-accent text-sidebar-foreground will-change-transform
          ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}`
        }
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span
          className={`transition-opacity duration-150 ${
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          }`}
        >
          {title}
        </span>
        {badge > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1">
            {badge}
          </span>
        )}
      </NavLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
));

MemoizedMenuItem.displayName = "MemoizedMenuItem";

// Memoized menu group for performance
const MemoizedMenuGroup = memo(({ 
  label, 
  items, 
  isCollapsed 
}: { 
  label: string; 
  items: Array<{ title: string; icon: any; url: string; badge?: number }>; 
  isCollapsed: boolean;
}) => (
  <SidebarGroup>
    <SidebarGroupLabel className="text-sidebar-foreground/70">
      {label}
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <MemoizedMenuItem
            key={item.url}
            title={item.title}
            icon={item.icon}
            url={item.url}
            badge={item.badge}
            isCollapsed={isCollapsed}
          />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
));

MemoizedMenuGroup.displayName = "MemoizedMenuGroup";

const transactionMenuItems = [
  { title: "Purchases", icon: ShoppingCart, url: "/purchases" },
  { title: "Sales", icon: Receipt, url: "/sales" },
  { title: "Payments", icon: CreditCard, url: "/payments" },
  { title: "Expenses", icon: ReceiptText, url: "/expenses" },
  { title: "EMI", icon: CalendarClock, url: "/emi" },
  { title: "Vehicles for Sale", icon: Tag, url: "/vehicles-for-sale" },
];

const managementMenuItems = [
  { title: "Documents", icon: FileText, url: "/documents" },
  { title: "Reports", icon: BarChart3, url: "/reports" },
  { title: "Public Page Analytics", icon: BarChart3, url: "/analytics/public-page" },
  { title: "Marketplace Analytics", icon: BarChart3, url: "/analytics/marketplace" },
  { title: "Vehicle Inspection", icon: Wrench, url: "/vehicles" },
  { title: "Alerts", icon: Bell, url: "/alerts" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const fetchNewLeadsCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "new")
      .is("last_viewed_at", null);

    setNewLeadsCount(count || 0);
  }, []);

  useEffect(() => {
    fetchNewLeadsCount();

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
  }, [fetchNewLeadsCount]);

  useEffect(() => {
    if (location.pathname === "/leads") {
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
  }, [location.pathname, fetchNewLeadsCount]);

  const handleLogout = useCallback(async () => {
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
  }, [navigate, toast]);

  const mainMenuItems = useMemo(() => [
    { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard", badge: 0 },
    { title: "Vehicles", icon: Car, url: "/vehicles", badge: 0 },
    { title: "Customers", icon: UsersRound, url: "/customers", badge: 0 },
    { title: "Vendors", icon: UserCircle, url: "/vendors", badge: 0 },
    { title: "Leads", icon: UserPlus, url: "/leads", badge: newLeadsCount },
  ], [newLeadsCount]);

  return (
    <Sidebar collapsible="icon" className="will-change-transform">
      <SidebarContent className="bg-sidebar flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-sidebar-foreground flex-shrink-0" />
            <span
              className={`text-lg font-bold text-sidebar-foreground transition-opacity duration-150
                ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}
            >
              VahanHub
            </span>
          </div>
        </div>

        {/* Scrollable Menu - Invisible scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-invisible">
          <MemoizedMenuGroup label="Main" items={mainMenuItems} isCollapsed={isCollapsed} />
          <MemoizedMenuGroup label="Transactions" items={transactionMenuItems} isCollapsed={isCollapsed} />
          <MemoizedMenuGroup label="Management" items={managementMenuItems} isCollapsed={isCollapsed} />
        </div>

        {/* Bottom: Settings & Logout */}
        <div className="border-t border-sidebar-border">
          <SidebarMenu>
            <MemoizedMenuItem 
              title="Settings" 
              icon={Settings} 
              url="/settings" 
              isCollapsed={isCollapsed} 
            />
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
