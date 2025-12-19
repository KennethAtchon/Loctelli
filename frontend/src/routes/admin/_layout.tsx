import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";
import { ROUTES } from "@/lib/routes";

export const Route = createFileRoute(ROUTES.ADMIN.LAYOUT)({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminLayoutWrapper>
      <Outlet />
    </AdminLayoutWrapper>
  );
}
