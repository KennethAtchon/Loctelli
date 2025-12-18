import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-gray-600">Settings page - Coming soon</p>
    </div>
  );
}
