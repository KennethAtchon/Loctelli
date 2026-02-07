"use client";

import { useMemo, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  flowchartToSchema,
  schemaToFlowchart,
} from "@/lib/forms/flowchart-serialization";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import type { FormField, FormType, ProfileEstimation } from "@/lib/forms/types";
import type { ProfileEstimationFormValues } from "@/components/admin/forms/profile-estimation/profile-estimation-form-types";
import { generateStableId } from "@/lib/utils/stable-id";

/** Form values shape shared by Create and Edit (for RHF). Parent owns profile estimation as expanded form shape. */
export type FormTemplateFormValues = {
  name: string;
  slug: string;
  description?: string;
  formType?: FormType;
  schema: FormField[];
  title: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  cardSettings?: Record<string, unknown>;
  profileEstimation?: ProfileEstimationFormValues;
  isActive?: boolean;
  [key: string]: unknown;
};

export interface UseFormTemplateFormStateRHFOptions {
  exportFileName?: string;
}

/**
 * Form template state driven by React Hook Form. Use with useForm<FormTemplateFormValues>.
 */
export function useFormTemplateFormStateRHF(
  form: UseFormReturn<FormTemplateFormValues>,
  options: UseFormTemplateFormStateRHFOptions = {}
): Omit<
  UseFormTemplateFormStateReturn<FormTemplateFormValues>,
  "handleInputChange"
> {
  const { toast } = useToast();
  const { exportFileName } = options;

  const defaultFlowchartGraph = useMemo(
    () => schemaToFlowchart([]) as FlowchartGraph,
    []
  );

  const cardSettings = form.watch("cardSettings");
  const cardFormSchema = useMemo(
    () =>
      flowchartToSchema(
        (cardSettings?.flowchartGraph as FlowchartGraph | undefined) ??
          defaultFlowchartGraph
      ),
    [cardSettings?.flowchartGraph, defaultFlowchartGraph]
  );

  const addField = useCallback(() => {
    const schema = form.getValues("schema") ?? [];
    const newField: FormField = {
      id: generateStableId("field"),
      type: "text",
      label: "",
      required: false,
    };
    form.setValue("schema", [...schema, newField]);
  }, [form]);

  const updateField = useCallback(
    (index: number, updates: Partial<FormField>) => {
      const schema = form.getValues("schema") ?? [];
      form.setValue(
        "schema",
        schema.map((field, i) =>
          i === index ? { ...field, ...updates } : field
        )
      );
    },
    [form]
  );

  const removeField = useCallback(
    (index: number) => {
      const schema = form.getValues("schema") ?? [];
      form.setValue(
        "schema",
        schema.filter((_, i) => i !== index)
      );
    },
    [form]
  );

  const exportSchemaToJSON = useCallback(() => {
    const schema = form.getValues("schema") ?? [];
    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName ?? form.getValues("slug") ?? "form-schema"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Form schema exported successfully",
    });
  }, [form, exportFileName, toast]);

  const handleImportFields = useCallback(
    (fields: FormField[]) => {
      form.setValue("schema", fields);
    },
    [form]
  );

  return {
    defaultFlowchartGraph,
    cardFormSchema,
    addField,
    updateField,
    removeField,
    exportSchemaToJSON,
    handleImportFields,
  };
}

/** Minimal shape needed for card/schema form state (shared by Create and Update DTOs). */
export interface FormTemplateFormState {
  schema?: FormField[];
  cardSettings?: Record<string, unknown>;
  formType?: string;
}

export interface UseFormTemplateFormStateOptions {
  /** Used for JSON export filename (e.g. template slug or form slug). */
  exportFileName?: string;
}

export interface UseFormTemplateFormStateReturn<T> {
  /** Stable default graph when no flowchart is saved. */
  defaultFlowchartGraph: FlowchartGraph;
  /** For card forms: schema derived from flowchart graph. */
  cardFormSchema: FormField[];
  handleInputChange: (
    field: keyof T,
    value:
      | string
      | number
      | boolean
      | FormField[]
      | Record<string, unknown>
      | ProfileEstimationFormValues
      | import("@/lib/forms/types").ProfileEstimation
      | undefined
  ) => void;
  addField: () => void;
  updateField: (index: number, updates: Partial<FormField>) => void;
  removeField: (index: number) => void;
  exportSchemaToJSON: () => void;
  handleImportFields: (fields: FormField[]) => void;
}

/**
 * Shared form state logic for both New and Edit form template pages.
 * Keeps hook order stable and avoids duplicating flowchart/schema logic.
 */
export function useFormTemplateFormState<
  T extends {
    schema?: FormField[];
    cardSettings?: Record<string, unknown>;
    slug?: string;
  },
>(
  formData: T,
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  options: UseFormTemplateFormStateOptions = {}
): UseFormTemplateFormStateReturn<T> {
  const { toast } = useToast();
  const { exportFileName } = options;

  const defaultFlowchartGraph = useMemo(
    () => schemaToFlowchart([]) as FlowchartGraph,
    []
  );

  const cardFormSchema = useMemo(
    () =>
      flowchartToSchema(
        (formData.cardSettings?.flowchartGraph as FlowchartGraph | undefined) ??
          defaultFlowchartGraph
      ),
    [formData.cardSettings?.flowchartGraph, defaultFlowchartGraph]
  );

  const handleInputChange = useCallback(
    (
      field: keyof T,
      value:
        | string
        | number
        | boolean
        | FormField[]
        | Record<string, unknown>
        | ProfileEstimation
        | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData]
  );

  const currentSchema = formData.schema ?? [];

  const addField = useCallback(() => {
    const newField: FormField = {
      id: generateStableId("field"),
      type: "text",
      label: "",
      required: false,
    };
    setFormData((prev) => ({
      ...prev,
      schema: [...(prev.schema ?? []), newField],
    }));
  }, [setFormData]);

  const updateField = useCallback(
    (index: number, updates: Partial<FormField>) => {
      setFormData((prev) => {
        const schema = prev.schema ?? [];
        return {
          ...prev,
          schema: schema.map((field, i) =>
            i === index ? { ...field, ...updates } : field
          ),
        };
      });
    },
    [setFormData]
  );

  const removeField = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        schema: (prev.schema ?? []).filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const exportSchemaToJSON = useCallback(() => {
    const jsonString = JSON.stringify(currentSchema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName ?? formData.slug ?? "form-schema"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Form schema exported successfully",
    });
  }, [currentSchema, exportFileName, formData.slug, toast]);

  const handleImportFields = useCallback(
    (fields: FormField[]) => {
      setFormData((prev) => ({ ...prev, schema: fields }));
    },
    [setFormData]
  );

  return {
    defaultFlowchartGraph,
    cardFormSchema,
    handleInputChange,
    addField,
    updateField,
    removeField,
    exportSchemaToJSON,
    handleImportFields,
  };
}
