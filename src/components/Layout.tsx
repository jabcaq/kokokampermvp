import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Users, FileText, UserPlus, Truck, Menu, Mail, ClipboardCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { useCheckExpiringDocuments } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/clients", label: "Klienci", icon: Users },
  { path: "/contracts", label: "Umowy", icon: FileText },
  { path: "/fleet", label: "Flota", icon: Truck },
  { path: "/protocols", label: "Protokoły", icon: ClipboardCheck },
  { path: "/inquiries", label: "Zapytania", icon: Mail },
];

export const Layout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const checkExpiringMutation = useCheckExpiringDocuments();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

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
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          RentCamper CRM
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Zarządzanie wynajmem</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
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
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar border-r border-sidebar-border">
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
        <SheetContent side="left" className="p-0 w-64 bg-sidebar">
          <div className="flex flex-col h-full">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-6 lg:px-8 max-w-7xl py-4 flex justify-end">
            <NotificationBell />
          </div>
        </div>
        <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
