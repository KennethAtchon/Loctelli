"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormTemplate, FormSubmission } from "@/lib/api";
import { FileText, Users, Calendar, CheckCircle } from "lucide-react";
import logger from "@/lib/logger";
import { useTenant } from "@/contexts/tenant-context";

export default function FormsPage() {
  const router = useRouter();
  const { subAccountId } = useTenant();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>(
    []
  );
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    submissions: 0,
    newSubmissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">(
    "templates"
  );
  const isLoadingRef = useRef(false);

  // Use the pagination hook for templates
  const {
    pagination: templatePagination,
    paginatedData: paginatedTemplates,
    setCurrentPage: setTemplatePage,
    setTotalItems: setTotalTemplates,
  } = usePagination(filteredTemplates, { pageSize: 10 });

  // Calculate stats cards
  const statsCards: StatCard[] = [
    {
      title: "Total Forms",
      value: stats.total,
      icon: <FileText className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "Active Forms",
      value: stats.active,
      icon: <CheckCircle className="h-8 w-8" />,
      color: "text-green-600",
    },
    {
      title: "Total Submissions",
      value: stats.submissions,
      icon: <Users className="h-8 w-8" />,
      color: "text-purple-600",
    },
    {
      title: "New Submissions",
      value: stats.newSubmissions,
      icon: <Calendar className="h-8 w-8" />,
      color: "text-orange-600",
    },
  ];

  // Define columns for templates
  const templateColumns: Column<FormTemplate>[] = [
    {
      key: "name",
      header: "Form Name",
      render: (template) => (
        <div>
          <div className="font-medium">{template.name}</div>
          <div
            className="text-xs text-gray-500 cursor-pointer hover:text-blue-600"
            onClick={() => router.push(`/forms/${template.slug}`)}
          >
            /{template.slug}
          </div>
        </div>
      ),
    },
    {
      key: "title",
      header: "Display Title",
      render: (template) => <span>{template.title}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (template) => (
        <Badge variant={template.isActive ? "default" : "secondary"}>
          {template.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      render: (template) => (
        <span className="font-medium">{template._count?.submissions || 0}</span>
      ),
    },
    {
      key: "wakeUp",
      header: "Wake-up",
      render: (template) => (
        <Badge variant={template.requiresWakeUp ? "outline" : "secondary"}>
          {template.requiresWakeUp ? `${template.wakeUpInterval}s` : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "subAccount",
      header: "Sub-Account",
      render: (template) => template.subAccount?.name || "Global",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (template) => formatDate(template.createdAt),
    },
  ];

  // Define filters for templates
  const templateFilters: Filter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "wakeUp",
      label: "Wake-up",
      type: "select",
      options: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
      ],
    },
  ];

  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      logger.debug("⏸️ loadData already in progress, skipping");
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsRefreshing(true);
      setError(null);

      // Use tenant context for automatic filtering
      logger.debug("Loading forms with tenant subAccountId:", subAccountId);

      const [templatesData, submissionsData] = await Promise.all([
        api.forms.getFormTemplates(subAccountId || undefined),
        api.forms.getFormSubmissions(subAccountId || undefined),
      ]);

      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
      setSubmissions(submissionsData);
      setTotalTemplates(templatesData.length);

      // Calculate stats
      const activeTemplates = templatesData.filter((t) => t.isActive).length;
      const totalSubmissions = templatesData.reduce(
        (sum, t) => sum + (t._count?.submissions || 0),
        0
      );
      const newSubmissions = submissionsData.filter(
        (s) => s.status === "new"
      ).length;

      setStats({
        total: templatesData.length,
        active: activeTemplates,
        submissions: totalSubmissions,
        newSubmissions,
      });
    } catch (error) {
      logger.error("Failed to load forms data:", error);
      setError("Failed to load forms data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [subAccountId, setTotalTemplates]);

  // Handle search for templates
  const handleTemplateSearch = (term: string) => {
    const filtered = templates.filter(
      (template) =>
        template.name.toLowerCase().includes(term.toLowerCase()) ||
        template.title.toLowerCase().includes(term.toLowerCase()) ||
        template.slug.toLowerCase().includes(term.toLowerCase()) ||
        (template.description &&
          template.description.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTemplates(filtered);
    setTotalTemplates(filtered.length);
    setTemplatePage(1);
  };

  // Handle filters for templates
  const handleTemplateFilter = (key: string, value: string) => {
    let filtered = templates;

    if (key === "status" && value !== "all") {
      filtered = filtered.filter((template) =>
        value === "active" ? template.isActive : !template.isActive
      );
    }

    if (key === "wakeUp" && value !== "all") {
      filtered = filtered.filter((template) =>
        value === "enabled" ? template.requiresWakeUp : !template.requiresWakeUp
      );
    }

    setFilteredTemplates(filtered);
    setTotalTemplates(filtered.length);
    setTemplatePage(1);
  };

  // Handle actions
  const handleView = (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  const handleEdit = (template: FormTemplate) => {
    window.location.href = `/admin/forms/${template.id}/edit`;
  };

  const handleCreate = () => {
    window.location.href = "/admin/forms/new";
  };

  const handleViewSubmissions = () => {
    setActiveTab("submissions");
  };

  // Load data on mount and when subAccountId changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccountId]);

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

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

  if (activeTab === "submissions") {
    // Redirect to submissions page (to be created)
    window.location.href = "/admin/forms/submissions";
    return null;
  }

  return (
    <>
      <DataTable
        data={paginatedTemplates}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        columns={templateColumns}
        title="Form Management"
        description="Manage dynamic forms and view submission statistics"
        searchPlaceholder="Search forms..."
        filters={templateFilters}
        onSearchChange={handleTemplateSearch}
        onFilterChange={handleTemplateFilter}
        pagination={{
          currentPage: templatePagination.currentPage,
          totalPages: templatePagination.totalPages,
          pageSize: templatePagination.pageSize,
          totalItems: templatePagination.totalItems,
          onPageChange: setTemplatePage,
        }}
        onRefresh={loadData}
        onView={handleView}
        onEdit={handleEdit}
        onCreateClick={handleCreate}
        stats={statsCards}
        error={error}
        success={success}
        headerActions={
          <Button
            onClick={handleViewSubmissions}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            View Submissions
          </Button>
        }
      />

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <Dialog
          open={!!selectedTemplate}
          onOpenChange={() => setSelectedTemplate(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Details - {selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                Complete form configuration and statistics
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedTemplate.name}
                  </div>
                  <div>
                    <strong>Slug:</strong> /{selectedTemplate.slug}
                  </div>
                  <div>
                    <strong>Title:</strong> {selectedTemplate.title}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge
                      variant={
                        selectedTemplate.isActive ? "default" : "secondary"
                      }
                      className="ml-2"
                    >
                      {selectedTemplate.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <strong>Submissions:</strong>{" "}
                    {selectedTemplate._count?.submissions || 0}
                  </div>
                  <div>
                    <strong>Sub-Account:</strong>{" "}
                    {selectedTemplate.subAccount?.name || "Global"}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTemplate.description && (
                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedTemplate.description}
                  </div>
                </div>
              )}

              {/* Form Configuration */}
              <div>
                <h3 className="font-semibold mb-3">Form Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Submit Button:</strong>{" "}
                    {selectedTemplate.submitButtonText}
                  </div>
                  <div>
                    <strong>Success Message:</strong>{" "}
                    {selectedTemplate.successMessage}
                  </div>
                  <div>
                    <strong>Wake-up Required:</strong>{" "}
                    {selectedTemplate.requiresWakeUp ? "Yes" : "No"}
                  </div>
                  <div>
                    <strong>Wake-up Interval:</strong>{" "}
                    {selectedTemplate.wakeUpInterval}s
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <h3 className="font-semibold mb-3">
                  Form Fields ({selectedTemplate.schema.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedTemplate.schema.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-gray-600">
                            Type: {field.type} • ID: {field.id}
                            {field.required && " • Required"}
                          </div>
                          {field.placeholder && (
                            <div className="text-xs text-gray-500">
                              Placeholder: {field.placeholder}
                            </div>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Options: {field.options.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public URL */}
              <div>
                <h3 className="font-semibold mb-3">Public Access</h3>
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm">
                    <strong>Public URL:</strong>
                    <br />
                    <code className="text-blue-600">
                      {window.location.origin}/forms/
                      {selectedTemplate.slug}
                    </code>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedTemplate.createdAt)}
                  </div>
                  <div>
                    <strong>Updated:</strong>{" "}
                    {formatDate(selectedTemplate.updatedAt)}
                  </div>
                  <div>
                    <strong>Created by:</strong>{" "}
                    {selectedTemplate.createdByAdmin?.name}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
