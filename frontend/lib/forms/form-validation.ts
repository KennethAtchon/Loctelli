import type { FormField } from "./types";
import { shouldShowField } from "./conditional-logic";

/**
 * Generates initial form data with default values for all fields.
 * @param schema - Form field schema
 * @returns Object with field IDs as keys and default values
 */
export function getInitialFormData(
  schema: FormField[]
): Record<string, unknown> {
  const initialData: Record<string, unknown> = {};

  for (const field of schema) {
    if (field.type === "checkbox") {
      initialData[field.id] = [];
    } else {
      initialData[field.id] = "";
    }
  }

  return initialData;
}

/**
 * Validates a single field value.
 * @param field - The field to validate
 * @param value - The value to validate
 * @returns true if valid, false otherwise
 */
export function validateField(
  field: FormField,
  value: unknown
): boolean {
  // Required check
  if (field.required) {
    if (value === "" || value === null || value === undefined) {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
  }

  // Type-specific validation
  switch (field.type) {
    case "email":
      if (value && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }
      return !field.required || value !== "";

    case "phone":
      if (value && typeof value === "string") {
        // Basic phone validation (adjust regex as needed)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(value.replace(/\s/g, ""));
      }
      return !field.required || value !== "";

    case "select":
    case "radio":
      if (value && field.options) {
        return field.options.includes(String(value));
      }
      return !field.required || value !== "";

    case "checkbox":
      if (Array.isArray(value) && field.options) {
        return value.every((v) => field.options!.includes(String(v)));
      }
      return Array.isArray(value);

    default:
      return true;
  }
}

/**
 * Validates all required fields in the form.
 * Only validates visible fields (fields that pass conditional logic).
 * @param schema - Form field schema
 * @param formData - Current form data values
 * @returns true if all required fields are valid, false otherwise
 */
export function validateForm(
  schema: FormField[],
  formData: Record<string, unknown>
): boolean {
  for (const field of schema) {
    // Only validate visible fields
    if (!shouldShowField(field, formData)) {
      continue;
    }

    const value = formData[field.id];
    if (!validateField(field, value)) {
      return false;
    }
  }

  return true;
}
