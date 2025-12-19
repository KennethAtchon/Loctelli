import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { SubaccountFilterProvider } from "@/contexts/subaccount-filter-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { ROUTES } from "@/lib/routes";

export const Route = createFileRoute(ROUTES.ADMIN.LAYOUT)({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminProtectedRoute>
      <SubaccountFilterProvider>
        <TenantProvider>
          <div className="flex h-screen overflow-hidden admin-layout">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6">
                <Outlet />
              </main>
            </div>
          </div>
        </TenantProvider>
      </SubaccountFilterProvider>
    </AdminProtectedRoute>
  );
}
