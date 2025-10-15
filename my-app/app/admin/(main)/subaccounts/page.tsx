'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, RefreshCw, Building, Users, Target, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { SubAccount, CreateSubAccountDto, UpdateSubAccountDto } from '@/lib/api';
import { CreateSubAccountDialog } from './create-subaccount-dialog';
import { EditSubAccountDialog } from './edit-subaccount-dialog';
import { useTenant } from '@/contexts/tenant-context';

export default function SubAccountsPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubAccount, setEditingSubAccount] = useState<SubAccount | null>(null);
  const { setSubAccountId, refreshSubaccounts } = useTenant();

  const loadSubAccounts = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.adminSubAccounts.getAllSubAccounts();
      setSubAccounts(data);
    } catch {
      toast.error('Failed to load SubAccounts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      await loadSubAccounts();
      await refreshSubaccounts(); // Refresh the subaccount context
    } catch {
      toast.error('Failed to create SubAccount');
    }
  };

  const handleUpdateSubAccount = async (id: number, formData: UpdateSubAccountDto) => {
    try {
      await api.adminSubAccounts.updateSubAccount(id, formData);
      toast.success('SubAccount updated successfully');
      setIsEditDialogOpen(false);
      setEditingSubAccount(null);
      loadSubAccounts();
    } catch {
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
    } catch {
      toast.error('Failed to delete SubAccount');
    }
  };

  const openEditDialog = (subAccount: SubAccount) => {
    setEditingSubAccount(subAccount);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = async (subAccount: SubAccount) => {
    // Ensure the subaccount list is up to date before setting the filter
    await refreshSubaccounts();
    setSubAccountId(subAccount.id);
    toast.success(`Filtered to ${subAccount.name}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            SubAccounts
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Manage client organizations and their data
          </p>
        </div>
        <div className="flex gap-3 justify-start lg:justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSubAccounts}
            disabled={isRefreshing}
            className="bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-slate-600 border-gray-200/60 dark:border-slate-600/60 transition-all duration-200 dark:text-gray-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create SubAccount
          </Button>
        </div>
      </div>

      {/* SubAccounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {subAccounts.map((subAccount) => (
          <Card key={subAccount.id} className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800/50 border-gray-200/60 dark:border-slate-600/60 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="relative">
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors">{subAccount.name}</span>
                </div>
                <Badge variant={subAccount.isActive ? "default" : "secondary"} className={subAccount.isActive ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                  {subAccount.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">{subAccount.description}</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 border border-blue-100/60">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Users:</span>
                    <div className="text-lg font-bold text-blue-600">{subAccount._count.users}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50/50 border border-purple-100/60">
                  <Target className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Strategies:</span>
                    <div className="text-lg font-bold text-purple-600">{subAccount._count.strategies}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/60">
                  <Building className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Leads:</span>
                    <div className="text-lg font-bold text-emerald-600">{subAccount._count.leads}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50/50 border border-orange-100/60">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Bookings:</span>
                    <div className="text-lg font-bold text-orange-600">{subAccount._count.bookings}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(subAccount)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(subAccount)}
                  className="bg-white/80 hover:bg-gray-50 border-gray-200/60"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSubAccount(subAccount.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60"
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
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Building className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No SubAccounts found</h3>
              <p className="text-gray-600 dark:text-gray-400">Get started by creating your first subaccount to organize your clients and data.</p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First SubAccount
            </Button>
          </CardContent>
        </Card>
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