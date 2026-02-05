import type { FormField } from "./types";

/**
 * Clamps current index to the nearest visible field index.
 * If current field is hidden, returns the next visible field index (forward bias).
 * @param schema - All form fields
 * @param visibleFields - Currently visible fields
 * @param currentIndex - Current field index in schema
 * @returns Clamped visible index
 */
export function clampToVisible(
  schema: FormField[],
  visibleFields: FormField[],
  currentIndex: number
): number {
  if (visibleFields.length === 0) return 0;

  const currentField = schema[currentIndex];
  if (currentField && visibleFields.some((f) => f.id === currentField.id)) {
    return visibleFields.findIndex((f) => f.id === currentField.id);
  }

  // Forward bias: find next visible field after currentIndex
  const nextVisible = visibleFields.findIndex((f) => {
    const schemaIndex = schema.findIndex((s) => s.id === f.id);
    return schemaIndex >= currentIndex;
  });

  return nextVisible >= 0 ? nextVisible : 0;
}
