'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Database,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Strategies', href: '/admin/strategies', icon: Target },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Dev', href: '/admin/dev', icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
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
              <span className="text-sm font-medium text-gray-700">U</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700">User Name</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
          <button className="ml-2 p-1 text-gray-400 hover:text-gray-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 