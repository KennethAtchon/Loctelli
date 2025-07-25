'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column, Filter, StatCard } from '@/components/customUI';
import { usePagination } from '@/components/customUI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building, Eye, Edit, Trash2 } from 'lucide-react';
import { Lead } from '@/types';
import { DetailedLead } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';
import Link from 'next/link';

export default function LeadsPage() {
  const { getCurrentSubaccount } = useSubaccountFilter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);

  // Use the pagination hook
  const {
    pagination,
    paginatedData,
    setCurrentPage,
    setTotalItems,
  } = usePagination(filteredLeads, { pageSize: 10 });

  // Calculate stats
  const stats: StatCard[] = [
    {
      title: 'Total Leads',
      value: leads.length,
      icon: <Building className="h-8 w-8" />,
      color: 'text-blue-600',
    },
    {
      title: 'Active Leads',
      value: leads.filter(l => l.status === 'active').length,
      icon: <Building className="h-8 w-8" />,
      color: 'text-green-600',
    },
    {
      title: 'Lead Status',
      value: leads.filter(l => l.status === 'lead').length,
      icon: <Building className="h-8 w-8" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Inactive Leads',
      value: leads.filter(l => l.status === 'inactive').length,
      icon: <Building className="h-8 w-8" />,
      color: 'text-red-600',
    },
  ];

  // Define columns
  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (lead) => <span className="font-medium">{lead.name}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (lead) => (
        <div>
          <div className="text-sm">{lead.email || 'No email'}</div>
          <div className="text-xs text-gray-500">{lead.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (lead) => lead.company || 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => (
        <Badge variant={getStatusBadgeVariant(lead.status)}>
          {lead.status}
        </Badge>
      ),
    },
    {
      key: 'strategy',
      header: 'Strategy',
      render: (lead) => lead.strategy?.name || 'N/A',
    },
    {
      key: 'lastMessageDate',
      header: 'Last Message',
      render: (lead) => lead.lastMessageDate ? formatDate(lead.lastMessageDate) : 'No messages',
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'lead', label: 'Lead' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  const loadLeads = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const currentSubaccount = getCurrentSubaccount();
      const leadsData = await api.leads.getLeads(
        currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
      );
      setLeads(leadsData);
      setFilteredLeads(leadsData);
      setTotalItems(leadsData.length);
    } catch (error) {
      logger.error('Failed to load leads:', error);
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getCurrentSubaccount]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(term.toLowerCase()) ||
      lead.email?.toLowerCase().includes(term.toLowerCase()) ||
      lead.company?.toLowerCase().includes(term.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredLeads(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = leads;

    if (key === 'status' && value !== 'all') {
      filtered = filtered.filter(lead => lead.status === value);
    }

    setFilteredLeads(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page
  };

  // Handle actions
  const handleView = async (lead: Lead) => {
    try {
      const detailedLead = await api.adminAuth.getDetailedLead(lead.id);
      setSelectedLead(detailedLead);
    } catch (error) {
      logger.error('Failed to load lead details:', error);
    }
  };

  const handleEdit = (lead: Lead) => {
    // Navigate to edit page
    window.location.href = `/admin/leads/${lead.id}/edit`;
  };

  const handleDelete = async (lead: Lead) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        setError(null);
        await api.leads.deleteLead(lead.id);
        setSuccess('Lead deleted successfully');
        loadLeads();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error('Failed to delete lead:', error);
        setError('Failed to delete lead. Please try again.');
      }
    }
  };

  const handleCreate = () => {
    window.location.href = '/admin/leads/new';
  };

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'inactive':
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

  return (
    <>
      <DataTable
        data={paginatedData}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        columns={columns}
        title="Lead Management"
        description="A list of all your leads and their current status"
        searchPlaceholder="Search leads..."
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
        onRefresh={loadLeads}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        stats={stats}
        error={error}
        success={success}
      />

      {/* Lead Details Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Details - {selectedLead.name}</DialogTitle>
              <DialogDescription>
                Complete lead information and related data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>ID:</strong> {selectedLead.id}</div>
                  <div><strong>Name:</strong> {selectedLead.name}</div>
                  <div><strong>Email:</strong> {selectedLead.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedLead.phone || 'N/A'}</div>
                  <div><strong>Company:</strong> {selectedLead.company || 'N/A'}</div>
                  <div><strong>Position:</strong> {selectedLead.position || 'N/A'}</div>
                  <div><strong>Status:</strong> 
                    <Badge variant={getStatusBadgeVariant(selectedLead.status)} className="ml-2">
                      {selectedLead.status}
                    </Badge>
                  </div>
                  <div><strong>Custom ID:</strong> {selectedLead.customId || 'N/A'}</div>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedLead.notes}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Created:</strong> {formatDate(selectedLead.createdAt)}</div>
                  <div><strong>Updated:</strong> {formatDate(selectedLead.updatedAt)}</div>
                  <div><strong>Last Message:</strong> {selectedLead.lastMessageDate ? formatDate(selectedLead.lastMessageDate) : 'No messages'}</div>
                </div>
              </div>

              {/* User Information */}
              {selectedLead.user && (
                <div>
                  <h3 className="font-semibold mb-3">Assigned User</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>User ID:</strong> {selectedLead.user.id}</div>
                                         <div><strong>Name:</strong> {selectedLead.user.name}</div>
                     <div><strong>Email:</strong> {selectedLead.user.email}</div>
                  </div>
                </div>
              )}

              {/* Strategy Information */}
              {selectedLead.strategy && (
                <div>
                  <h3 className="font-semibold mb-3">Strategy</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Strategy ID:</strong> {selectedLead.strategy.id}</div>
                                         <div><strong>Name:</strong> {selectedLead.strategy.name}</div>
                     <div><strong>Tag:</strong> {selectedLead.strategy.tag || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Bookings */}
              {selectedLead.bookings && selectedLead.bookings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Bookings ({selectedLead.bookings.length})</h3>
                  <div className="space-y-2">
                    {selectedLead.bookings.map((booking) => (
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
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 