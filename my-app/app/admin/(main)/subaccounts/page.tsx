'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { SubAccount, CreateSubAccountDto } from '@/lib/api';
import { CreateSubAccountDialog } from './create-subaccount-dialog';
import { EditSubAccountDialog } from './edit-subaccount-dialog';
import { useRouter } from 'next/navigation';

export default function SubAccountsPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubAccount, setEditingSubAccount] = useState<SubAccount | null>(null);
  const router = useRouter();

  const loadSubAccounts = async () => {
    try {
      const data = await api.adminSubAccounts.getAllSubAccounts();
      setSubAccounts(data);
    } catch (error) {
      toast.error('Failed to load SubAccounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubAccounts();
  }, []);

  const handleCreateSubAccount = async (formData: CreateSubAccountDto) => {
    try {
      await api.adminSubAccounts.createSubAccount(formData);
      toast.success('SubAccount created successfully');
      setIsCreateDialogOpen(false);
      loadSubAccounts();
    } catch (error) {
      toast.error('Failed to create SubAccount');
    }
  };

  const handleUpdateSubAccount = async (id: number, formData: CreateSubAccountDto) => {
    try {
      await api.adminSubAccounts.updateSubAccount(id, formData);
      toast.success('SubAccount updated successfully');
      setIsEditDialogOpen(false);
      setEditingSubAccount(null);
      loadSubAccounts();
    } catch (error) {
      toast.error('Failed to update SubAccount');
    }
  };

  const handleDeleteSubAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this SubAccount? This action cannot be undone.')) {
      return;
    }

    try {
      await api.adminSubAccounts.deleteSubAccount(id);
      toast.success('SubAccount deleted successfully');
      loadSubAccounts();
    } catch (error) {
      toast.error('Failed to delete SubAccount');
    }
  };

  const openEditDialog = (subAccount: SubAccount) => {
    setEditingSubAccount(subAccount);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading SubAccounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SubAccounts</h1>
          <p className="text-gray-600">Manage client organizations and their data</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create SubAccount
        </Button>
      </div>

      {/* SubAccounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subAccounts.map((subAccount) => (
          <Card key={subAccount.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{subAccount.name}</span>
                <Badge variant={subAccount.isActive ? "default" : "secondary"}>
                  {subAccount.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{subAccount.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium">Users:</span> {subAccount._count.users}
                </div>
                <div>
                  <span className="font-medium">Strategies:</span> {subAccount._count.strategies}
                </div>
                <div>
                  <span className="font-medium">Leads:</span> {subAccount._count.leads}
                </div>
                <div>
                  <span className="font-medium">Bookings:</span> {subAccount._count.bookings}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/subaccounts/${subAccount.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(subAccount)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSubAccount(subAccount.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subAccounts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No SubAccounts found</div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First SubAccount
          </Button>
        </div>
      )}

      {/* Create/Edit Dialogs */}
      <CreateSubAccountDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateSubAccount}
      />
      
      <EditSubAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        subAccount={editingSubAccount}
        onSubmit={handleUpdateSubAccount}
      />
    </div>
  );
} 