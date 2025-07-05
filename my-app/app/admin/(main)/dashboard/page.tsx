'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Target, Calendar, RefreshCw, Plus, Eye, Building } from 'lucide-react';
import { DashboardStats, SystemStatus } from '@/lib/api/endpoints/admin-auth';
import Link from 'next/link';
import logger from '@/lib/logger';

interface DetailedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  company?: string;
  budget?: string;
  bookingsTime?: unknown;
  bookingEnabled: number;
  calendarId?: string;
  locationId?: string;
  assignedUserId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByAdminId?: number;
  createdByAdmin?: {
    id: number;
    name: string;
    email: string;
  };
  strategies?: Array<{
    id: number;
    name: string;
    tag?: string;
    tone?: string;
  }>;
  clients?: Array<{
    id: number;
    name: string;
    email?: string;
    status: string;
  }>;
  bookings?: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
  }>;
}

interface DetailedClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  status: string;
  notes?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  strategy?: {
    id: number;
    name: string;
    tag?: string;
  };
  bookings?: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentClients, setRecentClients] = useState<DetailedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [selectedClient, setSelectedClient] = useState<DetailedClient | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const [dashboardStats, status, clients] = await Promise.all([
        api.adminAuth.getDashboardStats(),
        api.adminAuth.getSystemStatus(),
        api.adminAuth.getRecentClients()
      ]);
      setStats(dashboardStats);
      setSystemStatus(status);
      setRecentClients(clients);
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadDetailedUser = async (userId: number) => {
    try {
      const user = await api.adminAuth.getDetailedUser(userId);
      setSelectedUser(user);
    } catch (error) {
      logger.error('Failed to load user details:', error);
    }
  };

  const loadDetailedClient = async (clientId: number) => {
    try {
      const client = await api.adminAuth.getDetailedClient(clientId);
      setSelectedClient(client);
    } catch (error) {
      logger.error('Failed to load client details:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'available':
        return 'default';
      case 'error':
      case 'disconnected':
        return 'destructive';
      default:
        return 'secondary';
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !systemStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your system</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.growthRates.users >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.growthRates.users >= 0 ? "+" : ""}{stats.growthRates.users}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.growthRates.activeUsers >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.growthRates.activeUsers >= 0 ? "+" : ""}{stats.growthRates.activeUsers}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/strategies'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStrategies}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.growthRates.strategies >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.growthRates.strategies >= 0 ? "+" : ""}{stats.growthRates.strategies}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/bookings'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.growthRates.bookings >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.growthRates.bookings >= 0 ? "+" : ""}{stats.growthRates.bookings}%
              </span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Latest users who joined the platform
              </CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.company && (
                        <p className="text-xs text-gray-400">{user.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => loadDetailedUser(user.id)}
                          >
                            <Eye className="h-3 w-3" />
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

                              {/* Clients */}
                              {selectedUser.clients && selectedUser.clients.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-3">Clients ({selectedUser.clients.length})</h3>
                                  <div className="space-y-2">
                                    {selectedUser.clients.map((client) => (
                                      <div key={client.id} className="p-2 border rounded">
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-sm text-gray-600">
                                          Email: {client.email || 'N/A'} | Status: {client.status}
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>
                Latest clients added to the platform
              </CardDescription>
            </div>
            <Link href="/admin/clients">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-4 p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center">
                      <Building className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email || 'No email'}</p>
                      {client.company && (
                        <p className="text-xs text-gray-400">{client.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{client.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => loadDetailedClient(client.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Client Details - {client.name}</DialogTitle>
                            <DialogDescription>
                              Complete client information and related data
                            </DialogDescription>
                          </DialogHeader>
                          {selectedClient && selectedClient.id === client.id && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div>
                                <h3 className="font-semibold mb-3">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>ID:</strong> {selectedClient.id}</div>
                                  <div><strong>Name:</strong> {selectedClient.name}</div>
                                  <div><strong>Email:</strong> {selectedClient.email || 'N/A'}</div>
                                  <div><strong>Phone:</strong> {selectedClient.phone || 'N/A'}</div>
                                  <div><strong>Company:</strong> {selectedClient.company || 'N/A'}</div>
                                  <div><strong>Position:</strong> {selectedClient.position || 'N/A'}</div>
                                  <div><strong>Custom ID:</strong> {selectedClient.customId || 'N/A'}</div>
                                  <div><strong>Status:</strong> 
                                    <Badge variant="outline" className="ml-2">{selectedClient.status}</Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Timestamps */}
                              <div>
                                <h3 className="font-semibold mb-3">Timestamps</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Created:</strong> {formatDate(selectedClient.createdAt)}</div>
                                  <div><strong>Updated:</strong> {formatDate(selectedClient.updatedAt)}</div>
                                  <div><strong>Last Message:</strong> {selectedClient.lastMessageDate ? formatDate(selectedClient.lastMessageDate) : 'No messages'}</div>
                                </div>
                              </div>

                              {/* Notes */}
                              {selectedClient.notes && (
                                <div>
                                  <h3 className="font-semibold mb-3">Notes</h3>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedClient.notes}</p>
                                </div>
                              )}

                              {/* Last Message */}
                              {selectedClient.lastMessage && (
                                <div>
                                  <h3 className="font-semibold mb-3">Last Message</h3>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedClient.lastMessage}</p>
                                </div>
                              )}

                              {/* Assigned User */}
                              {selectedClient.user && (
                                <div>
                                  <h3 className="font-semibold mb-3">Assigned User</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>User ID:</strong> {selectedClient.user.id}</div>
                                    <div><strong>User Name:</strong> {selectedClient.user.name}</div>
                                    <div><strong>User Email:</strong> {selectedClient.user.email}</div>
                                  </div>
                                </div>
                              )}

                              {/* Assigned Strategy */}
                              {selectedClient.strategy && (
                                <div>
                                  <h3 className="font-semibold mb-3">Assigned Strategy</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Strategy ID:</strong> {selectedClient.strategy.id}</div>
                                    <div><strong>Strategy Name:</strong> {selectedClient.strategy.name}</div>
                                    <div><strong>Strategy Tag:</strong> {selectedClient.strategy.tag || 'N/A'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Bookings */}
                              {selectedClient.bookings && selectedClient.bookings.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-3">Bookings ({selectedClient.bookings.length})</h3>
                                  <div className="space-y-2">
                                    {selectedClient.bookings.map((booking) => (
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent clients</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">Database</span>
              <Badge variant={getStatusBadgeVariant(systemStatus.database)}>
                {systemStatus.database}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">API Server</span>
              <Badge variant={getStatusBadgeVariant(systemStatus.apiServer)}>
                {systemStatus.apiServer}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">Redis Cache</span>
              <Badge variant={getStatusBadgeVariant(systemStatus.redisCache)}>
                {systemStatus.redisCache}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">File Storage</span>
              <Badge variant={getStatusBadgeVariant(systemStatus.fileStorage)}>
                {systemStatus.fileStorage}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 