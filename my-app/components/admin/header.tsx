'use client';

import { User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/unified-auth-context';
import { SubaccountFilter } from './subaccount-filter';
import { DarkModeToggleCompact } from '@/components/ui/dark-mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { admin, adminLogout } = useAdminAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await adminLogout();
    router.push('/admin/login');
  };

  const handleProfileClick = () => {
    router.push('/admin/settings');
  };

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-slate-700/60 px-6 py-4 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Left side - empty for now, can be used for breadcrumbs or page title */}
        <div className="flex-1"></div>
        
        {/* Right side - Dark mode toggle, Subaccount filter and User menu */}
        <div className="flex items-center justify-end gap-4">
          <DarkModeToggleCompact />
          <SubaccountFilter variant="compact" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-right truncate max-w-32 font-medium text-gray-700 dark:text-gray-200">
                  {admin?.name ? (admin.name.length > 20 ? admin.name.substring(0, 20) + '...' : admin.name) : 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60">
              <DropdownMenuLabel className="font-semibold text-gray-800 dark:text-gray-200">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200">
                <Settings className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="dark:text-gray-200">Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 