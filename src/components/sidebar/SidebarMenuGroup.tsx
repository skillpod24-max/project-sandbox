import { memo } from "react";
import { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import SidebarMenuItem from "./SidebarMenuItem";

interface MenuItem {
  title: string;
  icon: LucideIcon;
  url: string;
  badge?: number;
}

interface SidebarMenuGroupProps {
  label: string;
  items: MenuItem[];
  isCollapsed: boolean;
}

const SidebarMenuGroup = memo(({ label, items, isCollapsed }: SidebarMenuGroupProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
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
  );
});

SidebarMenuGroup.displayName = "SidebarMenuGroup";

export default SidebarMenuGroup;
