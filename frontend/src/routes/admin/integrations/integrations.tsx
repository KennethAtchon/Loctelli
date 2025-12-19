import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { IntegrationTemplate, Integration } from "@/lib/api";

export const Route = createFileRoute('/admin/integrations/integrations')({
  component: AdminIntegrationsPage,
});

function AdminIntegrationsPage() {
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, integrationsData] = await Promise.all([
        api.integrationTemplates.getActive(),
        api.integrations.getAll(),
      ]);
      setTemplates(templatesData);
      setIntegrations(integrationsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast("Failed to load integrations data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await api.integrations.deleteIntegration(id);
      await loadData();
      toast("Integration deleted successfully");
    } catch (error) {
      console.error("Failed to delete integration:", error);
      toast("Failed to delete integration");
    } finally {
      setDeleting(null);
    }
  };

  const getIntegrationForTemplate = (templateId: number) => {
    return integrations.find(
      (integration) => integration.integrationTemplateId === templateId
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Manage external service integrations</p>
        </div>
        <Button onClick={() => navigate({ to: '/admin/integrations/new', search: { template: undefined } })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => {
          const integration = getIntegrationForTemplate(template.id);
          
          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {integration && getStatusBadge(integration.status)}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {integration ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: `/admin/integrations/${integration.id}` })}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: `/admin/integrations/${integration.id}/edit` })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this integration? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(integration.id)}
                                disabled={deleting === integration.id}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => navigate({ to: `/admin/integrations/new?template=${template.id}` })}>
                        <Plus className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {integration && (
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Created: {new Date(integration.createdAt).toLocaleDateString()}</p>
                      {integration.lastSyncAt && (
                      <p>Last Synced: {new Date(integration.lastSyncAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No integration templates</h3>
            <p className="text-gray-600 text-center">
              No integration templates are available at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

