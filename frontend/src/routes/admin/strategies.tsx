import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/strategies')({
  component: AdminStrategiesPage,
});

function AdminStrategiesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Strategies Management</h1>
      <p className="text-gray-600">Strategies management page - Coming soon</p>
    </div>
  );
}
