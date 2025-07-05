'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, RefreshCw, Calendar, Clock, User, Building } from 'lucide-react';
import logger from '@/lib/logger';

interface Booking {
  id: number;
  userId: number;
  clientId: number;
  bookingType: string;
  details: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    name: string;
    email: string;
    company: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const calculateStats = (bookingsData: Booking[]) => {
    const stats = {
      totalBookings: bookingsData.length,
      confirmedBookings: bookingsData.filter(b => b.status === 'confirmed').length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      cancelledBookings: bookingsData.filter(b => b.status === 'cancelled').length,
    };
    setStats(stats);
  };

  const loadBookings = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const bookingsData = await api.bookings.getBookings();
      setBookings(bookingsData);
      calculateStats(bookingsData);
    } catch (error) {
      logger.error('Failed to load bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const filterBookings = useCallback(() => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingType === typeFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return 'default';
      case 'meeting':
        return 'secondary';
      case 'demo':
        return 'outline';
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

  const formatBookingDetails = (details: any) => {
    if (!details) return 'No details available';
    
    try {
      if (typeof details === 'string') {
        const parsed = JSON.parse(details);
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return 'Invalid details format';
    }
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
            onClick={loadBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Manage client appointments and meeting schedules.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadBookings}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find specific bookings or filter by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search bookings by client, user, or type..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="meeting">Meeting</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>A list of all client bookings and appointments.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.client?.name || 'Unknown Client'}</div>
                        <div className="text-sm text-gray-500">{booking.client?.email}</div>
                        {booking.client?.company && (
                          <div className="text-xs text-gray-400 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {booking.client.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(booking.bookingType)}>
                        {booking.bookingType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{booking.user?.name || 'Unknown User'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatDate(booking.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                              <DialogDescription>
                                Detailed view of the booking information
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Booking ID</h4>
                                  <p>{booking.id}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Status</h4>
                                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold">Client Information</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                  <p><strong>Name:</strong> {booking.client?.name || 'Unknown'}</p>
                                  <p><strong>Email:</strong> {booking.client?.email || 'N/A'}</p>
                                  <p><strong>Company:</strong> {booking.client?.company || 'N/A'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold">User Information</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                  <p><strong>Name:</strong> {booking.user?.name || 'Unknown'}</p>
                                  <p><strong>Email:</strong> {booking.user?.email || 'N/A'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold">Booking Type</h4>
                                <Badge variant={getTypeBadgeVariant(booking.bookingType)}>
                                  {booking.bookingType}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="font-semibold">Details</h4>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {formatBookingDetails(booking.details)}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Created</h4>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{formatDate(booking.createdAt)}</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Updated</h4>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{formatDate(booking.updatedAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bookings have been created yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 