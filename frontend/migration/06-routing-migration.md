# Routing Migration Guide

## Overview

This guide covers migrating the Next.js App Router structure, route handlers, and navigation patterns used throughout the application.

## App Router Structure

### Current Route Structure

```
app/
├── (main)/              # Route group
│   ├── blog/
│   │   └── page.tsx
│   └── forms/
│       └── [slug]/
│           └── page.tsx
├── account/
│   └── page.tsx
├── admin/
│   ├── (auth)/          # Admin auth route group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (main)/          # Admin main route group
│   │   ├── [34 files]   # Admin dashboard pages
│   │   └── layout.tsx
│   └── page.tsx
├── api/
│   ├── contact/
│   │   └── route.ts
│   ├── proxy/            # API proxy routes
│   └── test/
│       └── route.ts
├── auth/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── globals.css
├── layout.tsx           # Root layout
├── page.tsx             # Home page
└── sitemap.ts           # Sitemap generation
```

## 1. Next.js 15 App Router Updates

### Migration Steps

**1. Route Groups**

- [ ] Verify route groups `(main)`, `(auth)`, `(main)` work correctly
- [ ] Check layout nesting
- [ ] Verify route group isolation
- [ ] Test navigation between groups

**2. Dynamic Routes**

- [ ] Verify `[slug]` dynamic routes work
- [ ] Check route parameter handling
- [ ] Test dynamic route generation
- [ ] Verify catch-all routes (if any)

**3. Route Handlers**

- [ ] Verify API routes in `app/api/` work
- [ ] Check route handler exports
- [ ] Test HTTP methods (GET, POST, etc.)
- [ ] Verify response handling

## 2. Root Layout

### File: `app/layout.tsx`

#### Current Implementation

Provides:

- Root HTML structure
- Metadata configuration
- Theme provider
- Auth provider
- Global styles

#### Migration Steps

**1. Metadata API**

- [ ] Verify Next.js 15 metadata API
- [ ] Check metadata structure
- [ ] Test SEO metadata
- [ ] Verify Open Graph tags
- [ ] Check Twitter cards

**2. Providers**

- [ ] Verify ThemeProvider setup
- [ ] Check UnifiedAuthProvider
- [ ] Test provider nesting
- [ ] Verify SSR compatibility
- [ ] Check hydration warnings

**3. Font Loading**

- [ ] Verify `next/font/google` usage
- [ ] Check font optimization
- [ ] Test font loading
- [ ] Verify font display

#### Example: Layout Structure

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <UnifiedAuthProvider>
            {children}
          </UnifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] Verify HTML structure
- [ ] Check provider order
- [ ] Test client/server component mix
- [ ] Verify suppressHydrationWarning

## 3. Route Groups

### (main) Route Group

#### Location: `app/(main)/`

**Routes:**

- `blog/page.tsx`
- `forms/[slug]/page.tsx`

#### Migration Steps

- [ ] Verify route group isolation
- [ ] Check shared layout (if any)
- [ ] Test route access
- [ ] Verify URL structure

### (auth) Route Groups

#### Admin Auth: `app/admin/(auth)/`

**Routes:**

- `login/page.tsx`
- `register/page.tsx`
- `layout.tsx`

#### Migration Steps

- [ ] Verify auth layout
- [ ] Check route protection
- [ ] Test redirect logic
- [ ] Verify auth state handling

### Admin Main: `app/admin/(main)/`

**Routes:**

- 34 admin dashboard pages
- `layout.tsx`

#### Migration Steps

- [ ] Verify admin layout
- [ ] Check route protection
- [ ] Test navigation
- [ ] Verify subaccount filtering

## 4. Dynamic Routes

### Forms Route

#### Location: `app/(main)/forms/[slug]/page.tsx`

#### Migration Steps

**1. Dynamic Parameter**

- [ ] Verify `[slug]` parameter extraction
- [ ] Check `params` prop type
- [ ] Test route generation
- [ ] Verify 404 handling

**2. Route Handler**

- [ ] Verify form data fetching
- [ ] Check API integration
- [ ] Test form rendering
- [ ] Verify error handling

#### Example: Dynamic Route

```typescript
export default async function FormPage({
  params,
}: {
  params: { slug: string };
}) {
  // Verify params type
  // Check slug validation
  // Test data fetching
}
```

## 5. API Routes

### Location: `app/api/`

#### Routes

1. **contact/route.ts** - Contact form handler
2. **proxy/** - API proxy routes
3. **test/route.ts** - Test endpoint

#### Migration Steps

**1. Route Handlers**

- [ ] Verify route handler exports
- [ ] Check HTTP method handlers (GET, POST, etc.)
- [ ] Test request handling
- [ ] Verify response formatting

**2. API Proxy**

- [ ] Verify proxy implementation
- [ ] Check API key injection
- [ ] Test request forwarding
- [ ] Verify error handling
- [ ] Check CORS handling

**3. Contact Route**

- [ ] Verify contact form handling
- [ ] Check email sending (if any)
- [ ] Test form validation
- [ ] Verify error responses

#### Example: API Route

```typescript
export async function POST(request: Request) {
  // Verify request handling
  // Check body parsing
  // Test error handling
  // Verify response format
}
```

## 6. Protected Routes

### User Protected Routes

#### Location: `components/auth/protected-route.tsx`

#### Migration Steps

- [ ] Verify route protection logic
- [ ] Check authentication state
- [ ] Test redirect behavior
- [ ] Verify loading states
- [ ] Check error handling

### Admin Protected Routes

#### Location: `components/auth/admin-protected-route.tsx`

#### Migration Steps

- [ ] Verify admin route protection
- [ ] Check admin authentication
- [ ] Test redirect to admin login
- [ ] Verify permission checks
- [ ] Test subaccount access

## 7. Navigation

### Client-Side Navigation

#### Next.js Navigation

- [ ] Verify `next/navigation` usage
- [ ] Check `useRouter` hook
- [ ] Test `usePathname` hook
- [ ] Verify `useSearchParams` hook
- [ ] Test navigation methods

#### Navigation Components

- [ ] Verify navigation components
- [ ] Check active route highlighting
- [ ] Test mobile navigation
- [ ] Verify navigation state

## 8. Metadata and SEO

### Page Metadata

#### Migration Steps

**1. Static Metadata**

- [ ] Verify metadata exports
- [ ] Check metadata structure
- [ ] Test SEO metadata
- [ ] Verify Open Graph
- [ ] Check Twitter cards

**2. Dynamic Metadata**

- [ ] Verify dynamic metadata generation
- [ ] Check `generateMetadata` function
- [ ] Test metadata for dynamic routes
- [ ] Verify metadata updates

**3. Sitemap**

- [ ] Verify `sitemap.ts` generation
- [ ] Check sitemap structure
- [ ] Test sitemap generation
- [ ] Verify sitemap routes

#### Example: Metadata

```typescript
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
  // Verify all metadata fields
};
```

## 9. Server Components vs Client Components

### Component Type Strategy

#### Migration Steps

**1. Identify Server Components**

- [ ] List all server components
- [ ] Verify no client-side APIs used
- [ ] Check data fetching
- [ ] Test server component rendering

**2. Identify Client Components**

- [ ] List all client components (`"use client"`)
- [ ] Verify client-side APIs needed
- [ ] Check interactivity requirements
- [ ] Test client component hydration

**3. Component Composition**

- [ ] Verify server/client component mixing
- [ ] Check prop passing
- [ ] Test component boundaries
- [ ] Verify hydration warnings

## 10. Route Loading and Error States

### Loading States

#### Migration Steps

- [ ] Verify `loading.tsx` files (if any)
- [ ] Check loading UI
- [ ] Test loading states
- [ ] Verify loading transitions

### Error States

#### Migration Steps

- [ ] Verify `error.tsx` files (if any)
- [ ] Check error boundaries
- [ ] Test error handling
- [ ] Verify error recovery

### Not Found Pages

#### Migration Steps

- [ ] Verify `not-found.tsx` files (if any)
- [ ] Check 404 handling
- [ ] Test not found pages
- [ ] Verify custom 404 pages

## 11. Route Middleware

### Middleware Usage

#### Migration Steps

- [ ] Check for `middleware.ts` file
- [ ] Verify middleware logic
- [ ] Test middleware execution
- [ ] Check route matching
- [ ] Verify redirects

## 12. Route Testing

### Test Routes

#### Migration Steps

- [ ] Verify all routes accessible
- [ ] Test route navigation
- [ ] Check route parameters
- [ ] Verify route protection
- [ ] Test error routes
- [ ] Check 404 handling

## 13. Next.js 15 Specific Updates

### App Router Updates

- [ ] Review Next.js 15 App Router changes
- [ ] Check for deprecated APIs
- [ ] Update route handlers if needed
- [ ] Verify server actions (if used)
- [ ] Test parallel routes (if used)
- [ ] Check intercepting routes (if used)

### Server Actions

- [ ] Identify server actions usage
- [ ] Verify server action syntax
- [ ] Test server action calls
- [ ] Check error handling
- [ ] Verify form actions

## 14. Migration Checklist

After routing migration, verify:

- [ ] All routes accessible
- [ ] Navigation works
- [ ] Route protection works
- [ ] Dynamic routes work
- [ ] API routes work
- [ ] Metadata works
- [ ] SEO maintained
- [ ] Loading states work
- [ ] Error handling works
- [ ] 404 pages work

## 15. Common Routing Issues

### Issue: Route Not Found

**Solution:**

1. Verify route file structure
2. Check route naming
3. Verify route groups
4. Test route access

### Issue: Hydration Mismatch

**Solution:**

1. Check server/client component mix
2. Verify `suppressHydrationWarning`
3. Check date/time rendering
4. Verify theme provider

### Issue: Metadata Not Working

**Solution:**

1. Verify metadata export
2. Check metadata structure
3. Test metadata generation
4. Verify Next.js version

## Next Steps

After routing migration:

- **[07-testing-migration.md](./07-testing-migration.md)** - Migrate testing setup

## Notes

Document routing changes:

```
[Add routing migration notes here]
```
