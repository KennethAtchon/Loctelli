# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during frontend migration. Use this as a reference when troubleshooting migration problems.

## Table of Contents

1. [Dependency Issues](#dependency-issues)
2. [Build Issues](#build-issues)
3. [TypeScript Issues](#typescript-issues)
4. [Component Issues](#component-issues)
5. [API Issues](#api-issues)
6. [Routing Issues](#routing-issues)
7. [Testing Issues](#testing-issues)
8. [Styling Issues](#styling-issues)
9. [Performance Issues](#performance-issues)
10. [Deployment Issues](#deployment-issues)

## Dependency Issues

### Issue: Peer Dependency Warnings

**Symptoms:**

- Warnings about missing peer dependencies
- Package installation fails
- Runtime errors about missing packages

**Solutions:**

```bash
# Install missing peer dependencies
pnpm add --save-peer <package>@<version>

# Or update to compatible versions
pnpm update <package>

# Check peer dependency requirements
pnpm list <package>
```

**Prevention:**

- Review peer dependency requirements before updating
- Check package documentation for compatibility
- Use `pnpm install` to see all warnings

---

### Issue: Version Conflicts

**Symptoms:**

- Multiple versions of same package
- Inconsistent behavior
- Type errors

**Solutions:**

```bash
# Check for duplicate packages
pnpm list --depth=0 | grep <package>

# Force resolution
pnpm add <package>@<version> --force

# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Prevention:**

- Use exact versions for critical packages
- Review dependency tree regularly
- Use `pnpm why <package>` to understand dependencies

---

### Issue: Package Not Found

**Symptoms:**

- `MODULE_NOT_FOUND` errors
- Package installation fails
- Import errors

**Solutions:**

```bash
# Clear cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install

# Check package name spelling
pnpm search <package-name>
```

**Prevention:**

- Verify package names before installing
- Check package registry
- Verify network connectivity

## Build Issues

### Issue: Build Fails with TypeScript Errors

**Symptoms:**

- TypeScript compilation errors
- Build process stops
- Type errors in console

**Solutions:**

```bash
# Check TypeScript errors
pnpm exec tsc --noEmit

# Fix type errors one by one
# Update type definitions
pnpm add -D @types/<package>@latest

# Temporarily ignore errors (not recommended)
# In tsconfig.json: "noEmit": true
```

**Common Type Errors:**

- Missing type definitions: Install `@types/<package>`
- Generic type issues: Update TypeScript version
- Import type errors: Check module resolution

---

### Issue: Build Fails with Module Resolution Errors

**Symptoms:**

- `Cannot find module` errors
- Path alias not working
- Import errors

**Solutions:**

```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep paths

# Check next.config.ts for alias config
# Restart TypeScript server in IDE

# Clear build cache
rm -rf .next
pnpm run build
```

**Prevention:**

- Verify path aliases in `tsconfig.json`
- Use absolute imports consistently
- Check file extensions in imports

---

### Issue: Build Output Too Large

**Symptoms:**

- Large bundle sizes
- Slow page loads
- Performance issues

**Solutions:**

```bash
# Analyze bundle
pnpm add -D @next/bundle-analyzer

# Check bundle size
# Review code splitting
# Remove unused dependencies
pnpm remove <unused-package>
```

**Optimization Tips:**

- Use dynamic imports for large components
- Enable code splitting
- Remove unused dependencies
- Optimize images
- Use tree shaking

---

### Issue: Build Hangs or Times Out

**Symptoms:**

- Build process stops
- No output for long time
- Timeout errors

**Solutions:**

```bash
# Increase timeout
# Check system resources
# Clear build cache
rm -rf .next node_modules
pnpm install
pnpm run build

# Check for circular dependencies
pnpm add -D madge
npx madge --circular src/
```

**Prevention:**

- Monitor system resources
- Check for infinite loops
- Review build configuration
- Optimize build process

## TypeScript Issues

### Issue: Type Errors After Update

**Symptoms:**

- Type errors in previously working code
- Type inference issues
- Generic type errors

**Solutions:**

```typescript
// Update type definitions
pnpm add -D @types/<package>@latest

// Use type assertions (temporary)
const value = data as ExpectedType;

// Update TypeScript version
pnpm add -D typescript@latest
```

**Common Solutions:**

- Update `@types/*` packages
- Check TypeScript version compatibility
- Review breaking changes
- Update type definitions

---

### Issue: Path Aliases Not Working

**Symptoms:**

- `Cannot find module '@/...'` errors
- TypeScript can't resolve paths
- IDE shows errors

**Solutions:**

```json
// Verify tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// Restart TypeScript server
// In VS Code: Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

**Prevention:**

- Verify path aliases match file structure
- Use consistent import paths
- Check TypeScript configuration

---

### Issue: Generic Type Inference Fails

**Symptoms:**

- Generic types not inferred
- Type errors with generics
- `any` type warnings

**Solutions:**

```typescript
// Explicitly specify generic types
function example<T>(value: T): T {
  return value;
}

// Use type parameters
const result = example<string>("value");
```

**Prevention:**

- Use explicit types when needed
- Avoid `any` types
- Review generic constraints

## Component Issues

### Issue: Hydration Mismatch

**Symptoms:**

- Console warnings about hydration
- UI flickering
- Content mismatch between server and client

**Solutions:**

```typescript
// Suppress hydration warning (use carefully)
<html suppressHydrationWarning>

// Use useEffect for client-only content
useEffect(() => {
  // Client-only code
}, []);

// Check for date/time rendering
// Use consistent formatting
```

**Common Causes:**

- Date/time rendering differences
- Random values
- Browser-only APIs
- Theme provider issues

---

### Issue: Component Not Rendering

**Symptoms:**

- Component doesn't appear
- Blank screen
- No errors in console

**Solutions:**

```typescript
// Check component export
export default function Component() {
  return <div>Content</div>;
}

// Verify import
import Component from './component';

// Check for errors
console.log('Component rendering');

// Verify component is in component tree
```

**Debugging:**

- Check component exports
- Verify imports
- Check for errors
- Review component tree

---

### Issue: State Not Updating

**Symptoms:**

- State changes don't reflect in UI
- Component doesn't re-render
- Stale state

**Solutions:**

```typescript
// Use useState correctly
const [state, setState] = useState(initialValue);

// Update state correctly
setState(newValue);

// Check for state mutations
// Don't mutate state directly
// Use functional updates
setState((prev) => ({ ...prev, newValue }));
```

**Common Causes:**

- State mutation
- Missing dependencies in useEffect
- Incorrect state updates
- Context not updating

## API Issues

### Issue: CORS Errors

**Symptoms:**

- CORS errors in console
- API requests fail
- Network errors

**Solutions:**

```typescript
// Verify API proxy setup
// Check next.config.ts
// Verify backend CORS configuration
// Check API URL

// Use API proxy route
fetch("/api/proxy/endpoint");
```

**Prevention:**

- Use API proxy for all backend calls
- Verify backend CORS settings
- Check API URL configuration

---

### Issue: Token Refresh Loop

**Symptoms:**

- Infinite refresh requests
- 401 errors repeatedly
- Performance issues

**Solutions:**

```typescript
// Add refresh lock
let isRefreshing = false;

async function refreshToken() {
  if (isRefreshing) return;
  isRefreshing = true;
  // Refresh logic
  isRefreshing = false;
}

// Check token expiration before refresh
// Verify refresh token is valid
```

**Prevention:**

- Add refresh lock mechanism
- Check token expiration
- Verify refresh token validity
- Handle refresh errors

---

### Issue: API Response Type Mismatch

**Symptoms:**

- Type errors with API responses
- Runtime errors
- Data not accessible

**Solutions:**

```typescript
// Verify response types
interface ApiResponse {
  data: ExpectedType;
}

// Use type assertions carefully
const response = await api.get<ApiResponse>("/endpoint");

// Verify backend DTOs match
// Update types if backend changed
```

**Prevention:**

- Keep types in sync with backend
- Use TypeScript for type safety
- Verify API contracts
- Update types when backend changes

## Routing Issues

### Issue: Route Not Found

**Symptoms:**

- 404 errors
- Route not accessible
- Navigation fails

**Solutions:**

```typescript
// Verify route file structure
// app/route/page.tsx

// Check route naming
// Verify route groups
// Test route access

// Check for typos in paths
```

**Prevention:**

- Follow Next.js App Router conventions
- Verify file structure
- Test routes after creation
- Check route naming

---

### Issue: Dynamic Route Not Working

**Symptoms:**

- Dynamic parameters not accessible
- Route params undefined
- 404 for dynamic routes

**Solutions:**

```typescript
// Verify dynamic route structure
// app/[slug]/page.tsx

// Check params type
export default function Page({ params }: { params: { slug: string } }) {
  // Use params
}

// Verify route generation
```

**Prevention:**

- Follow Next.js dynamic route conventions
- Verify params type
- Test dynamic routes
- Check route generation

---

### Issue: Metadata Not Working

**Symptoms:**

- SEO metadata missing
- Open Graph tags not showing
- Metadata not updating

**Solutions:**

```typescript
// Verify metadata export
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page Description",
};

// Check metadata structure
// Verify Next.js version
// Test metadata generation
```

**Prevention:**

- Follow Next.js metadata API
- Verify metadata structure
- Test metadata generation
- Check Next.js version

## Testing Issues

### Issue: Tests Failing After Update

**Symptoms:**

- Previously passing tests fail
- Test errors
- Mock failures

**Solutions:**

```bash
# Update test utilities
# Review test dependencies
# Update mocks
# Check test setup

# Run tests with verbose output
pnpm test -- --verbose

# Update test libraries
pnpm add -D @testing-library/react@latest
```

**Common Causes:**

- API changes in testing libraries
- Mock setup changes
- Component API changes
- Test utility updates

---

### Issue: MSW Not Intercepting Requests

**Symptoms:**

- Real API calls instead of mocks
- Network errors in tests
- Tests fail with API errors

**Solutions:**

```typescript
// Verify MSW setup
import { server } from "./test-utils/msw";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Check handler registration
// Verify request URLs match
// Test handler matching
```

**Prevention:**

- Verify MSW setup
- Check handler registration
- Match request URLs exactly
- Test handler matching

---

### Issue: Async Test Failures

**Symptoms:**

- Tests timeout
- Async operations not completing
- Flaky tests

**Solutions:**

```typescript
// Use waitFor for async operations
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Text")).toBeInTheDocument();
});

// Increase timeout if needed
jest.setTimeout(10000);

// Verify async operations complete
// Check for race conditions
```

**Prevention:**

- Use proper async utilities
- Wait for async operations
- Avoid race conditions
- Set appropriate timeouts

## Styling Issues

### Issue: Tailwind Classes Not Working

**Symptoms:**

- Styles not applying
- Classes not recognized
- Styling missing

**Solutions:**

```bash
# Verify Tailwind configuration
# Check postcss.config.mjs
# Verify globals.css imports

# Clear build cache
rm -rf .next
pnpm run build

# Check Tailwind v4 migration
# Verify CSS imports
```

**Common Causes:**

- Tailwind v4 migration issues
- CSS import problems
- Configuration errors
- Build cache issues

---

### Issue: Styles Not Loading

**Symptoms:**

- No styles applied
- CSS not loading
- Styling completely missing

**Solutions:**

```typescript
// Verify globals.css import in layout
import "./globals.css";

// Check CSS file exists
// Verify PostCSS configuration
// Test CSS compilation
```

**Prevention:**

- Verify CSS imports
- Check PostCSS configuration
- Test styling after changes
- Clear build cache regularly

## Performance Issues

### Issue: Slow Page Loads

**Symptoms:**

- Slow initial load
- Poor performance metrics
- User complaints

**Solutions:**

```bash
# Analyze bundle size
pnpm add -D @next/bundle-analyzer

# Check for large dependencies
# Use dynamic imports
# Optimize images
# Enable compression
```

**Optimization Tips:**

- Use code splitting
- Optimize images
- Enable compression
- Remove unused code
- Use dynamic imports

---

### Issue: Memory Leaks

**Symptoms:**

- Memory usage increasing
- Performance degradation over time
- Browser crashes

**Solutions:**

```typescript
// Clean up effects
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  };
}, []);

// Remove event listeners
// Clear intervals/timeouts
// Unsubscribe from observables
```

**Prevention:**

- Clean up effects
- Remove event listeners
- Clear intervals
- Unsubscribe from observables
- Monitor memory usage

## Deployment Issues

### Issue: Environment Variables Not Working

**Symptoms:**

- Environment variables undefined
- API calls fail
- Configuration missing

**Solutions:**

```bash
# Verify environment variables
# Check .env files
# Verify NEXT_PUBLIC_ prefix
# Test variable access

# Check Docker build args
# Verify deployment platform config
# Test variable injection
```

**Prevention:**

- Use `NEXT_PUBLIC_` prefix for client variables
- Verify environment setup
- Test variables in staging
- Document all variables

---

### Issue: Docker Build Fails

**Symptoms:**

- Docker build errors
- Build timeout
- Image not created

**Solutions:**

```dockerfile
# Verify Dockerfile syntax
# Check build arguments
# Test build locally
docker build -t frontend .

# Check for missing files
# Verify .dockerignore
# Test each build stage
```

**Prevention:**

- Test Docker builds locally
- Verify all files included
- Check build arguments
- Monitor build logs

---

### Issue: Production Build Different from Development

**Symptoms:**

- Different behavior in production
- Errors only in production
- Features not working

**Solutions:**

```bash
# Test production build locally
pnpm run build
pnpm start

# Compare with development
# Check environment variables
# Verify build configuration
# Test production build
```

**Prevention:**

- Test production builds locally
- Verify environment setup
- Check build configuration
- Monitor production logs

## Getting Help

If you encounter issues not covered here:

1. **Check Documentation:**
   - Next.js documentation
   - React documentation
   - Package documentation

2. **Search Issues:**
   - GitHub issues
   - Stack Overflow
   - Package issue trackers

3. **Review Logs:**
   - Build logs
   - Runtime logs
   - Browser console
   - Server logs

4. **Ask for Help:**
   - Team members
   - Community forums
   - Package maintainers

## Prevention Tips

- **Test Incrementally:** Test after each change
- **Keep Backups:** Always have rollback options
- **Document Changes:** Keep migration notes
- **Monitor Performance:** Watch for regressions
- **Review Logs:** Check for warnings and errors

## Notes

Document issues and solutions:

```
[Add troubleshooting notes here]
```
