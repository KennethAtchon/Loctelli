'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Building } from 'lucide-react';
import Link from 'next/link';
import { Lead } from '@/types';
import { DetailedLead } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

interface LeadStats {
  totalLeads: number;
  activeLeads: number;
  leadLeads: number;
  inactiveLeads: number;
}

export default function LeadsPage() {
  const { currentFilter, getCurrentSubaccount } = useSubaccountFilter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    activeLeads: 0,
    leadLeads: 0,
    inactiveLeads: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const calculateStats = (leadsData: Lead[]) => {
    const stats = {
      totalLeads: leadsData.length,
      activeLeads: leadsData.filter(l => l.status === 'active').length,
      leadLeads: leadsData.filter(l => l.status === 'lead').length,
      inactiveLeads: leadsData.filter(l => l.status === 'inactive').length,
    };
    setStats(stats);
  };

  const loadLeads = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const currentSubaccount = getCurrentSubaccount();
      const leadsData = await api.leads.getLeads(
        currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
      );
      setLeads(leadsData);
      calculateStats(leadsData);
    } catch (error) {
      logger.error('Failed to load leads:', error);
      setError('Failed to load leads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getCurrentSubaccount]);

  const filterLeads = useCallback(() => {
    let filtered = leads;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    filterLeads();
  }, [filterLeads]);

  // Cleanup success/error messages on unmount
  useEffect(() => {
    return () => {
      setSuccess(null);
      setError(null);
    };
  }, []);

  const loadDetailedLead = async (leadId: number) => {
    try {
      const lead = await api.adminAuth.getDetailedLead(leadId);
      setSelectedLead(lead);
    } catch (error) {
      logger.error('Failed to load lead details:', error);
    }
  };

  const deleteLead = async (leadId: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        setError(null);
        await api.leads.deleteLead(leadId);
        setSuccess('Lead deleted successfully');
        await loadLeads(); // Reload the list
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error('Failed to delete lead:', error);
        setError('Failed to delete lead. Please try again.');
      }
    }
  };

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
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
              onClick={loadLeads}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your lead relationships and interactions.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadLeads}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/leads/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalLeads}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.activeLeads}</div>
            <div className="text-sm text-gray-600">Active Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.leadLeads}</div>
            <div className="text-sm text-gray-600">Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inactiveLeads}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>A list of all your leads and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{lead.email || 'No email'}</div>
                        <div className="text-xs text-gray-500">{lead.phone || 'No phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.strategy?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {lead.lastMessageDate ? formatDate(lead.lastMessageDate) : 'No messages'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => loadDetailedLead(lead.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Lead Details - {lead.name}</DialogTitle>
                              <DialogDescription>
                                Complete lead information and related data
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLead && selectedLead.id === lead.id && (
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
                                    <div><strong>Custom ID:</strong> {selectedLead.customId || 'N/A'}</div>
                                    <div><strong>Status:</strong> 
                                      <Badge variant="outline" className="ml-2">{selectedLead.status}</Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Timestamps */}
                                <div>
                                  <h3 className="font-semibold mb-3">Timestamps</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Created:</strong> {formatDate(selectedLead.createdAt)}</div>
                                    <div><strong>Updated:</strong> {formatDate(selectedLead.updatedAt)}</div>
                                    <div><strong>Last Message:</strong> {selectedLead.lastMessageDate ? formatDate(selectedLead.lastMessageDate) : 'No messages'}</div>
                                  </div>
                                </div>

                                {/* Notes */}
                                {selectedLead.notes && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Notes</h3>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedLead.notes}</p>
                                  </div>
                                )}

                                {/* Last Message */}
                                {selectedLead.lastMessage && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Last Message</h3>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedLead.lastMessage}</p>
                                  </div>
                                )}

                                {/* Assigned User */}
                                {selectedLead.user && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Assigned User</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><strong>User ID:</strong> {selectedLead.user.id}</div>
                                      <div><strong>User Name:</strong> {selectedLead.user.name}</div>
                                      <div><strong>User Email:</strong> {selectedLead.user.email}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Assigned Strategy */}
                                {selectedLead.strategy && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Assigned Strategy</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><strong>Strategy ID:</strong> {selectedLead.strategy.id}</div>
                                      <div><strong>Strategy Name:</strong> {selectedLead.strategy.name}</div>
                                      <div><strong>Strategy Tag:</strong> {selectedLead.strategy.tag || 'N/A'}</div>
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
                            )}
                          </DialogContent>
                        </Dialog>
                        <Link href={`/admin/leads/${lead.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteLead(lead.id)}
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
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No leads match your search criteria' 
                  : 'No leads found. Add your first lead to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 