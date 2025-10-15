'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Target, Calendar, RefreshCw, Plus, Eye, Building, Globe, Code, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { DashboardStats, SystemStatus, DetailedLead } from '@/lib/api/endpoints/admin-auth';
import Link from 'next/link';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';
import { LeadDetailsContent } from '@/components/admin/lead-details-content';

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
  } | null;
  strategies?: Array<{
    id: number;
    name: string;
    tag?: string;
    tone?: string;
  }>;
  leads?: Array<{
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

export default function AdminDashboardPage() {
  const { adminFilter, isGlobalView, getCurrentSubaccount } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentLeads, setRecentLeads] = useState<DetailedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Use tenant context - adminFilter is compatible with the API
      logger.debug('Loading dashboard with tenant filter:', adminFilter);

      const [dashboardStats, status, leads] = await Promise.all([
        api.adminAuth.getDashboardStats(adminFilter ?? undefined),
        api.adminAuth.getSystemStatus(),
        api.adminAuth.getRecentLeads(adminFilter ?? undefined)
      ]);
      setStats(dashboardStats);
      setSystemStatus(status);
      setRecentLeads(leads);
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Cleanup error state on unmount
  useEffect(() => {
    return () => {
      setError(null);
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

  const loadDetailedLead = async (leadId: number) => {
    try {
      const lead = await api.adminAuth.getDetailedLead(leadId);
      setSelectedLead(lead);
    } catch (error) {
      logger.error('Failed to load lead details:', error);
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

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return 'N/A';

    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    // Check if the date is valid
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

  if (!stats || !systemStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="p-0 h-auto text-destructive underline ml-2"
              onClick={loadDashboardData}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            {!isGlobalView && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-full shadow-sm">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {getCurrentSubaccount?.()?.name}
                </span>
              </div>
            )}
            {isGlobalView && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/60 rounded-full shadow-sm">
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Global View
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {isGlobalView
              ? 'Comprehensive overview of all subaccounts and system metrics'
              : `Detailed insights for ${getCurrentSubaccount?.()?.name} subaccount`
            }
          </p>
        </div>
        <div className="flex justify-start lg:justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-slate-600 border-gray-200/60 dark:border-slate-600/60 transition-all duration-200 dark:text-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-blue-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Total Users</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.totalUsers}</div>
            <div className="flex items-center gap-1">
              {stats.growthRates.users >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stats.growthRates.users >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.growthRates.users >= 0 ? "+" : ""}{stats.growthRates.users}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-emerald-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Active Users</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.activeUsers}</div>
            <div className="flex items-center gap-1">
              {stats.growthRates.activeUsers >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stats.growthRates.activeUsers >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.growthRates.activeUsers >= 0 ? "+" : ""}{stats.growthRates.activeUsers}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-purple-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-purple-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => window.location.href = '/admin/strategies'}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Total Strategies</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.totalStrategies}</div>
            <div className="flex items-center gap-1">
              {stats.growthRates.strategies >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stats.growthRates.strategies >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.growthRates.strategies >= 0 ? "+" : ""}{stats.growthRates.strategies}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50/50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-orange-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => window.location.href = '/admin/bookings'}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Total Bookings</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stats.totalBookings}</div>
            <div className="flex items-center gap-1">
              {stats.growthRates.bookings >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stats.growthRates.bookings >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.growthRates.bookings >= 0 ? "+" : ""}{stats.growthRates.bookings}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Recent Users
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Latest users who joined the platform
              </CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-blue-50/50 transition-all duration-200 border border-transparent hover:border-blue-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      {user.company && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent users</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600" />
                Recent Leads
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Latest leads added to the platform
              </CardDescription>
            </div>
            <Link href="/admin/leads">
              <Button variant="outline" size="sm" className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-emerald-50/50 transition-all duration-200 border border-transparent hover:border-emerald-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lead.email || 'No email'}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{lead.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{lead.status}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => loadDetailedLead(lead.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          {selectedLead && selectedLead.id === lead.id && (
                            <LeadDetailsContent
                              lead={selectedLead}
                              formatDate={formatDate}
                              getStatusBadgeVariant={() => 'outline' as const}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent leads</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            System Status
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system health and performance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200/60 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Code className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Database</span>
              </div>
              <Badge variant={getStatusBadgeVariant(systemStatus.database)} className={`${
                systemStatus.database.toLowerCase() === 'healthy' 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {systemStatus.database}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-200/60 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Globe className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">API Server</span>
              </div>
              <Badge variant={getStatusBadgeVariant(systemStatus.apiServer)} className={`${
                systemStatus.apiServer.toLowerCase() === 'healthy' 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {systemStatus.apiServer}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:border-orange-200/60 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Redis Cache</span>
              </div>
              <Badge variant={getStatusBadgeVariant(systemStatus.redisCache)} className={`${
                systemStatus.redisCache.toLowerCase() === 'healthy' 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {systemStatus.redisCache}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:border-purple-200/60 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">File Storage</span>
              </div>
              <Badge variant={getStatusBadgeVariant(systemStatus.fileStorage)} className={`${
                systemStatus.fileStorage.toLowerCase() === 'healthy' 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {systemStatus.fileStorage}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 