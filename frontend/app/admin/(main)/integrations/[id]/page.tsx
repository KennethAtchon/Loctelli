"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  Settings,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Integration } from "@/lib/api";

export default function IntegrationDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadIntegration(parseInt(params.id as string));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadIntegration = async (id: number) => {
    try {
      setLoading(true);
      const data = await api.integrations.getById(id);
      setIntegration(data);
    } catch (error) {
      console.error("Failed to load integration:", error);
      toast.error("Error", {
        description: "Failed to load integration",
      });
      router.push("/admin/integrations");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!integration) return;

    try {
      setTesting(true);
      await api.integrations.testConnection(integration.id);
      toast.success("Success", {
        description: "Connection test successful!",
      });
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("Error", {
        description: "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    if (!integration) return;

    try {
      setSyncing(true);
      await api.integrations.syncData(integration.id);
      toast.success("Success", {
        description: "Data sync completed successfully!",
      });
      // Reload integration to get updated sync time
      await loadIntegration(integration.id);
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Error", {
        description: "Data sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!integration) return;

    try {
      setDeleting(true);
      await api.integrations.deleteIntegration(integration.id);
      toast.success("Success", {
        description: "Integration deleted successfully",
      });
      router.push("/admin/integrations");
    } catch (error) {
      console.error("Failed to delete integration:", error);
      toast.error("Error", {
        description: "Failed to delete integration",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case "disconnected":
        return (
          <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Activity className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "disconnected":
        return <Settings className="h-5 w-5 text-gray-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integration...</div>
        </div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Integration not found</p>
          <Button
            onClick={() => router.push("/admin/integrations")}
            className="mt-4"
          >
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {integration.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {integration.integrationTemplate.displayName} Integration
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/integrations/${integration.id}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this integration? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integration Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(integration.status)}
                Integration Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(integration.status)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {integration.integrationTemplate.category}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    SubAccount
                  </Label>
                  <p className="text-sm text-gray-900">
                    {integration.subAccount.name}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Created
                  </Label>
                  <p className="text-sm text-gray-900">
                    {formatDate(integration.createdAt)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {integration.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {integration.description}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {integration.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <Label className="text-sm font-medium text-red-800">
                      Error
                    </Label>
                  </div>
                  <p className="text-sm text-red-700">
                    {integration.errorMessage}
                  </p>
                </div>
              )}

              {/* Configuration */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Configuration
                </Label>
                <div className="mt-2 bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(integration.config, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Integration Created</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(integration.createdAt)}
                    </p>
                  </div>
                </div>

                {integration.lastSyncAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Last Sync</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(integration.lastSyncAt)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(integration.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Template Name
                </Label>
                <p className="text-sm text-gray-900">
                  {integration.integrationTemplate.displayName}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  API Version
                </Label>
                <p className="text-sm text-gray-900">
                  {(
                    integration.integrationTemplate as {
                      apiVersion?: string;
                    }
                  ).apiVersion || "N/A"}
                </p>
              </div>

              {(
                integration.integrationTemplate as {
                  description?: string;
                }
              ).description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <p className="text-sm text-gray-900">
                    {
                      (
                        integration.integrationTemplate as {
                          description?: string;
                        }
                      ).description
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
