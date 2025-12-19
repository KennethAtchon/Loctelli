import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { DataTable, Column, Filter, StatCard } from "@/components/customUI";
import { usePagination } from "@/components/customUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSubmission } from "@/lib/api";
import {
  Eye,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useTenant } from "@/contexts/tenant-context";
import { ROUTES } from "@/lib/routes";
import { AdminLayoutWrapper } from "@/components/admin/admin-layout-wrapper";

export const Route = createFileRoute(ROUTES.ADMIN.FORM_SUBMISSIONS)({
  component: () => (
    <AdminLayoutWrapper>
      <FormSubmissionsPage />
    </AdminLayoutWrapper>
  ),
});

function FormSubmissionsPage() {
  const navigate = useNavigate();
  const { subAccountId } = useTenant();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<
    FormSubmission[]
  >([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    reviewed: 0,
    contacted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use the pagination hook
  const {
    pagination,
    paginatedData: paginatedSubmissions,
    setCurrentPage,
    setTotalItems,
  } = usePagination(filteredSubmissions, { pageSize: 10 });

  // Calculate stats cards
  const statsCards: StatCard[] = [
    {
      title: "Total Submissions",
      value: stats.total,
      icon: <FileText className="h-8 w-8" />,
      color: "text-blue-600",
    },
    {
      title: "New Submissions",
      value: stats.new,
      icon: <AlertCircle className="h-8 w-8" />,
      color: "text-orange-600",
    },
    {
      title: "Reviewed",
      value: stats.reviewed,
      icon: <Eye className="h-8 w-8" />,
      color: "text-purple-600",
    },
    {
      title: "Contacted",
      value: stats.contacted,
      icon: <CheckCircle className="h-8 w-8" />,
      color: "text-green-600",
    },
  ];

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "reviewed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "contacted":
        return "bg-green-100 text-green-800 border-green-200";
      case "processed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Define columns for submissions
  const submissionColumns: Column<FormSubmission>[] = [
    {
      key: "formTemplate",
      header: "Form",
      render: (submission) => (
        <div>
          <div className="font-medium">{submission.formTemplate?.name}</div>
          <div className="text-sm text-gray-500">
            {submission.formTemplate?.title}
          </div>
        </div>
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (submission) => formatDate(submission.submittedAt),
    },
    {
      key: "status",
      header: "Status",
      render: (submission) => (
        <Badge className={getStatusColor(submission.status)}>
          {submission.status.charAt(0).toUpperCase() +
            submission.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (submission) => (
        <Badge
          variant="outline"
          className={getPriorityColor(submission.priority)}
        >
          {submission.priority}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (submission) => submission.assignedTo?.name || "Unassigned",
    },
    {
      key: "subAccount",
      header: "Sub-Account",
      render: (submission) => submission.subAccount?.name || "Global",
    },
  ];

  // Define filters for submissions
  const submissionFilters: Filter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "new", label: "New" },
        { value: "reviewed", label: "Reviewed" },
        { value: "contacted", label: "Contacted" },
        { value: "processed", label: "Processed" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
  ];

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const submissionsData = await api.forms.getFormSubmissions(
        subAccountId ?? undefined,
      );

      setSubmissions(submissionsData);
      setFilteredSubmissions(submissionsData);
      setTotalItems(submissionsData.length);

      // Calculate stats
      const newSubmissions = submissionsData.filter(
        (s) => s.status === "new",
      ).length;
      const reviewedSubmissions = submissionsData.filter(
        (s) => s.status === "reviewed",
      ).length;
      const contactedSubmissions = submissionsData.filter(
        (s) => s.status === "contacted",
      ).length;

      setStats({
        total: submissionsData.length,
        new: newSubmissions,
        reviewed: reviewedSubmissions,
        contacted: contactedSubmissions,
      });
    } catch (error) {
      console.error("Failed to load form submissions:", error);
      setError("Failed to load form submissions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [subAccountId, setTotalItems]);

  // Handle search for submissions
  const handleSubmissionSearch = (term: string) => {
    const filtered = submissions.filter(
      (submission) =>
        submission.formTemplate?.name
          ?.toLowerCase()
          .includes(term.toLowerCase()) ||
        submission.formTemplate?.title
          ?.toLowerCase()
          .includes(term.toLowerCase()) ||
        submission.status.toLowerCase().includes(term.toLowerCase()) ||
        submission.assignedTo?.name?.toLowerCase().includes(term.toLowerCase()),
    );
    setFilteredSubmissions(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  // Handle filters for submissions
  const handleSubmissionFilter = (key: string, value: string) => {
    let filtered = submissions;

    if (key === "status" && value !== "all") {
      filtered = filtered.filter((submission) => submission.status === value);
    }

    if (key === "priority" && value !== "all") {
      filtered = filtered.filter(
        (submission) => submission.priority.toLowerCase() === value,
      );
    }

    setFilteredSubmissions(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  // Handle actions
  const handleView = (submission: FormSubmission) => {
    navigate({
      to: "/admin/forms/submissions/$id",
      params: { id: submission.id },
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Show success message if there's success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/admin/forms" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Button>
        <h1 className="text-2xl font-bold">Form Submissions</h1>
      </div>

      <DataTable<FormSubmission>
        title="Form Submissions"
        data={paginatedSubmissions}
        columns={submissionColumns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        success={success}
        onSearchChange={handleSubmissionSearch}
        onFilterChange={handleSubmissionFilter}
        filters={submissionFilters}
        onView={handleView}
        pagination={{
          ...pagination,
          onPageChange: setCurrentPage,
        }}
        onRefresh={loadData}
        stats={statsCards}
        searchPlaceholder="Search submissions..."
        onCreateClick={() => navigate({ to: "/admin/forms" })}
      />
    </div>
  );
}
