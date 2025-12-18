import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column, Filter, StatCard } from '@/components/customUI';
import { usePagination } from '@/components/customUI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, User, Building, Eye, Edit } from 'lucide-react';
import { Booking } from '@/types';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';

export const Route = createFileRoute('/admin/bookings')({
  component: BookingsPage,
});

function BookingsPage() {
  const navigate = useNavigate();
  const { getTenantQueryParams } = useTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Use the pagination hook
  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredBookings, { pageSize: 10 });

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
      value: bookings.filter((b) => b.status === 'confirmed').length,
      icon: <Calendar className="h-8 w-8" />,
      color: 'text-green-600',
    },
    {
      title: 'Pending',
      value: bookings.filter((b) => b.status === 'pending').length,
      icon: <Clock className="h-8 w-8" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Cancelled',
      value: bookings.filter((b) => b.status === 'cancelled').length,
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
          <div className="font-medium">
            {booking.lead?.name || 'Unknown Lead'}
          </div>
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

      // Use tenant context for automatic filtering
      const queryParams = getTenantQueryParams();
      logger.debug('Loading bookings with tenant params:', queryParams);

      const bookingsData = await api.bookings.getBookings(queryParams);
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
  }, [getTenantQueryParams, setTotalItems]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = bookings.filter(
      (booking) =>
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
      filtered = filtered.filter((booking) => booking.status === value);
    }

    if (key === 'type' && value !== 'all') {
      filtered = filtered.filter((booking) => booking.bookingType === value);
    }

    setFilteredBookings(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    // Navigate to edit page
    navigate({ to: `/admin/bookings/${booking.id}/edit` });
  };

  const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      setError(null);
      await api.bookings.updateBookingStatus(bookingId, newStatus);

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

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

    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <>
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

      {/* Booking Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Booking ID
                    </label>
                    <p className="text-sm">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Type
                    </label>
                    <p className="text-sm">
                      <Badge
                        variant={getTypeBadgeVariant(
                          selectedBooking.bookingType
                        )}
                      >
                        {selectedBooking.bookingType}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <p className="text-sm">
                      <Badge
                        variant={getStatusBadgeVariant(selectedBooking.status)}
                      >
                        {selectedBooking.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created
                    </label>
                    <p className="text-sm">
                      {formatDate(selectedBooking.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-sm">
                      {formatDate(selectedBooking.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Information */}
              {selectedBooking.lead && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Lead Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Name
                        </label>
                        <p className="text-sm">{selectedBooking.lead.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <p className="text-sm">
                          {selectedBooking.lead.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Phone
                        </label>
                        <p className="text-sm">
                          {selectedBooking.lead.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Company
                        </label>
                        <p className="text-sm">
                          {selectedBooking.lead.company || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Position
                        </label>
                        <p className="text-sm">
                          {selectedBooking.lead.position || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Status
                        </label>
                        <p className="text-sm">{selectedBooking.lead.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information */}
              {selectedBooking.user && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned User
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Name
                        </label>
                        <p className="text-sm">{selectedBooking.user.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <p className="text-sm">{selectedBooking.user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Company
                        </label>
                        <p className="text-sm">
                          {selectedBooking.user.company || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Role
                        </label>
                        <p className="text-sm">{selectedBooking.user.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              {selectedBooking.details && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Booking Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap text-gray-700">
                      {formatBookingDetails(selectedBooking.details)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEdit(selectedBooking);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
