import { memo } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem as SidebarMenuItemBase } from "@/components/ui/sidebar";

interface SidebarMenuItemProps {
  title: string;
  icon: LucideIcon;
  url: string;
  badge?: number;
  isCollapsed: boolean;
}

const SidebarMenuItem = memo(({ title, icon: Icon, url, badge = 0, isCollapsed }: SidebarMenuItemProps) => {
  return (
    <SidebarMenuItemBase>
      <SidebarMenuButton asChild>
        <NavLink
          to={url}
          className={({ isActive }) =>
            `hover:bg-sidebar-accent transition-colors text-sidebar-foreground
            ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}`
          }
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span
            className={`transition-all duration-150 ${
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
    </SidebarMenuItemBase>
  );
});

SidebarMenuItem.displayName = "SidebarMenuItem";

export default SidebarMenuItem;
