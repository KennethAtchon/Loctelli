'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CreateLeadDto } from '@/types';
import { Strategy } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';
import { useTenant } from '@/contexts/tenant-context';

export default function NewLeadPage() {
  const router = useRouter();
  const { adminFilter } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [formData, setFormData] = useState<CreateLeadDto>({
    regularUserId: 0, // Will be set when user selects from dropdown
    strategyId: 0, // Will be set when strategy selects from dropdown
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    customId: '',
    status: 'lead',
    notes: '',
    subAccountId: 0, // Will be set from current filter
  });

  // Load users for the dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await api.adminAuth.getAllUsers(adminFilter ?? undefined);
        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter(user => user.role !== 'admin');
        setUsers(regularUsers);


      } catch (error) {
        logger.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, [adminFilter]);

  // Load strategies for the selected user
  useEffect(() => {
    const loadStrategies = async () => {
      if (selectedUserId === 0) {
        setStrategies([]);
        return;
      }
      try {
        const strategiesData = await api.strategies.getStrategiesByUser(selectedUserId);
        setStrategies(strategiesData);
      } catch (error) {
        logger.error('Failed to load strategies:', error);
      }
    };
    loadStrategies();
  }, [selectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.regularUserId || formData.regularUserId === 0) {
      setError('Please select a user for this lead');
      return;
    }
    
    if (!formData.strategyId || formData.strategyId === 0) {
      setError('Please select a strategy for this lead');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Get the selected user to determine the subaccount
      const selectedUser = users.find(user => user.id === formData.regularUserId);
      if (!selectedUser) {
        setError('Selected user not found');
        return;
      }

      // Create lead with the user's subaccount
      await api.leads.createLead({
        ...formData,
        subAccountId: selectedUser.subAccountId || 0,
      });
      router.push('/admin/leads');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create lead');
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-600">Create a new lead record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Enter the lead's details below. All fields marked with * are required.
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
                  <Label htmlFor="regularUserId">Assign to User *</Label>
                  <Select
                    value={selectedUserId.toString()}
                    onValueChange={(value) => {
                      const userId = parseInt(value);
                      setSelectedUserId(userId);
                      setFormData(prev => ({ ...prev, regularUserId: userId, strategyId: 0 }));
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
                  <Label htmlFor="strategyId">Strategy *</Label>
                  <Select
                    value={formData.strategyId.toString()}
                    onValueChange={(value) => handleSelectChange('strategyId', value)}
                    disabled={selectedUserId === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedUserId === 0 ? "Select a user first" : "Select a strategy"} />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
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
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="CEO, Manager, etc."
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
                    placeholder="Optional custom identifier"
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
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Lead
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