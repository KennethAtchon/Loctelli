# Dependency Graph

> **Purpose**: Enforced dependency structure to prevent circular dependencies and ensure clean architecture.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`

---

## Overview

This document defines the strict dependency graph that must be enforced throughout the form system. Violations of this graph indicate architectural problems and must be fixed.

---

## Dependency Graph Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UI (pages, CardFormView, SimpleFormView, builders)                      │
│  → useCardFormState, useCardFormSession, useSimpleFormState, formsApi    │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│  State / Hooks (useCardFormState, useCardFormSession, etc.)              │
│  → form domain (conditional-logic, serialization, profile-estimation)   │
│  → forms API client                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│  Domain (lib/forms/*.ts — no React, no fetch)                            │
│  → form-types only                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│  Types (lib/forms/types.ts or lib/api form types — single canonical set) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### Layer 1: Types (Foundation)

**Location**: `frontend/lib/forms/types.ts`

**Purpose**: Canonical definitions of all form-related types used across the application.

**Exports**:
- `FormField`, `FormFieldType`
- `Condition`, `ConditionOperator`, `ConditionGroup`
- `ConditionalLogic`
- `CardMedia`
- `ProfileEstimation`, `ScoringRule`, `FieldScoring`, `AIProfileConfig`
- Any other form-related types

**Dependencies**: None (foundation layer)

**Rules**:
- No imports from other layers
- No React types (unless needed for component props)
- No API-specific types (use generic types that API can map to)

---

### Layer 2: Domain (Pure Functions)

**Location**: `frontend/lib/forms/*.ts`

**Purpose**: Pure business logic functions with no side effects.

**Files**:
- `conditional-logic.ts` - Field visibility, conditional evaluation
- `flowchart-serialization.ts` - Convert between flowchart and schema
- `profile-estimation.ts` - Profile calculation logic
- `form-validation.ts` - Validation and initial data
- `navigation.ts` - Navigation logic (if needed)

**Dependencies**: 
- ✅ `@/lib/forms/types` (types only)
- ❌ No React (`useState`, `useEffect`, etc.)
- ❌ No `fetch` or API calls
- ❌ No hooks or UI components
- ❌ No services layer

**Exports**: Pure functions only

**Example**:
```ts
// ✅ GOOD: Domain function
import type { FormField, ConditionGroup } from './types';

export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown>
): FormField[] {
  // Pure logic, no side effects
}

// ❌ BAD: Domain importing from hooks
import { useFormData } from '../hooks/useCardFormData'; // NO!
```

---

### Layer 3: Services (API Client)

**Location**: `frontend/lib/api/endpoints/forms.ts`

**Purpose**: The only place that performs form-related HTTP calls.

**Dependencies**:
- ✅ `@/lib/forms/types` (for request/response types)
- ❌ No hooks
- ❌ No UI components
- ❌ No domain functions (unless needed for request transformation)

**Exports**: API client functions

**Example**:
```ts
// ✅ GOOD: Service importing types
import type { FormField, FormTemplate } from '@/lib/forms/types';

export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  // API call
}

// ❌ BAD: Service importing from hooks
import { useCardFormState } from '@/components/...'; // NO!
```

---

### Layer 4: State / Hooks

**Location**: `frontend/components/public/forms/card-form/use*.ts`

**Purpose**: React hooks that manage form state and compose domain functions.

**Files**:
- `useCardFormSchema.ts`
- `useCardFormSession.ts`
- `useCardFormNavigation.ts`
- `useCardFormData.ts`
- `useCardFormProfile.ts`
- `useCardFormState.ts` (orchestrator)

**Dependencies**:
- ✅ `@/lib/forms/types` (types)
- ✅ Domain functions (`@/lib/forms/conditional-logic`, etc.)
- ✅ Services (`formsApi`)
- ❌ No UI components
- ❌ No other hooks (except React built-ins and composition)

**Example**:
```ts
// ✅ GOOD: Hook importing domain and services
import { getVisibleFields } from '@/lib/forms/conditional-logic';
import { formsApi } from '@/lib/api/endpoints/forms';
import type { FormField } from '@/lib/forms/types';

export function useCardFormNavigation(...) {
  // Uses domain functions and services
}

// ❌ BAD: Hook importing UI component
import { CardFormView } from './CardFormView'; // NO!
```

---

### Layer 5: UI (Components and Pages)

**Location**: 
- `frontend/components/public/forms/card-form/CardFormView.tsx`
- `frontend/app/(main)/forms/[slug]/page.tsx`

**Purpose**: Presentational components and page components.

**Dependencies**:
- ✅ Hooks (`useCardFormState`, etc.)
- ✅ Services (`formsApi` for direct calls if needed)
- ❌ No direct domain function calls (go through hooks)
- ❌ No type imports (types come through hooks)

**Example**:
```ts
// ✅ GOOD: Component using hooks
import { useCardFormState } from './useCardFormState';

export function CardFormView({ slug, template }) {
  const formState = useCardFormState(slug, template);
  // Render using formState
}

// ❌ BAD: Component importing domain directly
import { getVisibleFields } from '@/lib/forms/conditional-logic'; // NO!
```

---

## Enforcement Rules

### Rule 1: No Circular Dependencies

**Check**: If A imports B and B imports A (directly or transitively), it's a circular dependency.

**How to Check**:
```bash
# Use a tool like madge or depcheck
npx madge --circular frontend/lib/forms frontend/components/public/forms
```

**Fix**: Refactor to break the cycle, usually by:
- Moving shared code to a lower layer
- Using dependency injection
- Splitting responsibilities

---

### Rule 2: Domain Layer Cannot Import from Higher Layers

**Violation Example**:
```ts
// ❌ BAD: Domain importing from hooks
// lib/forms/conditional-logic.ts
import { useFormData } from '../hooks/useCardFormData'; // NO!
```

**Fix**: Pass data as parameters:
```ts
// ✅ GOOD: Domain receives data as parameters
export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown> // Passed in, not imported
): FormField[] {
  // ...
}
```

---

### Rule 3: Services Cannot Import from Hooks or UI

**Violation Example**:
```ts
// ❌ BAD: Service importing hook
// lib/api/endpoints/forms.ts
import { useCardFormState } from '@/components/...'; // NO!
```

**Fix**: Services are pure API clients; hooks call services, not the other way around.

---

### Rule 4: UI Cannot Import Domain Directly

**Violation Example**:
```ts
// ❌ BAD: Component importing domain
// CardFormView.tsx
import { getVisibleFields } from '@/lib/forms/conditional-logic'; // NO!
```

**Fix**: Use hooks that wrap domain functions:
```ts
// ✅ GOOD: Component uses hook
import { useCardFormState } from './useCardFormState';
// Hook internally uses getVisibleFields
```

---

## Migration Checklist

When refactoring, ensure:

- [ ] All form types are in `lib/forms/types.ts`
- [ ] Domain files import only from `./types` (or `@/lib/forms/types`)
- [ ] Services import types from `@/lib/forms/types`, not from `@/lib/api`
- [ ] Hooks import domain functions and services, not UI
- [ ] UI components import hooks and services, not domain directly
- [ ] No circular dependencies exist
- [ ] TypeScript compilation succeeds
- [ ] Linter passes (no unused imports, etc.)

---

## Common Violations and Fixes

### Violation: Domain Importing from API

```ts
// ❌ BAD
// lib/forms/conditional-logic.ts
import type { FormField } from '@/lib/api/endpoints/forms';
```

**Fix**: Import from types:
```ts
// ✅ GOOD
import type { FormField } from './types';
```

---

### Violation: Hook Importing UI Component

```ts
// ❌ BAD
// useCardFormState.ts
import { CardFormView } from './CardFormView';
```

**Fix**: Hooks don't need UI components. If you need to render something, return JSX from the hook or pass render props.

---

### Violation: Service Defining Form Types

```ts
// ❌ BAD
// lib/api/endpoints/forms.ts
export interface FormField { ... } // Duplicate definition
```

**Fix**: Import from types:
```ts
// ✅ GOOD
import type { FormField } from '@/lib/forms/types';
```

---

## Verification

After refactoring, verify the dependency graph:

1. **Type Check**: Run `tsc --noEmit` - should pass
2. **Circular Dependencies**: Use `madge --circular` - should find none
3. **Linter**: Run ESLint - should pass
4. **Manual Review**: Check imports in each file match the allowed dependencies

---

## Summary

**Dependency Flow**:
```
Types (foundation)
  ↑
Domain (pure functions)
  ↑
Services (API client)
  ↑
Hooks (state management)
  ↑
UI (components)
```

**Key Rules**:
- Types have no dependencies
- Domain depends only on types
- Services depend on types (and possibly domain for transformations)
- Hooks depend on domain, services, and types
- UI depends on hooks and services

**No**:
- Circular dependencies
- Domain importing from hooks/UI
- Services importing from hooks/UI
- UI importing domain directly

---

## Next Steps

1. Review `04-type-layer.md` to implement the types foundation
2. Review `05-domain-layer.md` to implement domain functions
3. Ensure all imports follow this graph
