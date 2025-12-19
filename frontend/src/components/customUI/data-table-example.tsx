"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/api/endpoints/admin-auth";
import { DataTable, Column, Filter, StatCard } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react";
import { useTenant } from "@/contexts/tenant-context";
import { usePagination } from "./use-pagination";

// Example of how to refactor the Users page using the new DataTable component
export function UsersTableExample() {
  const { adminFilter } = useTenant();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Use the pagination hook
  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredUsers, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: "Total Users",
      value: users.length,
      icon: <Users className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: users.filter((u) => u.isActive).length,
      icon: <UserCheck className="h-8 w-8" />,
      color: "text-green-600",
    },
    {
      title: "Inactive Users",
      value: users.filter((u) => !u.isActive).length,
      icon: <UserX className="h-8 w-8" />,
      color: "text-red-600",
    },
    {
      title: "Admin Users",
      value: users.filter((u) => u.role === "admin").length,
      icon: <UserPlus className="h-8 w-8" />,
      color: "text-purple-600",
    },
  ];

  // Define columns
  const columns: Column<UserProfile>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (user) => user.company || "-",
    },
    {
      key: "isActive",
      header: "Status",
      render: (user) => (
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "bookingEnabled",
      header: "Booking",
      render: (user) => (
        <Badge variant={user.bookingEnabled ? "default" : "secondary"}>
          {user.bookingEnabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      render: (user) =>
        user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never",
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "user", label: "User" },
        { value: "manager", label: "Manager" },
        { value: "admin", label: "Admin" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError("");
      const usersData = await api.adminAuth.getAllUsers(
        adminFilter ?? undefined,
      );
      setUsers(usersData);
      setFilteredUsers(usersData);
      setTotalItems(usersData.length);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminFilter, setTotalItems]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.company?.toLowerCase().includes(term.toLowerCase()),
    );
    setFilteredUsers(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = users;

    if (key === "role" && value !== "all") {
      filtered = filtered.filter((user) => user.role === value);
    }

    if (key === "status" && value !== "all") {
      const isActive = value === "active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = (user: UserProfile) => {
    // Implement view logic
    console.log("View user:", user);
  };

  const handleEdit = (user: UserProfile) => {
    // Implement edit logic
    console.log("Edit user:", user);
  };

  const handleDelete = (user: UserProfile) => {
    // Implement delete logic
    console.log("Delete user:", user);
  };

  const handleCreate = () => {
    // Implement create logic
    console.log("Create user");
  };

  // Load data on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Helper functions
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

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
      title="User Management"
      description="Manage all users in the system"
      searchPlaceholder="Search users..."
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
      onRefresh={loadUsers}
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
      stats={stats}
      error={error}
      success={success}
    />
  );
}
