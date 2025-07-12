'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column, Filter, StatCard } from '@/components/customUI';
import { usePagination } from '@/components/customUI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, User, Building, Eye, Edit } from 'lucide-react';
import { Booking } from '@/types';
import logger from '@/lib/logger';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

export default function BookingsPage() {
  const { getCurrentSubaccount } = useSubaccountFilter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Use the pagination hook
  const {
    pagination,
    paginatedData,
    setCurrentPage,
    setTotalItems,
  } = usePagination(filteredBookings, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: 'Total Bookings',
      value: bookings.length,
      icon: <Calendar className="h-8 w-8" />,
      color: 'text-blue-600',
    },
    {
      title: 'Confirmed',
      value: bookings.filter(b => b.status === 'confirmed').length,
      icon: <Calendar className="h-8 w-8" />,
      color: 'text-green-600',
    },
    {
      title: 'Pending',
      value: bookings.filter(b => b.status === 'pending').length,
      icon: <Clock className="h-8 w-8" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Cancelled',
      value: bookings.filter(b => b.status === 'cancelled').length,
      icon: <Calendar className="h-8 w-8" />,
      color: 'text-red-600',
    },
  ];

  // Define columns
  const columns: Column<Booking>[] = [
    {
      key: 'lead',
      header: 'Lead',
      render: (booking) => (
        <div>
          <div className="font-medium">{booking.lead?.name || 'Unknown Lead'}</div>
          <div className="text-sm text-gray-500">{booking.lead?.email}</div>
          {booking.lead?.company && (
            <div className="text-xs text-gray-400 flex items-center">
              <Building className="h-3 w-3 mr-1" />
              {booking.lead.company}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'bookingType',
      header: 'Type',
      render: (booking) => (
        <Badge variant={getTypeBadgeVariant(booking.bookingType)}>
          {booking.bookingType}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (booking) => (
        <Badge variant={getStatusBadgeVariant(booking.status)}>
          {booking.status}
        </Badge>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (booking) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span>{booking.user?.name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (booking) => formatDate(booking.createdAt),
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'consultation', label: 'Consultation' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'demo', label: 'Demo' },
      ],
    },
  ];

  const loadBookings = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const currentSubaccount = getCurrentSubaccount();
      const bookingsData = await api.bookings.getBookings(
        currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
      );
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
      setTotalItems(bookingsData.length);
    } catch (error) {
      logger.error('Failed to load bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getCurrentSubaccount]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = bookings.filter(booking =>
      booking.lead?.name.toLowerCase().includes(term.toLowerCase()) ||
      booking.lead?.email?.toLowerCase().includes(term.toLowerCase()) ||
      booking.lead?.company?.toLowerCase().includes(term.toLowerCase()) ||
      booking.user?.name.toLowerCase().includes(term.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredBookings(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = bookings;

    if (key === 'status' && value !== 'all') {
      filtered = filtered.filter(booking => booking.status === value);
    }

    if (key === 'type' && value !== 'all') {
      filtered = filtered.filter(booking => booking.bookingType === value);
    }

    setFilteredBookings(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = (booking: Booking) => {
    // Booking details are shown in a dialog
    console.log('View booking:', booking);
  };

  const handleEdit = (booking: Booking) => {
    // Navigate to edit page
    window.location.href = `/admin/bookings/${booking.id}/edit`;
  };

  const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      setError(null);
      await api.bookings.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));
      
      setSuccess('Booking status updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Failed to update booking status:', error);
      setError('Failed to update booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

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

  const formatBookingDetails = (details: Record<string, unknown>) => {
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

  return (
    <DataTable
      data={paginatedData}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      columns={columns}
      title="Booking Management"
      description="A list of all lead bookings and appointments"
      searchPlaceholder="Search bookings..."
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
      onRefresh={loadBookings}
      onView={handleView}
      onEdit={handleEdit}
      stats={stats}
      error={error}
      success={success}
    />
  );
} 