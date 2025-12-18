import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { CreateUserDto, UpdateUserDto } from "@/lib/api";
import type { UserProfile, DetailedUser } from "@/lib/api/endpoints/admin-auth";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
} from "lucide-react";
import { useTenant } from "@/contexts/tenant-context";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { getTenantQueryParams, adminFilter, availableSubaccounts } =
    useTenant();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);

  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredUsers, { pageSize: 5 });

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

  const loadUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError("");
      const usersData = await api.adminAuth.getAllUsers(
        adminFilter ?? undefined
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

  const handleSearch = (term: string) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.company?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

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
    setCurrentPage(1);
  };

  const handleView = async (user: UserProfile) => {
    try {
      const detailedUser = await api.adminAuth.getDetailedUser(user.id);
      setSelectedUser(detailedUser);
    } catch (error) {
      console.error("Failed to load user details:", error);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setError("");
      await api.adminAuth.deleteUser(user.id);
      setSuccess("User deleted successfully");
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to delete user", error);
      setError("Failed to delete user. Please try again.");
    }
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateUser = async (formData: CreateUserDto) => {
    try {
      setError("");
      await api.adminAuth.createUser(formData);
      setSuccess("User created successfully");
      setIsCreateDialogOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to create user", error);
      setError("Failed to create user. Please try again.");
    }
  };

  const handleUpdateUser = async (id: number, formData: UpdateUserDto) => {
    try {
      setError("");
      await api.adminAuth.updateUser(id, formData);
      setSuccess("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to update user", error);
      setError("Failed to update user. Please try again.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
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

      {selectedUser && (
        <Dialog
          open={!!selectedUser}
          onOpenChange={() => setSelectedUser(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser.name}</DialogTitle>
              <DialogDescription>
                Complete user information and related data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID:</strong> {selectedUser.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {selectedUser.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedUser.email}
                  </div>
                  <div>
                    <strong>Role:</strong> {selectedUser.role}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge
                      variant={selectedUser.isActive ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <strong>Company:</strong> {selectedUser.company || "N/A"}
                  </div>
                  <div>
                    <strong>Budget:</strong> {selectedUser.budget || "N/A"}
                  </div>
                  <div>
                    <strong>Booking Enabled:</strong>{" "}
                    {selectedUser.bookingEnabled ? "Yes" : "No"}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Integration Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Calendar ID:</strong>{" "}
                    {selectedUser.calendarId || "N/A"}
                  </div>
                  <div>
                    <strong>Location ID:</strong>{" "}
                    {selectedUser.locationId || "N/A"}
                  </div>
                  <div>
                    <strong>Assigned User ID:</strong>{" "}
                    {selectedUser.assignedUserId || "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedUser.createdAt)}
                  </div>
                  <div>
                    <strong>Updated:</strong>{" "}
                    {formatDate(selectedUser.updatedAt)}
                  </div>
                  <div>
                    <strong>Last Login:</strong>{" "}
                    {selectedUser.lastLoginAt
                      ? formatDate(selectedUser.lastLoginAt)
                      : "Never"}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
        availableSubaccounts={availableSubaccounts}
      />

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        onSubmit={handleUpdateUser}
      />
    </>
  );
}
