"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { FormTemplate, FormField, api, UploadedFile } from "@/lib/api";
import logger from "@/lib/logger";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";
import Image from "next/image";

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile>
  >({});

  // Wake-up mechanism - use ref instead of state to avoid infinite loops
  const wakeUpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const formsApi = api.forms;
  const isLoadingRef = useRef(false);

  // This is getting called multiple times on page load, not being debounced, I dont know why
  const wakeUpDatabase = useCallback(async () => {
    logger.info("Waking up database");
    try {
      await formsApi.wakeUpDatabase();
      logger.debug("Database wake-up successful");
    } catch (error) {
      logger.error("Database wake-up failed:", error);
    }
  }, [formsApi]);

  const loadForm = useCallback(async () => {
    // Prevent multiple simultaneous calls
    logger.info("Loading form for slug: ", slug);
    if (isLoadingRef.current) {
      logger.debug("⏸️ loadForm already in progress, skipping");
      return;
    }

    // Prevent loading reserved slugs
    if (slug === "wake-up" || slug === "invalid-form") {
      setError("Invalid form URL");
      setIsLoading(false);
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Always wake up database first to prevent cold start issues
      logger.info("Waking up database before loading form");
      try {
        await wakeUpDatabase();
      } catch (wakeError) {
        logger.warn("Initial wake-up failed, continuing anyway:", wakeError);
      }

      // Try to load the form - if it fails, retry once after a short delay
      let formTemplate: FormTemplate;
      try {
        formTemplate = await formsApi.getPublicForm(slug);
      } catch (firstError) {
        logger.warn("First form load attempt failed, retrying after wake-up:", firstError);
        // Wait a bit for database to fully wake up
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Retry the wake-up and then the form load
        await wakeUpDatabase();
        formTemplate = await formsApi.getPublicForm(slug);
      }

      setTemplate(formTemplate);

      // Initialize form data with default values
      const initialData: Record<string, unknown> = {};
      formTemplate.schema.forEach((field: FormField) => {
        if (field.type === "checkbox") {
          initialData[field.id] = [];
        } else {
          initialData[field.id] = "";
        }
      });
      setFormData(initialData);

      // Set up wake-up mechanism if required
      if (formTemplate.requiresWakeUp) {
        // Clear any existing interval first
        if (wakeUpIntervalRef.current) {
          clearInterval(wakeUpIntervalRef.current);
        }

        // Set up periodic wake-up
        const interval = setInterval(
          wakeUpDatabase,
          formTemplate.wakeUpInterval * 1000
        );
        wakeUpIntervalRef.current = interval;
      }
    } catch (error) {
      logger.error("Failed to load form:", error);
      setError(error instanceof Error ? error.message : "Failed to load form");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [slug, wakeUpDatabase, formsApi]);

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleCheckboxChange = (
    fieldId: string,
    option: string,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentValues = (prev[fieldId] as string[] | undefined) || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option],
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((val: string) => val !== option),
        };
      }
    });
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!file) return;

    try {
      setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
      setError(null);

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("fieldId", fieldId);

      const uploadResult = await formsApi.uploadFormFile(slug, uploadFormData);

      // Store uploaded file info
      setUploadedFiles((prev) => ({
        ...prev,
        [fieldId]: uploadResult,
      }));

      // Update form data with file URL
      handleInputChange(fieldId, uploadResult.url);
    } catch (error) {
      logger.error("File upload failed:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const validateForm = () => {
    if (!template) return false;

    for (const field of template.schema) {
      if (field.required) {
        const value = formData[field.id] as string | string[] | undefined;
        if (
          !value ||
          (Array.isArray(value) && value.length === 0) ||
          value.toString().trim() === ""
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template || !validateForm()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await formsApi.submitPublicForm(slug, {
        data: formData,
        files: uploadedFiles,
        source: "website",
      });

      setSuccess(true);
    } catch (error) {
      logger.error("Failed to submit form:", error);
      setError("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = (formData[field.id] as string | undefined) || "";

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "phone"
                    ? "tel"
                    : "text"
              }
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(field.id, val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={field.placeholder || "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "radio":
        return (
          <div key={field.id} className="space-y-3">
            <Label>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => handleInputChange(field.id, val)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label
                    htmlFor={`${field.id}-${option}`}
                    className="font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "checkbox":
        const selectedValues =
          (formData[field.id] as string[] | undefined) || [];
        return (
          <div key={field.id} className="space-y-3">
            <Label>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.id, option, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`${field.id}-${option}`}
                    className="font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "file":
      case "image":
        const isUploading = uploadingFiles[field.id];
        const uploadedFile = uploadedFiles[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              accept={field.type === "image" ? "image/*" : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(field.id, file);
                }
              }}
              required={field.required && !uploadedFile}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="flex items-center text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </div>
            )}
            {uploadedFile && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                {uploadedFile.originalName} uploaded successfully
                {field.type === "image" && uploadedFile.url && (
                  <div className="mt-2">
                    <Image
                      src={uploadedFile.url}
                      alt="Uploaded image"
                      width={320}
                      height={128}
                      className="max-w-xs max-h-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              {field.type === "image"
                ? "Upload an image file"
                : "Upload a file"}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    console.log("UseEffect called ");
    loadForm();

    // Cleanup wake-up interval on unmount
    return () => {
      console.log("UseEffect cleanup called ");
      if (wakeUpIntervalRef.current) {
        console.log("Clearing wake-up interval");
        clearInterval(wakeUpIntervalRef.current);
        wakeUpIntervalRef.current = null;
      }
    };
  }, [loadForm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading form...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (success && template) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
              <p className="text-gray-600">{template.successMessage}</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>{template.title}</CardTitle>
              {template.subtitle && (
                <CardDescription>{template.subtitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {template.schema.map(renderField)}

                <Button
                  type="submit"
                  disabled={isSubmitting || !validateForm()}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    template.submitButtonText
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
