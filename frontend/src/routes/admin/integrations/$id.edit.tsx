import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { Integration, UpdateIntegrationDto } from "@/lib/api";

export const Route = createFileRoute('/admin/integrations/$id/edit')({
  component: EditIntegrationPage,
});

function EditIntegrationPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateIntegrationDto>({
    name: "",
    description: "",
    isActive: false,
    config: {},
  });

  useEffect(() => {
    if (id) {
      loadIntegration(parseInt(id));
    }
  }, [id]);

  const loadIntegration = async (integrationId: number) => {
    try {
      setLoading(true);
      const data = await api.integrations.getById(integrationId);
      setIntegration(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        isActive: data.isActive,
        config: data.config,
      });
    } catch (error) {
      console.error("Failed to load integration:", error);
      toast.error("Failed to load integration");
      navigate({ to: '/admin/integrations/integrations' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      toast.error("Please enter an integration name");
      return false;
    }

    // Validate required config fields
    if (integration?.integrationTemplate?.configSchema?.required) {
      const requiredFields =
        integration.integrationTemplate.configSchema.required;
      for (const field of requiredFields) {
        if (
          !formData.config?.[field] ||
          formData.config[field].toString().trim() === ""
        ) {
          toast.error(`Please fill in the required field: ${field}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm() || !integration) return;

    try {
      setTesting(true);
      await api.integrations.testConnection(integration.id);
      toast.success("Connection test successful!");
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    if (!integration) return;

    try {
      setTesting(true);
      await api.integrations.syncData(integration.id);
      toast.success("Data sync completed successfully!");
      // Reload integration to get updated sync time
      await loadIntegration(integration.id);
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Data sync failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !integration) return;

    try {
      setSaving(true);
      await api.integrations.update(integration.id, formData);
      toast.success("Integration updated successfully");
      navigate({ to: '/admin/integrations/integrations' });
    } catch (error) {
      console.error("Failed to update integration:", error);
      toast.error("Failed to update integration");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!integration) return;

    try {
      setDeleting(true);
      await api.integrations.deleteIntegration(integration.id);
      toast.success("Integration deleted successfully");
      navigate({ to: '/admin/integrations/integrations' });
    } catch (error) {
      console.error("Failed to delete integration:", error);
      toast.error("Failed to delete integration");
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

  const renderConfigField = (
    key: string,
    schema: { type: string; title?: string; description?: string }
  ) => {
    const value = formData.config?.[key] || "";
    const isRequired =
      integration?.integrationTemplate?.configSchema?.required?.includes(key);

    switch (schema.type) {
      case "string":
        if (
          schema.title?.toLowerCase().includes("key") ||
          schema.title?.toLowerCase().includes("token")
        ) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                {schema.title}
                {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={key}
                type="password"
                value={String(value)}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={schema.description}
                required={isRequired}
              />
              {schema.description && (
                <p className="text-sm text-gray-500">{schema.description}</p>
              )}
            </div>
          );
        }
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              {schema.title}
              {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={String(value)}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={schema.description}
              required={isRequired}
            />
            {schema.description && (
              <p className="text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );
      default:
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              {schema.title}
              {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={String(value)}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={schema.description}
              required={isRequired}
            />
            {schema.description && (
              <p className="text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );
    }
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
            onClick={() => navigate({ to: '/admin/integrations/integrations' })}
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
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/integrations/integrations' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Integration
            </h1>
            <p className="text-gray-600 mt-2">
              Update configuration for{" "}
              {integration.integrationTemplate.displayName}
            </p>
          </div>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integration Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Integration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Type
                </Label>
                <p className="text-sm text-gray-900">
                  {integration.integrationTemplate.displayName}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Badge variant="outline">
                  {integration.integrationTemplate.category}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <div className="mt-1">{getStatusBadge(integration.status)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  SubAccount
                </Label>
                <p className="text-sm text-gray-900">
                  {integration.subAccount.name}
                </p>
              </div>

              {integration.lastSyncAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Last Sync
                  </Label>
                  <p className="text-sm text-gray-900">
                    {new Date(integration.lastSyncAt).toLocaleString()}
                  </p>
                </div>
              )}

              {integration.errorMessage && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Error
                  </Label>
                  <p className="text-sm text-red-600">
                    {integration.errorMessage}
                  </p>
                </div>
              )}

              <div className="pt-4 space-y-2">
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
                  disabled={testing}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {testing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Update the integration settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter a name for this integration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter a description for this integration"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integration.integrationTemplate.configSchema?.properties &&
                    Object.entries(
                      integration.integrationTemplate.configSchema
                        .properties as Record<
                        string,
                        { type: string; title?: string; description?: string }
                      >
                    ).map(([key, schema]) => renderConfigField(key, schema))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

