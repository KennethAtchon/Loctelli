"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateUserDto, UpdateUserDto } from "@/lib/api";
import type { UserProfile, DetailedUser } from "@/lib/api/endpoints/admin-auth";
import type { SubAccount } from "@/lib/api/endpoints/admin-subaccounts";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import logger from "@/lib/logger";
import { useTenant } from "@/contexts/tenant-context";
import { useTenantQuery, useTenantQueryKey } from "@/hooks/useTenantQuery";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";

const USERS_STALE_MS = 2 * 60 * 1000; // 2 min

export default function UsersPage() {
  const { availableSubaccounts } = useTenant();
  const queryClient = useQueryClient();
  const { getTenantQueryKey } = useTenantQueryKey();

  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);

  const usersQuery = useTenantQuery({
    queryKey: ["users"],
    queryFn: async ({ subAccountId }) =>
      api.adminAuth.getAllUsers(
        subAccountId != null ? String(subAccountId) : undefined
      ),
    staleTime: USERS_STALE_MS,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  // Use the pagination hook
  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredUsers, { pageSize: 5 });

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

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: getTenantQueryKey(["users"]) });
  };

  const createUserMutation = useMutation({
    mutationFn: (formData: CreateUserDto) => api.adminAuth.createUser(formData),
    onSuccess: () => {
      setError("");
      setSuccess("User created successfully");
      setIsCreateDialogOpen(false);
      setTimeout(() => setSuccess(""), 3000);
      invalidateUsers();
    },
    onError: (err) => {
      logger.error("Failed to create user", err);
      setError("Failed to create user. Please try again.");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: UpdateUserDto }) =>
      api.adminAuth.updateUser(id, formData),
    onSuccess: () => {
      setError("");
      setSuccess("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setTimeout(() => setSuccess(""), 3000);
      invalidateUsers();
    },
    onError: (err) => {
      logger.error("Failed to update user", err);
      setError("Failed to update user. Please try again.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.adminAuth.deleteUser(userId),
    onSuccess: () => {
      setError("");
      setSuccess("User deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
      invalidateUsers();
    },
    onError: (err) => {
      logger.error("Failed to delete user", err);
      setError("Failed to delete user. Please try again.");
    },
  });

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.company?.toLowerCase().includes(term.toLowerCase())
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
  const handleView = async (user: UserProfile) => {
    try {
      const detailedUser = await api.adminAuth.getDetailedUser(user.id);
      setSelectedUser(detailedUser);
    } catch (error) {
      logger.error("Failed to load user details:", error);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setError("");
    deleteUserMutation.mutate(user.id);
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateUser = async (formData: CreateUserDto) => {
    setError("");
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = async (id: number, formData: UpdateUserDto) => {
    setError("");
    updateUserMutation.mutate({ id, formData });
  };

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
    <>
      <DataTable
        data={paginatedData}
        isLoading={usersQuery.isLoading}
        isRefreshing={usersQuery.isFetching}
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
        onRefresh={() => usersQuery.refetch()}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        stats={stats}
        error={error || (usersQuery.error ? "Failed to load users" : null)}
        success={success}
      />

      {/* User Details Dialog */}
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
              {/* Basic Information */}
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

              {/* Integration Details */}
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

              {/* Timestamps */}
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

              {/* Created By Admin */}
              <div>
                <h3 className="font-semibold mb-3">Created By Admin</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedUser.createdByAdmin ? (
                    <>
                      <div>
                        <strong>Admin ID:</strong>{" "}
                        {selectedUser.createdByAdmin.id}
                      </div>
                      <div>
                        <strong>Admin Name:</strong>{" "}
                        {selectedUser.createdByAdmin.name}
                      </div>
                      <div>
                        <strong>Admin Email:</strong>{" "}
                        {selectedUser.createdByAdmin.email}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-gray-500 italic">
                      Admin account has been deleted
                    </div>
                  )}
                </div>
              </div>

              {/* Strategies */}
              {selectedUser.strategies &&
                selectedUser.strategies.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Strategies ({selectedUser.strategies.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedUser.strategies.map((strategy) => (
                        <div key={strategy.id} className="p-2 border rounded">
                          <div className="font-medium">{strategy.name}</div>
                          <div className="text-sm text-gray-600">
                            Tag: {strategy.tag || "N/A"} | Tone:{" "}
                            {strategy.tone || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Leads */}
              {selectedUser.leads && selectedUser.leads.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Leads ({selectedUser.leads.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.leads.map((lead) => (
                      <div key={lead.id} className="p-2 border rounded">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-600">
                          Email: {lead.email || "N/A"} | Status: {lead.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Availability */}
              {selectedUser.bookingEnabled && selectedUser.bookingsTime && (
                <div>
                  <h3 className="font-semibold mb-3">Booking Availability</h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedUser.bookingsTime) ? (
                      selectedUser.bookingsTime.map(
                        (
                          timeSlot: {
                            date: string;
                            slots: string[];
                          },
                          index: number
                        ) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium text-sm mb-2">
                              {new Date(timeSlot.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {timeSlot.slots && timeSlot.slots.length > 0 ? (
                                timeSlot.slots.map(
                                  (slot: string, slotIndex: number) => (
                                    <Badge
                                      key={slotIndex}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {slot}
                                    </Badge>
                                  )
                                )
                              ) : (
                                <span className="text-sm text-gray-500 italic">
                                  No slots available
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No booking availability data
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bookings */}
              {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Bookings ({selectedUser.bookings.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.bookings.map((booking) => (
                      <div key={booking.id} className="p-2 border rounded">
                        <div className="font-medium">{booking.bookingType}</div>
                        <div className="text-sm text-gray-600">
                          Status: {booking.status} | Created:{" "}
                          {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Dialogs */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
        availableSubaccounts={availableSubaccounts as unknown as SubAccount[]}
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
