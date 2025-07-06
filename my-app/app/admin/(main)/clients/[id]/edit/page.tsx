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
import { Client, CreateClientDto, Strategy } from '@/types';
import type { UserProfile } from '@/lib/api/endpoints/admin-auth';
import logger from '@/lib/logger';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = parseInt(params.id as string);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [formData, setFormData] = useState<CreateClientDto>({
    userId: 0,
    strategyId: 0,
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    customId: '',
    status: 'lead',
    notes: '',
  });

  // Load client data, users, and strategies
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingClient(true);
        const [clientData, usersData] = await Promise.all([
          api.clients.getClient(clientId),
          api.adminAuth.getAllUsers()
        ]);
        
        setClient(clientData);
        setSelectedUserId(clientData.userId);
        
        // Filter out admin users, only show regular users
        const regularUsers = usersData.filter(user => user.role !== 'admin');
        setUsers(regularUsers);
        
        // Load strategies for the selected user
        const strategiesData = await api.strategies.getStrategiesByUser(clientData.userId);
        setStrategies(strategiesData);
        
        // Populate form with existing data
        setFormData({
          userId: clientData.userId,
          strategyId: clientData.strategyId,
          name: clientData.name,
          email: clientData.email || '',
          phone: clientData.phone || '',
          company: clientData.company || '',
          position: clientData.position || '',
          customId: clientData.customId || '',
          status: clientData.status,
          notes: clientData.notes || '',
        });
      } catch (error) {
        logger.error('Failed to load client data:', error);
        setError('Failed to load client data');
      } finally {
        setIsLoadingClient(false);
      }
    };

    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.clients.updateClient(clientId, formData);
      router.push('/admin/clients');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update client');
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
      [name]: name === 'strategyId' || name === 'userId' ? parseInt(value) || 0 : value,
    }));
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
          <p className="text-gray-600">Update client information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            Update the client's details below. All fields marked with * are required.
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
                      setFormData(prev => ({ ...prev, userId, strategyId: 0 }));
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
                placeholder="Additional notes about this client..."
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Client
                  </>
                )}
              </Button>
              <Link href="/admin/clients">
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