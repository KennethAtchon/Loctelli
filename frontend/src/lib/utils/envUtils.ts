/**
 * Centralized environment variable management
 * All environment variables should be accessed through this file
 *
 * Note: Vite uses VITE_ prefix for public environment variables
 * Access via import.meta.env.VITE_* instead of process.env
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  // Custom authentication system - no NextAuth needed
} as const;

// Environment Configuration
export const ENV_CONFIG = {
  NODE_ENV: import.meta.env.MODE || "development",
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
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
      `Missing required environment variables: ${missingVarNames}`,
    );
  }
}

// Helper function to get environment variable with type safety
// Note: For Vite, use VITE_ prefix and access via import.meta.env
export function getEnvVar(
  key: string,
  defaultValue?: string,
): string | undefined {
  // For Vite, we need to access import.meta.env
  // This is a simplified version - in practice, you'd map VITE_ prefixed vars
  return (import.meta.env as Record<string, string>)[key] || defaultValue;
}

// Export all configs for easy access
export const env = {
  api: API_CONFIG,
  auth: AUTH_CONFIG,
  env: ENV_CONFIG,
} as const;
