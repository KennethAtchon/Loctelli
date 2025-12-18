import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormTemplate } from "@/lib/api";
import {
  FileText,
  Users,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useTenant } from "@/contexts/tenant-context";
import { toast } from "sonner";

export const Route = createFileRoute('/admin/forms')({
  component: AdminFormsPage,
});

function AdminFormsPage() {
  const navigate = useNavigate();
  const { subAccountId } = useTenant();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    active: 0,
    submissions: 0,
    newSubmissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const { pagination, paginatedData, setCurrentPage, setTotalItems } =
    usePagination(filteredTemplates, { pageSize: 10 });

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

  const templateColumns: Column<FormTemplate>[] = [
    {
      key: "name",
      header: "Form Name",
      render: (template) => (
        <div>
          <div className="font-medium">{template.name}</div>
          <div className="text-xs text-gray-500">/{template.slug}</div>
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

  const filters: Filter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const loadTemplates = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const [templatesData, statsData] = await Promise.all([
        api.forms.getFormTemplates(),
        api.forms.getFormStats(),
      ]);
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
      setStats(statsData);
      setTotalItems(templatesData.length);
    } catch (error) {
      console.error("Failed to load forms:", error);
      setError("Failed to load forms");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setTotalItems]);

  const handleSearch = (term: string) => {
    const filtered = templates.filter(
      (template) =>
        template.name.toLowerCase().includes(term.toLowerCase()) ||
        template.title.toLowerCase().includes(term.toLowerCase()) ||
        template.slug.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredTemplates(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  const handleFilter = (key: string, value: string) => {
    let filtered = templates;
    if (key === "status" && value !== "all") {
      const isActive = value === "active";
      filtered = filtered.filter((template) => template.isActive === isActive);
    }
    setFilteredTemplates(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  const handleView = async (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  const handleEdit = (template: FormTemplate) => {
    // Navigate to edit page - route not yet implemented
    console.log("Edit form:", template.id);
    toast("Form editing not yet implemented");
  };

  const handleDelete = async (template: FormTemplate) => {
    if (confirm("Are you sure you want to delete this form template?")) {
      try {
        setError(null);
        await api.forms.deleteFormTemplate(template.id);
        setSuccess("Form template deleted successfully");
        loadTemplates();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Failed to delete form:", error);
        setError("Failed to delete form. Please try again.");
      }
    }
  };

  const handleCreate = () => {
    // Navigate to create page - route not yet implemented
    toast("Form creation not yet implemented");
  };

  const handleViewSubmissions = () => {
    // Navigate to submissions page - route not yet implemented
    toast("Form submissions view not yet implemented");
  };

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <DataTable
        data={paginatedData}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        columns={templateColumns}
        title="Form Templates"
        description="Manage form templates and view submissions"
        searchPlaceholder="Search forms..."
        filters={filters}
        onSearchChange={handleSearch}
        onFilterChange={handleFilter}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
          totalItems: pagination.totalItems,
          onPageChange: setCurrentPage,
        }}
        onCreateClick={handleCreate}
        onRefresh={loadTemplates}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        stats={statsCards}
        error={error}
        success={success}
      />

      {selectedTemplate && (
        <Dialog
          open={!!selectedTemplate}
          onOpenChange={() => setSelectedTemplate(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Details - {selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                Complete form template information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedTemplate.name}
                  </div>
                  <div>
                    <strong>Slug:</strong> {selectedTemplate.slug}
                  </div>
                  <div>
                    <strong>Title:</strong> {selectedTemplate.title}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge variant={selectedTemplate.isActive ? "default" : "secondary"} className="ml-2">
                      {selectedTemplate.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTemplate.description && (
                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-sm text-gray-700">{selectedTemplate.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Wake-up Settings</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Requires Wake-up:</strong> {selectedTemplate.requiresWakeUp ? "Yes" : "No"}
                  </div>
                  {selectedTemplate.requiresWakeUp && (
                    <div>
                      <strong>Interval:</strong> {selectedTemplate.wakeUpInterval}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

