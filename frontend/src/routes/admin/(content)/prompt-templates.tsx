import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { PromptTemplate } from "@/lib/api/endpoints/prompt-templates";
import { useTenant } from "@/contexts/tenant-context";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";

export const Route = createFileRoute(ROUTES.ADMIN.PROMPT_TEMPLATES)({
  component: () => (
    <AdminLayoutWrapper>
      <AdminPromptTemplatesPage />
    </AdminLayoutWrapper>
  ),
});

function AdminPromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const navigate = useNavigate();
  const { subAccountId, isGlobalView, getCurrentSubaccount } = useTenant();

  useEffect(() => {
    loadTemplates();
  }, [subAccountId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      let data: PromptTemplate[];
      if (subAccountId) {
        data = await api.promptTemplates.getAllForSubAccount(subAccountId);
      } else {
        data = await api.promptTemplates.getAll();
      }
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast("Error", {
        description: "Failed to load prompt templates",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    if (isGlobalView) {
      toast("Error", {
        description:
          "Please select a specific subaccount to activate templates. Templates cannot be activated globally.",
      });
      return;
    }

    if (!subAccountId) {
      toast("Error", {
        description:
          "No subaccount selected. Please select a subaccount first.",
      });
      return;
    }

    try {
      setActivating(id);
      await api.promptTemplates.activate(id, subAccountId);
      await loadTemplates();
      const currentSubaccount = getCurrentSubaccount?.();
      toast("Success", {
        description: `Template activated successfully for ${currentSubaccount?.name}`,
      });
    } catch (error) {
      console.error("Failed to activate template:", error);
      toast("Error", {
        description: "Failed to activate template",
      });
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await api.promptTemplates.deleteTemplate(id);
      await loadTemplates();
      toast("Success", {
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast("Error", {
        description: "Failed to delete template",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
          <p className="text-gray-600">
            Manage AI conversation prompt templates
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/admin/prompt-templates/new" })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.isActive && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {!template.isActive && !isGlobalView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(template.id)}
                      disabled={activating === template.id}
                    >
                      {activating === template.id ? (
                        <Circle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span className="ml-2">Activate</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: `/admin/prompt-templates/${template.id}/edit`,
                      })
                    }
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
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this template? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          disabled={deleting === template.id}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>Created: {formatDate(template.createdAt)}</p>
                <p>Updated: {formatDate(template.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by creating your first prompt template
            </p>
            <Button
              onClick={() => navigate({ to: "/admin/prompt-templates/new" })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
