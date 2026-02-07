/**
 * Generate a stable unique ID for form array items and schema fields.
 * Uses crypto.randomUUID when available to avoid Date.now()-based IDs
 * that cause remounts and focus loss when keys change on re-render.
 */
export function generateStableId(prefix?: string): string {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `id_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  return prefix ? `${prefix}_${id}` : id;
}
