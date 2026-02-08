/**
 * Extract a user-friendly message from API/backend errors for toasts and UI.
 * Handles Error instances (used by ApiClient), objects with message, and strings.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error == null) return fallback;
  if (typeof error === "string") return error || fallback;
  if (error instanceof Error && error.message) return error.message;
  const obj = error as Record<string, unknown>;
  if (typeof obj?.message === "string") return obj.message;
  if (typeof obj?.error === "string") return obj.error;
  return fallback;
}
