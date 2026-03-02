# Authentication Flow Fixes - Admin Login Redirect Issue

## 🐛 Problem Identified

Admin users were being redirected to the user login page (`/auth/login`) instead of the admin login page (`/admin/login`), causing confusion and incorrect authentication flows.

## 🔍 Root Causes Found

### 1. **User Login Page Logic Issue**
**File:** `/app/auth/login/page.tsx`
- **Problem:** User login page was trying to determine if the user should be redirected to admin dashboard using `isAdmin()`
- **Issue:** `isAdmin()` returns `false` for admin users who haven't successfully logged in through the admin flow
- **Result:** Circular logic where admin users couldn't properly authenticate

### 2. **ProtectedRoute Component Hardcoded Redirect**
**File:** `/components/auth/protected-route.tsx`
- **Problem:** Component was hardcoded to redirect to `/auth/login` regardless of current path
- **Issue:** Admin users accessing protected admin routes were sent to user login instead of admin login
- **Result:** Incorrect routing for unauthorized admin access attempts

## ✅ Fixes Applied

### 1. **Simplified User Login Page**
```typescript
// BEFORE (problematic)
const { loginUser, isAuthenticated, isLoading, isAdmin } = useUnifiedAuth();
const getPostLoginRedirect = () => {
  const fallbackPath = isAdmin() ? "/admin/dashboard" : "/account";
  return resolvePostLoginRedirect(fallbackPath);
};

// AFTER (fixed)
const { loginUser, isAuthenticated, isLoading } = useUnifiedAuth();
const getPostLoginRedirect = () =>
  resolvePostLoginRedirect("/account");
```

**Changes:**
- Removed `isAdmin()` dependency from user login page
- User login page now only handles user authentication
- Simplified redirect logic to always go to `/account`

### 2. **Smart ProtectedRoute Component**
```typescript
// BEFORE (hardcoded)
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push("/auth/login");
  }
}, [isAuthenticated, isLoading, router]);

// AFTER (context-aware)
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    const loginPath = getLoginPathForCurrentRoute(pathname);
    router.push(loginPath);
  }
}, [isAuthenticated, isLoading, router, pathname]);
```

**Changes:**
- Added `usePathname()` to detect current route
- Added `getLoginPathForCurrentRoute()` utility function
- Now redirects to appropriate login page based on current path:
  - `/admin/*` routes → `/admin/login`
  - Other routes → `/auth/login`

## 🎯 Expected Behavior After Fix

### **Admin User Flow:**
1. Admin navigates to `/admin/dashboard` (or any admin route)
2. If not authenticated → redirected to `/admin/login` ✅
3. Admin logs in successfully → redirected to `/admin/dashboard` ✅

### **User Flow:**
1. User navigates to `/account` (or any user route)
2. If not authenticated → redirected to `/auth/login` ✅
3. User logs in successfully → redirected to `/account` ✅

### **Cross-Contamination Prevention:**
- Admin users can no longer be sent to user login page from admin routes
- User login page no longer attempts to handle admin authentication
- Each login page handles its specific user type only

## 🔧 Technical Details

### **Key Functions Used:**
- `getLoginPathForCurrentRoute(pathname)` - Determines correct login page based on current path
- `resolvePostLoginRedirect(defaultPath)` - Handles post-login redirects with returnTo support

### **Route Logic:**
```typescript
// From lib/session-expiration.ts
export function getLoginPathForCurrentRoute(pathname?: string): string {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  return currentPath.startsWith("/admin") ? "/admin/login" : "/auth/login";
}
```

## ✅ Verification

- **Build Status:** ✅ Frontend builds successfully
- **Type Safety:** ✅ No TypeScript errors
- **Route Logic:** ✅ Proper path-based login redirection
- **Separation of Concerns:** ✅ Each login page handles its user type

## 🚀 Result

Admin users will now be properly routed to the admin login page when accessing admin routes, eliminating the confusion and authentication flow issues. The authentication system now properly distinguishes between user and admin login flows based on the current route context.
