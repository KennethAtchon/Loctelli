import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Building,
  Users,
  Target,
  Calendar,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  SubAccount,
  CreateSubAccountDto,
  UpdateSubAccountDto,
} from "@/lib/api";
import { useTenant } from "@/contexts/tenant-context";
import { CreateSubAccountDialog } from "@/components/admin/create-subaccount-dialog";
import { EditSubAccountDialog } from "@/components/admin/edit-subaccount-dialog";
import { ROUTES } from "@/lib/routes";

export const Route = createFileRoute(ROUTES.ADMIN.SUBACCOUNTS)({
  component: AdminSubAccountsPage,
});

function AdminSubAccountsPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubAccount, setSelectedSubAccount] =
    useState<SubAccount | null>(null);
  const { setSubAccountId, refreshSubaccounts } = useTenant();

  const loadSubAccounts = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.adminSubAccounts.getAllSubAccounts();
      setSubAccounts(data);
    } catch {
      toast("Failed to load SubAccounts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubAccounts();
  }, []);

  const handleDeleteSubAccount = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this SubAccount? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.adminSubAccounts.deleteSubAccount(id);
      toast("SubAccount deleted successfully");
      loadSubAccounts();
    } catch {
      toast("Failed to delete SubAccount");
    }
  };

  const handleCreateSubAccount = async (data: CreateSubAccountDto) => {
    try {
      await api.adminSubAccounts.createSubAccount(data);
      toast.success("SubAccount created successfully");
      setIsCreateDialogOpen(false);
      await loadSubAccounts();
      await refreshSubaccounts?.();
    } catch (error) {
      toast.error("Failed to create SubAccount");
      throw error;
    }
  };

  const handleEditSubAccount = async (
    id: number,
    data: UpdateSubAccountDto,
  ) => {
    try {
      await api.adminSubAccounts.updateSubAccount(id, data);
      toast.success("SubAccount updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSubAccount(null);
      await loadSubAccounts();
      await refreshSubaccounts?.();
    } catch (error) {
      toast.error("Failed to update SubAccount");
      throw error;
    }
  };

  const handleEditClick = (subAccount: SubAccount) => {
    setSelectedSubAccount(subAccount);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = async (subAccount: SubAccount) => {
    await refreshSubaccounts?.();
    setSubAccountId?.(subAccount.id);
    toast(`Filtered to ${subAccount.name}`);
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
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create SubAccount
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total SubAccounts
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subAccounts.filter((s) => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subAccounts.filter((s) => !s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Paused or archived</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {subAccounts.map((subAccount) => (
          <Card
            key={subAccount.id}
            className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {subAccount.name}
                      <Badge
                        variant={subAccount.isActive ? "default" : "secondary"}
                      >
                        {subAccount.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {subAccount.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(subAccount)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(subAccount)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSubAccount(subAccount.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID</p>
                  <p className="font-mono text-sm">{subAccount.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Users
                  </p>
                  <p className="font-semibold">
                    {subAccount._count?.users || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Strategies
                  </p>
                  <p className="font-semibold">
                    {subAccount._count?.strategies || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Leads
                  </p>
                  <p className="font-semibold">
                    {subAccount._count?.leads || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subAccounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No SubAccounts
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first SubAccount to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create SubAccount
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateSubAccountDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateSubAccount}
      />

      <EditSubAccountDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedSubAccount(null);
        }}
        subAccount={selectedSubAccount}
        onSubmit={handleEditSubAccount}
      />
    </div>
  );
}
