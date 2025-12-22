# Components Migration Guide

## Overview

This guide covers migrating React components, including UI components, admin components, custom components, and component patterns used throughout the application.

## Component Structure

### Current Component Organization

```
components/
├── admin/          # Admin-specific components
├── auth/           # Authentication components
├── chat/           # Chat interface
├── customUI/       # Custom data tables and UI
├── seo/            # SEO components
├── ui/             # Shadcn/ui base components
├── version1/       # Legacy landing page components
├── version2/       # Current landing page components
└── theme-provider.tsx
```

## 1. Shadcn/ui Base Components

### Location: `components/ui/`

#### Component Inventory

These are the base UI components from Shadcn/ui:

- Accordion, Alert, Alert Dialog, Avatar, Badge
- Breadcrumb, Button, Calendar, Card, Carousel
- Checkbox, Collapsible, Command, Context Menu
- Dialog, Drawer, Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu
- Popover, Progress, Radio Group, Scroll Area
- Select, Separator, Sheet, Skeleton, Slider
- Switch, Table, Tabs, Textarea, Toast, Toggle
- Tooltip, and more

#### Migration Steps

**1. Update Shadcn Components**

```bash
# Update Shadcn CLI (if using)
npx shadcn@latest add --help

# Check for component updates
# Review Shadcn documentation for breaking changes
```

**2. React 19 Compatibility**

- [ ] Verify all components work with React 19
- [ ] Check for deprecated React APIs
- [ ] Update ref usage if needed
- [ ] Verify forwardRef patterns

**3. TypeScript Updates**

- [ ] Check for type errors in components
- [ ] Update prop types if needed
- [ ] Verify generic types work correctly

#### Component-Specific Updates

**Button Component**

- [ ] Verify button variants work
- [ ] Check disabled states
- [ ] Test loading states

**Form Components**

- [ ] Verify form integration
- [ ] Check validation display
- [ ] Test error states

**Dialog/Modal Components**

- [ ] Verify portal rendering
- [ ] Check focus management
- [ ] Test accessibility

## 2. Admin Components

### Location: `components/admin/`

#### Component List

- `agent-info-modal.tsx`
- `bookings-time-editor.tsx`
- `database-schema.tsx`
- `forms/` (2 files)
- `header.tsx`
- `lead-details-content.tsx`
- `sdk-tables.tsx`
- `sidebar.tsx`
- `subaccount-filter.tsx`

#### Migration Steps

**1. Review Each Component**

For each admin component:

- [ ] Check React 19 compatibility
- [ ] Verify TypeScript types
- [ ] Test component functionality
- [ ] Check for deprecated APIs

**2. API Integration**

- [ ] Verify API calls work
- [ ] Check error handling
- [ ] Test loading states
- [ ] Verify data updates

**3. State Management**

- [ ] Check React Query usage
- [ ] Verify context usage
- [ ] Test state updates
- [ ] Check prop drilling

#### Key Components to Migrate

**agent-info-modal.tsx**

```typescript
// Check for:
// - Modal/dialog API changes
// - Form handling
// - API integration
// - State management
```

**sdk-tables.tsx**

```typescript
// Check for:
// - Table component updates
// - Data fetching
// - Sorting/filtering
// - Pagination
```

**subaccount-filter.tsx**

```typescript
// Check for:
// - Context usage
// - Filter state
// - API integration
```

## 3. Authentication Components

### Location: `components/auth/`

#### Components

- `admin-protected-route.tsx`
- `protected-route.tsx`

#### Migration Steps

**1. Protected Route Components**

- [ ] Verify authentication logic
- [ ] Check redirect behavior
- [ ] Test route protection
- [ ] Verify loading states

**2. Context Integration**

- [ ] Check UnifiedAuthContext usage
- [ ] Verify auth state checks
- [ ] Test logout handling
- [ ] Check token refresh

#### Example Migration

```typescript
// Verify protected route pattern
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Check React 19 compatibility
  // Verify useAuth hook works
  // Test redirect logic
}
```

## 4. Custom UI Components

### Location: `components/customUI/`

#### Components

- `bulk-actions.tsx`
- `data-table-example.tsx`
- `data-table.tsx`
- `index.ts`
- `use-pagination.ts`

#### Migration Steps

**1. Data Table Component**

- [ ] Verify table rendering
- [ ] Check sorting functionality
- [ ] Test filtering
- [ ] Verify pagination
- [ ] Check selection handling

**2. Custom Hooks**

- [ ] Review `use-pagination.ts`
- [ ] Verify hook patterns
- [ ] Test hook dependencies
- [ ] Check for memory leaks

**3. Bulk Actions**

- [ ] Verify action handling
- [ ] Check selection state
- [ ] Test API integration
- [ ] Verify error handling

## 5. Chat Components

### Location: `components/chat/`

#### Components

- `chat-interface.tsx`

#### Migration Steps

**1. Chat Interface**

- [ ] Verify real-time updates
- [ ] Check message rendering
- [ ] Test input handling
- [ ] Verify API integration
- [ ] Check WebSocket connections (if any)

**2. State Management**

- [ ] Check message state
- [ ] Verify conversation state
- [ ] Test message history
- [ ] Check loading states

## 6. Landing Page Components

### Location: `components/version1/` and `components/version2/`

#### Version 2 Components (Current)

- `contact-section.tsx`
- `footer.tsx`
- `hero-section.tsx`
- `navigation.tsx`
- `process-section.tsx`
- `services-section.tsx`

#### Migration Steps

**1. Review Current Version**

- [ ] Verify all sections render
- [ ] Check responsive design
- [ ] Test animations (if any)
- [ ] Verify links and navigation

**2. Component Patterns**

- [ ] Check component composition
- [ ] Verify prop types
- [ ] Test component isolation
- [ ] Check for code duplication

## 7. SEO Components

### Location: `components/seo/`

#### Components

- `structured-data.tsx`

#### Migration Steps

**1. Structured Data**

- [ ] Verify JSON-LD generation
- [ ] Check metadata rendering
- [ ] Test SEO validation
- [ ] Verify schema.org compliance

## 8. Theme Provider

### Location: `components/theme-provider.tsx`

#### Migration Steps

**1. Theme Provider**

- [ ] Verify `next-themes` integration
- [ ] Check theme switching
- [ ] Test dark mode
- [ ] Verify SSR compatibility
- [ ] Check hydration warnings

**2. Theme Configuration**

- [ ] Review theme setup
- [ ] Check CSS variables
- [ ] Verify theme persistence
- [ ] Test theme transitions

## 9. Component Patterns to Review

### Server Components vs Client Components

#### Current Pattern

Components using `"use client"`:

- [ ] List all client components
- [ ] Verify client directive usage
- [ ] Check for unnecessary client components
- [ ] Optimize server/client split

#### Migration Checklist

- [ ] Identify components that can be server components
- [ ] Move data fetching to server components where possible
- [ ] Keep interactivity in client components
- [ ] Verify hydration works correctly

### Context Usage

#### Current Contexts

- `unified-auth-context.tsx`
- `tenant-context.tsx`
- `subaccount-filter-context.tsx`
- `dark-mode-context.tsx`

#### Migration Steps

- [ ] Verify context providers work
- [ ] Check context consumption
- [ ] Test context updates
- [ ] Verify no unnecessary re-renders
- [ ] Check for context optimization opportunities

### Form Handling

#### React Hook Form Integration

- [ ] Verify form components use React Hook Form
- [ ] Check Zod validation
- [ ] Test form submission
- [ ] Verify error handling
- [ ] Check form state management

## 10. React 19 Specific Updates

### New Features to Consider

**1. useFormState and useFormStatus**

- [ ] Review form components for optimization
- [ ] Consider using new form hooks
- [ ] Test form state management

**2. Server Components**

- [ ] Identify server component opportunities
- [ ] Move data fetching to server
- [ ] Optimize component tree

**3. Automatic Batching**

- [ ] Verify state updates batch correctly
- [ ] Check for unnecessary re-renders
- [ ] Optimize state updates

## 11. TypeScript Updates

### Component Type Safety

- [ ] Verify all components have proper types
- [ ] Check prop types
- [ ] Verify generic components
- [ ] Test type inference
- [ ] Check for `any` types

### Type Updates

- [ ] Update React types
- [ ] Check Next.js types
- [ ] Verify component prop types
- [ ] Update event handler types

## 12. Testing Components

### Component Testing

- [ ] Verify test files exist for critical components
- [ ] Update test utilities
- [ ] Test component rendering
- [ ] Verify user interactions
- [ ] Check accessibility tests

### Test Updates

- [ ] Update React Testing Library usage
- [ ] Verify test queries work
- [ ] Check mock setup
- [ ] Test async operations

## 13. Component Migration Checklist

After migration, verify:

- [ ] All components render correctly
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] Forms work correctly
- [ ] API integrations work
- [ ] State management works
- [ ] Navigation works
- [ ] Responsive design works
- [ ] Accessibility maintained
- [ ] Performance is acceptable

## 14. Common Component Issues

### Issue: Hydration Mismatch

**Solution:**

1. Check for client/server component mismatch
2. Verify `suppressHydrationWarning` usage
3. Check for date/time rendering
4. Verify theme provider setup

### Issue: Context Not Working

**Solution:**

1. Verify context provider is in component tree
2. Check context value updates
3. Verify context consumption
4. Check for multiple providers

### Issue: Form Not Submitting

**Solution:**

1. Verify React Hook Form setup
2. Check form validation
3. Verify API integration
4. Check error handling

## Next Steps

After component migration:

- **[05-api-state-migration.md](./05-api-state-migration.md)** - Migrate API and state management

## Notes

Document component changes:

```
[Add component migration notes here]
```
