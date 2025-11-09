'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

interface SDKTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
  }>;
  rowCount: number;
}

interface SDKTablesResponse {
  tables: SDKTable[];
  count: number;
}

export default function SDKTables() {
  const [tables, setTables] = useState<SDKTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/proxy/ai-receptionist/dev/tables');
      if (!response.ok) {
        throw new Error(`Failed to fetch SDK tables: ${response.statusText}`);
      }
      
      const data: SDKTablesResponse = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      logger.error('Failed to fetch SDK tables:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SDK tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SDK Tables
          </CardTitle>
          <CardDescription>
            Tables created by the AI Receptionist SDK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading tables...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SDK Tables
          </CardTitle>
          <CardDescription>
            Tables created by the AI Receptionist SDK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 py-4">
            <p>Error: {error}</p>
            <Button onClick={fetchTables} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SDK Tables
            </CardTitle>
            <CardDescription>
              Tables created by the AI Receptionist SDK (ai_receptionist_*)
            </CardDescription>
          </div>
          <Button onClick={fetchTables} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <div className="text-gray-600 py-8 text-center">
            <p>No SDK tables found.</p>
            <p className="text-sm mt-2">Make sure the SDK has been initialized with database storage.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tables.map((table) => (
              <div key={table.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold font-mono">{table.name}</h3>
                  <Badge variant="secondary">
                    {table.rowCount.toLocaleString()} rows
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Column</th>
                        <th className="text-left p-2 font-semibold">Type</th>
                        <th className="text-left p-2 font-semibold">Nullable</th>
                        <th className="text-left p-2 font-semibold">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column) => (
                        <tr key={column.name} className="border-b">
                          <td className="p-2 font-mono">{column.name}</td>
                          <td className="p-2 text-gray-600">{column.type}</td>
                          <td className="p-2">
                            {column.nullable ? (
                              <Badge variant="outline">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </td>
                          <td className="p-2 text-gray-500 font-mono text-xs">
                            {column.default || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

