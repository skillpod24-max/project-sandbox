import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Settings, LogOut, ChevronDown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarUserMenuProps {
  shopName: string | null;
  userEmail?: string;
}

const TopBarUserMenu = ({ shopName, userEmail }: TopBarUserMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alertsCount, setAlertsCount] = useState(0);

  const fetchAlertsCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Count documents expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: docsCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("expiry_date", thirtyDaysFromNow.toISOString())
      .gte("expiry_date", new Date().toISOString());

    // Count vehicles with expiring documents
    const { count: vehiclesCount } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or(`insurance_expiry.lte.${thirtyDaysFromNow.toISOString()},puc_expiry.lte.${thirtyDaysFromNow.toISOString()},fitness_expiry.lte.${thirtyDaysFromNow.toISOString()}`);

    setAlertsCount((docsCount || 0) + (vehiclesCount || 0));
  }, []);

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchAlertsCount]);

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

  return (
    <div className="flex items-center gap-2">
      {/* Alerts Button */}
      <button
        onClick={() => navigate("/alerts")}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        title="Alerts"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {alertsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
            {alertsCount > 99 ? "99+" : alertsCount}
          </span>
        )}
      </button>

      {/* Settings Button */}
      <button
        onClick={() => navigate("/settings")}
        className="p-2 rounded-lg hover:bg-muted transition-colors hidden sm:block"
        title="Settings"
      >
        <Settings className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                {shopName || "My Account"}
              </p>
              {userEmail && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-32">
                  {userEmail}
                </p>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium">{shopName || "My Account"}</p>
            {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
          </div>
          <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/alerts")} className="cursor-pointer">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
            {alertsCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs">
                {alertsCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TopBarUserMenu;
