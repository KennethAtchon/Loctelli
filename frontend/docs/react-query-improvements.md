# React Query Improvements & Usage Guide

This document describes the current React Query setup, where to use it, and how to improve usage across the frontend. It complements [api-architecture.md](./api-architecture.md).

---

## Table of Contents

1. [Current Setup](#current-setup)
2. [Where to Use React Query](#where-to-use-react-query)
3. [Hook Selection Guide](#hook-selection-guide)
4. [File-by-File: Where to Use React Query](#file-by-file-where-to-use-react-query)
5. [Improvements](#improvements)
6. [Stale Time by Resource](#stale-time-by-resource)
7. [Migration Checklist](#migration-checklist)

---

## Current Setup

### Providers & QueryClient

- **File:** `frontend/components/providers.tsx`
- **QueryClient** is created once per app with:
  - **staleTime:** `60 * 1000` (1 minute) for all queries
  - **refetchOnWindowFocus:** `false`
  - **retry:** up to 3 times, except for 401 (handled by API client / mutation `onError`)
  - **mutations.onError:** 401 → refresh token, invalidate queries, or redirect to login

### Tenant-Aware Hooks

- **File:** `frontend/hooks/useTenantQuery.ts`
- **useTenantQuery** – GET with tenant in query key and `queryFn` context (`subAccountId`, `mode`)
- **useTenantMutation** – POST/PUT/PATCH/DELETE with tenant validation and optional `invalidateQueries`
- **useTenantQueryKey** – build tenant-scoped query keys for manual invalidation
- **useInvalidateTenantQueries** – invalidate all or specific tenant queries (e.g. after filter change)
- **useTenantInfiniteQuery** – currently implemented with `useQuery` (no cursor/pages); see [Improvements](#improvements)

### Non-React-Query Alternative

- **File:** `frontend/hooks/useTenantData.ts`
- **useTenantData** / **useTenantMutation** (from this file) – same tenant semantics but **no cache**, no deduplication, no shared state. Prefer **useTenantQuery** / **useTenantMutation** from `useTenantQuery.ts` for cached, tenant-aware data.

### Error Handling

- **File:** `frontend/lib/api/react-query-error-handler.ts`
- **handle401Error** – refresh token and invalidate queries on 401
- **configureQueryClientWithAuth** – optional; 401 handling is already in `providers.tsx` mutation defaults

---

## Where to Use React Query

Use React Query (or tenant hooks that wrap it) for:

| Scenario                                               | Use                                                                    | Reason                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Any GET that loads list or detail data**             | `useTenantQuery` (admin/tenant pages) or `useQuery` (public/no tenant) | Cache, deduplication, loading/error state, refetch             |
| **Tenant-scoped list/detail in admin**                 | `useTenantQuery`                                                       | Correct cache keys and invalidation when tenant filter changes |
| **Create/Update/Delete that should refresh lists**     | `useTenantMutation` with `invalidateQueries`                           | Keeps UI in sync after mutations                               |
| **Public data (no tenant)**                            | `useQuery`                                                             | e.g. public form by slug, status; no tenant in key             |
| **Admin-only, no tenant filter**                       | `useQuery`                                                             | e.g. list of admin users, system status                        |
| **One-off action (e.g. test connection, clear cache)** | `useMutation` (optional)                                               | Can stay as raw `api.*` if you don’t need cache invalidation   |
| **Infinite scroll / cursor lists**                     | `useInfiniteQuery` (see [Improvements](#improvements))                 | When backend supports cursor/page                              |

Do **not** use React Query for:

- **Auth flows** (login, register, refresh) – keep in auth context with direct `api.auth.*` / `api.adminAuth.*` calls.
- **Form submit that navigates away** – e.g. public form submit; mutation is optional.
- **Single fire-and-forget request** where you don’t need cache or refetch (e.g. analytics ping).

---

## Hook Selection Guide

| Context                          | Data type                                                 | Hook                                                                           | Example query key                                     |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Admin, tenant filter matters     | Leads, bookings, forms, contacts, strategies (by tenant)  | **useTenantQuery**                                                             | `['leads']`, `['bookings']`, `['forms', 'templates']` |
| Admin, tenant filter matters     | Create/update lead, booking, form, etc.                   | **useTenantMutation**                                                          | `invalidateQueries: [['leads']]`                      |
| Admin, no tenant (global config) | Subaccounts, admin users, prompt templates (global list)  | **useQuery**                                                                   | `['subaccounts']`, `['adminUsers']`                   |
| Admin dashboard                  | Stats, system status, recent leads (respect admin filter) | **useTenantQuery** (or useQuery with filter in key)                            | `['dashboard', 'stats']`                              |
| Public page                      | Form template by slug, status                             | **useQuery**                                                                   | `['form', slug]`, `['status']`                        |
| After mutation                   | Refresh related lists                                     | **useTenantMutation** `invalidateQueries` or **queryClient.invalidateQueries** | Same keys as above                                    |

---

## File-by-File: Where to Use React Query

### Admin app – list/detail pages (tenant-scoped)

Use **useTenantQuery** for the main list and **useTenantMutation** for create/update/delete. Replace `useState` + `useEffect` + `api.*` with these hooks.

| File                                          | Current pattern                                                                  | Use React Query for                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/admin/(main)/dashboard/page.tsx`         | `useState` + `Promise.all([getDashboardStats, getSystemStatus, getRecentLeads])` | **useTenantQuery** (or 3 queries) for stats, status, recent leads; optionally **useQuery** for detailed user/lead modals                                  |
| `app/admin/(main)/leads/page.tsx`             | `loadLeads()` with `api.leads.getLeads(queryParams)`                             | **useTenantQuery** `queryKey: ['leads']`, `queryFn` with `getTenantQueryParams()`; delete → **useTenantMutation** with `invalidateQueries: [['leads']]`   |
| `app/admin/(main)/contacts/page.tsx`          | `loadContacts()` with `api.contacts.getContacts()` + `getStats()`                | **useTenantQuery** for contacts and **useTenantQuery** for stats (or one query that returns both); add note → **useTenantMutation** + invalidate contacts |
| `app/admin/(main)/bookings/page.tsx`          | `loadBookings()` with `api.bookings.getBookings(queryParams)`                    | **useTenantQuery** `queryKey: ['bookings']`; filters in key or in `queryFn`                                                                               |
| `app/admin/(main)/forms/page.tsx`             | `loadData()` with `getFormTemplates` + `getFormSubmissions`                      | **useTenantQuery** for templates and **useTenantQuery** for submissions (or two queries); create/update/delete → **useTenantMutation** + invalidate       |
| `app/admin/(main)/forms/submissions/page.tsx` | `loadSubmissions()`                                                              | **useTenantQuery** `queryKey: ['forms', 'submissions']`                                                                                                   |
| `app/admin/(main)/strategies/page.tsx`        | `loadStrategies()` with `api.strategies.getStrategies(queryParams)`              | **useTenantQuery** `queryKey: ['strategies']`; delete → **useTenantMutation**                                                                             |
| `app/admin/(main)/prompt-templates/page.tsx`  | `loadTemplates()` (tenant-aware branch)                                          | **useTenantQuery** `queryKey: ['prompt-templates']`; activate/delete → **useTenantMutation**                                                              |
| `app/admin/(main)/integrations/page.tsx`      | `Promise.all([getActive(), getAll()])`                                           | **useTenantQuery** (or useQuery) for templates and integrations; delete → **useTenantMutation**                                                           |

### Admin app – detail/edit pages

Use **useTenantQuery** (or **useQuery** when no tenant) for loading the entity; **useTenantMutation** for save/delete.

| File                                                                   | Current pattern                                            | Use React Query for                                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `app/admin/(main)/leads/[id]/edit/page.tsx`                            | `Promise.all([getLead, getAllUsers, getStrategiesByUser])` | **useTenantQuery** for lead; **useQuery** for users; **useTenantQuery** for strategies; **useTenantMutation** for update |
| `app/admin/(main)/leads/new/page.tsx`                                  | `useEffect` for users + strategies, then create            | **useQuery** for users/strategies; **useTenantMutation** for create with `invalidateQueries: [['leads']]`                |
| `app/admin/(main)/bookings/[id]/edit/page.tsx`                         | `getBooking` + users + leads                               | **useTenantQuery** for booking; **useQuery** for users; **useTenantQuery** for leads; **useTenantMutation** for update   |
| `app/admin/(main)/strategies/[id]/page.tsx`                            | `getStrategy(strategyId)`                                  | **useTenantQuery** `queryKey: ['strategies', id]`; delete → **useTenantMutation**                                        |
| `app/admin/(main)/strategies/[id]/edit/page.tsx`                       | `Promise.all([getStrategy, getAllUsers, getAllTemplates])` | **useTenantQuery** for strategy; **useQuery** for users/templates; **useTenantMutation** for update                      |
| `app/admin/(main)/strategies/new/page.tsx`                             | `Promise.all` for users + templates, then create           | **useQuery** for users/templates; **useTenantMutation** for create                                                       |
| `app/admin/(main)/forms/[id]/edit/page.tsx`                            | `getFormTemplate(formId)`                                  | **useTenantQuery** `queryKey: ['forms', 'template', id]`; **useTenantMutation** for update                               |
| `app/admin/(main)/forms/submissions/[id]/page.tsx`                     | `getFormSubmission` + `updateFormSubmission`               | **useTenantQuery** for submission; **useTenantMutation** for update                                                      |
| `app/admin/(main)/integrations/[id]/page.tsx` and `[id]/edit/page.tsx` | `getById(id)` + test/sync/update/delete                    | **useQuery** or **useTenantQuery** for integration; **useTenantMutation** for test/sync/update/delete                    |
| `app/admin/(main)/contacts/[id]/edit/page.tsx`                         | `Promise.all([getContact, getUsers])`                      | **useTenantQuery** for contact; **useQuery** for users; **useTenantMutation** for update                                 |
| `app/admin/(main)/prompt-templates/[id]/edit/page.tsx`                 | `getById(templateId)`                                      | **useTenantQuery** for template; **useTenantMutation** for update                                                        |
| `app/admin/(main)/prompt-templates/new/page.tsx`                       | Create only                                                | **useTenantMutation** with `invalidateQueries: [['prompt-templates']]`                                                   |

### Admin app – global / no tenant

| File                                     | Current pattern                                | Use React Query for                                                                                             |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `app/admin/(main)/subaccounts/page.tsx`  | `loadSubaccounts()` with `getAllSubAccounts()` | **useQuery** `queryKey: ['subaccounts']`; create/update/delete → **useMutation** + invalidate `['subaccounts']` |
| `app/admin/(main)/users/page.tsx`        | `loadUsers()` + detailed user                  | **useQuery** `queryKey: ['admin', 'users']`; CRUD → **useMutation** + invalidate                                |
| `app/admin/(main)/settings/page.tsx`     | `loadAccounts()` + update/delete admin         | **useQuery** for accounts; **useMutation** for update password / delete account                                 |
| `contexts/subaccount-filter-context.tsx` | `loadSubaccounts()` in useEffect               | **useQuery** `queryKey: ['subaccounts']` and read from cache; optional `refetch` for refresh                    |

### Public / shared

| File                               | Current pattern                                          | Use React Query for                                                                                                         |
| ---------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `app/(main)/forms/[slug]/page.tsx` | `formsApi.getPublicForm(slug)` in `loadForm()` | **useQuery** `queryKey: ['form', 'public', slug]` for template; submit as-is or **useMutation** for submit |
| Auth (login/register)              | Direct `api.auth.*` / `api.adminAuth.*` in context       | Leave as-is (no React Query)                                                                                                |

### Components

| File                                            | Current pattern                                        | Use React Query for                                                                            |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `components/examples/TenantAwareLeadsList.tsx`  | **useTenantData**                                      | Switch to **useTenantQuery** for cache and consistency                                         |
| `components/examples/TenantAwareCreateLead.tsx` | **useTenantMutation** from useTenantData               | Switch to **useTenantMutation** from `useTenantQuery.ts` with `invalidateQueries: [['leads']]` |
| `components/admin/agent-info-modal.tsx`         | Direct `api.get<AgentInfo>(...)`                       | Optional **useQuery** keyed by lead/user if modal is shown often                               |
| `components/admin/sdk-tables.tsx`               | Direct `api.get` for tables                            | Optional **useQuery** for caching                                                              |
| `components/admin/database-schema.tsx`          | `api.general.getDatabaseSchema()`                      | Optional **useQuery** `queryKey: ['schema']`                                                   |
| `components/debug/debug-panel.tsx`              | Direct `api.dev.*` (system info, clear cache, test DB) | Can stay as direct calls or **useMutation** for actions                                        |

---

## Improvements

### 1. Prefer tenant hooks over raw fetch

- **useTenantQuery** / **useTenantMutation** (from `useTenantQuery.ts`) keep cache keys and invalidation consistent when the tenant filter changes.
- Replace **useTenantData** / **useTenantMutation** from `useTenantData.ts` with the hooks in `useTenantQuery.ts` wherever you want cache (e.g. `TenantAwareLeadsList`, `TenantAwareCreateLead`).

### 2. Fix useTenantInfiniteQuery for real infinite lists

- **File:** `frontend/hooks/useTenantQuery.ts`
- **Current:** `useTenantInfiniteQuery` uses `useQuery`, so it does not support cursor-based or page-based infinite loading.
- **Change:** Implement with **useInfiniteQuery** (from `@tanstack/react-query`), pass `pageParam` into `queryFn`, and add `getNextPageParam` / `getPreviousPageParam` so lists (e.g. leads, submissions) can use “Load more” or infinite scroll.

### 3. Stale time per resource

- **Current:** Single default `staleTime: 60 * 1000` in `providers.tsx`.
- **Improvement:** Override per query for resources that change rarely vs often (see [Stale Time by Resource](#stale-time-by-resource)).

### 4. Invalidate on tenant filter change

- When admin changes subaccount filter, tenant-scoped data should be refetched or cleared.
- Use **useInvalidateTenantQueries** in the filter UI (e.g. in tenant/subaccount context) and call `invalidateAllTenantQueries()` (or invalidate specific keys) when the filter changes so all **useTenantQuery** data for the previous tenant is invalidated.

### 5. Optional: Persist query client

- For better UX across reloads, consider `@tanstack/query-persist-client-core` + `localStorage` (or similar) and only persist selected query keys (e.g. `['subaccounts']`, not sensitive lists). Document and apply carefully to avoid persisting tenant-scoped data that becomes stale after filter change.

---

## Stale Time by Resource

Suggested `staleTime` (and optionally `gcTime`) per resource type when migrating to React Query:

| Resource                                      | Suggested staleTime | Notes                                           |
| --------------------------------------------- | ------------------- | ----------------------------------------------- |
| Dashboard stats, system status                | 1–2 min             | Refreshes often; 401 handling already in place  |
| Leads, contacts, bookings (lists)             | 1–2 min             | Balance freshness vs requests                   |
| Strategies, forms (templates/list)            | 2–5 min             | Changes less often                              |
| Single lead/contact/booking/strategy (detail) | 1–2 min             | Invalidate on list mutation                     |
| Prompt templates                              | 5 min               | Rarely changes                                  |
| Subaccounts, admin users                      | 5 min               | Config-like                                     |
| Public form template (by slug)                | 5–15 min            | High read, low write; invalidate on form update |
| Integration list/detail                       | 2–5 min             |                                                 |

Example:

```ts
useTenantQuery({
  queryKey: ["leads"],
  queryFn: ({ subAccountId }) => api.leads.getLeads({ subAccountId }),
  staleTime: 2 * 60 * 1000, // 2 minutes
});
```

---

## Migration Checklist

- [x] **Dashboard:** Replace `loadDashboardData()` with **useTenantQuery** (or 3 queries) for stats, status, recent leads.
- [x] **Leads page:** **useTenantQuery** for list, **useTenantMutation** for delete; detail modal can use **useQuery** keyed by lead id.
- [x] **Contacts page:** **useTenantQuery** for contacts + stats; **useTenantMutation** for add note.
- [x] **Bookings page:** **useTenantQuery** for list; mutations for create/update/delete with invalidation.
- [x] **Forms (admin):** **useTenantQuery** for templates and submissions; **useTenantMutation** for CRUD.
- [x] **Strategies:** **useTenantQuery** for list and detail; **useTenantMutation** for create/update/delete.
- [ ] **Prompt templates:** **useTenantQuery** for list/detail; **useTenantMutation** for activate/delete/update.
- [ ] **Integrations:** **useTenantQuery** or **useQuery** for list/detail; **useTenantMutation** for test/sync/update/delete.
- [x] **Subaccounts page:** **useQuery** for list; **useMutation** for CRUD.
- [x] **Subaccount filter context:** Load subaccounts with **useQuery** and optionally expose refetch.
- [x] **Public form page:** **useQuery** for form template by slug.
- [x] **Examples:** Replace **useTenantData** / **useTenantMutation** (useTenantData.ts) with **useTenantQuery** / **useTenantMutation** (useTenantQuery.ts).
- [x] **useTenantInfiniteQuery:** Reimplement with **useInfiniteQuery** for infinite lists.
- [x] **Invalidation:** Call **useInvalidateTenantQueries** when admin changes tenant filter (in subaccount filter context `setFilter`).
- [x] **Stale times:** Add per-query `staleTime` (and `gcTime` if needed) for key resources.

---

## References

- **How React Query works in this project (plain English + sequence diagrams):** `frontend/docs/tanstack-react-query-explained.md`
- **React Query setup:** `frontend/components/providers.tsx`
- **Tenant hooks:** `frontend/hooks/useTenantQuery.ts`
- **API client:** `frontend/lib/api/client.ts`
- **API architecture:** `frontend/docs/api-architecture.md`
