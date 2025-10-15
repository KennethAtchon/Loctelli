# Tenant System Integration Guide

## Overview

The tenant system provides automatic multi-tenant data isolation for both regular users and admins. It has been integrated into the frontend to automatically filter all API calls based on user type and current admin filter selection.

## What Was Integrated

### 1. Core Components

- **TenantProvider** - Added to [admin layout](my-app/app/admin/(main)/layout.tsx:36)
  - Wraps all admin pages
  - Provides tenant context to all child components
  - Works seamlessly with existing SubaccountFilterProvider

- **Tenant Context** - [tenant-context.tsx](my-app/contexts/tenant-context.tsx)
  - Three modes: `USER_SCOPED`, `ADMIN_GLOBAL`, `ADMIN_FILTERED`
  - Automatic detection based on auth state
  - Security validation before all operations

- **Tenant Hooks**:
  - `useTenant()` - Main hook for accessing tenant context
  - `useTenantData()` - Simplified data fetching without React Query
  - `useTenantQuery()` - React Query integration for advanced use cases
  - `useTenantScope()` - Helper for tenant-scoped operations

### 2. Updated Pages

✅ **Migrated to Tenant System (Main List Pages):**
- [leads/page.tsx](my-app/app/admin/(main)/leads/page.tsx:19) - Using `useTenant()`
- [contacts/page.tsx](my-app/app/admin/(main)/contacts/page.tsx:17) - Using `useTenant()`
- [bookings/page.tsx](my-app/app/admin/(main)/bookings/page.tsx:16) - Using `useTenant()`
- [users/page.tsx](my-app/app/admin/(main)/users/page.tsx:20) - Using `useTenant()`
- [strategies/page.tsx](my-app/app/admin/(main)/strategies/page.tsx:19) - Using `useTenant()`
- [dashboard/page.tsx](my-app/app/admin/(main)/dashboard/page.tsx:93) - Using `useTenant()`
- [chat/page.tsx](my-app/app/admin/(main)/chat/page.tsx:51) - Using `useTenant()`
- [prompt-templates/page.tsx](my-app/app/admin/(main)/prompt-templates/page.tsx:22) - Using `useTenant()`
- [forms/page.tsx](my-app/app/admin/(main)/forms/page.tsx:18) - Using `useTenant()`

⚠️ **Still Need Migration:**
- forms/submissions/page.tsx
- Various create pages (leads/new, strategies/new, forms/new, etc.)
- Various edit pages ([id]/edit/page.tsx)
- Subaccounts page (uses different pattern)
- Any custom dialogs/modals that fetch data

## How It Works

### For Regular Users
```typescript
// Regular users are automatically scoped to their subAccountId
const { getTenantQueryParams } = useTenant();

// This will return: { subAccountId: <user's subaccount> }
const leads = await api.leads.getLeads(getTenantQueryParams());
```

### For Admins

#### Global View (No Filter Selected)
```typescript
const { getTenantQueryParams, isGlobalView } = useTenant();

// Returns: {} - no filtering
const leads = await api.leads.getLeads(getTenantQueryParams());
// Admin sees ALL leads across ALL tenants
```

#### Filtered View (Specific Tenant Selected)
```typescript
const { getTenantQueryParams } = useTenant();

// Returns: { subAccountId: <selected tenant> }
const leads = await api.leads.getLeads(getTenantQueryParams());
// Admin sees only leads for selected tenant
```

## Migration Pattern

### Before (Old Pattern)
```typescript
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

export default function MyPage() {
  const { getCurrentSubaccount } = useSubaccountFilter();

  const loadData = async () => {
    const currentSubaccount = getCurrentSubaccount();
    const data = await api.getData(
      currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
    );
  };
}
```

### After (New Pattern)
```typescript
import { useTenant } from '@/contexts/tenant-context';

export default function MyPage() {
  const { getTenantQueryParams } = useTenant();

  const loadData = async () => {
    // Much simpler - automatic filtering!
    const data = await api.getData(getTenantQueryParams());
  };
}
```

## Security Features

1. **Automatic Validation** - Every operation validates tenant access
2. **User Isolation** - Regular users can ONLY access their own tenant
3. **Admin Flexibility** - Admins can view globally or filter to specific tenant
4. **Backend Enforcement** - Backend guard validates all requests (see [tenant-isolation.guard.ts](project/src/main-app/infrastructure/prisma/tenant-isolation.guard.ts))

## Example Components

Created example components showing best practices:

- [TenantAwareLeadsList.tsx](my-app/components/examples/TenantAwareLeadsList.tsx) - Displaying tenant-filtered data
- [TenantAwareCreateLead.tsx](my-app/components/examples/TenantAwareCreateLead.tsx) - Creating tenant-scoped records

## API Client Integration

The tenant system works with your existing API client. Simply pass the tenant params:

```typescript
// Auto-generated tenant params
const { getTenantQueryParams, getTenantHeaders } = useTenant();

// For query parameters
await api.getData(getTenantQueryParams());

// For headers (if needed)
await api.postData(data, { headers: getTenantHeaders() });
```

## Testing Checklist

- [ ] Test as regular user - should only see their tenant's data
- [ ] Test as admin with global view - should see all data
- [ ] Test as admin with filtered view - should see filtered tenant's data
- [ ] Test switching between global and filtered view
- [ ] Test creating records - should auto-assign to correct tenant
- [ ] Verify backend guard blocks unauthorized access attempts

## Next Steps

1. **Migrate Remaining Pages** - Update all pages that fetch tenant-scoped data
2. **Backend Validation** - Ensure all backend endpoints use TenantIsolationGuard
3. **Add Tenant Indicator** - Show current tenant in UI header
4. **Documentation** - Update API docs to show tenant parameter requirements

## Benefits

✅ **Simpler Code** - No more manual tenant filtering logic
✅ **More Secure** - Automatic validation prevents data leaks
✅ **Less Bugs** - Centralized logic reduces errors
✅ **Better UX** - Seamless switching between global/filtered views
✅ **Type Safe** - Full TypeScript support with proper types

## Support

For questions or issues:
1. Check [FRONTEND-TENANT-SYSTEM.md](.helper/FRONTEND-TENANT-SYSTEM.md)
2. Review [tenant-context.tsx](my-app/contexts/tenant-context.tsx) implementation
3. See example components for usage patterns
