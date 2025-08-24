'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Mail, Phone, Calendar } from 'lucide-react';
import { ContactSubmission, UpdateContactSubmissionDto, User } from '@/types';
import logger from '@/lib/logger';

interface ContactEditPageProps {
  params: { id: string };
}

export default function ContactEditPage({ params }: ContactEditPageProps) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactSubmission | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateContactSubmissionDto>({
    status: undefined,
    priority: undefined,
    assignedToId: undefined,
  });

  const loadContact = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [contactData, usersData] = await Promise.all([
        api.contacts.getContact(params.id),
        api.users.getUsers() // Assuming this exists
      ]);
      
      setContact(contactData);
      setUsers(usersData);
      
      // Initialize form data
      setFormData({
        status: contactData.status,
        priority: contactData.priority,
        assignedToId: contactData.assignedToId?.toString(),
      });
    } catch (error) {
      logger.error('Failed to load contact:', error);
      setError('Failed to load contact details');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!contact) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      const updateData = { ...formData };
      
      // Set follow-up date if status changed to CONTACTED and wasn't already set
      if (formData.status === 'CONTACTED' && contact.status !== 'CONTACTED') {
        updateData.followedUpAt = new Date().toISOString();
      }
      
      await api.contacts.updateContact(contact.id, updateData);
      setSuccess('Contact updated successfully');
      
      // Reload contact data
      loadContact();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Failed to update contact:', error);
      setError('Failed to update contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!contact || !newNote.trim()) return;
    
    try {
      setIsAddingNote(true);
      await api.contacts.addNote(contact.id, { content: newNote.trim() });
      setNewNote('');
      setSuccess('Note added successfully');
      // Reload contact data
      loadContact();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      logger.error('Failed to add note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  useEffect(() => {
    loadContact();
  }, [loadContact]);

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div>Loading contact details...</div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contact.fullName}</h1>
            <p className="text-gray-500">Contact Details & Management</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <div className="mt-1 text-sm">{contact.fullName}</div>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <div className="mt-1">
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-sm">
                      {contact.email}
                    </a>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <div className="mt-1">
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline text-sm">
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Services Interested</Label>
                  <div className="mt-1 text-sm">{contact.services}</div>
                </div>
                <div>
                  <Label className="font-medium">Source</Label>
                  <div className="mt-1 text-sm">{contact.source}</div>
                </div>
                <div>
                  <Label className="font-medium">Submitted</Label>
                  <div className="mt-1 text-sm">{formatDate(contact.submittedAt)}</div>
                </div>
              </div>
              
              {contact.message && (
                <div>
                  <Label className="font-medium">Initial Message</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                    {contact.message}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Notes</CardTitle>
              <CardDescription>Track all interactions and follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.notes && contact.notes.length > 0 ? (
                contact.notes.map((note, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{note.authorName}</span>
                      <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-700">{note.content}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No notes yet</div>
              )}
              
              {/* Add Note */}
              <div className="pt-4 border-t">
                <Label className="font-medium">Add New Note</Label>
                <div className="mt-2 space-y-3">
                  <Textarea
                    placeholder="Enter follow-up notes, call summary, or next steps..."
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
            </CardContent>
          </Card>
        </div>

        {/* Management Panel */}
        <div className="space-y-6">
          {/* Status & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>Update status, priority, and assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value as any})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                    <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                    <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                    <SelectItem value="UNRESPONSIVE">Unresponsive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-1">
                  Current: <Badge variant={getStatusBadgeVariant(contact.status)}>{contact.status}</Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({...formData, priority: value as any})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-1">
                  Current: <Badge variant={getPriorityBadgeVariant(contact.priority)}>{contact.priority}</Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="assigned">Assign To</Label>
                <Select 
                  value={formData.assignedToId} 
                  onValueChange={(value) => setFormData({...formData, assignedToId: value})}
                >
                  <SelectTrigger id="assigned">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-1 text-sm text-gray-500">
                  Current: {contact.assignedTo?.name || 'Unassigned'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Submitted:</span>
                <span>{formatDate(contact.submittedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Last Updated:</span>
                <span>{formatDate(contact.updatedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Followed Up:</span>
                <span>{contact.followedUpAt ? formatDate(contact.followedUpAt) : 'Not yet'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Closed:</span>
                <span>{contact.closedAt ? formatDate(contact.closedAt) : 'Not closed'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}