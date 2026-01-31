import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, Users, ShoppingCart, Receipt, BarChart3, FileText, CreditCard } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '@/lib/constants';

interface NavChild {
  title: string;
  path: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: string;
  children?: NavChild[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  BarChart3,
  FileText,
  CreditCard,
};

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Account', 'Purchase', 'Sale', 'Reports']);

  const navItems: NavItem[] = user?.role === 'customer' ? CUSTOMER_NAV_ITEMS : ADMIN_NAV_ITEMS;

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (children?: { path: string }[]) =>
    children?.some(child => location.pathname.startsWith(child.path));

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title) ? prev.filter(g => g !== title) : [...prev, title]
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-lg font-bold text-sidebar-primary-foreground">SF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Shiv Furniture</span>
            <span className="text-xs text-sidebar-foreground/60">Budget System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const hasChildren = 'children' in item && item.children;
                const groupOpen = openGroups.includes(item.title);
                const active = isActive(item.path) || isGroupActive(item.children);

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={groupOpen}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              'w-full justify-between',
                              active && 'bg-sidebar-accent text-sidebar-accent-foreground'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform',
                                groupOpen && 'rotate-180'
                              )}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children?.map(child => (
                              <SidebarMenuSubItem key={child.path}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive(child.path)}
                                >
                                  <Link to={child.path}>{child.title}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)}>
                      <Link to={item.path} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/50">
          Version 1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
