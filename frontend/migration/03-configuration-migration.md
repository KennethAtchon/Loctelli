# Configuration Files Migration Guide

## Overview

This guide covers migrating all configuration files in the frontend application, including Next.js, TypeScript, Tailwind, Jest, and other tool configurations.

## 1. Next.js Configuration

### File: `next.config.ts`

#### Current Configuration Review

Review the current `next.config.ts` for:

- ESLint configuration
- TypeScript configuration
- Image optimization
- Experimental features
- Headers and redirects
- Compression settings

#### Migration Steps

**1. Update ESLint Configuration**

```typescript
// Next.js 15 may have updated ESLint handling
eslint: {
  ignoreDuringBuilds: true, // Keep if linting is disabled
}
```

**2. Update TypeScript Configuration**

```typescript
typescript: {
  ignoreBuildErrors: true, // Review if this should be false
}
```

**3. Image Optimization**

```typescript
images: {
  formats: ["image/webp", "image/avif"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**4. Experimental Features**

```typescript
experimental: {
  optimizePackageImports: ["lucide-react"],
  // Check Next.js 15 docs for new experimental features
}
```

**5. Security Headers**

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ];
}
```

#### Next.js 15 Specific Updates

- [ ] Review Next.js 15 migration guide
- [ ] Check for deprecated configuration options
- [ ] Update experimental features
- [ ] Verify image optimization settings
- [ ] Test build with new configuration

## 2. TypeScript Configuration

### File: `tsconfig.json`

#### Current Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "__tests__/**/*"]
}
```

#### Migration Steps

**1. Update Target**

- Consider updating `target` to `ES2020` or `ES2022` for better optimization
- Keep `ES2017` if browser support is required

**2. Module Resolution**

- `moduleResolution: "bundler"` is correct for Next.js 15
- Verify this works with your setup

**3. Strict Mode**

- Currently `strict: true` but some strict checks are disabled
- Consider enabling `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` gradually

**4. Path Aliases**

- Verify `@/*` alias works correctly
- Test imports using the alias

#### TypeScript 5 Updates

- [ ] Review TypeScript 5 breaking changes
- [ ] Update compiler options if needed
- [ ] Verify path aliases work
- [ ] Test type checking: `pnpm exec tsc --noEmit`

## 3. Tailwind CSS Configuration

### Tailwind v4 Migration

Tailwind CSS v4 is a major rewrite with significant changes.

#### File: `postcss.config.mjs`

**Current Configuration:**

```javascript
// Review current PostCSS config
```

**Tailwind v4 Changes:**

- [ ] May use `@tailwindcss/postcss` plugin
- [ ] Configuration may move to CSS file
- [ ] Check `@tailwindcss/postcss@^4.0.0` usage

#### CSS File Updates

**File: `app/globals.css`**

Tailwind v4 may require CSS import changes:

```css
/* Old (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New (v4) - Check if needed */
@import "tailwindcss";
```

#### Configuration Migration

1. **Review Tailwind v4 Migration Guide**
   - [ ] Read official migration documentation
   - [ ] Identify breaking changes
   - [ ] Plan configuration updates

2. **Update Configuration**
   - [ ] Move config to CSS if required
   - [ ] Update PostCSS plugin
   - [ ] Update custom utilities

3. **Test Styling**
   - [ ] Verify all styles work
   - [ ] Check for missing classes
   - [ ] Test responsive breakpoints
   - [ ] Verify dark mode (if used)

## 4. Jest Configuration

### File: `jest.config.js`

#### Current Configuration Review

Review for:

- Test environment
- Module name mapping
- Setup files
- Coverage configuration
- Transform configuration

#### Migration Steps

**1. Update Jest Configuration**

```javascript
// Jest 29 may have configuration changes
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // ... other config
};
```

**2. Update Setup File**

- Review `jest.setup.js`
- Update testing library setup
- Check for deprecated APIs

**3. Test Configuration**

```bash
# Verify Jest works
pnpm test

# Check coverage
pnpm test:coverage
```

#### Jest 29 Updates

- [ ] Review Jest 29 changelog
- [ ] Update configuration if needed
- [ ] Test all test files
- [ ] Verify coverage reporting

## 5. ESLint Configuration

### File: `eslint.config.mjs`

#### ESLint 9 Flat Config

ESLint 9 uses a new flat config format.

#### Current Configuration Review

Check if using:

- Flat config format (`.mjs`)
- Legacy format (`.eslintrc.*`)

#### Migration Steps

**1. Verify Flat Config**

```javascript
// ESLint 9 flat config format
export default [
  // ... config
];
```

**2. Update Plugins**

- [ ] Update `eslint-config-next`
- [ ] Update `eslint-config-prettier`
- [ ] Verify plugin compatibility

**3. Test Linting**

```bash
# Note: Linting is currently disabled
# If re-enabling, test:
pnpm run lint
```

## 6. Prettier Configuration

### File: `.prettierrc` or `prettier.config.js`

#### Migration Steps

**1. Check Configuration**

- [ ] Verify Prettier config exists
- [ ] Review formatting rules
- [ ] Test formatting: `pnpm run format`

**2. Update if Needed**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 7. Components Configuration

### File: `components.json`

#### Shadcn/ui Configuration

This file configures Shadcn/ui component generation.

#### Migration Steps

**1. Review Configuration**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

**2. Update for Tailwind v4**

- [ ] Check if Shadcn supports Tailwind v4
- [ ] Update configuration if needed
- [ ] Test component generation

## 8. Environment Variables

### File: `lib/utils/envUtils.ts`

#### Migration Steps

**1. Review Environment Variable Validation**

- [ ] Check validation logic
- [ ] Verify all required variables
- [ ] Update validation if needed

**2. Environment Files**

- [ ] `.env.local` - Local development
- [ ] `.env.development` - Development
- [ ] `.env.production` - Production
- [ ] Document all variables

## 9. Docker Configuration

### File: `Dockerfile`

#### Migration Steps

**1. Review Dockerfile**

- [ ] Node.js version (currently 20)
- [ ] Build arguments
- [ ] Multi-stage build
- [ ] Production dependencies

**2. Update if Needed**

```dockerfile
# Verify Node.js version compatibility
FROM node:20-alpine AS builder

# Check pnpm version
RUN npm install -g pnpm

# Verify build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

## 10. Package.json Scripts

### File: `package.json`

#### Current Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "build:all": "pnpm run format:check && pnpm run lint && tsc --noEmit && pnpm run build",
    "start": "next start",
    "lint": "echo 'Linting disabled'",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "rm -rf .next && rm -rf pnpm-lock.yaml && rm -rf node_modules",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "audit:types": "npx tsx scripts/audit-types.ts"
  }
}
```

#### Migration Steps

**1. Verify Scripts Work**

- [ ] Test each script
- [ ] Update if dependencies change
- [ ] Add new scripts if needed

**2. Consider Adding**

```json
{
  "scripts": {
    // ... existing scripts
    "type-check": "tsc --noEmit",
    "lint:fix": "eslint --fix .",
    "prepare": "husky install" // if using husky
  }
}
```

## 11. Configuration Verification Checklist

After migration, verify:

- [ ] Next.js config works: `pnpm run build`
- [ ] TypeScript compiles: `pnpm exec tsc --noEmit`
- [ ] Tailwind styles work: Check UI rendering
- [ ] Jest tests run: `pnpm test`
- [ ] ESLint works (if enabled): `pnpm run lint`
- [ ] Prettier works: `pnpm run format:check`
- [ ] Docker builds: `docker build -t frontend .`
- [ ] All scripts execute successfully

## 12. Common Configuration Issues

### Issue: TypeScript Path Aliases Not Working

**Solution:**

1. Verify `tsconfig.json` paths configuration
2. Check `next.config.ts` for alias configuration (if needed)
3. Restart TypeScript server in IDE

### Issue: Tailwind Classes Not Working

**Solution:**

1. Verify Tailwind v4 migration completed
2. Check CSS imports in `globals.css`
3. Verify PostCSS configuration
4. Clear `.next` directory and rebuild

### Issue: Jest Module Resolution Errors

**Solution:**

1. Update `moduleNameMapper` in `jest.config.js`
2. Verify path aliases match TypeScript config
3. Check `jest.setup.js` for correct imports

## Next Steps

After configuration migration:

- **[04-components-migration.md](./04-components-migration.md)** - Migrate components

## Notes

Document configuration changes:

```
[Add configuration notes here]
```
