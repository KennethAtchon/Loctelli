import { ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col lg:ml-0">
            <Header />
            <main className="flex-1 p-6 lg:p-6 pt-20 lg:pt-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
} 