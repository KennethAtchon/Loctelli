'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CreateUserDto, UpdateUserDto } from '@/lib/api';
import type { UserProfile, DetailedUser } from '@/lib/api/endpoints/admin-auth';
import type { SubAccount } from '@/lib/api/endpoints/admin-subaccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import logger from '@/lib/logger';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<number>(0);
  const [createFormData, setCreateFormData] = useState<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    company: '',
    role: 'user',
    bookingEnabled: 1,
  });
  const [editFormData, setEditFormData] = useState<UpdateUserDto>({
    name: '',
    email: '',
    role: 'user',
    company: '',
    isActive: true,
    bookingEnabled: 1,
  });

  const calculateStats = (usersData: UserProfile[]) => {
    const stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(u => u.isActive).length,
      inactiveUsers: usersData.filter(u => !u.isActive).length,
      adminUsers: usersData.filter(u => u.role === 'admin').length,
    };
    setStats(stats);
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError('');
      const usersData = await api.adminAuth.getAllUsers();
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      logger.error('Failed to load users', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadSubAccounts = useCallback(async () => {
    try {
      const subAccountsData = await api.adminSubAccounts.getAllSubAccounts();
      setSubAccounts(subAccountsData);
      if (subAccountsData.length > 0 && selectedSubAccountId === 0) {
        setSelectedSubAccountId(subAccountsData[0].id);
      }
    } catch (error) {
      logger.error('Failed to load SubAccounts', error);
    }
  }, [selectedSubAccountId]);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
    loadSubAccounts();
  }, [loadUsers, loadSubAccounts]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Cleanup success message on unmount
  useEffect(() => {
    return () => {
      setSuccess('');
      setError('');
    };
  }, []);

  const loadDetailedUser = async (userId: number) => {
    try {
      const user = await api.adminAuth.getDetailedUser(userId);
      setSelectedUser(user);
    } catch (error) {
      logger.error('Failed to load user details:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubAccountId === 0) {
      setError('Please select a SubAccount');
      return;
    }
    try {
      setError('');
      await api.adminAuth.createUser({
        ...createFormData,
        subAccountId: selectedSubAccountId,
      });
      setSuccess('User created successfully');
      setIsCreateDialogOpen(false);
      setCreateFormData({ name: '', email: '', password: '', company: '', role: 'user', bookingEnabled: 1 });
      loadUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      logger.error('Failed to create user', error);
      setError('Failed to create user. Please try again.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      setError('');
      await api.adminAuth.updateUser(editingUser.id, editFormData);
      setSuccess('User updated successfully');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({ name: '', email: '', role: 'user', company: '', isActive: true, bookingEnabled: 1 });
      loadUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      logger.error('Failed to update user', error);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setError('');
      await api.adminAuth.deleteUser(userId);
      setSuccess('User deleted successfully');
      loadUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      logger.error('Failed to delete user', error);
      setError('Failed to delete user. Please try again.');
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company || '',
      isActive: user.isActive,
      bookingEnabled: user.bookingEnabled || 1,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadUsers}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={createFormData.company}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={createFormData.role} onValueChange={(value) => setCreateFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subAccount">SubAccount *</Label>
                  <Select
                    value={selectedSubAccountId.toString()}
                    onValueChange={(value) => setSelectedSubAccountId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a SubAccount" />
                    </SelectTrigger>
                    <SelectContent>
                      {subAccounts.map((subAccount) => (
                        <SelectItem key={subAccount.id} value={subAccount.id.toString()}>
                          {subAccount.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="booking-enabled"
                    checked={createFormData.bookingEnabled === 1}
                    onCheckedChange={(checked) => setCreateFormData(prev => ({ ...prev, bookingEnabled: checked ? 1 : 0 }))}
                  />
                  <Label htmlFor="booking-enabled">Enable Booking Functionality</Label>
                </div>
                <Button type="submit" className="w-full">Create User</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
                <div className="text-sm text-gray-600">Inactive Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.adminUsers}</div>
                <div className="text-sm text-gray-600">Admin Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find specific users or filter by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, or company..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.company || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.bookingEnabled ? 'default' : 'secondary'}>
                        {user.bookingEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => loadDetailedUser(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>User Details - {user.name}</DialogTitle>
                              <DialogDescription>
                                Complete user information and related data
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && selectedUser.id === user.id && (
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                  <h3 className="font-semibold mb-3">Basic Information</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>ID:</strong> {selectedUser.id}</div>
                                    <div><strong>Name:</strong> {selectedUser.name}</div>
                                    <div><strong>Email:</strong> {selectedUser.email}</div>
                                    <div><strong>Role:</strong> {selectedUser.role}</div>
                                    <div><strong>Status:</strong> 
                                      <Badge variant={selectedUser.isActive ? "default" : "secondary"} className="ml-2">
                                        {selectedUser.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                    <div><strong>Company:</strong> {selectedUser.company || 'N/A'}</div>
                                    <div><strong>Budget:</strong> {selectedUser.budget || 'N/A'}</div>
                                    <div><strong>Booking Enabled:</strong> {selectedUser.bookingEnabled ? 'Yes' : 'No'}</div>
                                  </div>
                                </div>

                                {/* Integration Details */}
                                <div>
                                  <h3 className="font-semibold mb-3">Integration Details</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Calendar ID:</strong> {selectedUser.calendarId || 'N/A'}</div>
                                    <div><strong>Location ID:</strong> {selectedUser.locationId || 'N/A'}</div>
                                    <div><strong>Assigned User ID:</strong> {selectedUser.assignedUserId || 'N/A'}</div>
                                  </div>
                                </div>

                                {/* Timestamps */}
                                <div>
                                  <h3 className="font-semibold mb-3">Timestamps</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</div>
                                    <div><strong>Updated:</strong> {formatDate(selectedUser.updatedAt)}</div>
                                    <div><strong>Last Login:</strong> {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}</div>
                                  </div>
                                </div>

                                {/* Created By Admin */}
                                <div>
                                  <h3 className="font-semibold mb-3">Created By Admin</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {selectedUser.createdByAdmin ? (
                                      <>
                                        <div><strong>Admin ID:</strong> {selectedUser.createdByAdmin.id}</div>
                                        <div><strong>Admin Name:</strong> {selectedUser.createdByAdmin.name}</div>
                                        <div><strong>Admin Email:</strong> {selectedUser.createdByAdmin.email}</div>
                                      </>
                                    ) : (
                                      <div className="col-span-2 text-gray-500 italic">
                                        Admin account has been deleted
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Strategies */}
                                {selectedUser.strategies && selectedUser.strategies.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Strategies ({selectedUser.strategies.length})</h3>
                                    <div className="space-y-2">
                                      {selectedUser.strategies.map((strategy) => (
                                        <div key={strategy.id} className="p-2 border rounded">
                                          <div className="font-medium">{strategy.name}</div>
                                          <div className="text-sm text-gray-600">
                                            Tag: {strategy.tag || 'N/A'} | Tone: {strategy.tone || 'N/A'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Leads */}
                                {selectedUser.leads && selectedUser.leads.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Leads ({selectedUser.leads.length})</h3>
                                    <div className="space-y-2">
                                      {selectedUser.leads.map((lead) => (
                                        <div key={lead.id} className="p-2 border rounded">
                                          <div className="font-medium">{lead.name}</div>
                                          <div className="text-sm text-gray-600">
                                            Email: {lead.email || 'N/A'} | Status: {lead.status}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Bookings */}
                                {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Bookings ({selectedUser.bookings.length})</h3>
                                    <div className="space-y-2">
                                      {selectedUser.bookings.map((booking) => (
                                        <div key={booking.id} className="p-2 border rounded">
                                          <div className="font-medium">{booking.bookingType}</div>
                                          <div className="text-sm text-gray-600">
                                            Status: {booking.status} | Created: {formatDate(booking.createdAt)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users match your search criteria' 
                  : 'No users found. Add your first user to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={editFormData.company}
                onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-booking-enabled"
                checked={editFormData.bookingEnabled === 1}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, bookingEnabled: checked ? 1 : 0 }))}
              />
              <Label htmlFor="edit-booking-enabled">Enable Booking Functionality</Label>
            </div>
            <Button type="submit" className="w-full">Update User</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 