import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';

export const Route = createFileRoute('/admin/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminProtectedRoute>
      <div className="flex h-screen overflow-hidden admin-layout">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

