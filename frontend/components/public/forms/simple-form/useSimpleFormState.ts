import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type {
  FormField,
  CreateFormSubmissionDto,
  UploadedFile,
} from "@/lib/forms/types";
import { getInitialFormData, validateForm } from "@/lib/forms/form-validation";
import { api } from "@/lib/api";

export interface UseSimpleFormStateOptions {
  initialData?: Record<string, unknown>;
  onSubmitSuccess?: (result: unknown) => void;
  onSubmitError?: (error: Error) => void;
}

export function useSimpleFormState(
  schema: FormField[],
  slug: string,
  options: UseSimpleFormStateOptions = {}
): {
  formData: Record<string, unknown>;
  uploadedFiles: Record<string, UploadedFile>;
  uploadingFiles: Record<string, boolean>;
  isSubmitting: boolean;
  formError: string | null;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (fieldId: string, value: string, checked: boolean) => void;
  handleFileUpload: (fieldId: string, file: File) => Promise<void>;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
} {
  // Initialize form data
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial = getInitialFormData(schema);
    if (options.initialData) {
      return { ...initial, ...options.initialData };
    }
    return initial;
  });

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile>
  >({});
  const [uploadingFiles, setUploadingFiles] = useState<
    Record<string, boolean>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  // TanStack Query: File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async ({
      fieldId,
      file,
    }: {
      fieldId: string;
      file: File;
    }) => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("fieldId", fieldId);
      return api.forms.uploadFormFile(slug, formDataUpload);
    },
  });

  // TanStack Query: Form submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: CreateFormSubmissionDto) => {
      return api.forms.submitPublicForm(slug, data);
    },
    onSuccess: (result) => {
      if (options.onSubmitSuccess) {
        options.onSubmitSuccess(result);
      }
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      setFormError(errorMessage);
      if (options.onSubmitError) {
        options.onSubmitError(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    },
  });

  const handleInputChange = useCallback(
    (fieldId: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
      // Clear error when user starts typing
      setFormError(null);
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (fieldId: string, value: string, checked: boolean) => {
      setFormData((prev) => {
        const current = (prev[fieldId] as string[]) || [];
        if (checked) {
          return { ...prev, [fieldId]: [...current, value] };
        } else {
          return { ...prev, [fieldId]: current.filter((v) => v !== value) };
        }
      });
      setFormError(null);
    },
    []
  );

  const handleFileUpload = useCallback(
    async (fieldId: string, file: File) => {
      setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
      setFormError(null);

      try {
        const result = await fileUploadMutation.mutateAsync({
          fieldId,
          file,
        });
        setUploadedFiles((prev) => ({
          ...prev,
          [fieldId]: result,
        }));
        // Update form data with file URL
        setFormData((prev) => ({
          ...prev,
          [fieldId]: result.url,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "File upload failed";
        setFormError(errorMessage);
        throw error;
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [fileUploadMutation]
  );

  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm(schema, formData)) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError(null);

    // Submit using TanStack Query mutation
    // Note: formTemplateId should be passed from template, but for now we'll let the API handle it
    await submitMutation.mutateAsync({
      data: formData,
      files: uploadedFiles,
      source: "simple-form",
    });
  }, [schema, formData, uploadedFiles, submitMutation]);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(schema));
    setUploadedFiles({});
    setFormError(null);
  }, [schema]);

  return {
    formData,
    uploadedFiles,
    uploadingFiles,
    isSubmitting: submitMutation.isPending,
    formError: formError || (submitMutation.error?.message ?? null),
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
    handleSubmit,
    resetForm,
  };
}
