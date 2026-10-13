import { LayoutDashboard, Receipt, Package, History, Users, UserCog, ChevronRight, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const baseMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Sale", url: "/billing", icon: Receipt },
  { title: "Products", url: "/products", icon: Package },
  { title: "Sales History", url: "/sales", icon: History },
  { title: "Customers", url: "/customers", icon: Users },
];

const adminMenuItems = [
  { title: "Staff", url: "/staff", icon: UserCog },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = user?.role === 'admin'
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Salesperson';

  return (
    <Sidebar className="border-r-0 bg-gradient-to-b from-[hsl(225,25%,15%)] to-[hsl(225,30%,12%)]">
      <SidebarHeader className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <span className="text-xl font-bold text-sidebar-primary-foreground">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">Shop POS</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">Point of Sale</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative h-12 overflow-hidden rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-white"
                      }`}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isActive 
                            ? "bg-white/20" 
                            : "bg-sidebar-accent group-hover:bg-sidebar-primary/20"
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1 font-medium">{item.title}</span>
                        <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                          isActive 
                            ? "opacity-100 translate-x-0" 
                            : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
                        }`} />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div 
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 p-4 shadow-inner cursor-pointer hover:from-sidebar-accent/90 hover:to-sidebar-accent/70 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-primary/30 ring-offset-2 ring-offset-sidebar-accent">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-accent bg-status-active" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || 'Unknown'}
              </p>
              <p className="truncate text-xs text-sidebar-muted">{roleLabel}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); navigate('/login'); }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-sidebar-muted" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
