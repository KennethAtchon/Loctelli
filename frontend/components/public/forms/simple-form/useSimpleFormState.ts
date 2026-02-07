import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  handleCheckboxChange: (
    fieldId: string,
    value: string,
    checked: boolean
  ) => void;
  handleFileUpload: (fieldId: string, file: File) => Promise<void>;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
} {
  const defaultValues = useMemo(
    () =>
      options.initialData
        ? { ...getInitialFormData(schema), ...options.initialData }
        : getInitialFormData(schema),
    [schema, options.initialData]
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues,
  });

  useEffect(() => {
    form.reset(
      options.initialData
        ? { ...getInitialFormData(schema), ...options.initialData }
        : getInitialFormData(schema)
    );
  }, [schema, options.initialData, form]);

  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile>
  >({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);

  const fileUploadMutation = useMutation({
    mutationFn: async ({ fieldId, file }: { fieldId: string; file: File }) => {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("fieldId", fieldId);
      return api.forms.uploadFormFile(slug, formDataUpload);
    },
  });

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
      form.setValue(fieldId, value);
      setFormError(null);
    },
    [form]
  );

  const handleCheckboxChange = useCallback(
    (fieldId: string, value: string, checked: boolean) => {
      const current = (form.getValues(fieldId) as string[]) || [];
      form.setValue(
        fieldId,
        checked ? [...current, value] : current.filter((v) => v !== value)
      );
      setFormError(null);
    },
    [form]
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
        form.setValue(fieldId, result.url);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "File upload failed";
        setFormError(errorMessage);
        throw error;
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    [fileUploadMutation, form]
  );

  const handleSubmit = useCallback(async () => {
    const data = form.getValues();
    if (!validateForm(schema, data)) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError(null);

    await submitMutation.mutateAsync({
      data,
      files: uploadedFiles,
      source: "simple-form",
    });
  }, [schema, form, uploadedFiles, submitMutation]);

  const resetForm = useCallback(() => {
    form.reset(
      options.initialData
        ? { ...getInitialFormData(schema), ...options.initialData }
        : getInitialFormData(schema)
    );
    setUploadedFiles({});
    setFormError(null);
  }, [schema, form, options.initialData]);

  return {
    formData: form.watch(),
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
