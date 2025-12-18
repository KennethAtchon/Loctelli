# Frontend Multi-Tenant System

## Overview

This document describes the robust, centralized multi-tenant system for the Loctelli frontend. The system automatically handles tenant isolation for regular users while preserving admin capabilities to view global or tenant-specific data.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     TenantProvider                          │
│  Centralized tenant context for entire application         │
│  - Detects user type (regular user vs admin)               │
│  - Manages subAccountId context                            │
│  - Provides helper functions                               │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
│  useTenant()     │ │ useTenant   │ │ TenantAware     │
│  Core hook       │ │ Query()     │ │ ApiClient       │
│                  │ │ React Query │ │                  │
│                  │ │ integration │ │                  │
└──────────────────┘ └─────────────┘ └──────────────────┘
```

### Tenant Modes

The system operates in three modes:

1. **USER_SCOPED** (Regular Users)
   - Automatically filtered to user's `subAccountId`
   - No option to view other tenants
   - SubAccountId always present

2. **ADMIN_GLOBAL** (Admin - Global View)
   - Can view data across all tenants
   - SubAccountId is `null`
   - Used for system-wide analytics/monitoring

3. **ADMIN_FILTERED** (Admin - Specific Tenant)
   - Admin filtered to specific `subAccountId`
   - Used when admin needs to manage specific tenant
   - Respects SubaccountFilterContext

## Setup

### 1. Provider Hierarchy

Add TenantProvider to your app layout:

```tsx
// app/layout.tsx
import { UnifiedAuthProvider } from '@/contexts/unified-auth-context';
import { TenantProvider } from '@/contexts/tenant-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <UnifiedAuthProvider>
            <TenantProvider>
              {children}
            </TenantProvider>
          </UnifiedAuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 2. Admin Layout (with SubaccountFilter)

For admin pages that need global/filtered view:

```tsx
// app/admin/layout.tsx
import { SubaccountFilterProvider } from '@/contexts/subaccount-filter-context';
import { TenantProvider } from '@/contexts/tenant-context';

export default function AdminLayout({ children }) {
  return (
    <SubaccountFilterProvider>
      <TenantProvider>
        {children}
      </TenantProvider>
    </SubaccountFilterProvider>
  );
}
```

**Important**: TenantProvider must be inside SubaccountFilterProvider for admin pages!

## Usage

### Basic Tenant Information

```tsx
'use client';

import { useTenant } from '@/contexts/tenant-context';

function MyComponent() {
  const {
    mode,           // 'USER_SCOPED' | 'ADMIN_GLOBAL' | 'ADMIN_FILTERED'
    subAccountId,   // number | null
    isGlobalView,   // boolean
  } = useTenant();

  return (
    <div>
      <p>Mode: {mode}</p>
      <p>SubAccount: {subAccountId || 'Global'}</p>
      {isGlobalView && <p>Viewing all tenants</p>}
    </div>
  );
}
```

### Tenant-Aware Queries (Recommended)

Use `useTenantQuery` for automatic tenant filtering:

```tsx
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { api } from '@/lib/api';

function LeadsList() {
  // Automatically includes tenant context in query key
  // Invalidates when tenant changes
  const { data: leads, isLoading } = useTenantQuery({
    queryKey: ['leads'],
    queryFn: async ({ subAccountId }) => {
      // subAccountId is automatically provided:
      // - Regular user: Their subAccountId
      // - Admin global: null
      // - Admin filtered: Selected subAccountId

      if (subAccountId) {
        return api.leads.getLeads({ subAccountId });
      }
      // Global view - fetch all
      return api.leads.getAllLeads();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {leads?.map(lead => (
        <li key={lead.id}>{lead.name}</li>
      ))}
    </ul>
  );
}
```

### Tenant-Aware Mutations

```tsx
import { useTenantMutation } from '@/hooks/useTenantQuery';

function CreateLeadForm() {
  const createLead = useTenantMutation({
    mutationFn: async ({ name, email, subAccountId }) => {
      // subAccountId automatically injected
      return api.leads.createLead({
        name,
        email,
        subAccountId: subAccountId!,
      });
    },
    // Auto-invalidate leads query for this tenant
    invalidateQueries: [['leads']],
    // Require subAccountId (throws error if null)
    requireSubAccount: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createLead.mutateAsync({ name: 'John', email: 'john@example.com' });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Manual Tenant Filtering

If you can't use `useTenantQuery`, use `useTenantScope`:

```tsx
import { useTenantScope } from '@/contexts/tenant-context';
import { useQuery } from '@tanstack/react-query';

function CustomQuery() {
  const { query, headers } = useTenantScope();

  const { data } = useQuery({
    queryKey: ['leads', query()],
    queryFn: async () => {
      // Method 1: Query params
      const params = query(); // { subAccountId: 123 } or {}
      return api.leads.getLeads(params);

      // Method 2: Headers
      const customHeaders = headers(); // { 'X-SubAccount-Id': '123' } or {}
      return fetch('/api/leads', { headers: customHeaders });
    },
  });

  return <div>{/* ... */}</div>;
}
```

### Access Control

```tsx
import { useTenant } from '@/contexts/tenant-context';

function LeadDetailsPage({ leadId, lead }) {
  const { canAccessSubAccount, validateTenantAccess } = useTenant();

  // Check if user can access this lead's subAccount
  if (!canAccessSubAccount(lead.subAccountId)) {
    return <div>Access Denied</div>;
  }

  // Or throw error if access denied
  const handleUpdate = async () => {
    validateTenantAccess(lead.subAccountId); // Throws if denied
    await api.leads.updateLead(leadId, { ... });
  };

  return <div>{/* ... */}</div>;
}
```

## Admin Global vs Filtered Views

### Pattern: Conditional Rendering

```tsx
import { useTenant } from '@/contexts/tenant-context';
import { useTenantQuery } from '@/hooks/useTenantQuery';

function AdminDashboard() {
  const { isGlobalView, mode } = useTenant();

  const { data } = useTenantQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async ({ subAccountId }) => {
      if (subAccountId) {
        // Filtered view - specific tenant stats
        return api.analytics.getTenantStats(subAccountId);
      }
      // Global view - all tenants
      return api.analytics.getGlobalStats();
    },
  });

  return (
    <div>
      <h1>
        {isGlobalView ? 'Global Dashboard' : `Tenant ${subAccountId} Dashboard`}
      </h1>

      {/* Conditional UI based on view */}
      {isGlobalView ? (
        <GlobalStatsView data={data} />
      ) : (
        <TenantStatsView data={data} />
      )}
    </div>
  );
}
```

### Pattern: Disable Actions in Global View

```tsx
function CreateResourceButton() {
  const { mode } = useTenant();

  if (mode === 'ADMIN_GLOBAL') {
    return (
      <Button disabled>
        Select a subaccount to create resources
      </Button>
    );
  }

  return <Button onClick={handleCreate}>Create Resource</Button>;
}
```

### Pattern: SubAccount Selector

The SubaccountFilterContext is automatically integrated:

```tsx
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

function SubAccountSelector() {
  const {
    currentFilter,
    availableSubaccounts,
    setFilter,
  } = useSubaccountFilter();

  return (
    <select value={currentFilter} onChange={(e) => setFilter(e.target.value)}>
      <option value="GLOBAL">All Tenants</option>
      {availableSubaccounts.map(sa => (
        <option key={sa.id} value={sa.id}>{sa.name}</option>
      ))}
    </select>
  );
}
```

## Advanced Usage

### Query Invalidation on Tenant Change

Queries automatically re-fetch when tenant context changes. But you can manually invalidate:

```tsx
import { useInvalidateTenantQueries } from '@/hooks/useTenantQuery';

function SubAccountSwitcher() {
  const { setFilter } = useSubaccountFilter();
  const { invalidateAllTenantQueries } = useInvalidateTenantQueries();

  const handleSwitch = (newSubAccountId) => {
    setFilter(newSubAccountId);
    // Force immediate refetch
    invalidateAllTenantQueries();
  };

  return <select onChange={(e) => handleSwitch(e.target.value)}>...</select>;
}
```

### Tenant-Aware API Client

For custom API calls outside React Query:

```tsx
import { tenantApiClient } from '@/lib/api/tenant-client';
import { useTenant } from '@/contexts/tenant-context';
import { useEffect } from 'react';

function CustomAPIComponent() {
  const { subAccountId, mode } = useTenant();

  useEffect(() => {
    // Set tenant context on the API client
    tenantApiClient.setTenantContext(subAccountId, mode);
  }, [subAccountId, mode]);

  const handleFetch = async () => {
    // Automatically includes X-SubAccount-Id header
    const data = await tenantApiClient.getTenantScoped('/custom-endpoint');
  };

  return <button onClick={handleFetch}>Fetch</button>;
}
```

## Migration Guide

### Migrating Existing Components

**Before** (Manual filtering):

```tsx
function OldLeadsList() {
  const { user } = useAuth();
  const { currentFilter, isGlobalView } = useSubaccountFilter();

  const { data } = useQuery({
    queryKey: ['leads', user?.subAccountId, currentFilter],
    queryFn: async () => {
      // Manually determine what to fetch
      if (user?.accountType === 'admin') {
        if (isGlobalView()) {
          return api.leads.getLeads(); // All leads
        } else {
          const subAccount = getCurrentSubaccount();
          return api.leads.getLeads({ subAccountId: subAccount.id });
        }
      } else {
        return api.leads.getLeads({ subAccountId: user.subAccountId });
      }
    },
  });

  return <div>{/* ... */}</div>;
}
```

**After** (Automatic filtering):

```tsx
function NewLeadsList() {
  const { data } = useTenantQuery({
    queryKey: ['leads'],
    queryFn: async ({ subAccountId }) => {
      // Automatically handled!
      return api.leads.getLeads(subAccountId ? { subAccountId } : undefined);
    },
  });

  return <div>{/* ... */}</div>;
}
```

**Benefits**:
- ✅ 70% less code
- ✅ No manual tenant logic
- ✅ Automatic invalidation
- ✅ Type-safe
- ✅ Consistent across app

## Security

### Validation in Components

```tsx
function EditLead({ leadId, lead }) {
  const { validateTenantAccess, canAccessSubAccount } = useTenant();

  const handleSave = async (data) => {
    // Validate before mutation
    validateTenantAccess(lead.subAccountId);

    await api.leads.updateLead(leadId, data);
  };

  // Or in useEffect
  useEffect(() => {
    if (!canAccessSubAccount(lead.subAccountId)) {
      router.push('/access-denied');
    }
  }, [lead]);

  return <form onSubmit={handleSave}>...</form>;
}
```

### Protection at Route Level

```tsx
// app/dashboard/page.tsx
import { RequireTenant } from '@/contexts/tenant-context';

export default function DashboardPage() {
  return (
    <RequireTenant>
      <Dashboard />
    </RequireTenant>
  );
}
```

## Testing

### Mock Tenant Context

```tsx
import { TenantContext } from '@/contexts/tenant-context';

function TestWrapper({ children, mode = 'USER_SCOPED', subAccountId = 1 }) {
  const mockValue = {
    mode,
    subAccountId,
    isGlobalView: mode === 'ADMIN_GLOBAL',
    shouldFilterByTenant: mode !== 'ADMIN_GLOBAL',
    // ... other required fields
  };

  return (
    <TenantContext.Provider value={mockValue}>
      {children}
    </TenantContext.Provider>
  );
}

// Test
it('shows only user leads', () => {
  render(
    <TestWrapper mode="USER_SCOPED" subAccountId={1}>
      <LeadsList />
    </TestWrapper>
  );

  // Assert filtered correctly
});
```

## Troubleshooting

### Issue: "useTenant must be used within TenantProvider"

**Solution**: Ensure TenantProvider wraps your component:

```tsx
// app/layout.tsx
<TenantProvider>
  {children}
</TenantProvider>
```

### Issue: Admin can't see global view

**Solution**: Ensure SubaccountFilterProvider wraps TenantProvider in admin layout:

```tsx
// app/admin/layout.tsx
<SubaccountFilterProvider>
  <TenantProvider>
    {children}
  </TenantProvider>
</SubaccountFilterProvider>
```

### Issue: Queries don't invalidate when switching tenants

**Solution**: Use `useTenantQuery` instead of `useQuery`, or manually include tenant context in query key:

```tsx
const { subAccountId, mode } = useTenant();

useQuery({
  queryKey: ['leads', { mode, subAccountId }],
  queryFn: ...
});
```

### Issue: Regular user has no subAccountId

**Solution**: This is a critical error. Check:
1. User registration includes subAccountId
2. JWT payload includes subAccountId
3. Profile endpoint returns subAccountId

## Performance

The tenant system is highly optimized:

- ✅ **Memoized contexts** - No unnecessary re-renders
- ✅ **Automatic cache invalidation** - Only invalidates affected queries
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Tree-shakeable** - Only imports what you use

## Best Practices

1. **Always use `useTenantQuery`** for data fetching
2. **Never hardcode subAccountId** in components
3. **Validate tenant access** before mutations
4. **Use conditional rendering** for admin global/filtered views
5. **Include tenant context in query keys** if not using useTenantQuery
6. **Test both user and admin modes** for each component
7. **Log tenant context changes** for debugging

## Related Files

- [`contexts/tenant-context.tsx`](../frontend/contexts/tenant-context.tsx) - Core tenant context
- [`hooks/useTenantQuery.ts`](../frontend/hooks/useTenantQuery.ts) - React Query integration
- [`lib/api/tenant-client.ts`](../frontend/lib/api/tenant-client.ts) - Tenant-aware API client
- [`contexts/subaccount-filter-context.tsx`](../frontend/contexts/subaccount-filter-context.tsx) - Admin filter
- [`components/examples/`](../frontend/components/examples/) - Usage examples

## See Also

- [Backend Tenant Isolation](./architecture/04-tenant-isolation-enforcement.md)
- [Multi-Tenant Architecture](./architecture/03-multi-tenant.md)
- [Authentication System](./architecture/01-authentication.md)
