"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { PromptTemplate } from "@/lib/api/endpoints/prompt-templates";
import { useTenant } from "@/contexts/tenant-context";

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { subAccountId, isGlobalView, getCurrentSubaccount } = useTenant();

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccountId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      let data: PromptTemplate[];
      if (subAccountId) {
        // Load templates for specific subaccount with activation status
        data = await api.promptTemplates.getAllForSubAccount(subAccountId);
      } else {
        // Load all templates (global view)
        data = await api.promptTemplates.getAll();
      }

      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast({
        title: "Error",
        description: "Failed to load prompt templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    if (isGlobalView) {
      toast({
        title: "Error",
        description:
          "Please select a specific subaccount to activate templates. Templates cannot be activated globally.",
        variant: "destructive",
      });
      return;
    }

    if (!subAccountId) {
      toast({
        title: "Error",
        description:
          "No subaccount selected. Please select a subaccount first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActivating(id);
      await api.promptTemplates.activate(id, subAccountId);
      await loadTemplates(); // Reload to get updated status
      const currentSubaccount = getCurrentSubaccount?.();
      toast({
        title: "Success",
        description: `Template activated successfully for ${currentSubaccount?.name}`,
      });
    } catch (error) {
      console.error("Failed to activate template:", error);
      toast({
        title: "Error",
        description: "Failed to activate template",
        variant: "destructive",
      });
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await api.promptTemplates.deleteTemplate(id);
      await loadTemplates(); // Reload to get updated list
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prompt Templates</h1>
          <p className="text-gray-600 mt-2">
            Manage AI prompt templates for your sales conversations
            {getCurrentSubaccount?.() && (
              <span className="ml-2 text-blue-600 font-medium">
                (for {getCurrentSubaccount?.()?.name})
              </span>
            )}
            {isGlobalView && (
              <span className="ml-2 text-amber-600 font-medium">
                (Global View - Select a subaccount to activate templates)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => router.push("/admin/prompt-templates/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {template.description || "No description"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {(
                    getCurrentSubaccount?.()
                      ? template.isActiveForSubAccount
                      : template.isActive
                  ) ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {/* Template Details */}
                <div className="text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-2">
                    {template.category && (
                      <div>
                        <span className="font-medium">Category:</span>{" "}
                        {template.category}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Temperature:</span>{" "}
                      {template.temperature ?? 0.7}
                    </div>
                    {template.maxTokens && (
                      <div>
                        <span className="font-medium">Max Tokens:</span>{" "}
                        {template.maxTokens}
                      </div>
                    )}
                  </div>
                </div>

                {/* System Prompt Preview */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Base System Prompt:
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border max-h-20 overflow-hidden">
                    {template.baseSystemPrompt?.length > 100
                      ? `${template.baseSystemPrompt.substring(0, 100)}...`
                      : template.baseSystemPrompt}
                  </div>
                </div>

                {/* Created Info */}
                <div className="text-xs text-gray-500">
                  Created by {template.createdByAdmin.name} on{" "}
                  {formatDate(template.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/prompt-templates/${template.id}/edit`)
                    }
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {!(getCurrentSubaccount?.()
                    ? template.isActiveForSubAccount
                    : template.isActive) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(template.id)}
                      disabled={activating === template.id}
                      className="flex-1"
                    >
                      {activating === template.id ? (
                        "Activating..."
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{template.name}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting === template.id ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first prompt template.
          </p>
          <Button onClick={() => router.push("/admin/prompt-templates/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  );
}
