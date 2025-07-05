# Environment Utilities

This module provides centralized environment variable management for the Loctelli CRM application.

## Overview

The `envUtils.ts` file centralizes all environment variable access, providing type safety and validation. This ensures consistent access to configuration values across the application.

## Required Environment Variables

### API Configuration
- `NEXT_PUBLIC_API_URL`: Backend API base URL (defaults to `http://localhost:8000`)
- `API_KEY`: **Required** - API key for backend authorization (server-side only)

## Configuration Objects

### API_CONFIG
```typescript
export const API_CONFIG = {
  BASE_URL: string;    // Backend API URL
  API_KEY: string;     // API key for authorization
} as const;
```

### ENV_CONFIG
```typescript
export const ENV_CONFIG = {
  NODE_ENV: string;           // Current environment
  IS_PRODUCTION: boolean;     // True if production
  IS_DEVELOPMENT: boolean;    // True if development
} as const;
```

## Usage

### Basic Usage
```typescript
import { env } from '@/lib/envUtils';

// Access API configuration
const apiUrl = env.api.BASE_URL;
const apiKey = env.api.API_KEY;

// Access environment configuration
const isProduction = env.env.IS_PRODUCTION;
```

### Environment Validation
```typescript
import { validateEnvironmentVariables } from '@/lib/envUtils';

// Validate on app startup
try {
  validateEnvironmentVariables();
  console.log('✅ All required environment variables are set');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}
```

### Helper Functions
```typescript
import { getEnvVar } from '@/lib/envUtils';

// Get environment variable with default
const customVar = getEnvVar('CUSTOM_VARIABLE', 'default-value');
```

## API Key Authorization

The API key is automatically included in all backend requests in the `x-api-key` header:

```typescript
// Headers sent with every request
{
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'X-User-Token': userAccessToken, // If user is logged in
}
```

## Environment Setup

### Development
Create a `.env.local` file in the `my-app` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
API_KEY=your-development-api-key

# Environment
NODE_ENV=development
```

### Production
Set the following environment variables in your production environment:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
API_KEY=your-production-api-key
NODE_ENV=production
```

## Security Considerations

- **API Key**: The API key is required for all backend communication and is server-side only
- **Public Variables**: Only variables prefixed with `NEXT_PUBLIC_` are available in the browser
- **Validation**: The application validates required environment variables on startup
- **Type Safety**: All configuration objects are typed with `as const` for better type inference

## Error Handling

If required environment variables are missing, the application will:

1. Log an error during validation
2. Exit with code 1 in development
3. Show appropriate error messages to users

## Best Practices

1. **Always use envUtils**: Don't access `process.env` directly
2. **Validate on startup**: Call `validateEnvironmentVariables()` early in your app
3. **Use type-safe access**: Access config through the `env` object
4. **Provide defaults**: Use the helper functions for optional variables
5. **Document changes**: Update this README when adding new environment variables 