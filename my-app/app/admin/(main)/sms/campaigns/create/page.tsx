'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ArrowLeft, 
  Save, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { CreateCampaignDto } from '@/types/sms';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageComposer } from '@/components/sms/message-composer';

export default function CreateSmsCampaignPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignDto>({
    name: '',
    message: '',
    recipients: [],
    scheduledAt: undefined,
  });
  const [isScheduled, setIsScheduled] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleInputChange = (field: keyof CreateCampaignDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !formData.recipients.includes(recipientInput.trim())) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput.trim()]
      }));
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error('At least one recipient is required');
      return;
    }

    try {
      setLoading(true);
      
      const campaignData: CreateCampaignDto = {
        ...formData,
        scheduledAt: isScheduled ? formData.scheduledAt : undefined,
      };

      const response = await api.sms.createCampaign(campaignData);
      
      if (response?.success) {
        toast.success('Campaign created successfully');
        // Redirect to campaign details or list
        window.location.href = '/admin/sms/campaigns';
      } else {
        toast.error(response?.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = formData.message.length;
  const isOverLimit = characterCount > 160;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/sms/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create SMS Campaign</h1>
            <p className="text-muted-foreground">
              Create a new SMS campaign to reach your audience
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="Enter campaign name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <MessageComposer
                value={formData.message}
                onChange={(value) => handleInputChange('message', value)}
                placeholder="Enter your SMS message..."
                maxLength={160}
                showCharacterCount
              />
              {isOverLimit && (
                <div className="flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Message exceeds 160 characters and will be split into multiple SMS
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Phone Numbers *</Label>
              <div className="flex space-x-2">
                <Input
                  id="recipients"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRecipient}
                  disabled={!recipientInput.trim()}
                >
                  Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter phone numbers one by one or use bulk SMS for large lists
              </p>
            </div>

            {formData.recipients.length > 0 && (
              <div className="space-y-2">
                <Label>Recipients ({formData.recipients.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {formData.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <span className="text-sm">{recipient}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecipient(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Link href="/admin/sms/bulk">
                <Button type="button" variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Use Bulk SMS for Large Lists
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="scheduled"
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
              />
              <Label htmlFor="scheduled">Schedule Campaign</Label>
            </div>

            {isScheduled && (
              <div className="space-y-2">
                <Label>Schedule Date & Time</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduledAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledAt ? (
                        format(new Date(formData.scheduledAt), "PPP 'at' HH:mm")
                      ) : (
                        "Pick a date and time"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledAt ? new Date(formData.scheduledAt) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Set to current time if no time is selected
                          const now = new Date();
                          date.setHours(now.getHours());
                          date.setMinutes(now.getMinutes());
                          handleInputChange('scheduledAt', date.toISOString());
                        }
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">
                  Campaign will be sent at the scheduled time
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Campaign Name:</span>
                <p className="text-muted-foreground">{formData.name || 'Not set'}</p>
              </div>
              <div>
                <span className="font-medium">Recipients:</span>
                <p className="text-muted-foreground">{formData.recipients.length}</p>
              </div>
              <div>
                <span className="font-medium">Message Length:</span>
                <p className="text-muted-foreground">
                  {characterCount} characters {isOverLimit && '(will be split)'}
                </p>
              </div>
              <div>
                <span className="font-medium">Scheduled:</span>
                <p className="text-muted-foreground">
                  {isScheduled && formData.scheduledAt 
                    ? format(new Date(formData.scheduledAt), "PPP 'at' HH:mm")
                    : 'Send immediately'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/admin/sms/campaigns">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  );
} 