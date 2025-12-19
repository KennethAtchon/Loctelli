"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Target, Eye, Edit, Trash2 } from "lucide-react";
import { Strategy } from "@/types";
import logger from "@/lib/logger";
import { useTenant } from "@/contexts/tenant-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StrategiesPage() {
  const router = useRouter();
  const { getTenantQueryParams } = useTenant();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use the pagination hook
  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredStrategies, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: "Total Strategies",
      value: strategies.length,
      icon: <Target className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "Active Strategies",
      value: strategies.filter((s) => s.isActive).length,
      icon: <Target className="h-8 w-8" />,
      color: "text-green-600",
    },
  ];

  // Define columns
  const columns: Column<Strategy>[] = [
    {
      key: "name",
      header: "Name",
      render: (strategy) => (
        <div className="flex flex-col">
          <span className="font-medium">{strategy.name}</span>
          {strategy.description && (
            <span className="text-xs text-gray-500 truncate max-w-xs">
              {strategy.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "aiName",
      header: "AI Persona",
      render: (strategy) => (
        <div className="flex flex-col">
          <span className="font-medium">{strategy.aiName}</span>
          {strategy.tag && (
            <Badge variant="outline" className="mt-1 w-fit text-xs">
              {strategy.tag}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "conversationTone",
      header: "Tone",
      render: (strategy) => (
        <span className="text-sm truncate max-w-xs block">
          {strategy.conversationTone
            ? strategy.conversationTone.substring(0, 60) + "..."
            : "Not set"}
        </span>
      ),
    },
    {
      key: "industryContext",
      header: "Industry",
      render: (strategy) => (
        <span className="text-sm truncate">
          {strategy.industryContext || "General"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (strategy) => (
        <Badge variant={strategy.isActive ? "default" : "secondary"}>
          {strategy.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (strategy) => formatDate(strategy.createdAt),
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: "tag",
      label: "Tag",
      type: "select",
      options: [
        { value: "sales", label: "Sales" },
        { value: "support", label: "Support" },
        { value: "onboarding", label: "Onboarding" },
        { value: "follow-up", label: "Follow-up" },
      ],
    },
  ];

  const loadStrategies = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Use tenant context for automatic filtering
      const queryParams = getTenantQueryParams();
      logger.debug("Loading strategies with tenant params:", queryParams);

      const strategiesData = await api.strategies.getStrategies(queryParams);
      setStrategies(strategiesData);
      setFilteredStrategies(strategiesData);
      setTotalItems(strategiesData.length);
    } catch (error) {
      logger.error("Failed to load strategies:", error);
      setError("Failed to load strategies");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getTenantQueryParams]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = strategies.filter(
      (strategy) =>
        strategy.name.toLowerCase().includes(term.toLowerCase()) ||
        strategy.tag?.toLowerCase().includes(term.toLowerCase()) ||
        strategy.aiName?.toLowerCase().includes(term.toLowerCase()) ||
        strategy.description?.toLowerCase().includes(term.toLowerCase()) ||
        strategy.industryContext?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredStrategies(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = strategies;

    if (key === "tag" && value !== "all") {
      filtered = filtered.filter((strategy) => strategy.tag === value);
    }

    setFilteredStrategies(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = (strategy: Strategy) => {
    // Navigate to strategy details page
    router.push(`/admin/strategies/${strategy.id}`);
  };

  const handleEdit = (strategy: Strategy) => {
    // Navigate to edit page
    router.push(`/admin/strategies/${strategy.id}/edit`);
  };

  const handleDelete = async (strategy: Strategy) => {
    if (confirm("Are you sure you want to delete this strategy?")) {
      try {
        setError(null);
        await api.strategies.deleteStrategy(strategy.id);
        setSuccess("Strategy deleted successfully");
        loadStrategies();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error("Failed to delete strategy:", error);
        setError("Failed to delete strategy. Please try again.");
      }
    }
  };

  const handleCreate = () => {
    router.push("/admin/strategies/new");
  };

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
