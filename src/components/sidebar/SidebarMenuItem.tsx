import { memo } from "react";
import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem as SidebarMenuItemBase } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarMenuItemProps {
  title: string;
  icon: LucideIcon;
  url: string;
  badge?: number;
  isCollapsed: boolean;
}

const SidebarMenuItem = memo(({ title, icon: Icon, url, badge = 0, isCollapsed }: SidebarMenuItemProps) => {
  const linkContent = (
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
      {badge > 0 && !isCollapsed && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1">
          {badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <SidebarMenuItemBase>
      <SidebarMenuButton asChild>
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={12}
              className="z-[200] bg-popover text-popover-foreground border shadow-lg font-medium text-sm px-3 py-1.5"
            >
              {title}
              {badge > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1">
                  {badge}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          linkContent
        )}
      </SidebarMenuButton>
    </SidebarMenuItemBase>
  );
});

SidebarMenuItem.displayName = "SidebarMenuItem";

export default SidebarMenuItem;
