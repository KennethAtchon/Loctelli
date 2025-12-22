"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

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

interface TableDataResponse {
  data: Record<string, unknown>[];
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SDKTablesResponse {
  tables: SDKTable[];
  count: number;
}

export default function SDKTables() {
  const [tables, setTables] = useState<SDKTable[]>([]);
  const [tableData, setTableData] = useState<Record<string, TableDataResponse>>(
    {}
  );
  const [tablePages, setTablePages] = useState<Record<string, number>>({});
  const [tablePageSizes, setTablePageSizes] = useState<Record<string, number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTables, setLoadingTables] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data: SDKTablesResponse = await api.get<SDKTablesResponse>(
        "/ai-receptionist/dev/tables"
      );
      const fetchedTables = data.tables || [];
      setTables(fetchedTables);

      // Initialize pagination state for each table
      const initialPages: Record<string, number> = {};
      const initialPageSizes: Record<string, number> = {};
      fetchedTables.forEach((table) => {
        initialPages[table.name] = 1;
        initialPageSizes[table.name] = 50;
      });
      setTablePages(initialPages);
      setTablePageSizes(initialPageSizes);

      // Fetch first page of data for each table
      fetchedTables.forEach((table) => {
        if (table.rowCount > 0) {
          fetchTableData(table.name, 1, 50);
        }
      });
    } catch (err) {
      logger.error("Failed to fetch SDK tables:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch SDK tables"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async (
    tableName: string,
    page: number,
    pageSize: number
  ) => {
    try {
      setLoadingTables((prev) => new Set(prev).add(tableName));

      const queryParams = api.buildQueryString({
        tableName,
        page,
        pageSize,
      });
      const data: TableDataResponse = await api.get<TableDataResponse>(
        `/ai-receptionist/dev/table-data?${queryParams}`
      );
      setTableData((prev) => ({ ...prev, [tableName]: data }));
    } catch (err) {
      logger.error(`Failed to fetch data for table ${tableName}:`, err);
    } finally {
      setLoadingTables((prev) => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    }
  };

  const handlePageChange = (tableName: string, newPage: number) => {
    const pageSize = tablePageSizes[tableName] || 50;
    setTablePages((prev) => ({ ...prev, [tableName]: newPage }));
    fetchTableData(tableName, newPage, pageSize);
  };

  const handlePageSizeChange = (tableName: string, newPageSize: number) => {
    setTablePageSizes((prev) => ({ ...prev, [tableName]: newPageSize }));
    setTablePages((prev) => ({ ...prev, [tableName]: 1 }));
    fetchTableData(tableName, 1, newPageSize);
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <p className="text-sm mt-2">
              Make sure the SDK has been initialized with database storage.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tables.map((table) => (
              <div key={table.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold font-mono">
                    {table.name}
                  </h3>
                  <Badge variant="secondary">
                    {table.rowCount.toLocaleString()} rows
                  </Badge>
                </div>
                <div className="space-y-4">
                  {/* Schema Table */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">
                      Schema
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">
                              Column
                            </th>
                            <th className="text-left p-2 font-semibold">
                              Type
                            </th>
                            <th className="text-left p-2 font-semibold">
                              Nullable
                            </th>
                            <th className="text-left p-2 font-semibold">
                              Default
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((column) => (
                            <tr key={column.name} className="border-b">
                              <td className="p-2 font-mono">{column.name}</td>
                              <td className="p-2 text-gray-600">
                                {column.type}
                              </td>
                              <td className="p-2">
                                {column.nullable ? (
                                  <Badge variant="outline">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </td>
                              <td className="p-2 text-gray-500 font-mono text-xs">
                                {column.default || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Data Table */}
                  {table.rowCount > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Data
                        </h4>
                        <div className="flex items-center gap-2">
                          <select
                            value={tablePageSizes[table.name] || 50}
                            onChange={(e) =>
                              handlePageSizeChange(
                                table.name,
                                parseInt(e.target.value)
                              )
                            }
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                            <option value="100">100 per page</option>
                            <option value="250">250 per page</option>
                            <option value="500">500 per page</option>
                            <option value="1000">1000 per page</option>
                          </select>
                        </div>
                      </div>

                      {loadingTables.has(table.name) ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            Loading data...
                          </span>
                        </div>
                      ) : tableData[table.name] ? (
                        <>
                          <div className="overflow-x-auto border rounded">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b">
                                  {table.columns.map((column) => (
                                    <th
                                      key={column.name}
                                      className="text-left p-2 font-semibold"
                                    >
                                      {column.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData[table.name].data.map(
                                  (
                                    row: Record<string, unknown>,
                                    idx: number
                                  ) => (
                                    <tr
                                      key={idx}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      {table.columns.map((column) => {
                                        const value = row[column.name];
                                        let displayValue: string;

                                        if (
                                          value === null ||
                                          value === undefined
                                        ) {
                                          displayValue = "-";
                                        } else if (typeof value === "object") {
                                          displayValue = JSON.stringify(value);
                                        } else if (
                                          typeof value === "string" &&
                                          value.length > 100
                                        ) {
                                          displayValue =
                                            value.substring(0, 100) + "...";
                                        } else {
                                          displayValue = String(value);
                                        }

                                        return (
                                          <td
                                            key={column.name}
                                            className="p-2 font-mono text-xs max-w-xs truncate"
                                            title={displayValue}
                                          >
                                            {displayValue}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          {tableData[table.name].totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm text-gray-600">
                                Showing{" "}
                                {(tableData[table.name].page - 1) *
                                  tableData[table.name].pageSize +
                                  1}{" "}
                                to{" "}
                                {Math.min(
                                  tableData[table.name].page *
                                    tableData[table.name].pageSize,
                                  tableData[table.name].totalRows
                                )}{" "}
                                of{" "}
                                {tableData[
                                  table.name
                                ].totalRows.toLocaleString()}{" "}
                                rows
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePageChange(
                                      table.name,
                                      tableData[table.name].page - 1
                                    )
                                  }
                                  disabled={tableData[table.name].page === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600">
                                  Page {tableData[table.name].page} of{" "}
                                  {tableData[table.name].totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePageChange(
                                      table.name,
                                      tableData[table.name].page + 1
                                    )
                                  }
                                  disabled={
                                    tableData[table.name].page >=
                                    tableData[table.name].totalPages
                                  }
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-500 text-sm py-2">
                          Click refresh to load data
                        </div>
                      )}
                    </div>
                  )}

                  {table.rowCount === 0 && (
                    <div className="text-gray-500 text-sm py-2">
                      No data in this table
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
