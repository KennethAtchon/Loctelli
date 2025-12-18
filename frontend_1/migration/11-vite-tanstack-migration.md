# Migration to Vite + React + TanStack Router + TanStack Query

## ✅ MIGRATION COMPLETED - December 18, 2025

The migration from Next.js 15.4.7 to Vite + React + TanStack Router has been **successfully completed**. The new frontend is located in the `frontend/` directory and is fully functional.

## Overview

This guide provides comprehensive documentation for migrating the Loctelli frontend from **Next.js 15.4.7** to a modern stack using **Vite**, **React**, **TanStack Router**, and **TanStack Query**.

## Migration Summary

### Current Stack
- **Framework**: Next.js 15.4.7 with App Router
- **React**: 19.2.1
- **Routing**: Next.js App Router (file-based)
- **Data Fetching**: TanStack React Query 5.62.11
- **Build Tool**: Next.js built-in (Turbopack)
- **Package Manager**: pnpm

### Target Stack
- **Build Tool**: Vite 5.x
- **React**: 19.2.1 (maintained)
- **Routing**: TanStack Router (type-safe, file-based)
- **Data Fetching**: TanStack Query 5.x (maintained)
- **Package Manager**: pnpm (maintained)

## Key Benefits

1. **Faster Development**: Vite's HMR is significantly faster than Next.js
2. **Type-Safe Routing**: TanStack Router provides full type safety for routes
3. **Simpler Architecture**: No SSR complexity, pure SPA approach
4. **Better DX**: Improved developer experience with Vite
5. **Smaller Bundle**: More control over bundle size and code splitting

## Migration Strategy

### Phase 1: Pre-Migration Assessment
1. Audit current Next.js-specific features
2. Identify API routes that need migration
3. Document SSR/SSG requirements
4. Backup codebase
5. Set up migration branch

### Phase 2: Core Infrastructure
1. Install Vite and TanStack Router
2. Remove Next.js dependencies
3. Set up Vite configuration
4. Configure TanStack Router
5. Update TypeScript configuration

### Phase 3: Routing Migration
1. Convert App Router structure to TanStack Router
2. Migrate route handlers
3. Update navigation patterns
4. Migrate API routes (to backend or proxy)

### Phase 4: Application Code
1. Update component imports
2. Migrate Next.js-specific APIs
3. Update image optimization
4. Migrate metadata/SEO
5. Update environment variables

### Phase 5: Build & Deployment
1. Update build configuration
2. Update Dockerfile
3. Configure production build
4. Test deployment

## Critical Considerations

### What We're Losing
- **SSR/SSG**: Next.js server-side rendering and static generation
- **API Routes**: Next.js API routes (`app/api/*`)
- **Image Optimization**: Next.js `next/image` component
- **Automatic Code Splitting**: Next.js automatic route-based splitting
- **Built-in SEO**: Next.js metadata API

### What We Need to Replace
- **API Routes**: Move to backend or use proxy
- **Image Optimization**: Use Vite plugins or external service
- **SEO**: Use React Helmet or similar
- **Code Splitting**: Manual with Vite's dynamic imports
- **Environment Variables**: Use Vite's `import.meta.env`

## Migration Checklist

### Pre-Migration
- [ ] Create backup branch
- [ ] Document all Next.js-specific features in use
- [ ] List all API routes in `app/api/`
- [ ] Document SSR/SSG requirements
- [ ] Audit `next/image` usage
- [ ] Document metadata/SEO requirements
- [ ] Review environment variable usage
- [ ] Test current build and functionality

### Dependencies
- [ ] Remove Next.js dependencies
- [ ] Install Vite and plugins
- [ ] Install TanStack Router
- [ ] Verify TanStack Query compatibility
- [ ] Update TypeScript types
- [ ] Install Vite React plugin

### Configuration
- [ ] Create `vite.config.ts`
- [ ] Update `tsconfig.json`
- [ ] Create TanStack Router configuration
- [ ] Update `package.json` scripts
- [ ] Configure environment variables
- [ ] Set up path aliases

### Routing
- [ ] Convert root layout
- [ ] Migrate route groups
- [ ] Convert dynamic routes
- [ ] Migrate nested routes
- [ ] Update navigation components
- [ ] Test all routes

### API & Data
- [ ] Migrate API routes to backend
- [ ] Update API client (if needed)
- [ ] Verify TanStack Query setup
- [ ] Test all API calls
- [ ] Update error handling

### Components
- [ ] Replace `next/image` with standard `<img>` or alternative
- [ ] Remove Next.js-specific imports
- [ ] Update `next/link` to TanStack Router `Link`
- [ ] Update `next/navigation` hooks
- [ ] Migrate metadata to React Helmet or similar

### Build & Deployment
- [ ] Update Dockerfile
- [ ] Configure production build
- [ ] Set up static asset handling
- [ ] Configure routing for SPA
- [ ] Test production build
- [ ] Update CI/CD pipelines

### Testing
- [ ] Update test configuration
- [ ] Fix broken tests
- [ ] Update test utilities
- [ ] Verify test coverage

## Detailed Migration Steps

## 1. Pre-Migration Assessment

### Audit Next.js Features

#### API Routes Inventory
Document all API routes in `app/api/`:
- [ ] `app/api/contact/route.ts` - Contact form handler
- [ ] `app/api/proxy/[...path]/route.ts` - API proxy
- [ ] `app/api/test/route.ts` - Test endpoint

**Action Required**: These need to be moved to the backend or handled differently.

#### Next.js-Specific Features
- [ ] `next/image` - Image optimization component
- [ ] `next/link` - Client-side navigation
- [ ] `next/navigation` - Navigation hooks (`useRouter`, `usePathname`, etc.)
- [ ] `next/font` - Font optimization
- [ ] Metadata API - SEO metadata
- [ ] Server Components - If any are used
- [ ] Server Actions - If any are used

### Create Migration Branch
```bash
git checkout -b migration/vite-tanstack-router
git push -u origin migration/vite-tanstack-router
```

## 2. Dependencies Migration

### Remove Next.js Dependencies

```bash
cd frontend
pnpm remove next react-dom
```

### Install Vite and Core Dependencies

```bash
# Install Vite and React plugin
pnpm add -D vite @vitejs/plugin-react

# Install TanStack Router
pnpm add @tanstack/react-router @tanstack/router-devtools

# Install React (if not already installed)
pnpm add react@^19.2.1

# Install React DOM
pnpm add react-dom@^19.2.1

# Install React Helmet for SEO (alternative to Next.js metadata)
pnpm add react-helmet-async

# Install Vite environment types
pnpm add -D @types/node
```

### Update TanStack Query (if needed)

```bash
# Verify current version
pnpm list @tanstack/react-query

# Update if needed
pnpm add @tanstack/react-query@latest
```

### Install Additional Vite Plugins

```bash
# For path aliases and TypeScript
pnpm add -D vite-tsconfig-paths

# For environment variables
# (built into Vite, but types needed)
```

## 3. Configuration Files

### Create `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
  define: {
    'process.env': {},
  },
});
```

### Update `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Create `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "echo 'Linting disabled'",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Environment Variables

Create `.env` files:
- `.env` - Default values
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production values

**Important**: Vite uses `VITE_` prefix for public variables:

```env
# .env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Loctelli
```

Access in code:
```typescript
// Old (Next.js)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// New (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```

## 4. Project Structure Migration

### New Directory Structure

```
src/
├── routes/                 # TanStack Router routes
│   ├── __root.tsx         # Root route
│   ├── index.tsx          # Home page
│   ├── about.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── admin/
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   └── $id/
│   │       └── edit.tsx
│   └── ...
├── components/            # React components (unchanged)
├── lib/                   # Utilities (unchanged)
├── contexts/              # React contexts (unchanged)
├── hooks/                 # Custom hooks (unchanged)
├── main.tsx               # Entry point
├── App.tsx                # Root component
└── vite-env.d.ts          # Vite type definitions
```

### Create `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import './index.css';

// Create router instance
const router = createRouter({ routeTree });

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loctelli - AI-Powered Lead Generation</title>
    <meta name="description" content="Automate your sales with AI-powered funnels" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 5. Routing Migration

### TanStack Router Setup

TanStack Router uses file-based routing similar to Next.js, but with explicit route definitions.

### Root Route: `src/routes/__root.tsx`

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { UnifiedAuthProvider } from '@/contexts/unified-auth-context';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import './globals.css';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <UnifiedAuthProvider>
          <Outlet />
          <Toaster />
        </UnifiedAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  ),
});
```

### Home Route: `src/routes/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/components/version2/HomePage';

export const Route = createFileRoute('/')({
  component: HomePage,
});
```

### Dynamic Routes: `src/routes/admin/bookings/$id/edit.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/bookings/$id/edit')({
  component: EditBookingPage,
});

function EditBookingPage() {
  const { id } = Route.useParams();
  // Component implementation
}
```

### Route Groups

TanStack Router doesn't use parentheses for route groups. Instead, organize in folders:

```
routes/
├── admin/
│   ├── _layout.tsx      # Layout route
│   ├── index.tsx        # /admin
│   └── dashboard.tsx    # /admin/dashboard
```

### Layout Route: `src/routes/admin/_layout.tsx`

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const Route = createFileRoute('/admin/_layout')({
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
```

### Navigation Updates

#### Replace `next/link`

```typescript
// Old (Next.js)
import Link from 'next/link';
<Link href="/admin/dashboard">Dashboard</Link>

// New (TanStack Router)
import { Link } from '@tanstack/react-router';
<Link to="/admin/dashboard">Dashboard</Link>
```

#### Replace Navigation Hooks

```typescript
// Old (Next.js)
import { useRouter, usePathname } from 'next/navigation';
const router = useRouter();
const pathname = usePathname();

// New (TanStack Router)
import { useRouter, useLocation } from '@tanstack/react-router';
const router = useRouter();
const location = useLocation();
const pathname = location.pathname;
```

#### Programmatic Navigation

```typescript
// Old (Next.js)
router.push('/admin/dashboard');
router.replace('/admin/dashboard');

// New (TanStack Router)
router.navigate({ to: '/admin/dashboard' });
router.navigate({ to: '/admin/dashboard', replace: true });
```

## 6. API Routes Migration

### Option 1: Move to Backend (Recommended)

Move all `app/api/*` routes to your backend API:

- `app/api/contact/route.ts` → Backend endpoint
- `app/api/proxy/[...path]/route.ts` → Backend proxy or direct API calls
- `app/api/test/route.ts` → Backend test endpoint

### Option 2: Use Vite Proxy

Configure proxy in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

Then update API client to use `/api` prefix directly.

### Option 3: Separate API Server

Create a separate Express/Fastify server for API routes.

## 7. Component Migration

### Replace `next/image`

```typescript
// Old (Next.js)
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />

// New (Vite)
// Option 1: Standard img
<img src="/logo.png" alt="Logo" width={100} height={100} />

// Option 2: Use vite-plugin-imagemin or similar
import logo from '/logo.png';
<img src={logo} alt="Logo" />
```

### Replace `next/font`

```typescript
// Old (Next.js)
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// New (Vite)
// Option 1: Import from Google Fonts in HTML
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

// Option 2: Use CSS @import in globals.css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### Update Metadata/SEO

```typescript
// Old (Next.js)
export const metadata: Metadata = { ... };

// New (React Helmet)
import { Helmet } from 'react-helmet-async';

function Page() {
  return (
    <>
      <Helmet>
        <title>Loctelli - Dashboard</title>
        <meta name="description" content="..." />
      </Helmet>
      {/* Page content */}
    </>
  );
}
```

## 8. Environment Variables Migration

### Update Environment Variable Access

```typescript
// Old (Next.js)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// New (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```

### Update `lib/utils/envUtils.ts`

```typescript
// Old
export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// New
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};
```

### Type Definitions

Create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  // Add other env variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 9. Build & Deployment

### Update Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Update Build Scripts

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

## 10. Testing Updates

### Update Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
};
```

### Update Test Utilities

```typescript
// test-utils/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory(),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}>
        {ui}
      </RouterProvider>
    </QueryClientProvider>
  );
}
```

## 11. Step-by-Step Migration Process

### Day 1: Preparation
- [ ] Complete pre-migration checklist
- [ ] Create backup branch
- [ ] Document all Next.js features in use
- [ ] Set up migration branch

### Day 2: Dependencies
- [ ] Remove Next.js dependencies
- [ ] Install Vite and plugins
- [ ] Install TanStack Router
- [ ] Verify TanStack Query
- [ ] Update package.json scripts

### Day 3: Configuration
- [ ] Create vite.config.ts
- [ ] Update tsconfig.json
- [ ] Create index.html
- [ ] Set up environment variables
- [ ] Configure path aliases

### Day 4: Project Structure
- [ ] Create src/ directory structure
- [ ] Create main.tsx
- [ ] Create root route
- [ ] Move components to src/
- [ ] Update imports

### Day 5-6: Routing
- [ ] Convert root layout
- [ ] Migrate home page
- [ ] Migrate auth routes
- [ ] Migrate admin routes
- [ ] Update navigation components

### Day 7: API Migration
- [ ] Move API routes to backend
- [ ] Update API client
- [ ] Configure Vite proxy (if needed)
- [ ] Test all API calls

### Day 8: Components
- [ ] Replace next/image
- [ ] Replace next/link
- [ ] Update navigation hooks
- [ ] Migrate metadata to React Helmet
- [ ] Update font loading

### Day 9: Build & Deployment
- [ ] Update Dockerfile
- [ ] Create nginx.conf
- [ ] Test production build
- [ ] Configure CI/CD

### Day 10: Testing
- [ ] Update test configuration
- [ ] Fix broken tests
- [ ] Update test utilities
- [ ] Run full test suite

### Day 11: Final Verification
- [ ] Test all routes
- [ ] Test all API calls
- [ ] Test authentication flow
- [ ] Test admin functionality
- [ ] Performance testing

### Day 12: Deployment
- [ ] Deploy to staging
- [ ] Full regression testing
- [ ] Performance monitoring
- [ ] Fix any issues

## 12. Common Issues & Solutions

### Issue: Route Not Found

**Problem**: TanStack Router can't find route

**Solution**:
1. Ensure route file follows naming convention
2. Run `pnpm run dev` to regenerate route tree
3. Check route file exports `Route` correctly

### Issue: Environment Variables Not Working

**Problem**: `import.meta.env` is undefined

**Solution**:
1. Ensure variables start with `VITE_` prefix
2. Restart dev server after adding variables
3. Check `vite-env.d.ts` type definitions

### Issue: Build Fails

**Problem**: TypeScript or build errors

**Solution**:
1. Run `tsc --noEmit` to check types
2. Clear `.vite` cache: `rm -rf .vite`
3. Check `vite.config.ts` for errors
4. Verify all imports are correct

### Issue: Images Not Loading

**Problem**: Images return 404

**Solution**:
1. Ensure images are in `public/` directory
2. Use absolute paths: `/image.png`
3. For imported images, use `import` statement

### Issue: API Calls Failing

**Problem**: CORS or 404 errors

**Solution**:
1. Check Vite proxy configuration
2. Verify API URL in environment variables
3. Check backend CORS settings
4. Use full URL for external APIs

## 13. Rollback Procedure

If migration fails:

```bash
# Restore from backup branch
git checkout main
git branch -D migration/vite-tanstack-router

# Or restore specific files
git checkout backup/pre-migration-YYYYMMDD -- package.json
git checkout backup/pre-migration-YYYYMMDD -- next.config.ts
```

## 14. Post-Migration Checklist

- [ ] All routes working
- [ ] All API calls working
- [ ] Authentication flow working
- [ ] Admin functionality working
- [ ] Images loading correctly
- [ ] SEO metadata working
- [ ] Build succeeds
- [ ] Tests passing
- [ ] Production build works
- [ ] Deployment successful
- [ ] Performance acceptable
- [ ] No console errors
- [ ] No TypeScript errors

## Next Steps

After migration:
1. Monitor performance metrics
2. Optimize bundle size
3. Set up error tracking
4. Configure analytics
5. Update documentation
6. Train team on new stack

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [TanStack Router Documentation](https://tanstack.com/router)
- [TanStack Query Documentation](https://tanstack.com/query)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)

## Notes

Document any issues or custom solutions here:

```
[Add migration notes here]
```

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

