import { ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';
import { SubaccountFilterProvider } from '@/contexts/subaccount-filter-context';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProtectedRoute>
      <SubaccountFilterProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-0 overflow-auto w-full">
              <Header />
              <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </SubaccountFilterProvider>
    </AdminProtectedRoute>
  );
} 