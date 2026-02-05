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
