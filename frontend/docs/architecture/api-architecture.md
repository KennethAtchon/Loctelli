# API Architecture Documentation

This document provides a comprehensive overview of how the `/lib/api` folder integrates with the `/api/proxy` route handler, how `providers.tsx` ties into the system, and the role of React Query and Query Client in the application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Flow](#architecture-flow)
3. [Core Components](#core-components)
4. [Request Flow](#request-flow)
5. [React Query Integration](#react-query-integration)
6. [Authentication Flow](#authentication-flow)
7. [Error Handling](#error-handling)
8. [Tenant-Aware API Client](#tenant-aware-api-client)

---

## Overview

The API architecture follows a layered approach:

```
Component → React Query Hook → API Client → /api/proxy → Backend API
```

**Key Design Principles:**

- **Proxy Pattern**: All API requests go through `/api/proxy` to avoid CORS issues
- **Centralized Client**: Single `ApiClient` instance manages all HTTP requests
- **React Query**: Handles caching, state management, and automatic refetching
- **Authentication**: Automatic token management and refresh
- **Tenant Awareness**: Multi-tenant support with automatic filtering

---

## Architecture Flow

### High-Level Flow Diagram

```
┌─────────────────┐
│   Component     │
│  (React UI)     │
└────────┬────────┘
         │
         │ useQuery/useMutation
         ▼
┌─────────────────┐
│  React Query    │
│  QueryClient    │
│  (providers.tsx)│
└────────┬────────┘
         │
         │ queryFn: () => api.endpoint.method()
         ▼
┌─────────────────┐
│   API Client    │
│  (/lib/api)     │
└────────┬────────┘
         │
         │ fetch('/api/proxy/...')
         ▼
┌─────────────────┐
│  /api/proxy     │
│  (Next.js Route)│
└────────┬────────┘
         │
         │ fetch(BACKEND_URL/...)
         ▼
┌─────────────────┐
│  Backend API    │
│  (NestJS)       │
└─────────────────┘
```

---

## Core Components

### 1. `/api/proxy/[...path]/route.ts`

**Purpose**: Next.js API route handler that acts as a proxy between the frontend and backend.

**Key Features:**

- **CORS Handling**: Adds CORS headers to all responses
- **Request Forwarding**: Forwards all HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- **Header Forwarding**: Forwards important headers like `Authorization`, `Content-Type`, `X-API-Key`
- **Body Handling**: Supports both JSON and FormData (multipart/form-data)
- **Binary Support**: Handles binary responses (images, PDFs, etc.)

**Configuration:**

```typescript
// From envUtils.ts
BASE_URL: "/api/proxy"; // Frontend uses this
BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8000"; // Proxy uses this
```

**Why Use a Proxy?**

1. **CORS Avoidance**: Browsers can't make direct requests to different origins
2. **Security**: Hides backend URL from client-side code
3. **API Key Management**: Server-side API keys stay secure
4. **Request Transformation**: Can modify requests/responses if needed

### 2. `/lib/api/client.ts` - ApiClient

**Purpose**: Core HTTP client that handles all API requests.

**Key Responsibilities:**

- Making HTTP requests to `/api/proxy`
- Adding authentication headers via `AuthManager`
- Handling 401 errors with automatic token refresh
- Rate limiting protection
- Error parsing and formatting

**Key Methods:**

```typescript
class ApiClient {
  request<T>(endpoint: string, options: RequestInit): Promise<T>;
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data?: unknown): Promise<T>;
  patch<T>(endpoint: string, data?: unknown): Promise<T>;
  put<T>(endpoint: string, data?: unknown): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
  uploadFile<T>(endpoint: string, formData: FormData): Promise<T>;
}
```

**401 Error Handling:**
When a 401 error occurs:

1. Attempts to refresh the token using `AuthManager.refreshToken()`
2. Retries the original request with the new token
3. If refresh fails, clears tokens and redirects to login

### 3. `/lib/api/auth-manager.ts` - AuthManager

**Purpose**: Manages authentication tokens and headers.

**Key Features:**

- **Token Storage**: Uses cookies via `AuthCookies` helper
- **Dual Authentication**: Supports both user and admin tokens (admin takes precedence)
- **Token Refresh**: Automatically refreshes expired tokens
- **Header Generation**: Creates `Authorization: Bearer <token>` headers

**Token Flow:**

```
Login → Store tokens in cookies →
Get tokens from cookies → Add to headers →
401 Error → Refresh token → Retry request
```

### 4. `/lib/api/index.ts` - Main API Interface

**Purpose**: Provides a unified API interface with domain-specific endpoints.

**Structure:**

```typescript
class Api extends ApiClient {
  auth: AuthApi;
  adminAuth: AdminAuthApi;
  users: UsersApi;
  leads: LeadsApi;
  strategies: StrategiesApi;
  // ... more endpoints
}

export const api = new Api(); // Singleton instance
```

**Usage:**

```typescript
// In components
await api.leads.getLeads({ subAccountId: 1 });
await api.auth.login({ email, password });
```

### 5. `/lib/api/tenant-client.ts` - TenantAwareApiClient

**Purpose**: Extends `ApiClient` with automatic tenant context handling.

**Key Features:**

- Automatically includes `X-SubAccount-Id` and `X-Tenant-Mode` headers
- Supports three modes:
  - `USER_SCOPED`: Regular user, automatically filtered by their subAccount
  - `ADMIN_GLOBAL`: Admin viewing all data across subAccounts
  - `ADMIN_FILTERED`: Admin viewing data for a specific subAccount

**Usage:**

```typescript
// Set tenant context (usually done by TenantProvider)
tenantApiClient.setTenantContext(subAccountId, mode);

// All subsequent requests include tenant headers
await tenantApiClient.get("/leads");
```

---

## Request Flow

### Example: Fetching Leads

Let's trace a complete request from component to backend:

#### Step 1: Component Makes Request

```typescript
// In a React component
const { data: leads } = useQuery({
  queryKey: ["leads", subAccountId],
  queryFn: () => api.leads.getLeads({ subAccountId: 1 }),
});
```

#### Step 2: React Query Executes Query Function

```typescript
// React Query calls the queryFn
api.leads.getLeads({ subAccountId: 1 });
```

#### Step 3: API Client Processes Request

```typescript
// In ApiClient.request()
const url = "/api/proxy/leads?subAccountId=1";
const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer <token>", // Added by AuthManager
};

const response = await fetch(url, { method: "GET", headers });
```

#### Step 4: Proxy Route Handles Request

```typescript
// In /api/proxy/[...path]/route.ts
const backendUrl = `${BACKEND_URL}/leads?subAccountId=1`;
const headers = {
  Authorization: request.headers.get("authorization"), // Forwarded
  "Content-Type": "application/json",
};

const response = await fetch(backendUrl, { method: "GET", headers });
```

#### Step 5: Backend Processes Request

```typescript
// NestJS backend receives request
// Validates token, processes request, returns data
```

#### Step 6: Response Flows Back

```
Backend → Proxy → ApiClient → React Query → Component
```

---

## React Query Integration

### What is React Query?

**React Query** (TanStack Query) is a powerful data-fetching library that provides:

- **Automatic Caching**: Stores API responses in memory
- **Background Refetching**: Automatically refetches stale data
- **Request Deduplication**: Multiple components requesting same data share one request
- **Optimistic Updates**: Update UI before server confirms
- **Error Handling**: Built-in error states and retry logic
- **Loading States**: Automatic loading/error/success states

### Query Client

**QueryClient** is the core instance that manages all queries and mutations.

**Configuration in `providers.tsx`:**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Data is fresh for 1 minute
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: (failureCount, error) => {
        // Don't retry 401 errors (API client handles refresh)
        if (error.message.includes("401")) return false;
        return failureCount < 3; // Retry other errors up to 3 times
      },
    },
    mutations: {
      onError: async (error) => {
        // Handle 401 errors in mutations
        if (error.message.includes("401")) {
          await authManager.refreshToken();
          queryClient.invalidateQueries(); // Refetch all queries with new token
        }
      },
    },
  },
});
```

### How Providers.tsx Ties Everything Together

**Location**: `/components/providers.tsx`

**Purpose**: Wraps the entire app with React Query's `QueryClientProvider`.

**Key Responsibilities:**

1. **Creates QueryClient**: Single instance for the entire app
2. **Configures Defaults**: Sets up retry logic, stale time, error handling
3. **Provides Context**: Makes QueryClient available to all components via React Context
4. **DevTools Integration**: Includes React Query DevTools in development

**Usage in `app/layout.tsx`:**

```typescript
<Providers>  {/* QueryClientProvider wrapper */}
  <ThemeProvider>
    <UnifiedAuthProvider>
      {children}
    </UnifiedAuthProvider>
  </ThemeProvider>
</Providers>
```

**Why This Matters:**

- All components can use `useQuery`, `useMutation`, `useQueryClient` hooks
- Shared cache across entire application
- Centralized error handling and retry logic

### React Query Hooks

#### useQuery - For Fetching Data

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["leads", subAccountId],
  queryFn: () => api.leads.getLeads({ subAccountId }),
  staleTime: 5 * 60 * 1000, // 5 minutes
  enabled: !!subAccountId, // Only fetch if subAccountId exists
});
```

**What Happens:**

1. React Query checks cache for `['leads', subAccountId]`
2. If cached and fresh, returns cached data
3. If stale or missing, calls `queryFn`
4. Stores result in cache
5. Returns `{ data, isLoading, error }`

#### useMutation - For Creating/Updating Data

```typescript
const createLead = useMutation({
  mutationFn: (data) => api.leads.createLead(data),
  onSuccess: () => {
    // Invalidate leads query to refetch
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  },
});

// Usage
createLead.mutate({ name: "John", email: "john@example.com" });
```

**What Happens:**

1. Calls `mutationFn` with provided data
2. On success, calls `onSuccess` callback
3. On error, calls `onError` callback (or global error handler)
4. Returns `{ mutate, mutateAsync, isLoading, error, data }`

#### useQueryClient - For Manual Cache Control

```typescript
const queryClient = useQueryClient();

// Invalidate queries
queryClient.invalidateQueries({ queryKey: ["leads"] });

// Set query data directly
queryClient.setQueryData(["leads", 1], newLeadsData);

// Get cached data
const cachedData = queryClient.getQueryData(["leads", 1]);
```

---

## Authentication Flow

### Login Flow

```
1. User submits login form
   ↓
2. Component calls: api.auth.login({ email, password })
   ↓
3. ApiClient.request() → POST /api/proxy/auth/login
   ↓
4. Proxy forwards to: POST BACKEND_URL/auth/login
   ↓
5. Backend validates credentials, returns tokens
   ↓
6. AuthManager.setTokens(accessToken, refreshToken)
   ↓
7. Tokens stored in cookies
   ↓
8. Component redirects to dashboard
```

### Automatic Token Refresh Flow

```
1. API request returns 401 Unauthorized
   ↓
2. ApiClient detects 401 (not an auth endpoint)
   ↓
3. AuthManager.refreshToken() called
   ↓
4. POST /api/proxy/auth/refresh with refresh_token
   ↓
5. Backend validates refresh token, returns new tokens
   ↓
6. AuthManager.setTokens(newAccessToken, newRefreshToken)
   ↓
7. Original request retried with new access token
   ↓
8. If refresh fails → clear tokens → redirect to login
```

### Token Storage

Tokens are stored in HTTP-only cookies (via `AuthCookies`):

- `access_token`: Short-lived (15 minutes typical)
- `refresh_token`: Long-lived (7 days typical)
- Separate tokens for users and admins

---

## Error Handling

### Error Handling Layers

1. **API Client Level** (`client.ts`):
   - Handles 401 errors with token refresh
   - Handles 429 rate limiting
   - Parses error responses
   - Throws descriptive errors

2. **React Query Level** (`providers.tsx`):
   - Global mutation error handler
   - Retry logic for non-401 errors
   - Automatic error state management

3. **Component Level**:
   - `useQuery` provides `error` state
   - `useMutation` provides `error` state
   - Components can handle errors as needed

### Error Flow Example

```
Backend returns 500 error
   ↓
Proxy forwards 500 status
   ↓
ApiClient.parseError() extracts error message
   ↓
ApiClient throws Error("Server error message")
   ↓
React Query catches error
   ↓
Retries up to 3 times (if not 401)
   ↓
Component receives error via useQuery().error
   ↓
Component displays error message to user
```

---

## Tenant-Aware API Client

### Multi-Tenant Architecture

The application supports multiple tenants (subAccounts) with three viewing modes:

1. **USER_SCOPED**: Regular users only see their subAccount's data
2. **ADMIN_GLOBAL**: Admins see all data across all subAccounts
3. **ADMIN_FILTERED**: Admins filter to see specific subAccount's data

### How Tenant Context Works

```typescript
// 1. TenantProvider sets context (usually in layout)
<TenantProvider>
  <App />
</TenantProvider>

// 2. Components use tenant hooks
const { subAccountId, mode } = useTenant()

// 3. Tenant-aware queries automatically include tenant info
const { data } = useTenantQuery({
  queryKey: ['leads'],
  queryFn: async ({ subAccountId }) => {
    // subAccountId automatically provided
    return api.leads.getLeads({ subAccountId })
  }
})

// 4. TenantAwareApiClient adds headers
// X-SubAccount-Id: 1
// X-Tenant-Mode: USER_SCOPED
```

### Tenant Query Key Strategy

Tenant context is included in query keys to ensure proper cache isolation:

```typescript
// Query key includes tenant context
queryKey: ["leads", { tenantMode: "USER_SCOPED", subAccountId: 1 }];

// This ensures:
// - User 1's leads are cached separately from User 2's leads
// - Admin global view is cached separately from filtered view
// - Switching tenant filters invalidates and refetches data
```

---

## Best Practices

### 1. Always Use React Query for Data Fetching

```typescript
// ✅ Good
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: () => api.users.getUsers(),
});

// ❌ Bad - Direct API call in component
const [users, setUsers] = useState([]);
useEffect(() => {
  api.users.getUsers().then(setUsers);
}, []);
```

### 2. Use Tenant-Aware Hooks for Multi-Tenant Data

```typescript
// ✅ Good
const { data } = useTenantQuery({
  queryKey: ["leads"],
  queryFn: ({ subAccountId }) => api.leads.getLeads({ subAccountId }),
});

// ❌ Bad - Manual tenant handling
const { subAccountId } = useTenant();
const { data } = useQuery({
  queryKey: ["leads", subAccountId],
  queryFn: () => api.leads.getLeads({ subAccountId }),
});
```

### 3. Invalidate Queries After Mutations

```typescript
// ✅ Good
const createLead = useMutation({
  mutationFn: api.leads.createLead,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  },
});

// ❌ Bad - No cache invalidation
const createLead = useMutation({
  mutationFn: api.leads.createLead,
});
```

### 4. Use Descriptive Query Keys

```typescript
// ✅ Good
queryKey: ["leads", { subAccountId: 1, status: "active" }];

// ❌ Bad
queryKey: ["data"];
```

---

## Summary

The API architecture provides:

1. **Proxy Pattern**: `/api/proxy` handles CORS and request forwarding
2. **Centralized Client**: `ApiClient` manages all HTTP requests
3. **React Query**: Handles caching, state, and automatic refetching
4. **Authentication**: Automatic token management and refresh
5. **Multi-Tenant**: Automatic tenant context handling
6. **Error Handling**: Layered error handling with automatic retries

**Key Files:**

- `/api/proxy/[...path]/route.ts` - Proxy route handler
- `/lib/api/client.ts` - Core HTTP client
- `/lib/api/auth-manager.ts` - Token management
- `/lib/api/index.ts` - Main API interface
- `/lib/api/tenant-client.ts` - Tenant-aware client
- `/components/providers.tsx` - React Query setup

This architecture ensures:

- ✅ No CORS issues
- ✅ Secure token handling
- ✅ Efficient caching
- ✅ Automatic error recovery
- ✅ Multi-tenant support
- ✅ Type-safe API calls
