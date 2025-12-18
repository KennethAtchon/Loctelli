# API and State Management Migration Guide

## Overview

This guide covers migrating the API client, authentication service, state management (React Context, React Query), and all API endpoint integrations.

## Architecture Overview

### Current Architecture

```
lib/api/
├── client.ts              # Base API client
├── auth-service.ts        # Authentication service
├── index.ts               # Main API export
├── tenant-client.ts       # Tenant-aware client
├── types.ts               # API types
└── endpoints/             # Endpoint-specific APIs
    ├── admin-auth.ts
    ├── admin-subaccounts.ts
    ├── auth.ts
    ├── bookings.ts
    ├── chat.ts
    ├── contacts.ts
    ├── forms.ts
    ├── general.ts
    ├── integration-templates.ts
    ├── integrations.ts
    ├── leads.ts
    ├── prompt-templates.ts
    ├── status.ts
    ├── strategies.ts
    └── users.ts
```

## 1. Base API Client

### File: `lib/api/client.ts`

#### Current Implementation

The `ApiClient` class provides:
- Base URL configuration
- Request/response handling
- Authentication header management
- Token refresh on 401 errors
- Rate limiting
- Retry logic
- Error handling

#### Migration Steps

**1. Review API Client**

- [ ] Verify `fetch` API usage (should work with React 19)
- [ ] Check error handling patterns
- [ ] Verify token refresh logic
- [ ] Test rate limiting
- [ ] Check retry mechanism

**2. TypeScript Updates**

- [ ] Verify generic types work correctly
- [ ] Check `ApiRequestOptions` interface
- [ ] Update types if needed
- [ ] Verify type inference

**3. React 19 Compatibility**

- [ ] Verify no React-specific APIs used
- [ ] Check for browser API compatibility
- [ ] Test in different browsers
- [ ] Verify SSR compatibility

#### Key Methods to Review

**request() Method**
```typescript
protected async request<T = unknown>(
  endpoint: string,
  options: RequestInit & ApiRequestOptions = {}
): Promise<T>
```

- [ ] Verify generic type handling
- [ ] Check error handling
- [ ] Test timeout handling
- [ ] Verify abort controller usage

**Token Refresh Logic**
```typescript
// Handle 401 Unauthorized
if (response.status === 401 && !isAuthEndpoint) {
  // Refresh token and retry
}
```

- [ ] Verify refresh logic works
- [ ] Check for infinite loops
- [ ] Test concurrent requests
- [ ] Verify token storage

## 2. Authentication Service

### File: `lib/api/auth-service.ts`

#### Current Implementation

The `AuthService` provides:
- Token management
- Cookie handling
- Token refresh
- Auth header generation
- Logout handling

#### Migration Steps

**1. Cookie Management**

- [ ] Verify HTTP-only cookie usage
- [ ] Check cookie security settings
- [ ] Test cookie expiration
- [ ] Verify cookie deletion

**2. Token Storage**

- [ ] Review token storage mechanism
- [ ] Verify token encryption (if any)
- [ ] Check token expiration handling
- [ ] Test token refresh

**3. Auth Headers**

- [ ] Verify header generation
- [ ] Check header format
- [ ] Test header injection
- [ ] Verify header cleanup

#### Key Methods to Review

**getAuthHeaders()**
```typescript
getAuthHeaders(): Record<string, string>
```

- [ ] Verify header format
- [ ] Check token retrieval
- [ ] Test missing token handling

**handleUnauthorized()**
```typescript
async handleUnauthorized(endpoint: string): Promise<Record<string, string>>
```

- [ ] Verify refresh flow
- [ ] Check error handling
- [ ] Test concurrent refresh attempts
- [ ] Verify redirect logic

## 3. Endpoint APIs

### Location: `lib/api/endpoints/`

#### Endpoint List

1. **admin-auth.ts** - Admin authentication
2. **admin-subaccounts.ts** - SubAccount management
3. **auth.ts** - User authentication
4. **bookings.ts** - Booking management
5. **chat.ts** - Chat messages
6. **contacts.ts** - Contact management
7. **forms.ts** - Form handling
8. **general.ts** - General endpoints
9. **integration-templates.ts** - Integration templates
10. **integrations.ts** - Integrations
11. **leads.ts** - Lead management
12. **prompt-templates.ts** - Prompt templates
13. **status.ts** - Status endpoints
14. **strategies.ts** - Strategy management
15. **users.ts** - User management

#### Migration Steps

**For Each Endpoint API:**

1. **Review Class Structure**
   - [ ] Verify class extends or uses ApiClient
   - [ ] Check method signatures
   - [ ] Verify TypeScript types
   - [ ] Test method calls

2. **API Method Updates**
   - [ ] Verify HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - [ ] Check request body formatting
   - [ ] Verify response type handling
   - [ ] Test error responses

3. **Type Safety**
   - [ ] Verify DTO types match backend
   - [ ] Check response types
   - [ ] Verify error types
   - [ ] Test type inference

#### Example: Auth Endpoint

```typescript
export class AuthApi {
  constructor(private client: ApiClient) {}

  async login(credentials: LoginDto): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/auth/login', credentials);
  }
}
```

- [ ] Verify DTO types
- [ ] Check response types
- [ ] Test error handling
- [ ] Verify API path

## 4. API Types

### File: `lib/api/types.ts`

#### Migration Steps

**1. Review Type Definitions**

- [ ] Verify all DTOs are defined
- [ ] Check response types
- [ ] Verify error types
- [ ] Test type exports

**2. Backend Alignment**

- [ ] Verify types match backend DTOs
- [ ] Check for missing types
- [ ] Update types if backend changed
- [ ] Test type compatibility

**3. Type Updates**

- [ ] Update for TypeScript 5
- [ ] Check for deprecated types
- [ ] Verify generic types
- [ ] Test type inference

## 5. React Query Integration

### TanStack React Query v5

#### Current Usage

React Query is used for:
- Data fetching
- Caching
- Background updates
- Optimistic updates

#### Migration Steps

**1. Query Client Setup**

- [ ] Verify QueryClient configuration
- [ ] Check query defaults
- [ ] Verify mutation defaults
- [ ] Test query client creation

**2. Query Hooks**

- [ ] Review all `useQuery` hooks
- [ ] Check query keys
- [ ] Verify query functions
- [ ] Test query options

**3. Mutation Hooks**

- [ ] Review all `useMutation` hooks
- [ ] Check mutation functions
- [ ] Verify onSuccess/onError handlers
- [ ] Test optimistic updates

**4. React Query v5 Updates**

- [ ] Review v5 migration guide
- [ ] Check for breaking changes
- [ ] Update query syntax if needed
- [ ] Test query invalidation

#### Example: Query Hook

```typescript
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => api.leads.getAll(filters),
  });
}
```

- [ ] Verify query key structure
- [ ] Check query function
- [ ] Test query options
- [ ] Verify caching

## 6. Context-Based State Management

### Unified Auth Context

### File: `contexts/unified-auth-context.tsx`

#### Current Implementation

Provides:
- Unified authentication for users and admins
- Account state management
- Login/register methods
- Logout handling
- Account refresh

#### Migration Steps

**1. Context Provider**

- [ ] Verify provider setup
- [ ] Check context value
- [ ] Test provider updates
- [ ] Verify SSR compatibility

**2. Context Hook**

- [ ] Verify `useAuth` hook
- [ ] Check error handling
- [ ] Test hook usage
- [ ] Verify type safety

**3. State Management**

- [ ] Review state updates
- [ ] Check for unnecessary re-renders
- [ ] Verify state persistence
- [ ] Test state cleanup

**4. React 19 Updates**

- [ ] Check for new context patterns
- [ ] Verify context performance
- [ ] Test concurrent features
- [ ] Check for optimizations

#### Key Methods to Review

**loginUser() / loginAdmin()**
```typescript
async loginUser(credentials: LoginDto): Promise<void>
async loginAdmin(credentials: AdminLoginDto): Promise<void>
```

- [ ] Verify login flow
- [ ] Check error handling
- [ ] Test token storage
- [ ] Verify redirect logic

**refreshAccount()**
```typescript
async refreshAccount(): Promise<void>
```

- [ ] Verify refresh logic
- [ ] Check API calls
- [ ] Test error handling
- [ ] Verify state updates

### Other Contexts

#### Tenant Context
- [ ] Verify tenant context works
- [ ] Check tenant switching
- [ ] Test data isolation
- [ ] Verify context updates

#### SubAccount Filter Context
- [ ] Verify filter context
- [ ] Check filter state
- [ ] Test filter updates
- [ ] Verify data filtering

## 7. Custom Hooks

### Location: `hooks/`

#### Hooks

- `use-mobile.tsx` - Mobile detection
- `use-toast.ts` - Toast notifications
- `useTenantData.ts` - Tenant data fetching
- `useTenantQuery.ts` - Tenant-aware queries

#### Migration Steps

**1. Review Each Hook**

- [ ] Verify hook patterns
- [ ] Check dependencies
- [ ] Test hook behavior
- [ ] Verify type safety

**2. React 19 Updates**

- [ ] Check for new hook patterns
- [ ] Verify hook performance
- [ ] Test concurrent features
- [ ] Check for optimizations

**3. Custom Query Hooks**

- [ ] Verify React Query integration
- [ ] Check query key structure
- [ ] Test query invalidation
- [ ] Verify caching

## 8. API Proxy Route

### Location: `app/api/proxy/`

#### Migration Steps

**1. Proxy Implementation**

- [ ] Verify proxy route works
- [ ] Check API key injection
- [ ] Test request forwarding
- [ ] Verify response handling

**2. Error Handling**

- [ ] Check error propagation
- [ ] Verify error responses
- [ ] Test timeout handling
- [ ] Check rate limiting

**3. Security**

- [ ] Verify API key security
- [ ] Check request validation
- [ ] Test CORS handling
- [ ] Verify header forwarding

## 9. Rate Limiting

### Files: `lib/utils/rate-limiter.ts`, `rate-limit-blocker.ts`

#### Migration Steps

**1. Rate Limiter**

- [ ] Verify rate limit logic
- [ ] Check Redis integration (if any)
- [ ] Test rate limit detection
- [ ] Verify retry timing

**2. Rate Limit Blocker**

- [ ] Verify blocker UI
- [ ] Check retry logic
- [ ] Test user experience
- [ ] Verify error messages

## 10. Environment Configuration

### File: `lib/utils/envUtils.ts`

#### Migration Steps

**1. Environment Variables**

- [ ] Verify environment variable validation
- [ ] Check API URL configuration
- [ ] Test environment detection
- [ ] Verify build-time variables

**2. API Configuration**

- [ ] Verify API base URL
- [ ] Check API endpoint paths
- [ ] Test API connectivity
- [ ] Verify CORS settings

## 11. Testing API Integration

### Test Files

- `__tests__/lib/api/client.test.ts`
- `__tests__/lib/api/endpoints/*.test.ts`

#### Migration Steps

**1. Update Tests**

- [ ] Verify test setup
- [ ] Check MSW (Mock Service Worker) configuration
- [ ] Update test mocks
- [ ] Test API mocking

**2. Test Coverage**

- [ ] Verify all endpoints tested
- [ ] Check error cases
- [ ] Test authentication flows
- [ ] Verify token refresh

## 12. Migration Checklist

After migration, verify:

- [ ] All API endpoints work
- [ ] Authentication works
- [ ] Token refresh works
- [ ] Error handling works
- [ ] Rate limiting works
- [ ] React Query works
- [ ] Context providers work
- [ ] Custom hooks work
- [ ] TypeScript types are correct
- [ ] Tests pass

## 13. Common API Issues

### Issue: CORS Errors

**Solution:**
1. Verify backend CORS configuration
2. Check API proxy setup
3. Verify request headers
4. Test in different browsers

### Issue: Token Refresh Loop

**Solution:**
1. Check refresh token logic
2. Verify token expiration
3. Test concurrent refresh attempts
4. Add refresh lock mechanism

### Issue: Type Mismatches

**Solution:**
1. Verify DTO types match backend
2. Update type definitions
3. Check response parsing
4. Test type inference

## Next Steps

After API and state migration:
- **[06-routing-migration.md](./06-routing-migration.md)** - Migrate routing

## Notes

Document API changes:

```
[Add API migration notes here]
```

