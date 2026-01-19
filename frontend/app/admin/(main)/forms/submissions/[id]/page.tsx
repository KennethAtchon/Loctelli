"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Mail,
  Building,
  CheckCircle,
  Clock,
  FileText,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type {
  FormSubmission,
  UpdateFormSubmissionDto,
  FormField,
  UploadedFile,
} from "@/lib/api/endpoints/forms";

export default function FormSubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateFormSubmissionDto>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const submissionData = await api.forms.getFormSubmission(submissionId);
      setSubmission(submissionData);
      setUpdateData({
        status: submissionData.status,
        priority: submissionData.priority,
        assignedToId: submissionData.assignedToId,
      });
    } catch (error: unknown) {
      console.error("Failed to load submission:", error);
      toast({
        title: "Error",
        description: "Failed to load form submission",
        variant: "destructive",
      });
      router.push("/admin/forms/submissions");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!submission) return;

    setLoading(true);
    try {
      const updatedSubmission = await api.forms.updateFormSubmission(
        submissionId,
        updateData
      );
      setSubmission(updatedSubmission);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Form submission updated successfully",
      });
    } catch (error: unknown) {
      console.error("Failed to update submission:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update form submission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  // Helper function to render form field value
  const renderFieldValue = (field: FormField | undefined, value: unknown) => {
    if (!value && value !== false && value !== 0) return "N/A";

    switch (field?.type) {
      case "email":
        return (
          <a
            href={`mailto:${String(value)}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {String(value)}
          </a>
        );
      case "phone":
        return (
          <a
            href={`tel:${String(value)}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {String(value)}
          </a>
        );
      case "checkbox":
        return value ? "Yes" : "No";
      case "file":
      case "image":
        if (typeof value === "object" && value !== null && "url" in value) {
          const fileValue = value as UploadedFile;
          return (
            <a
              href={fileValue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              {fileValue.originalName || "View File"}
            </a>
          ) as React.ReactNode;
        }
        return String(value);
      default:
        return String(value);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading form submission...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Form submission not found</p>
          <Button
            onClick={() => router.push("/admin/forms/submissions")}
            className="mt-4"
          >
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  const schema: FormField[] = submission.formTemplate?.schema || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/forms/submissions")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Button>
        <h1 className="text-2xl font-bold">Form Submission Details</h1>
        <div className="ml-auto">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                size="sm"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading} size="sm">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {submission.formTemplate?.name}
              </CardTitle>
              <CardDescription>
                {submission.formTemplate?.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Submitted:</span>
                  <br />
                  {formatDate(submission.submittedAt)}
                </div>
                <div>
                  <span className="font-medium">Source:</span>
                  <br />
                  {submission.source}
                </div>
                {submission.ipAddress && (
                  <div>
                    <span className="font-medium">IP Address:</span>
                    <br />
                    {submission.ipAddress}
                  </div>
                )}
                {submission.userAgent && (
                  <div className="col-span-2">
                    <span className="font-medium">User Agent:</span>
                    <br />
                    <span className="text-gray-600 text-xs">
                      {submission.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schema.length > 0 ? (
                schema.map((field) => {
                  const value = submission.data[field.id];
                  return (
                    <div
                      key={field.id}
                      className="border-b border-gray-100 pb-3 last:border-b-0"
                    >
                      <Label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <div className="mt-1 text-sm">
                        {renderFieldValue(field, value)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-sm">
                  No form schema available. Raw data:
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(submission.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          {submission.files && Object.keys(submission.files).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attached Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(submission.files || {}).map(
                    ([fieldId, fileInfo]: [string, UploadedFile]) => (
                      <div
                        key={fieldId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {fileInfo.originalName || "Unknown File"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {"size" in fileInfo && fileInfo.size
                              ? `${Math.round((fileInfo.size as number) / 1024)} KB`
                              : "Unknown size"}
                          </div>
                        </div>
                        {fileInfo.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(fileInfo.url, "_blank")}
                          >
                            View File
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={updateData.status}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={updateData.priority}
                      onValueChange={(value) =>
                        setUpdateData((prev) => ({
                          ...prev,
                          priority: value as
                            | "LOW"
                            | "MEDIUM"
                            | "HIGH"
                            | "URGENT",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.charAt(0).toUpperCase() +
                          submission.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Priority</Label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={getPriorityColor(submission.priority)}
                      >
                        {submission.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-500">Assigned To</Label>
                  <div className="mt-1">
                    {submission.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{submission.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Sub-Account</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{submission.subAccount?.name || "Global"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">Submitted</div>
                    <div className="text-gray-500">
                      {formatDate(submission.submittedAt)}
                    </div>
                  </div>
                </div>
                {submission.reviewedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Reviewed</div>
                      <div className="text-gray-500">
                        {formatDate(submission.reviewedAt)}
                      </div>
                    </div>
                  </div>
                )}
                {submission.contactedAt && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Contacted</div>
                      <div className="text-gray-500">
                        {formatDate(submission.contactedAt)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-gray-500">
                      {formatDate(submission.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
