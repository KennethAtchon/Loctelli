'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Lead, CreateLeadDto, Strategy } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const { adminFilter, subAccountId } = useTenant();
  const leadId = parseInt(params.id as string);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [formData, setFormData] = useState<CreateLeadDto>({
    regularUserId: 0,
    strategyId: 0,
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    customId: '',
    status: 'lead',
    notes: '',
    subAccountId: 0,
  });

  // Load lead data, users, and strategies
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingLead(true);
        const [leadData, usersData] = await Promise.all([
          api.leads.getLead(leadId),
          api.adminAuth.getAllUsers(adminFilter ?? undefined)
        ]);

        setLead(leadData);
        setSelectedUserId(leadData.regularUserId);

        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter(user => user.role !== 'admin');
        setUsers(regularUsers);

        // Load strategies for the selected user
        const strategiesData = await api.strategies.getStrategiesByUser(leadData.regularUserId);
        setStrategies(strategiesData);

        // Populate form with existing data
        setFormData({
          regularUserId: leadData.regularUserId,
          strategyId: leadData.strategyId,
          name: leadData.name,
          email: leadData.email || '',
          phone: leadData.phone || '',
          company: leadData.company || '',
          position: leadData.position || '',
          customId: leadData.customId || '',
          status: leadData.status,
          notes: leadData.notes || '',
          subAccountId: subAccountId || leadData.subAccountId || 0,
        });
      } catch (error) {
        logger.error('Failed to load lead data:', error);
        setError('Failed to load lead data');
      } finally {
        setIsLoadingLead(false);
      }
    };

    if (leadId) {
      loadData();
    }
  }, [leadId, adminFilter, subAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.leads.updateLead(leadId, formData);
      router.push('/admin/leads');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'strategyId' || name === 'regularUserId' ? parseInt(value) || 0 : value,
    }));
  };

  if (isLoadingLead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/leads">
            <Button>Back to Leads</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leads">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-gray-600">Update lead information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Update the lead's details below. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Assign to User *</Label>
                  <Select
                    value={selectedUserId.toString()}
                    onValueChange={(value) => {
                      const userId = parseInt(value);
                      setSelectedUserId(userId);
                      setFormData(prev => ({ ...prev, regularUserId: userId, strategyId: 0 }));
                      // Reload strategies for the new user
                      api.strategies.getStrategiesByUser(userId).then(strategiesData => {
                        setStrategies(strategiesData);
                      }).catch(error => {
                        logger.error('Failed to load strategies:', error);
                      });
                    }}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategyId">Assign Strategy *</Label>
                  <Select
                    value={formData.strategyId.toString()}
                    onValueChange={(value) => handleSelectChange('strategyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name} {strategy.tag && `(${strategy.tag})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter lead name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Enter job position"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customId">Custom ID</Label>
                  <Input
                    id="customId"
                    name="customId"
                    type="text"
                    value={formData.customId}
                    onChange={handleInputChange}
                    placeholder="Enter custom identifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this lead..."
                rows={4}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Lead
                  </>
                )}
              </Button>
              <Link href="/admin/leads">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 