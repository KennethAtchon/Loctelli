'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable, Column, Filter, StatCard } from '@/components/customUI';
import { usePagination } from '@/components/customUI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Eye, Edit, MessageSquare, User, Calendar } from 'lucide-react';
import { ContactSubmission, CreateContactNoteDto } from '@/types';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';

export default function ContactsPage() {
  const { getTenantQueryParams } = useTenant();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0, inProgress: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Use the pagination hook
  const {
    pagination,
    paginatedData,
    setCurrentPage,
    setTotalItems,
  } = usePagination(filteredContacts, { pageSize: 10 });

  // Calculate stats cards
  const statsCards: StatCard[] = [
    {
      title: 'Total Contacts',
      value: stats.total,
      icon: <Mail className="h-8 w-8" />,
      color: 'text-blue-600',
    },
    {
      title: 'New',
      value: stats.newCount,
      icon: <User className="h-8 w-8" />,
      color: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: <Calendar className="h-8 w-8" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Closed',
      value: stats.closed,
      icon: <MessageSquare className="h-8 w-8" />,
      color: 'text-gray-600',
    },
  ];

  // Define columns
  const columns: Column<ContactSubmission>[] = [
    {
      key: 'fullName',
      header: 'Name',
      render: (contact) => <span className="font-medium">{contact.fullName}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (contact) => (
        <div>
          <div className="text-sm">{contact.email}</div>
          <div className="text-xs text-gray-500">{contact.phone}</div>
        </div>
      ),
    },
    {
      key: 'services',
      header: 'Services',
      render: (contact) => {
        const serviceLabels = {
          'free-website': 'Free Website',
          'google-reviews': 'Google Reviews',
          'customer-reactivation': 'Customer Reactivation',
          'lead-generation': 'AI Lead Generation',
          'all-services': 'All Services',
        };
        return serviceLabels[contact.services as keyof typeof serviceLabels] || contact.services;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (contact) => (
        <Badge variant={getStatusBadgeVariant(contact.status)}>
          {contact.status}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (contact) => (
        <Badge variant={getPriorityBadgeVariant(contact.priority)}>
          {contact.priority}
        </Badge>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (contact) => contact.assignedTo?.name || 'Unassigned',
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (contact) => formatDate(contact.submittedAt),
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'NEW', label: 'New' },
        { value: 'CONTACTED', label: 'Contacted' },
        { value: 'QUALIFIED', label: 'Qualified' },
        { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
        { value: 'CLOSED_WON', label: 'Closed Won' },
        { value: 'CLOSED_LOST', label: 'Closed Lost' },
        { value: 'UNRESPONSIVE', label: 'Unresponsive' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
      ],
    },
  ];

  const loadContacts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Use tenant context for automatic filtering
      const queryParams = getTenantQueryParams();
      logger.debug('Loading contacts with tenant params:', queryParams);

      const [contactsData, statsData] = await Promise.all([
        api.contacts.getContacts(queryParams),
        api.contacts.getStats(queryParams)
      ]);

      setContacts(contactsData);
      setFilteredContacts(contactsData);
      setStats(statsData);
      setTotalItems(contactsData.length);
    } catch (error) {
      logger.error('Failed to load contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getTenantQueryParams]);

  // Handle search
  const handleSearch = (term: string) => {
    const filtered = contacts.filter(contact =>
      contact.fullName.toLowerCase().includes(term.toLowerCase()) ||
      contact.email.toLowerCase().includes(term.toLowerCase()) ||
      contact.phone.toLowerCase().includes(term.toLowerCase()) ||
      contact.services.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredContacts(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  // Handle filters
  const handleFilter = (key: string, value: string) => {
    let filtered = contacts;

    if (key === 'status' && value !== 'all') {
      filtered = filtered.filter(contact => contact.status === value);
    }
    
    if (key === 'priority' && value !== 'all') {
      filtered = filtered.filter(contact => contact.priority === value);
    }

    setFilteredContacts(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  // Handle actions
  const handleView = (contact: ContactSubmission) => {
    setSelectedContact(contact);
  };

  const handleEdit = (contact: ContactSubmission) => {
    window.location.href = `/admin/contacts/${contact.id}/edit`;
  };

  const handleAddNote = async () => {
    if (!selectedContact || !newNote.trim()) return;
    
    try {
      setIsAddingNote(true);
      await api.contacts.addNote(selectedContact.id, { content: newNote.trim() });
      setNewNote('');
      setSuccess('Note added successfully');
      // Refresh the selected contact
      const updatedContact = await api.contacts.getContact(selectedContact.id);
      setSelectedContact(updatedContact);
      loadContacts(); // Refresh the list
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Failed to add note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'default';
      case 'CONTACTED':
        return 'secondary';
      case 'QUALIFIED':
        return 'default';
      case 'PROPOSAL_SENT':
        return 'secondary';
      case 'CLOSED_WON':
        return 'default';
      case 'CLOSED_LOST':
        return 'destructive';
      case 'UNRESPONSIVE':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'outline';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'default';
      case 'URGENT':
        return 'destructive';
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
        title="Contact Management"
        description="Manage all contact form submissions and track follow-ups"
        searchPlaceholder="Search contacts..."
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
        onRefresh={loadContacts}
        onView={handleView}
        onEdit={handleEdit}
        stats={statsCards}
        error={error}
        success={success}
        hideCreateButton={true} // Don't show create button for contacts (they come from website form)
      />

      {/* Contact Details Dialog */}
      {selectedContact && (
        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contact Details - {selectedContact.fullName}</DialogTitle>
              <DialogDescription>
                Complete contact information and follow-up history
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedContact.fullName}</div>
                  <div><strong>Email:</strong> 
                    <a href={`mailto:${selectedContact.email}`} className="ml-2 text-blue-600 hover:underline">
                      {selectedContact.email}
                    </a>
                  </div>
                  <div><strong>Phone:</strong> 
                    <a href={`tel:${selectedContact.phone}`} className="ml-2 text-blue-600 hover:underline">
                      {selectedContact.phone}
                    </a>
                  </div>
                  <div><strong>Services:</strong> {selectedContact.services}</div>
                  <div><strong>Source:</strong> {selectedContact.source}</div>
                  <div><strong>Status:</strong> 
                    <Badge variant={getStatusBadgeVariant(selectedContact.status)} className="ml-2">
                      {selectedContact.status}
                    </Badge>
                  </div>
                  <div><strong>Priority:</strong> 
                    <Badge variant={getPriorityBadgeVariant(selectedContact.priority)} className="ml-2">
                      {selectedContact.priority}
                    </Badge>
                  </div>
                  <div><strong>Assigned To:</strong> {selectedContact.assignedTo?.name || 'Unassigned'}</div>
                </div>
              </div>

              {/* Message */}
              {selectedContact.message && (
                <div>
                  <h3 className="font-semibold mb-3">Initial Message</h3>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedContact.message}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Submitted:</strong> {formatDate(selectedContact.submittedAt)}</div>
                  <div><strong>Updated:</strong> {formatDate(selectedContact.updatedAt)}</div>
                  <div><strong>Followed Up:</strong> {selectedContact.followedUpAt ? formatDate(selectedContact.followedUpAt) : 'Not yet'}</div>
                  <div><strong>Closed:</strong> {selectedContact.closedAt ? formatDate(selectedContact.closedAt) : 'Not closed'}</div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-semibold mb-3">Follow-up Notes</h3>
                <div className="space-y-3">
                  {selectedContact.notes && selectedContact.notes.length > 0 ? (
                    selectedContact.notes.map((note, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>{note.authorName}</strong> • {formatDate(note.createdAt)}
                        </div>
                        <div className="text-sm">{note.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No notes yet</div>
                  )}
                  
                  {/* Add Note Form */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a follow-up note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!newNote.trim() || isAddingNote}
                        size="sm"
                      >
                        {isAddingNote ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}