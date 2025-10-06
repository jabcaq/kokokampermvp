import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Users, FileText, UserPlus, Truck, Menu, Mail, ClipboardCheck, LogOut, FolderOpen, UserCog, Receipt, Calendar, CalendarClock, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { useCheckExpiringDocuments } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/koko-logo.jpeg";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/clients", label: "Klienci", icon: Users },
  { path: "/contracts", label: "Umowy", icon: FileText },
  { path: "/fleet", label: "Flota", icon: Truck },
  { path: "/protocols", label: "Protokoły", icon: ClipboardCheck },
  { path: "/return-calendar", label: "Kalendarz zwrotów", icon: Calendar },
  { path: "/documents", label: "Dokumenty", icon: FolderOpen },
  { path: "/invoices", label: "Faktury i Paragony", icon: Receipt },
  { path: "/inquiries", label: "Zapytania", icon: Mail },
  { path: "/users", label: "Użytkownicy", icon: UserCog },
  { path: "/admin/employee-schedules", label: "Harmonogramy pracowników", icon: CalendarClock, adminOnly: true },
];

export const Layout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const checkExpiringMutation = useCheckExpiringDocuments();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  // Check user roles
  const { data: userRoles } = useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isReturnHandler: false };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      const roles = data?.map(r => r.role) || [];
      return {
        isAdmin: roles.includes("admin"),
        isReturnHandler: roles.includes("return_handler"),
      };
    },
    enabled: !!user?.id,
  });

  // Add employee-specific nav items if user is a return handler
  const employeeNavItems = userRoles?.isReturnHandler
    ? [
        { path: "/employee-schedule", label: "Mój harmonogram", icon: CalendarClock },
        { path: "/my-returns", label: "Moje zwroty", icon: CalendarCheck },
      ]
    : [];

  // Debug: log user roles to help troubleshoot
  console.log("User roles:", userRoles);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return userRoles?.isAdmin;
    }
    return true;
  });

  const allNavItems = [...filteredNavItems, ...employeeNavItems];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Wylogowano",
      description: "Do zobaczenia!",
    });
  };

  // Check for expiring documents on mount
  useEffect(() => {
    checkExpiringMutation.mutate();
  }, []);

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border bg-white">
        <img src={logoImage} alt="Koko Kamper" className="h-16 w-auto" />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 transition-all ${
                  isActive ? "shadow-md" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-3"
        >
          <LogOut className="h-5 w-5" />
          <span>Wyloguj</span>
        </Button>
        {user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-sidebar-border shadow-sm overflow-y-auto">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-white">
          <div className="flex flex-col h-full">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex-shrink-0">
          <div className="container mx-auto px-6 lg:px-8 max-w-7xl py-4 flex justify-end">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
