# Environment Variables Management

This project uses a centralized approach to manage environment variables through `envUtils.ts`.

## Overview

All environment variables are accessed through the `envUtils.ts` file, which provides:
- Type-safe access to environment variables
- Centralized configuration management
- Validation of required environment variables
- Helper functions for common use cases

## Usage

### Basic Usage

```typescript
import { env } from './lib/envUtils';

// Access API configuration
const apiUrl = env.api.BASE_URL;

// Access authentication configuration
const authSecret = env.auth.SECRET;

// Check environment
const isProduction = env.env.IS_PRODUCTION;
```

### Validation

```typescript
import { validateEnvironmentVariables } from './lib/envUtils';

// Validate on app startup
try {
  validateEnvironmentVariables();
  console.log('✅ All required environment variables are set');
} catch (error) {
  console.error('❌ Missing required environment variables:', error);
  process.exit(1);
}
```

### Helper Functions

```typescript
import { getEnvVar } from './lib/envUtils';

// Get environment variable with default value
const customVar = getEnvVar('CUSTOM_VARIABLE', 'default-value');
```

## Available Configurations

### API Configuration (`env.api`)
- `BASE_URL`: The base URL for API calls (defaults to `http://localhost:3000`)

### Authentication Configuration (`env.auth`)
- `SECRET`: NextAuth.js secret key (required)

### Environment Configuration (`env.env`)
- `NODE_ENV`: Current environment (`development`, `production`, etc.)
- `IS_PRODUCTION`: Boolean indicating if in production
- `IS_DEVELOPMENT`: Boolean indicating if in development

## Adding New Environment Variables

1. Add the variable to `envUtils.ts` in the appropriate configuration section
2. Update the validation function if the variable is required
3. Update this documentation

## Benefits

- **Type Safety**: All environment variables are typed
- **Centralization**: Single source of truth for all environment configuration
- **Validation**: Automatic validation of required variables
- **Maintainability**: Easy to modify and extend
- **Documentation**: Self-documenting configuration structure

## Example

See `envUtils.example.ts` for complete usage examples. 