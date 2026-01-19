"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
} from "lucide-react";
import { BulkActions } from "./bulk-actions";

// Column definition interface
export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

// Filter definition interface
export interface Filter {
  key: string;
  label: string;
  type: "select" | "text" | "date";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Stats card interface
export interface StatCard {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  description?: string;
}

// DataTable props interface
export interface DataTableProps<T extends { id: number | string }> {
  // Data and loading
  data: T[];
  isLoading?: boolean;
  isRefreshing?: boolean;

  // Table configuration
  columns: Column<T>[];
  title: string;
  description?: string;

  // Search and filters
  searchPlaceholder?: string;
  filters?: Filter[];
  onSearchChange?: (term: string) => void;
  onFilterChange?: (key: string, value: string) => void;

  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };

  // Actions
  onCreateClick?: () => void;
  onRefresh?: () => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  hideCreateButton?: boolean;

  // Bulk actions
  bulkActions?: {
    onBulkDelete?: (items: T[]) => Promise<void>;
    onBulkUpdate?: (
      items: T[],
      field: string,
      value: string | number | boolean
    ) => Promise<void>;
    updateFields?: Array<{
      value: string;
      label: string;
      type: "text" | "select";
    }>;
    selectOptions?: Array<{ value: string; label: string }>;
  };

  // Stats
  stats?: StatCard[];

  // Custom elements
  headerActions?: ReactNode;
  emptyState?: ReactNode;

  // Error handling
  error?: string | null;
  success?: string | null;
}

export function DataTable<T extends { id: number | string }>({
  data,
  isLoading = false,
  isRefreshing = false,
  columns,
  title,
  description,
  searchPlaceholder = "Search...",
  filters = [],
  onSearchChange,
  onFilterChange,
  pagination,
  onCreateClick,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  hideCreateButton = false,
  bulkActions,
  stats,
  headerActions,
  emptyState,
  error,
  success,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    onFilterChange?.(key, value);
  };

  // Handle item selection
  const handleItemSelect = (item: T, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems([...data]);
    } else {
      setSelectedItems([]);
    }
  };

  // Clear selections when data changes
  useEffect(() => {
    setSelectedItems([]);
  }, [data]);

  // Default empty state
  const defaultEmptyState = (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
          <Search className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {searchTerm ||
          Object.values(filterValues).some((v) => v !== "all" && v !== "")
            ? "No matches found"
            : "No items found"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {searchTerm ||
          Object.values(filterValues).some((v) => v !== "all" && v !== "")
            ? "Try adjusting your search criteria or filters to find what you're looking for."
            : "Get started by creating your first item."}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {description}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-start lg:justify-end">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-slate-600 border-gray-200/60 dark:border-slate-600/60 transition-all duration-200 dark:text-gray-200"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {onCreateClick && !hideCreateButton && (
            <Button
              onClick={onCreateClick}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const colorMap: Record<
              string,
              {
                bg: string;
                icon: string;
                text: string;
                hover: string;
              }
            > = {
              "text-blue-600": {
                bg: "from-blue-50 via-white to-blue-50/50",
                icon: "bg-blue-100 group-hover:bg-blue-200",
                text: "group-hover:text-blue-700 dark:group-hover:text-blue-400",
                hover: "hover:shadow-blue-100/50",
              },
              "text-green-600": {
                bg: "from-emerald-50 via-white to-emerald-50/50",
                icon: "bg-emerald-100 group-hover:bg-emerald-200",
                text: "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
                hover: "hover:shadow-emerald-100/50",
              },
              "text-red-600": {
                bg: "from-red-50 via-white to-red-50/50",
                icon: "bg-red-100 group-hover:bg-red-200",
                text: "group-hover:text-red-700 dark:group-hover:text-red-400",
                hover: "hover:shadow-red-100/50",
              },
              "text-purple-600": {
                bg: "from-purple-50 via-white to-purple-50/50",
                icon: "bg-purple-100 group-hover:bg-purple-200",
                text: "group-hover:text-purple-700 dark:group-hover:text-purple-400",
                hover: "hover:shadow-purple-100/50",
              },
            };
            const colors = colorMap[stat.color] || colorMap["text-blue-600"];

            return (
              <Card
                key={index}
                className={`group relative overflow-hidden bg-gradient-to-br ${colors.bg} dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-gray-200/60 dark:border-slate-600/60 hover:shadow-xl ${colors.hover} dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div
                        className={`text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 ${stat.color}`}
                      >
                        {stat.value}
                      </div>
                      <div
                        className={`text-sm font-semibold text-gray-700 dark:text-gray-300 ${colors.text} transition-colors`}
                      >
                        {stat.title}
                      </div>
                      {stat.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {stat.description}
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-2 rounded-lg transition-colors ${colors.icon}`}
                    >
                      <div className={`${stat.color}`}>{stat.icon}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search and Filters */}
      {(onSearchChange || filters.length > 0) && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-slate-700">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {onSearchChange && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-slate-700/50 border-gray-200/60 dark:border-slate-600/60 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              {filters.map((filter) => (
                <div key={filter.key}>
                  {filter.type === "select" ? (
                    <select
                      value={filterValues[filter.key] || "all"}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-gray-200/60 dark:border-slate-600/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All {filter.label}</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="bg-white/50 dark:bg-slate-700/50 border-gray-200/60 dark:border-slate-600/60 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {bulkActions && selectedItems.length > 0 && (
        <BulkActions
          items={data}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onBulkDelete={bulkActions.onBulkDelete}
          onBulkUpdate={bulkActions.onBulkUpdate}
          updateFields={bulkActions.updateFields}
          selectOptions={bulkActions.selectOptions}
        />
      )}

      {/* Table */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {title} ({data.length})
          </CardTitle>
          {description && (
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Selection checkbox */}
                    {bulkActions && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            data.length > 0 &&
                            selectedItems.length === data.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                    )}
                    {/* Column headers */}
                    {columns.map((column) => (
                      <TableHead key={column.key} className={column.className}>
                        {column.header}
                      </TableHead>
                    ))}
                    {/* Actions column */}
                    {(onView || onEdit || onDelete) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      {/* Selection checkbox */}
                      {bulkActions && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.some(
                              (i) => i.id === item.id
                            )}
                            onChange={(e) =>
                              handleItemSelect(item, e.target.checked)
                            }
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      {/* Data cells */}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={column.className}
                        >
                          {column.render
                            ? column.render(item)
                            : String(
                                (item as Record<string, unknown>)[column.key] ??
                                  ""
                              )}
                        </TableCell>
                      ))}
                      {/* Action buttons */}
                      {(onView || onEdit || onDelete) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(item)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="bg-white/80 hover:bg-gray-50 border-gray-200/60"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(item)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalItems > 0 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            pagination.onPageChange(pagination.currentPage - 1)
                          }
                          className={
                            pagination.currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => pagination.onPageChange(page)}
                            isActive={page === pagination.currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            pagination.onPageChange(pagination.currentPage + 1)
                          }
                          className={
                            pagination.currentPage >= pagination.totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  {/* Pagination info */}
                  <div className="text-center text-sm text-gray-600 mt-2">
                    {pagination.totalItems > 0 ? (
                      <>
                        Showing{" "}
                        {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
                        to{" "}
                        {Math.min(
                          pagination.currentPage * pagination.pageSize,
                          pagination.totalItems
                        )}{" "}
                        of {pagination.totalItems} items
                      </>
                    ) : (
                      "No items to display"
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            emptyState || defaultEmptyState
          )}
        </CardContent>
      </Card>
    </div>
  );
}
