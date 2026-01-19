/**
 * Centralized environment variable management
 *
 * IMPORTANT: All environment variables in the frontend should be accessed through this file.
 * Do NOT use process.env directly in other files - always use API_CONFIG, ENV_CONFIG, or getEnvVar().
 *
 * This file is the ONLY place where process.env should be accessed directly.
 */

// API Configuration
// Always use /api/proxy to avoid CORS issues
// The proxy route will forward requests to the backend using BACKEND_URL
// All env vars are accessed at runtime, not build time
export const API_CONFIG = {
  BASE_URL: "/api/proxy",
  // Backend URL for server-side proxy (used by /api/proxy route)
  // In development, use localhost:8000; otherwise use BACKEND_URL from environment
  // This is accessed at runtime, not build time
  get BACKEND_URL() {
    return process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : process.env.BACKEND_URL || "http://localhost:8000";
  },
  // API Key for server-side requests (used by proxy route)
  // This is accessed at runtime, not build time
  get API_KEY() {
    return process.env.API_KEY;
  },
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  // Custom authentication system - no NextAuth needed
} as const;

// Environment Configuration
// DEBUG: Server-side runtime env var
// NEXT_PUBLIC_DEBUG: Client-side build-time env var (embedded in bundle, accessible via process.env.NEXT_PUBLIC_DEBUG)
export const ENV_CONFIG = {
  // Check both DEBUG (server-side runtime) and NEXT_PUBLIC_DEBUG (client-side)
  // This is accessed at runtime on server, build-time on client
  get DEBUG() {
    // Server-side: check runtime DEBUG env var
    // Client-side: NEXT_PUBLIC_DEBUG is embedded at build time
    if (typeof window === "undefined") {
      return (
        process.env.DEBUG === "true" || process.env.NEXT_PUBLIC_DEBUG === "true"
      );
    } else {
      // Client-side: NEXT_PUBLIC_DEBUG is available via process.env (replaced at build time)
      return process.env.NEXT_PUBLIC_DEBUG === "true";
    }
  },
  get IS_PRODUCTION() {
    return !this.DEBUG;
  },
  get IS_DEVELOPMENT() {
    return this.DEBUG;
  },
} as const;

// Validation function to ensure required environment variables are set
export function validateEnvironmentVariables(): void {
  const requiredVars: Array<{ key: string; value: string; name: string }> = [
    // Add other required vars here if needed
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    const missingVarNames = missingVars.map(({ name }) => name).join(", ");
    throw new Error(
      `Missing required environment variables: ${missingVarNames}`
    );
  }
}

// Helper function to get environment variable with type safety
export function getEnvVar(
  key: string,
  defaultValue?: string
): string | undefined {
  return process.env[key] || defaultValue;
}

// Export all configs for easy access
export const env = {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  env: ENV_CONFIG,
} as const;
