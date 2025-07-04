import { ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import { ProtectedRoute } from '@/components/auth/protected-route';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 