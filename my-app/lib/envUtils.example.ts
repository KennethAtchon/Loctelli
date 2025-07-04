/**
 * Example usage of envUtils
 * This file demonstrates how to use the centralized environment variable management
 */

import { env, validateEnvironmentVariables, getEnvVar } from './envUtils';

// Example 1: Using the structured config objects
export function exampleUsage() {
  // Access API configuration
  const apiUrl = env.api.BASE_URL;
  console.log('API URL:', apiUrl);

  // Access authentication configuration
  const authSecret = env.auth.SECRET;
  console.log('Auth Secret exists:', !!authSecret);

  // Access environment configuration
  const isProduction = env.env.IS_PRODUCTION;
  console.log('Is Production:', isProduction);

  // Example 2: Using the helper function
  const customVar = getEnvVar('CUSTOM_VARIABLE', 'default-value');
  console.log('Custom Variable:', customVar);
}

// Example 3: Validating environment variables on app startup
export function initializeApp() {
  try {
    validateEnvironmentVariables();
    console.log('✅ All required environment variables are set');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

// Example 4: Conditional logic based on environment
export function getApiEndpoint() {
  if (env.env.IS_PRODUCTION) {
    return 'https://api.production.com';
  } else if (env.env.IS_DEVELOPMENT) {
    return env.api.BASE_URL;
  } else {
    return 'http://localhost:8000';
  }
} 