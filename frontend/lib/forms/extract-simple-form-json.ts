import type { CreateFormTemplateDto } from "./types";

/**
 * Type guard to check if an object is a valid Simple Form Template.
 * Simple forms have formType: "SIMPLE" and use schema array (no flowchartGraph).
 */
export function isSimpleFormTemplateJson(
  obj: unknown
): obj is CreateFormTemplateDto {
  if (!obj || typeof obj !== "object") return false;

  const o = obj as Record<string, unknown>;

  // Required basic properties
  if (typeof o.name !== "string" || !o.name) return false;
  if (typeof o.slug !== "string" || !o.slug) return false;
  if (typeof o.title !== "string" || !o.title) return false;
  if (o.formType !== "SIMPLE") return false;

  // Schema must be an array
  if (!Array.isArray(o.schema)) return false;

  // Basic validation of schema fields
  for (const field of o.schema) {
    if (!field || typeof field !== "object") return false;
    const f = field as Record<string, unknown>;
    if (typeof f.id !== "string" || !f.id) return false;
    if (typeof f.type !== "string" || !f.type) return false;
    if (typeof f.label !== "string" || !f.label) return false;

    // Validate field type
    const validTypes = [
      "text",
      "textarea",
      "select",
      "checkbox",
      "radio",
      "file",
      "image",
      "statement",
    ];
    if (!validTypes.includes(f.type)) return false;

    // For select/radio/checkbox, options should be present
    if (
      ["select", "radio", "checkbox"].includes(f.type) &&
      !Array.isArray(f.options)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Extract Simple Form Template JSON from assistant text (e.g. markdown ```json block or raw JSON).
 * Returns the first valid SimpleFormTemplateJson found, or null.
 */
export function extractSimpleFormJsonFromText(
  text: string
): CreateFormTemplateDto | null {
  if (!text || typeof text !== "string") return null;

  // Try markdown code block first (```json ... ```)
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim()) as unknown;
      if (isSimpleFormTemplateJson(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  // Try to find a raw JSON object (has schema and formType: "SIMPLE")
  const objectMatch = text.match(/\{[\s\S]*?(?:"formType"|"schema")[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]) as unknown;
      if (isSimpleFormTemplateJson(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  return null;
}
