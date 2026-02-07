/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate a variable-style key for piping (e.g. "What's your name?" → "whats_your_name").
 * Safe for {{pipingKey}} use: lowercase letters, numbers, underscores only; no leading number.
 */
export function labelToPipingKey(label: string): string {
  const raw = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
  if (!raw) return "field";
  if (/^\d/.test(raw)) return `q_${raw}`;
  return raw;
}

/**
 * Validate form template data
 */
export interface FormValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFormTemplate(
  name: string,
  slug: string,
  title: string,
  schema: unknown[],
  isCardForm: boolean
): FormValidationResult {
  if (!name.trim() || !slug.trim() || !title.trim()) {
    return {
      isValid: false,
      error: "Name, slug, and title are required",
    };
  }

  if (!isCardForm && schema.length === 0) {
    return {
      isValid: false,
      error: "At least one form field is required for Simple Forms",
    };
  }

  return { isValid: true };
}
