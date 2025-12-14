import { ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { SubaccountFilterProvider } from "@/contexts/subaccount-filter-context";
import { DarkModeProvider } from "@/contexts/dark-mode-context";
import { TenantProvider } from "@/contexts/tenant-context";

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout overflow-hidden h-screen transition-colors duration-300 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900/80">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0 w-full">
          <Header />
          <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-8 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProtectedRoute>
      <DarkModeProvider>
        <SubaccountFilterProvider>
          <TenantProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
          </TenantProvider>
        </SubaccountFilterProvider>
      </DarkModeProvider>
    </AdminProtectedRoute>
  );
}
