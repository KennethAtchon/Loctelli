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
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Building } from 'lucide-react';
import Link from 'next/link';
import { Client } from '@/types';
import { DetailedClient } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';

interface ClientStats {
  totalClients: number;
  activeClients: number;
  leadClients: number;
  inactiveClients: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    leadClients: 0,
    inactiveClients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<DetailedClient | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    filterClients();
  }, [searchTerm, filterClients]);

  const loadClients = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const clientsData = await api.clients.getClients();
      setClients(clientsData);
      calculateStats(clientsData);
    } catch (error) {
      logger.error('Failed to load clients:', error);
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const calculateStats = (clientsData: Client[]) => {
    const stats = {
      totalClients: clientsData.length,
      activeClients: clientsData.filter(c => c.status === 'active').length,
      leadClients: clientsData.filter(c => c.status === 'lead').length,
      inactiveClients: clientsData.filter(c => c.status === 'inactive').length,
    };
    setStats(stats);
  };

  const filterClients = useCallback(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, statusFilter]);

  const loadDetailedClient = async (clientId: number) => {
    try {
      const client = await api.adminAuth.getDetailedClient(clientId);
      setSelectedClient(client);
    } catch (error) {
      logger.error('Failed to load client details:', error);
    }
  };

  const deleteClient = async (clientId: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await api.clients.deleteClient(clientId);
        await loadClients(); // Reload the list
      } catch (error) {
        logger.error('Failed to delete client:', error);
        alert('Failed to delete client');
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
            onClick={loadClients}
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
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client relationships and interactions.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadClients}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.leadClients}</div>
            <div className="text-sm text-gray-600">Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inactiveClients}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find specific clients or filter by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search clients by name, email, or company..."
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
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients ({filteredClients.length})</CardTitle>
          <CardDescription>A list of all your clients and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
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
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{client.email || 'No email'}</div>
                        <div className="text-xs text-gray-500">{client.phone || 'No phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{client.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(client.status)}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.strategy?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {client.lastMessageDate ? formatDate(client.lastMessageDate) : 'No messages'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => loadDetailedClient(client.id)}
                            >
                              <Eye className="h-4 w-4" />
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
                        <Link href={`/admin/clients/${client.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteClient(client.id)}
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
                  ? 'No clients match your search criteria' 
                  : 'No clients found. Add your first client to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 