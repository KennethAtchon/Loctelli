'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { BulkActions } from './bulk-actions';

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
  type: 'select' | 'text' | 'date';
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
  
  // Bulk actions
  bulkActions?: {
    onBulkDelete?: (items: T[]) => Promise<void>;
    onBulkUpdate?: (items: T[], field: string, value: string | number | boolean) => Promise<void>;
    updateFields?: Array<{ value: string; label: string; type: 'text' | 'select' }>;
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
  bulkActions,
  stats,
  headerActions,
  emptyState,
  error,
  success
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    onFilterChange?.(key, value);
  };

  // Handle item selection
  const handleItemSelect = (item: T, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
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
    <div className="text-center py-8">
      <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
        {/* You can customize this icon */}
      </div>
      <p className="text-gray-500">
        {searchTerm || Object.values(filterValues).some(v => v !== 'all' && v !== '')
          ? 'No items match your search criteria' 
          : 'No items found. Add your first item to get started.'
        }
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <div className={`h-8 w-8 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.title}</div>
                    {stat.description && (
                      <div className="text-xs text-gray-500">{stat.description}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      {(onSearchChange || filters.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {onSearchChange && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              {filters.map((filter) => (
                <div key={filter.key}>
                  {filter.type === 'select' ? (
                    <select
                      value={filterValues[filter.key] || 'all'}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
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
      <Card>
        <CardHeader>
          <CardTitle>{title} ({data.length})</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
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
                          checked={data.length > 0 && selectedItems.length === data.length}
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
                            checked={selectedItems.some(i => i.id === item.id)}
                            onChange={(e) => handleItemSelect(item, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      {/* Data cells */}
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.render ? column.render(item) : (item as any)[column.key]}
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
                              >
                                View
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(item)}
                              >
                                Edit
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(item)}
                              >
                                Delete
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
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                          className={pagination.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                          onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                          className={pagination.currentPage >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Pagination info */}
                  <div className="text-center text-sm text-gray-600 mt-2">
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                    {pagination.totalItems} items
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