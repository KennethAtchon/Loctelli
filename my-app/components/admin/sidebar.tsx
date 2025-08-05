'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/admin-auth-context';
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
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'SubAccounts', href: '/admin/subaccounts', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Strategies', href: '/admin/strategies', icon: Target },
  { name: 'Leads', href: '/admin/leads', icon: Users },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'SMS', href: '/admin/sms', icon: Send },
  { name: 'Scraping', href: '/admin/scraping', icon: Globe },
  { name: 'Prompt Builder', href: '/admin/prompt-templates', icon: FileText },
  { name: 'Integrations', href: '/admin/integrations', icon: Link2 },
  { name: 'Dev', href: '/admin/dev', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },  
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, adminLogout } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
    setIsOpen(false);
  };

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Loctelli CRM</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {admin?.name ? (admin.name.length > 20 ? admin.name.substring(0, 20) + '...' : admin.name) : 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {admin?.email ? (admin.email.length > 20 ? admin.email.substring(0, 20) + '...' : admin.email) : 'admin@example.com'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
      <div className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200">
        <NavigationContent />
      </div>
    </>
  );
} 