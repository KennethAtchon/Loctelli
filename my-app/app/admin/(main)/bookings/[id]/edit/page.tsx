'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Booking, CreateBookingDto, Lead } from '@/types';
import { UserProfile } from '@/lib/api/endpoints/admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { adminFilter } = useTenant();
  const bookingId = Number(params.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateBookingDto>>({
    regularUserId: 0,
    leadId: undefined,
    bookingType: '',
    details: {},
    status: 'pending'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load booking data
        const bookingData = await api.bookings.getBooking(bookingId);
        setBooking(bookingData);
        
        // Handle case where booking exists but user doesn't
        const userId = bookingData.regularUserId || 0;
        if (userId === 0) {
          logger.warn('Booking has no valid user ID:', bookingData);
        }
        
        setFormData({
          regularUserId: userId,
          leadId: bookingData.leadId || undefined,
          bookingType: bookingData.bookingType,
          details: bookingData.details || {},
          status: bookingData.status
        });

        // Load users for dropdown
        const usersData = await api.adminAuth.getAllUsers(adminFilter ?? undefined);
        setUsers(usersData);

        // Load leads for dropdown
        const leadsData = await api.leads.getLeads();
        setLeads(leadsData);

      } catch (error) {
        logger.error('Failed to load booking data:', error);
        setError('Failed to load booking data');
        toast({
          title: "Error",
          description: "Failed to load booking data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      loadData();
    }
  }, [bookingId, toast, adminFilter]);

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDetailsChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.regularUserId || formData.regularUserId === 0 || !formData.bookingType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected user exists
    const selectedUser = users.find(user => user.id === formData.regularUserId);
    if (!selectedUser) {
      toast({
        title: "Validation Error",
        description: "Selected user does not exist",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure we're sending valid data
      const updateData = {
        regularUserId: formData.regularUserId,
        leadId: formData.leadId,
        bookingType: formData.bookingType,
        details: formData.details,
        status: formData.status
      };
      
      await api.bookings.updateBooking(bookingId, updateData);
      
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      
      router.push('/admin/bookings');
    } catch (error) {
      logger.error('Failed to update booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Button onClick={() => router.push('/admin/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/bookings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
            <p className="text-gray-600">Update booking information and details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the core booking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User *</Label>
                <Select
                  value={formData.regularUserId?.toString() || ''}
                  onValueChange={(value) => handleInputChange('regularUserId', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {booking?.user === null && (
                  <p className="text-sm text-amber-600">
                    ⚠️ The user associated with this booking no longer exists. Please select a new user.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadId">Lead</Label>
                <Select
                  value={formData.leadId?.toString() || 'no-lead'}
                  onValueChange={(value) => handleInputChange('leadId', value === 'no-lead' ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-lead">No lead</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.name} ({lead.company || 'No company'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingType">Booking Type *</Label>
                <Select
                  value={formData.bookingType || ''}
                  onValueChange={(value) => handleInputChange('bookingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Additional information about the booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.details?.date || ''}
                onChange={(e) => handleDetailsChange('date', e.target.value)}
                placeholder="Select date and time"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.details?.duration || ''}
                onChange={(e) => handleDetailsChange('duration', e.target.value)}
                placeholder="30"
                min="15"
                step="15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={formData.details?.location || ''}
                onChange={(e) => handleDetailsChange('location', e.target.value)}
                placeholder="Meeting location or video call link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.details?.notes || ''}
                onChange={(e) => handleDetailsChange('notes', e.target.value)}
                placeholder="Additional notes about the booking"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                value={formData.details?.agenda || ''}
                onChange={(e) => handleDetailsChange('agenda', e.target.value)}
                placeholder="Meeting agenda or discussion points"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/bookings')}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isSaving}
            onClick={handleSubmit}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 