'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column, Filter, StatCard } from '@/components/customUI';
import { usePagination } from '@/components/customUI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, Eye, Edit, Trash2 } from 'lucide-react';
import { Strategy } from '@/types';
import logger from '@/lib/logger';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';
import Link from 'next/link';

export default function StrategiesPage() {
  const { getCurrentSubaccount } = useSubaccountFilter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use the pagination hook
  const {
    pagination,
    paginatedData,
    setCurrentPage,
    setTotalItems,
  } = usePagination(filteredStrategies, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: 'Total Strategies',
      value: strategies.length,
      icon: <Target className="h-8 w-8" />,
      color: 'text-blue-600',
    },
    {
      title: 'Active Strategies',
      value: strategies.filter(s => s.aiObjective === 'active').length,
      icon: <Target className="h-8 w-8" />,
      color: 'text-green-600',
    },
    {
      title: 'High Creativity',
      value: strategies.filter(s => (s.creativity ?? 0) >= 7).length,
      icon: <Target className="h-8 w-8" />,
      color: 'text-purple-600',
    },
    {
      title: 'Low Creativity',
      value: strategies.filter(s => (s.creativity ?? 0) <= 3).length,
      icon: <Target className="h-8 w-8" />,
      color: 'text-orange-600',
    },
  ];

  // Define columns
  const columns: Column<Strategy>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (strategy) => <span className="font-medium">{strategy.name}</span>,
    },
    {
      key: 'tag',
      header: 'Tag',
      render: (strategy) => (
        <Badge variant="outline">{strategy.tag}</Badge>
      ),
    },
    {
      key: 'tone',
      header: 'Tone',
      render: (strategy) => (
        <Badge variant={getToneBadgeVariant(strategy.tone ?? '')}>
          {strategy.tone}
        </Badge>
      ),
    },
    {
      key: 'creativity',
      header: 'Creativity',
      render: (strategy) => (
        <Badge variant={getCreativityBadgeVariant(strategy.creativity ?? 0)}>
          {strategy.creativity}/10
        </Badge>
      ),
    },
    {
      key: 'aiObjective',
      header: 'Objective',
      render: (strategy) => (
        <span className="max-w-xs truncate">
          {strategy.aiObjective}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (strategy) => formatDate(strategy.createdAt),
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'tag',
      label: 'Tag',
      type: 'select',
      options: [
        { value: 'sales', label: 'Sales' },
        { value: 'support', label: 'Support' },
        { value: 'onboarding', label: 'Onboarding' },
        { value: 'follow-up', label: 'Follow-up' },
      ],
    },
  ];

  const loadStrategies = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const currentSubaccount = getCurrentSubaccount();
      const strategiesData = await api.strategies.getStrategies(
        currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
      );
      setStrategies(strategiesData);
      setFilteredStrategies(strategiesData);
      setTotalItems(strategiesData.length);
    } catch (error) {
      logger.error('Failed to load strategies:', error);
      setError('Failed to load strategies');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getCurrentSubaccount]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = strategies.filter(strategy =>
      strategy.name.toLowerCase().includes(term.toLowerCase()) ||
      strategy.tag?.toLowerCase().includes(term.toLowerCase()) ||
      strategy.tone?.toLowerCase().includes(term.toLowerCase()) ||
      strategy.aiObjective?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredStrategies(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = strategies;

    if (key === 'tag' && value !== 'all') {
      filtered = filtered.filter(strategy => strategy.tag === value);
    }

    setFilteredStrategies(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = (strategy: Strategy) => {
    // Strategy details are shown in a dialog
    console.log('View strategy:', strategy);
  };

  const handleEdit = (strategy: Strategy) => {
    // Navigate to edit page
    window.location.href = `/admin/strategies/${strategy.id}/edit`;
  };

  const handleDelete = async (strategy: Strategy) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      try {
        setError(null);
        await api.strategies.deleteStrategy(strategy.id);
        setSuccess('Strategy deleted successfully');
        loadStrategies();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error('Failed to delete strategy:', error);
        setError('Failed to delete strategy. Please try again.');
      }
    }
  };

  const handleCreate = () => {
    window.location.href = '/admin/strategies/new';
  };

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const getCreativityBadgeVariant = (creativity: number) => {
    if (creativity >= 8) return 'default';
    if (creativity >= 5) return 'secondary';
    return 'outline';
  };

  const getToneBadgeVariant = (tone: string) => {
    switch (tone?.toLowerCase()) {
      case 'professional':
        return 'default';
      case 'friendly':
        return 'secondary';
      case 'casual':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return 'N/A';
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DataTable
      data={paginatedData}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      columns={columns}
      title="Strategy Management"
      description="A list of all your AI conversation strategies"
      searchPlaceholder="Search strategies..."
      filters={filters}
      onSearchChange={handleSearch}
      onFilterChange={handleFilter}
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        onPageChange: setCurrentPage,
      }}
      onCreateClick={handleCreate}
      onRefresh={loadStrategies}
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      stats={stats}
      error={error}
      success={success}
    />
  );
} 