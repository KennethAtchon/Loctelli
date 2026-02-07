# Service Layer — API Client

> **Purpose**: Implementation guide for the API client layer that handles all form-related HTTP calls.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `04-type-layer.md`

---

## Overview

The service layer is the **only place** that performs form-related HTTP calls. All form API interactions go through `frontend/lib/api/endpoints/forms.ts`.

**Key Rules**:
- Must import all form types from `@/lib/forms/types`
- Must not define or re-export form types
- Must not import from hooks or UI components
- All form-related API calls must go through this layer

---

## File: `frontend/lib/api/endpoints/forms.ts`

**Current State**: Likely contains form type definitions and API functions.

**Target State**: 
- Imports types from `@/lib/forms/types`
- Contains only API client functions
- No type definitions
- No re-exports of form types

---

## Required API Functions

### Form Template Operations

```ts
/**
 * Fetches a form template by slug.
 * @param slug - Form template slug
 * @returns Form template with schema and settings
 */
export async function getFormTemplate(
  slug: string
): Promise<FormTemplate> {
  const response = await fetch(`/api/forms/${slug}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch form template: ${response.statusText}`);
  }
  const data = await response.json();
  return data; // Ensure backend DTO matches FormTemplate type
}
```

---

### Session Operations

```ts
/**
 * Creates a new form session.
 * @param slug - Form template slug
 * @param initialData - Optional initial form data
 * @returns Session token and initial state
 */
export async function createFormSession(
  slug: string,
  initialData?: Record<string, unknown>
): Promise<{
  sessionToken: string;
  currentCardIndex: number;
  partialData: Record<string, unknown>;
}> {
  const response = await fetch(`/api/forms/${slug}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialData })
  });
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Gets an existing form session.
 * @param sessionToken - Session token
 * @returns Session state or null if not found
 */
export async function getFormSession(
  sessionToken: string
): Promise<{
  sessionToken: string;
  currentCardIndex: number;
  partialData: Record<string, unknown>;
} | null> {
  const response = await fetch(`/api/forms/sessions/${sessionToken}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Updates form session progress.
 * @param sessionToken - Session token
 * @param currentCardIndex - Current card index
 * @param partialData - Partial form data
 */
export async function updateFormSession(
  sessionToken: string,
  currentCardIndex: number,
  partialData: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`/api/forms/sessions/${sessionToken}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentCardIndex, partialData })
  });
  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.statusText}`);
  }
}

/**
 * Completes a form session.
 * @param sessionToken - Session token
 */
export async function completeFormSession(
  sessionToken: string
): Promise<void> {
  const response = await fetch(`/api/forms/sessions/${sessionToken}/complete`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`Failed to complete session: ${response.statusText}`);
  }
}
```

---

### Form Submission

```ts
/**
 * Submits a form.
 * @param slug - Form template slug
 * @param formData - Complete form data
 * @param sessionToken - Optional session token
 * @returns Submission result
 */
export async function submitForm(
  slug: string,
  formData: Record<string, unknown>,
  sessionToken?: string
): Promise<{
  success: boolean;
  submissionId?: string;
  error?: string;
}> {
  const response = await fetch(`/api/forms/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData, sessionToken })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to submit form: ${response.statusText}`);
  }
  return response.json();
}
```

---

### File Upload

```ts
/**
 * Uploads a file for a form field.
 * @param slug - Form template slug
 * @param fieldId - Field ID
 * @param file - File to upload
 * @param sessionToken - Optional session token
 * @returns Upload result with file URL
 */
export async function uploadFormFile(
  slug: string,
  fieldId: string,
  file: File,
  sessionToken?: string
): Promise<{
  url: string;
  fileName: string;
  fileSize: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fieldId', fieldId);
  if (sessionToken) {
    formData.append('sessionToken', sessionToken);
  }
  
  const response = await fetch(`/api/forms/${slug}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
  return response.json();
}
```

---

### Profile Estimation

```ts
/**
 * Calculates profile estimation (rule-based or AI).
 * @param slug - Form template slug
 * @param formData - Form answers
 * @param sessionToken - Optional session token
 * @returns Profile estimation result
 */
export async function calculateProfile(
  slug: string,
  formData: Record<string, unknown>,
  sessionToken?: string
): Promise<{
  type: string;
  result: Record<string, unknown>;
}> {
  const response = await fetch(`/api/forms/${slug}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData, sessionToken })
  });
  if (!response.ok) {
    throw new Error(`Failed to calculate profile: ${response.statusText}`);
  }
  return response.json();
}
```

---

### Analytics

```ts
/**
 * Tracks time spent on a card.
 * @param sessionToken - Session token
 * @param fieldId - Field ID
 * @param durationMs - Duration in milliseconds
 */
export async function trackCardTime(
  sessionToken: string,
  fieldId: string,
  durationMs: number
): Promise<void> {
  await fetch(`/api/forms/analytics/card-time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, fieldId, durationMs })
  });
  // Non-blocking; don't throw on failure
}
```

---

## Migration Steps

### Step 1: Update Imports

**Before**:
```ts
// lib/api/endpoints/forms.ts
export interface FormField { ... } // ❌ Remove
export interface Condition { ... } // ❌ Remove
```

**After**:
```ts
// lib/api/endpoints/forms.ts
import type {
  FormField,
  FormTemplate,
  Condition,
  ProfileEstimation,
  // ... all form types
} from '@/lib/forms/types';
```

---

### Step 2: Remove Type Definitions

Remove all form type definitions from the API file. They should only exist in `lib/forms/types.ts`.

**Check for**:
- `interface FormField`
- `type FormFieldType`
- `interface Condition`
- `interface CardMedia`
- Any other form-related types

---

### Step 3: Remove Re-exports

**Before**:
```ts
// lib/api/endpoints/forms.ts
export type { FormField, Condition } from '@/lib/forms/types'; // ❌ Remove
```

**After**: No re-exports. Consumers import directly from `@/lib/forms/types`.

---

### Step 4: Update Function Signatures

Ensure all function signatures use imported types:

```ts
// ✅ GOOD
export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  // ...
}

// ❌ BAD (if FormTemplate was defined locally)
export async function getFormTemplate(slug: string): Promise<LocalFormTemplate> {
  // ...
}
```

---

### Step 5: Verify Backend DTO Alignment

Ensure backend DTOs align with frontend types. If there's a mismatch:

**Option A**: Transform in API client:
```ts
export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  const response = await fetch(`/api/forms/${slug}`);
  const dto = await response.json();
  // Transform DTO to match FormTemplate
  return {
    id: dto.id,
    slug: dto.slug,
    schema: dto.fields.map(transformField),
    // ...
  };
}
```

**Option B**: Update backend DTOs to match frontend types (preferred if possible).

---

## API Client Class (Optional)

If using a class-based API client:

```ts
import type {
  FormTemplate,
  FormField,
  ProfileEstimation,
  // ... all types
} from '@/lib/forms/types';

export class FormsApi {
  async getFormTemplate(slug: string): Promise<FormTemplate> {
    // Implementation
  }
  
  async createFormSession(slug: string, initialData?: Record<string, unknown>) {
    // Implementation
  }
  
  // ... other methods
}

export const formsApi = new FormsApi();
```

---

## Error Handling

All API functions should:
- Throw errors on HTTP failures
- Return typed responses
- Handle network errors gracefully

**Example**:
```ts
export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  try {
    const response = await fetch(`/api/forms/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch form template: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('Network error: Unable to connect to server');
    }
    throw error;
  }
}
```

---

## Verification Checklist

- [ ] All form types imported from `@/lib/forms/types`
- [ ] No form type definitions in API file
- [ ] No re-exports of form types
- [ ] All function signatures use imported types
- [ ] Backend DTOs align with frontend types (or transformation added)
- [ ] Error handling implemented
- [ ] TypeScript compilation passes
- [ ] All API functions tested

---

## Summary

**Service Layer Rules**:
- ✅ Only place for form-related HTTP calls
- ✅ Imports types from `@/lib/forms/types`
- ✅ No type definitions
- ✅ No re-exports
- ✅ No imports from hooks or UI

**Functions**:
- Form template operations
- Session management (create, get, update, complete)
- Form submission
- File upload
- Profile estimation (API call)
- Analytics tracking

---

## TanStack Query Integration

**Important**: All form data fetching and mutations should use TanStack Query (`@tanstack/react-query`) for proper caching, error handling, and loading states.

### Query Keys

Use consistent query keys for form-related queries:

```ts
// Form template queries
const FORM_TEMPLATE_KEYS = {
  all: ['forms', 'templates'] as const,
  lists: () => [...FORM_TEMPLATE_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...FORM_TEMPLATE_KEYS.lists(), filters] as const,
  details: () => [...FORM_TEMPLATE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FORM_TEMPLATE_KEYS.details(), id] as const,
  public: (slug: string) => ['forms', 'public', slug] as const,
  publicCard: (slug: string) => ['forms', 'public', 'card', slug] as const,
} as const;

// Form session queries
const FORM_SESSION_KEYS = {
  all: ['forms', 'sessions'] as const,
  detail: (slug: string, token: string) => [...FORM_SESSION_KEYS.all, slug, token] as const,
} as const;

// Form submission queries
const FORM_SUBMISSION_KEYS = {
  all: ['forms', 'submissions'] as const,
  lists: () => [...FORM_SUBMISSION_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...FORM_SUBMISSION_KEYS.lists(), filters] as const,
  details: () => [...FORM_SUBMISSION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...FORM_SUBMISSION_KEYS.details(), id] as const,
} as const;
```

### Using TanStack Query with Forms API

**Pattern**: The API client (`formsApi`) provides the functions, but hooks should wrap them with `useQuery` or `useMutation`.

#### Fetching Form Template

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFormTemplate(slug: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['forms', 'public', slug],
    queryFn: () => api.forms.getPublicForm(slug),
    enabled: options?.enabled !== false && !!slug && slug !== 'invalid-form',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => (attemptIndex + 1) * 500,
  });
}
```

#### Form Submission with Mutation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateFormSubmissionDto } from '@/lib/forms/types';

export function useSubmitForm(slug: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateFormSubmissionDto) => {
      return api.forms.submitPublicForm(slug, data);
    },
    onSuccess: () => {
      // Invalidate form template to refresh if needed
      queryClient.invalidateQueries({ queryKey: ['forms', 'public', slug] });
      // Invalidate submissions list if viewing submissions
      queryClient.invalidateQueries({ queryKey: ['forms', 'submissions'] });
    },
  });
}
```

#### File Upload with Mutation

```ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUploadFormFile(slug: string) {
  return useMutation({
    mutationFn: async ({ fieldId, file }: { fieldId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      return api.forms.uploadFormFile(slug, formData);
    },
    // File uploads typically don't need cache invalidation
  });
}
```

#### Session Management with Mutations

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateFormSessionDto, UpdateFormSessionDto } from '@/lib/forms/types';

export function useCreateFormSession(slug: string) {
  return useMutation({
    mutationFn: async (data?: CreateFormSessionDto) => {
      return api.forms.createFormSession(slug, data);
    },
  });
}

export function useUpdateFormSession(slug: string, token: string) {
  return useMutation({
    mutationFn: async (data: UpdateFormSessionDto) => {
      return api.forms.updateFormSession(slug, token, data);
    },
    // Session updates don't need cache invalidation (optimistic updates)
  });
}

export function useCompleteFormSession(slug: string, token: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return api.forms.completeFormSession(slug, token);
    },
    onSuccess: () => {
      // Invalidate session query
      queryClient.invalidateQueries({ 
        queryKey: ['forms', 'sessions', slug, token] 
      });
    },
  });
}
```

#### Profile Estimation with Mutation

```ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCalculateProfile(slug: string) {
  return useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      return api.forms.calculateProfileEstimation(slug, answers);
    },
    // Profile calculation is a one-off computation, no cache needed
  });
}
```

### Best Practices

1. **Use `useQuery` for fetching**: Form templates, sessions, submissions
2. **Use `useMutation` for mutations**: Submissions, file uploads, session updates, profile calculations
3. **Invalidate queries on success**: When mutations affect cached data, invalidate relevant queries
4. **Optimistic updates**: For session updates, consider optimistic updates instead of invalidation
5. **Error handling**: TanStack Query provides `error` and `isError` states automatically
6. **Loading states**: Use `isLoading`, `isFetching`, `isPending` from queries/mutations
7. **Retry logic**: Configure retry for network requests (already in example above)

### Example: Complete Form Hook with TanStack Query

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FormTemplate, CreateFormSubmissionDto } from '@/lib/forms/types';

export function useFormWithSubmission(slug: string) {
  const queryClient = useQueryClient();
  
  // Fetch form template
  const formQuery = useQuery({
    queryKey: ['forms', 'public', slug],
    queryFn: () => api.forms.getPublicForm(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
  
  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: async (data: CreateFormSubmissionDto) => {
      return api.forms.submitPublicForm(slug, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', 'public', slug] });
    },
  });
  
  return {
    template: formQuery.data,
    isLoading: formQuery.isLoading,
    error: formQuery.error,
    submitForm: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  };
}
```

---

## Next Steps

1. Update `lib/api/endpoints/forms.ts` to import types
2. Remove all form type definitions
3. Verify backend DTO alignment
4. Create TanStack Query hooks for form operations
5. Test API functions with TanStack Query
6. Proceed to `07-card-form-hooks.md` for hooks implementation
