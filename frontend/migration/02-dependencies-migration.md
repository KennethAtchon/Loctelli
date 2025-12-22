# Dependencies Migration Guide

## Overview

This guide covers migrating all npm/pnpm dependencies in the frontend application. Dependencies are organized by category and migration complexity.

## Migration Strategy

### Approach

1. **Group by Category**: Migrate related dependencies together
2. **Test Incrementally**: Test after each group migration
3. **Version Pinning**: Pin exact versions initially, then relax constraints
4. **Breaking Changes**: Document and address breaking changes immediately

### Migration Order

1. Core framework (Next.js, React)
2. Build tools and TypeScript
3. UI libraries (Radix UI, Shadcn)
4. State management and data fetching
5. Form libraries
6. Styling (Tailwind)
7. Testing libraries
8. Development tools

## 1. Core Framework Dependencies

### Next.js and React

#### Current Versions

- `next@^15.4.7`
- `react@^19.2.1`
- `react-dom@^19.2.1`

#### Migration Steps

```bash
# Update Next.js and React together
pnpm add next@latest react@latest react-dom@latest

# Verify versions
pnpm list next react react-dom
```

#### Breaking Changes to Address

**Next.js 15:**

- [ ] App Router is now default (already using it)
- [ ] `next/image` may have new props
- [ ] Metadata API changes
- [ ] Server Actions changes
- [ ] Turbopack improvements

**React 19:**

- [ ] New JSX transform (already enabled)
- [ ] `useFormState` and `useFormStatus` hooks
- [ ] Server Components improvements
- [ ] Automatic batching changes

#### Verification

```bash
# Test build
pnpm run build

# Check for deprecation warnings
pnpm run dev 2>&1 | grep -i "deprecated\|warning"
```

## 2. TypeScript and Build Tools

### TypeScript Configuration

#### Current Setup

- `typescript@^5`
- `@types/node@^22`
- `@types/react@^19.2.0`
- `@types/react-dom@^19.2.0`

#### Migration Steps

```bash
# Update TypeScript and type definitions
pnpm add -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest

# Verify TypeScript compilation
pnpm exec tsc --noEmit
```

#### TypeScript Configuration Updates

Check `tsconfig.json` for:

- [ ] `target` - Should be ES2017 or higher
- [ ] `lib` - Should include "dom", "dom.iterable", "esnext"
- [ ] `module` - Should be "esnext"
- [ ] `moduleResolution` - Should be "bundler" for Next.js
- [ ] `jsx` - Should be "preserve" for Next.js

## 3. UI Component Libraries

### Radix UI Packages

#### Current Versions

All `@radix-ui/*` packages are at various versions. Check for consistency.

#### Migration Steps

```bash
# Update all Radix UI packages to latest compatible versions
pnpm add @radix-ui/react-accordion@latest \
  @radix-ui/react-alert-dialog@latest \
  @radix-ui/react-aspect-ratio@latest \
  @radix-ui/react-avatar@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-collapsible@latest \
  @radix-ui/react-context-menu@latest \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-hover-card@latest \
  @radix-ui/react-label@latest \
  @radix-ui/react-menubar@latest \
  @radix-ui/react-navigation-menu@latest \
  @radix-ui/react-popover@latest \
  @radix-ui/react-progress@latest \
  @radix-ui/react-radio-group@latest \
  @radix-ui/react-scroll-area@latest \
  @radix-ui/react-select@latest \
  @radix-ui/react-separator@latest \
  @radix-ui/react-slider@latest \
  @radix-ui/react-slot@latest \
  @radix-ui/react-switch@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-toast@latest \
  @radix-ui/react-toggle@latest \
  @radix-ui/react-toggle-group@latest \
  @radix-ui/react-tooltip@latest
```

#### Breaking Changes

- [ ] Check Radix UI v2 migration guide (if applicable)
- [ ] Update component props if needed
- [ ] Test all UI components

### Other UI Dependencies

```bash
# Update UI utilities
pnpm add class-variance-authority@latest \
  clsx@latest \
  tailwind-merge@latest \
  lucide-react@latest \
  cmdk@latest \
  sonner@latest
```

## 4. State Management and Data Fetching

### TanStack React Query

#### Current Version

- `@tanstack/react-query@^5.62.11`

#### Migration Steps

```bash
# Update React Query
pnpm add @tanstack/react-query@latest
```

#### Breaking Changes (v5)

- [ ] Query client setup may need updates
- [ ] Mutation API changes
- [ ] DevTools integration changes

#### Verification

Check all React Query usage:

- [ ] `useQuery` hooks
- [ ] `useMutation` hooks
- [ ] Query client configuration
- [ ] Query invalidation patterns

## 5. Form Management

### React Hook Form and Zod

#### Current Versions

- `react-hook-form@^7.54.1`
- `@hookform/resolvers@^3.9.1`
- `zod@^3.24.1`

#### Migration Steps

```bash
# Update form libraries
pnpm add react-hook-form@latest @hookform/resolvers@latest zod@latest
```

#### Breaking Changes

- [ ] React Hook Form v7 API changes
- [ ] Zod v3 schema changes
- [ ] Resolver updates

#### Verification

Test all forms:

- [ ] Login forms
- [ ] Registration forms
- [ ] Admin forms
- [ ] Data entry forms

## 6. Styling

### Tailwind CSS

#### Current Version

- `tailwindcss@^4.0.0` (Major version!)

#### Migration Steps

```bash
# Tailwind v4 is a major rewrite
pnpm add -D tailwindcss@latest @tailwindcss/postcss@latest
```

#### Critical: Tailwind v4 Migration

Tailwind CSS v4 has significant changes:

1. **Configuration Changes**
   - [ ] Update `tailwind.config.js` or migrate to CSS-based config
   - [ ] Check `postcss.config.mjs` for Tailwind plugin

2. **CSS Import Changes**

   ```css
   /* Old (v3) */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* New (v4) - May need to update */
   @import "tailwindcss";
   ```

3. **Class Name Changes**
   - [ ] Some utility classes may have changed
   - [ ] Check for deprecated classes

4. **Plugin Compatibility**
   - [ ] Update or remove incompatible plugins
   - [ ] Check `tw-animate-css` compatibility

#### Verification

```bash
# Test Tailwind compilation
pnpm run build

# Check for missing classes
# Review build output for warnings
```

### Autoprefixer

```bash
pnpm add -D autoprefixer@latest
```

## 7. Testing Libraries

### Jest and Testing Library

#### Current Versions

- `jest@^29.7.0`
- `@testing-library/react@^16.1.0`
- `@testing-library/jest-dom@^6.6.3`
- `@testing-library/user-event@^14.5.2`

#### Migration Steps

```bash
# Update testing libraries
pnpm add -D jest@latest \
  @testing-library/react@latest \
  @testing-library/jest-dom@latest \
  @testing-library/user-event@latest \
  jest-environment-jsdom@latest \
  @types/jest@latest
```

#### Breaking Changes

- [ ] Jest 29 configuration changes
- [ ] Testing Library v16 API changes
- [ ] User Event v14 API changes

#### MSW (Mock Service Worker)

```bash
pnpm add -D msw@latest
```

## 8. Development Tools

### ESLint and Prettier

#### Current Versions

- `eslint@^9.39.1`
- `eslint-config-next@^15.3.4`
- `prettier@^3.7.4`

#### Migration Steps

```bash
# Update linting tools
pnpm add -D eslint@latest \
  eslint-config-next@latest \
  eslint-config-prettier@latest \
  prettier@latest
```

#### ESLint 9 Changes

- [ ] New flat config format (check `eslint.config.mjs`)
- [ ] Plugin system changes
- [ ] Rule updates

### Other Dev Dependencies

```bash
# Update remaining dev dependencies
pnpm add -D @eslint/eslintrc@latest \
  postcss@latest
```

## 9. Remaining Dependencies

### Utility Libraries

```bash
# Update utility packages
pnpm add date-fns@latest \
  loglevel@latest \
  next-themes@latest
```

### Feature Libraries

```bash
# Update feature-specific packages
pnpm add embla-carousel-react@latest \
  framer-motion@latest \
  input-otp@latest \
  react-day-picker@latest \
  react-resizable-panels@latest \
  recharts@latest \
  vaul@latest \
  mermaid@latest
```

## 10. Dependency Resolution

### Fix Version Conflicts

```bash
# Check for peer dependency warnings
pnpm install

# Resolve conflicts
pnpm add --save-peer <package>@<version>
```

### Update Lock File

```bash
# Regenerate lock file
rm pnpm-lock.yaml
pnpm install
```

## 11. Verification Steps

### Build Verification

```bash
# Clean install
rm -rf node_modules .next
pnpm install

# Type check
pnpm exec tsc --noEmit

# Build
pnpm run build

# Start dev server
pnpm run dev
```

### Runtime Verification

- [ ] Application starts without errors
- [ ] No console warnings about deprecated APIs
- [ ] All pages load correctly
- [ ] API calls work
- [ ] Forms submit correctly
- [ ] UI components render properly

## 12. Common Issues and Solutions

### Issue: Peer Dependency Warnings

**Solution:**

```bash
# Install missing peer dependencies
pnpm add --save-peer <missing-package>@<version>
```

### Issue: Type Errors After Update

**Solution:**

1. Update `@types/*` packages
2. Check TypeScript version compatibility
3. Review breaking changes in type definitions

### Issue: Build Failures

**Solution:**

1. Clear `.next` directory: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules`
3. Reinstall: `pnpm install`
4. Check for breaking changes in build tools

### Issue: Runtime Errors

**Solution:**

1. Check browser console for errors
2. Review dependency changelogs
3. Check for API changes in libraries
4. Review migration guides

## 13. Dependency Audit Checklist

After migration, verify:

- [ ] All dependencies updated to target versions
- [ ] No security vulnerabilities: `pnpm audit`
- [ ] No deprecated packages in use
- [ ] Peer dependencies satisfied
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Application runs correctly
- [ ] No console warnings

## 14. Rollback Procedure

If issues occur:

```bash
# Restore previous package.json
git checkout HEAD -- package.json

# Restore lock file
git checkout HEAD -- pnpm-lock.yaml

# Reinstall
rm -rf node_modules
pnpm install
```

## Next Steps

After dependencies are migrated:

- **[03-configuration-migration.md](./03-configuration-migration.md)** - Update configuration files

## Notes

Document any issues encountered:

```
[Add migration notes here]
```
