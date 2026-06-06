import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  ClipboardCheck,
  Settings,
  Shield,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  MapPinHouse,
  HandHeart,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Map, label: "Peta GIS", path: "/map" },
  { icon: Users, label: "Penerima Bantuan", path: "/recipients" },
  { icon: MapPinHouse, label: "Rumah Ibadah", path: "/places" },
  {
    icon: ClipboardCheck,
    label: "Verifikasi",
    path: "/verification",
    roles: ["admin", "officer"],
  },
  { icon: Shield, label: "Pengguna", path: "/users", roles: ["admin"] },
  { icon: Settings, label: "Pengaturan", path: "/settings", roles: ["admin"] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = menuItems.find((item) => item.path === location.pathname);

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const sidebarWidth = collapsed ? 72 : 260;

  const renderSidebar = () => (
    <div
      className="flex flex-col h-full bg-sidebar border-r border-sidebar-border"
      style={{ width: sidebarWidth, transition: "width 0.2s ease" }}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
        <HandHeart className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-sm font-bold truncate text-sidebar-foreground">
              WebGIS Poverty
            </h1>
            <p className="text-[10px] text-muted-foreground truncate">
              Mapping System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer - User */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-xl hover:bg-sidebar-accent transition-colors p-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || "user"}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled className="flex-col items-start">
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center mt-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <div
          className="shrink-0 h-full"
          style={{ width: sidebarWidth, transition: "width 0.2s ease" }}
        >
          {renderSidebar()}
        </div>
      )}

      {/* Sidebar - Mobile */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[260px]">
            <div className="h-full" style={{ width: 260 }}>
              {renderSidebar()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b bg-background/95 backdrop-blur z-40">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <HandHeart className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">{activeItem?.label || "WebGIS"}</span>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur z-40">
            <div>
              <h1 className="text-lg font-semibold">{activeItem?.label || ""}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {user?.role}
              </Badge>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
