/**
 * Centralized form field type definitions and metadata.
 *
 * Single source of truth for:
 * - Which field types exist (FormFieldType in types.ts)
 * - Display labels and descriptions for admin UI
 * - Helpers (hasOptions, default value, etc.)
 *
 * Used by: form-field-editor (simple), card-settings-panel (card), json-import-dialog,
 * logic-builder, flowchart serialization, and any UI that lists or validates field types.
 */

import type { FormFieldType } from "./types";

/** Metadata for each field type shown in admin dropdowns and docs */
export interface FormFieldTypeOption {
  value: FormFieldType;
  label: string;
  description: string;
  /** Whether this type uses the options array (select, radio, checkbox) */
  hasOptions: boolean;
  /** Whether this type is a question that collects input (excludes statement) */
  isInput: boolean;
}

/** All field types available in both Simple and Card forms (excluding statement, which is card-only in builder) */
export const FORM_FIELD_TYPE_OPTIONS: FormFieldTypeOption[] = [
  {
    value: "text",
    label: "Text Input",
    description: "Single-line text (e.g. name, short answer)",
    hasOptions: false,
    isInput: true,
  },
  {
    value: "textarea",
    label: "Text Area",
    description: "Multi-line text (e.g. message, comments)",
    hasOptions: false,
    isInput: true,
  },
  {
    value: "select",
    label: "Select Dropdown",
    description: "Single choice from a dropdown",
    hasOptions: true,
    isInput: true,
  },
  {
    value: "radio",
    label: "Radio Buttons",
    description: "Single choice from visible options",
    hasOptions: true,
    isInput: true,
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "Multiple choices; user can select several options",
    hasOptions: true,
    isInput: true,
  },
  {
    value: "file",
    label: "File Upload",
    description: "User uploads a file",
    hasOptions: false,
    isInput: true,
  },
  {
    value: "image",
    label: "Image Upload",
    description: "User uploads an image",
    hasOptions: false,
    isInput: true,
  },
];

/** Field types that use the options array (select, radio, checkbox) */
export const FIELD_TYPES_WITH_OPTIONS: FormFieldType[] = [
  "select",
  "radio",
  "checkbox",
];

export function fieldTypeHasOptions(type: FormFieldType): boolean {
  return FIELD_TYPES_WITH_OPTIONS.includes(type);
}

/** For logic builder: field types that can be used in conditions (excludes statement) */
export function isConditionableFieldType(type: FormFieldType): boolean {
  return type !== "statement";
}

/** Get option metadata by value (for labels in UI) */
export function getFieldTypeOption(
  type: FormFieldType
): FormFieldTypeOption | undefined {
  return FORM_FIELD_TYPE_OPTIONS.find((o) => o.value === type);
}
