"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthManager } from "@/lib/api/auth-manager";

// Optional devtools - only import if available
let ReactQueryDevtools: React.ComponentType<{
  initialIsOpen?: boolean;
}> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const devtools = require("@tanstack/react-query-devtools");
  ReactQueryDevtools = devtools.ReactQueryDevtools;
} catch {
  // Devtools not installed, that's fine
}

const authManager = new AuthManager();

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient in state to ensure it's stable across re-renders
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
          // Handle 401 errors globally - don't retry, let API client handle refresh
          retry: (failureCount, error) => {
            // Don't retry on 401 errors - API client handles token refresh
            if (
              error instanceof Error &&
              (error.message.includes("401") ||
                error.message.includes("Unauthorized") ||
                error.message.includes("Authentication"))
            ) {
              return false;
            }
            // Retry other errors up to 3 times
            return failureCount < 3;
          },
        },
        mutations: {
          // Handle 401 errors in mutations
          // Note: API client already handles 401s, but this provides a fallback
          onError: async (error) => {
            if (
              error instanceof Error &&
              (error.message.includes("401") ||
                error.message.includes("Unauthorized") ||
                error.message.includes("Authentication"))
            ) {
              try {
                await authManager.refreshToken();
                // Invalidate all queries to trigger refetch with new token
                client.invalidateQueries();
              } catch {
                // Refresh failed, clear tokens and redirect
                authManager.clearTokens();
                if (typeof window !== "undefined") {
                  const currentPath = window.location.pathname;
                  if (currentPath.startsWith("/admin")) {
                    window.location.href = "/admin/login";
                  } else {
                    window.location.href = "/auth/login";
                  }
                }
              }
            }
          },
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development if available */}
      {process.env.NODE_ENV === "development" && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
