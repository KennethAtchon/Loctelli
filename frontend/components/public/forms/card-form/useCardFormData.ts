import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormField } from "@/lib/forms/types";
import { getInitialFormData } from "@/lib/forms/form-validation";
import { api } from "@/lib/api";

/**
 * Hook to manage form data (values, validation, file uploads).
 * Uses lazy initialization and resets when schema changes.
 */
export function useCardFormData(
  schema: FormField[],
  initialData?: Record<string, unknown>
): {
  formData: Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (
    fieldId: string,
    value: string,
    checked: boolean
  ) => void;
  handleFileUpload: (
    fieldId: string,
    file: File,
    slug: string,
    sessionToken?: string
  ) => Promise<void>;
} {
  // Initialize formData once when schema is ready (lazy init)
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (initialData) {
      return { ...getInitialFormData(schema), ...initialData };
    }
    return getInitialFormData(schema);
  });

  // Reset formData when schema identity changes
  const schemaId = schema.map((f) => f.id).join(",");
  const prevSchemaIdRef = useRef(schemaId);

  if (schemaId !== prevSchemaIdRef.current) {
    prevSchemaIdRef.current = schemaId;
    setFormData(
      initialData
        ? { ...getInitialFormData(schema), ...initialData }
        : getInitialFormData(schema)
    );
  }

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>(
    {}
  );
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );

  const handleInputChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

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
    },
    []
  );

  // Note: File upload mutation is created per-call since slug is dynamic
  const handleFileUpload = useCallback(
    async (
      fieldId: string,
      file: File,
      slug: string,
      sessionToken?: string
    ): Promise<void> => {
      setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
      try {
        const formDataObj = new FormData();
        formDataObj.append("file", file);
        formDataObj.append("fieldId", fieldId);

        const result = await api.forms.uploadFormFile(slug, formDataObj);

        setUploadedFiles((prev) => ({
          ...prev,
          [fieldId]: [...(prev[fieldId] || []), file],
        }));

        // Store file URL in formData if needed
        setFormData((prev) => ({
          ...prev,
          [fieldId]: [...((prev[fieldId] as File[]) || []), file],
        }));
      } catch (error) {
        console.error("File upload failed:", error);
        throw error; // Let caller handle error
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
      }
    },
    []
  );

  return {
    formData,
    setFormData,
    uploadedFiles,
    uploadingFiles,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
  };
}
