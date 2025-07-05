'use client';

import DatabaseSchema from '@/components/admin/database-schema';

export default function DevPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Development Tools</h1>
          <p className="text-gray-600">Database schema and development utilities.</p>
        </div>
      </div>

      {/* Database Schema */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Database Schema</h2>
        <DatabaseSchema />
      </div>
    </div>
  );
} 