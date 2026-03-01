import { QueryClient } from "@tanstack/react-query";
import { authManager } from "./auth-manager";
import logger from "@/lib/logger";
import { emitSessionExpired } from "@/lib/session-expiration";

/**
 * React Query error handler for 401 Unauthorized responses
 * Automatically refreshes tokens and retries the request
 */
export async function handle401Error(
  error: unknown,
  queryClient: QueryClient
): Promise<boolean> {
  // Check if it's a 401 error
  if (
    error instanceof Error &&
    (error.message.includes("401") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Authentication"))
  ) {
    logger.debug("🔒 401 error detected, attempting token refresh...");

    try {
      // Attempt token refresh
      await authManager.refreshToken();
      logger.debug("✅ Token refresh successful, invalidating queries...");
      // Invalidate all queries to trigger refetch with new token
      queryClient.invalidateQueries();
      return true; // Indicate that we handled the error
    } catch (refreshError) {
      logger.error("❌ Token refresh failed:", refreshError);
      emitSessionExpired({
        source: "react-query-401-handler",
        reason: "Could not refresh your session.",
      });
      return false; // Error not fully handled, let React Query handle it
    }
  }

  return false; // Not a 401 error, don't handle it
}

/**
 * Configure React Query with 401 error handling
 * Call this when setting up your QueryClient
 */
export function configureQueryClientWithAuth(
  queryClient: QueryClient
): QueryClient {
  // Set up global error handler
  queryClient.setMutationDefaults(["mutation"], {
    onError: (error) => {
      handle401Error(error, queryClient);
    },
  });

  return queryClient;
}
