# Login Response Flow

This document traces the complete flow of a login response from the backend server to the frontend client.

## Backend Server Response

### 1. UnifiedAuthController (`backend-api/src/main-app/controllers/unified-auth.controller.ts`)

**Endpoint**: `POST /auth/login`

**Returns**: `AuthResponse` object (NestJS automatically serializes to JSON)

```typescript
{
  access_token: string,      // JWT access token (15 minutes default)
  refresh_token: string,     // JWT refresh token (7-30 days)
  user?: {                   // Present for user logins
    id: number,
    name: string,
    email: string,
    role: string,
    company?: string,
    subAccountId?: number
  },
  admin?: {                  // Present for admin logins
    id: number,
    name: string,
    email: string,
    role: string,
    permissions?: any
  }
}
```

**HTTP Response**:
- Status: `200 OK`
- Content-Type: `application/json; charset=utf-8`
- Body: JSON string of the `AuthResponse` object

**Example Response Body**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "company": "Acme Corp",
    "subAccountId": 5
  }
}
```

---

## Response Flow Through Layers

### Layer 1: Backend Server → Proxy Route Handler

**Location**: `frontend/app/api/proxy/[...path]/route.ts`

**What Happens**:
1. Proxy receives the backend response via `fetch(backendUrl, requestOptions)`
2. Reads response body as text: `await response.text()`
3. Forwards all response headers (except excluded ones like `host`, `connection`, etc.)
4. Adds CORS headers
5. Returns `NextResponse` with the same body and status

**Transformation**:
- **Input**: Backend HTTP response with JSON body
- **Output**: Next.js `NextResponse` with same JSON body (as string)
- **Headers**: All backend headers + CORS headers added

**Code Flow**:
```typescript
// Line 121: Fetch from backend
const response = await fetch(backendUrl, requestOptions);

// Line 137: Read body as text
responseBody = await response.text();  // JSON string

// Line 161: Return NextResponse
return new NextResponse(responseBody, {
  status: response.status,  // 200
  headers: responseHeaders  // Backend headers + CORS
});
```

**At This Point**:
- Body is still a JSON string (not parsed)
- Status code: `200`
- Content-Type: `application/json; charset=utf-8`

---

### Layer 2: Proxy Route Handler → API Client

**Location**: `frontend/lib/api/client.ts`

**What Happens**:
1. `ApiClient.request()` makes fetch call to `/api/proxy/auth/login`
2. Receives `Response` object from fetch
3. Checks if response is OK (`response.ok`)
4. Reads response body as text: `await response.text()`
5. Checks content-type header for JSON
6. Parses JSON string into JavaScript object
7. Returns typed object

**Transformation**:
- **Input**: HTTP Response with JSON string body
- **Output**: Parsed JavaScript object typed as `AuthResponse`
- **Error Handling**: 
  - If body read fails → throws error
  - If JSON parse fails → throws "Invalid JSON response from server"
  - If empty body → returns `{}`

**Code Flow**:
```typescript
// Line 56: Make fetch request
let response = await fetch(url, { ...options, headers });

// Line 140: Read body as text
text = await response.text();  // JSON string

// Line 174: Parse JSON
const parsed = JSON.parse(text) as T;  // JavaScript object

// Line 176: Return typed object
return parsed;  // AuthResponse object
```

**At This Point**:
- Body is a JavaScript object (not a string)
- Type: `AuthResponse`
- Structure matches backend response

---

### Layer 3: API Client → AuthApi Endpoint

**Location**: `frontend/lib/api/endpoints/auth.ts`

**What Happens**:
1. `AuthApi.login()` calls `this.api.login()` (from endpoint builder)
2. Endpoint builder calls `this.client.post<AuthResponse>()`
3. Receives `AuthResponse` object from `ApiClient`
4. Returns it directly (no transformation)

**Transformation**:
- **Input**: `AuthResponse` object from `ApiClient`
- **Output**: Same `AuthResponse` object
- **Type Safety**: TypeScript ensures structure matches interface

**Code Flow**:
```typescript
// Line 56: Call endpoint builder
return this.api.login(undefined, loginData) as Promise<AuthResponse>;

// Endpoint builder (line 88 in endpoint-builder.ts):
return this.client.post<AuthResponse>(fullPath, body);
```

**At This Point**:
- Still a JavaScript object
- Type: `AuthResponse`
- Ready to be used by calling code

---

### Layer 4: AuthApi → UnifiedAuthContext

**Location**: `frontend/contexts/unified-auth-context.tsx`

**What Happens**:
1. `loginUser()` receives `AuthResponse` from `api.auth.login()`
2. Validates that `response.user` exists
3. Extracts tokens and stores in cookies
4. Normalizes user profile data
5. Updates React state

**Transformation**:
- **Input**: `AuthResponse` object
- **Output**: 
  - Tokens stored in cookies
  - Account state updated in React context
  - Returns `void` (Promise resolves)

**Code Flow**:
```typescript
// Line 238: Receive response
const response: AuthResponse = await api.auth.login(credentials);

// Line 241-243: Validate structure
if (!response.user) {
  throw new Error("Invalid login response: user data missing");
}

// Line 246-247: Store tokens
AuthCookies.setAccessToken(response.access_token);
AuthCookies.setRefreshToken(response.refresh_token);

// Line 250-255: Normalize user profile
const userProfile: UserProfile = {
  ...response.user,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Line 257-258: Update state
setAccount(normalizeUserProfile(userProfile));
setAccountType("user");
```

**At This Point**:
- Tokens are in cookies
- React state is updated
- User is "logged in" from app perspective

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BACKEND SERVER (NestJS)                                  │
│    UnifiedAuthController.login()                           │
│    Returns: AuthResponse object                            │
│    HTTP: 200 OK, Content-Type: application/json            │
│    Body: JSON string                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Response
                     │ (JSON string in body)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PROXY ROUTE HANDLER                                      │
│    /api/proxy/[...path]/route.ts                            │
│    - Receives backend response                              │
│    - Reads body as text (JSON string)                      │
│    - Adds CORS headers                                      │
│    - Returns NextResponse with same body                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ NextResponse
                     │ (JSON string in body)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API CLIENT                                               │
│    /lib/api/client.ts                                       │
│    - Makes fetch() to /api/proxy/auth/login                 │
│    - Receives Response object                               │
│    - Reads body as text                                     │
│    - Parses JSON string → JavaScript object                 │
│    - Returns typed AuthResponse object                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ AuthResponse object
                     │ (JavaScript object)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AUTH API ENDPOINT                                        │
│    /lib/api/endpoints/auth.ts                               │
│    - Receives AuthResponse from ApiClient                   │
│    - Returns it directly (no transformation)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ AuthResponse object
                     │ (JavaScript object)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UNIFIED AUTH CONTEXT                                     │
│    /contexts/unified-auth-context.tsx                       │
│    - Validates response structure                           │
│    - Stores tokens in cookies                              │
│    - Normalizes user profile                                │
│    - Updates React state                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Points

1. **JSON Serialization/Deserialization**:
   - Backend: Object → JSON string (automatic by NestJS)
   - Proxy: Passes through as string
   - API Client: JSON string → JavaScript object (via `JSON.parse()`)

2. **Type Safety**:
   - Backend: TypeScript interface `AuthResponse`
   - Frontend: TypeScript interface `AuthResponse` (must match!)
   - Type casting happens at API Client level: `JSON.parse(text) as T`

3. **Error Handling**:
   - Backend: Throws HTTP exceptions (401, etc.)
   - Proxy: Catches errors, returns 500 with error message
   - API Client: Parses error responses, throws JavaScript Error
   - Context: Catches errors, logs them, re-throws

4. **Potential Failure Points**:
   - **Body read failure**: Network issue, connection dropped
   - **JSON parse failure**: Invalid JSON, empty body, wrong content-type
   - **Type mismatch**: Backend returns different structure than expected
   - **Missing fields**: Response structure doesn't match interface

---

## Debugging Tips

If you're getting "type error decoding failed":

1. **Check Network Tab**: Look at the actual response body in browser DevTools
2. **Check Console Logs**: The improved logging shows:
   - Response status
   - Content-type
   - Body length
   - Body preview (first 200 chars)
3. **Verify Structure**: Ensure backend response matches `AuthResponse` interface
4. **Check for Empty Body**: Empty responses return `{}` but might cause issues downstream

