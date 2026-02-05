import { useState, useRef, useCallback } from "react";
import type { FormField } from "@/lib/forms/types";
import { getInitialFormData } from "@/lib/forms/form-validation";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

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
    logger.debug("📝 useCardFormData: Initializing form data", {
      schemaLength: schema.length,
      hasInitialData: !!initialData,
      initialDataKeys: initialData ? Object.keys(initialData) : [],
    });
    if (initialData) {
      return { ...getInitialFormData(schema), ...initialData };
    }
    return getInitialFormData(schema);
  });

  // Reset formData when schema identity changes
  const schemaId = schema.map((f) => f.id).join(",");
  const prevSchemaIdRef = useRef(schemaId);

  if (schemaId !== prevSchemaIdRef.current) {
    logger.debug("🔄 useCardFormData: Schema changed, resetting form data", {
      oldSchemaId: prevSchemaIdRef.current,
      newSchemaId: schemaId,
      schemaLength: schema.length,
    });
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
    logger.debug("✏️ useCardFormData: Input changed", {
      fieldId,
      valueType: typeof value,
      valueLength: Array.isArray(value) ? value.length : undefined,
      hasValue: value !== null && value !== undefined && value !== "",
    });
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleCheckboxChange = useCallback(
    (fieldId: string, value: string, checked: boolean) => {
      logger.debug("☑️ useCardFormData: Checkbox changed", {
        fieldId,
        value,
        checked,
      });
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
      logger.debug("📤 useCardFormData: Starting file upload", {
        fieldId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        slug,
        hasSessionToken: !!sessionToken,
      });
      setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }));
      try {
        const formDataObj = new FormData();
        formDataObj.append("file", file);
        formDataObj.append("fieldId", fieldId);

        const result = await api.forms.uploadFormFile(slug, formDataObj);
        logger.debug("✅ useCardFormData: File upload successful", {
          fieldId,
          fileName: file.name,
          result,
        });

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
        logger.error("❌ useCardFormData: File upload failed", {
          fieldId,
          fileName: file.name,
          error,
        });
        throw error; // Let caller handle error
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }));
        logger.debug("🏁 useCardFormData: File upload completed", {
          fieldId,
        });
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
