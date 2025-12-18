import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/unified-auth-context";
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Database,
  Menu,
  FileText,
  Building2,
  Link2,
  Send,
  Search,
  Mail,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "SubAccounts", href: "/admin/subaccounts", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Contacts", href: "/admin/contacts", icon: Mail },
  { name: "Forms", href: "/admin/forms", icon: ClipboardList },
  { name: "Strategies", href: "/admin/strategies", icon: Target },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Chat", href: "/admin/chat", icon: MessageSquare },
  { name: "Prompt Builder", href: "/admin/prompt-templates", icon: FileText },
  { name: "Integrations", href: "/admin/integrations", icon: Link2 },
  { name: "Dev", href: "/admin/dev", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { admin, adminLogout } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    navigate({ to: "/admin/login" });
    setIsOpen(false);
  };

  const NavigationContent = () => (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-gray-200/60 dark:border-slate-700/60 transition-colors duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200/60 dark:border-slate-700/60 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-700 dark:to-slate-800">
        <h1 className="text-xl font-bold text-white">Loctelli CRM</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 transform scale-[1.02]"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:transform hover:scale-[1.01]"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200/60 dark:border-slate-700/60 p-4 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center bg-white dark:bg-slate-700/50 rounded-xl p-3 shadow-sm border border-gray-200/50 dark:border-slate-600/50 transition-colors duration-300">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-white">
                {admin?.name ? admin.name.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {admin?.name
                ? admin.name.length > 20
                  ? admin.name.substring(0, 20) + "..."
                  : admin.name
                : "Admin User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {admin?.email
                ? admin.email.length > 20
                  ? admin.email.substring(0, 20) + "..."
                  : admin.email
                : "admin@example.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavigationContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-col">
        <NavigationContent />
      </div>
    </>
  );
}
