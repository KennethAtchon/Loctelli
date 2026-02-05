# Design Principles

> **Purpose**: Core architectural principles that guide the entire form system re-architecture.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: None (foundational)

---

## Overview

This document establishes the foundational principles that will guide the form system re-architecture. These principles ensure maintainability, readability, and scalability.

---

## Core Principles

### 1. Single Source of Truth

**Rule**: Form domain types live in one place; no duplicate `CardMedia` / `FormField` across api vs flowchart.

**Why**: Eliminates type drift, reduces maintenance burden, and ensures consistency across the application.

**Implementation**:
- All form-related types defined in `frontend/lib/forms/types.ts`
- No form type definitions in `lib/api/endpoints/forms.ts`
- No duplicate type definitions in `flowchart-types.ts` or other files
- All imports must use `@/lib/forms/types`

**Migration Impact**: 
- Breaking change: All files importing form types from `@/lib/api` must be updated
- No backwards compatibility layer

---

### 2. Unidirectional Dependencies

**Rule**: `types` ← `domain` ← `services` ← `state/hooks` ← `UI`. No layer imports from a higher layer.

**Why**: Prevents circular dependencies, makes code testable, and creates clear boundaries.

**Dependency Flow**:
```
UI (pages, components)
  ↓ imports from
State / Hooks (useCardFormState, useCardFormSession)
  ↓ imports from
Domain (conditional-logic, serialization, profile-estimation)
  ↓ imports from
Services (formsApi)
  ↓ imports from
Types (lib/forms/types.ts)
```

**Enforcement**:
- Domain layer cannot import from hooks or UI
- Services cannot import from hooks or UI
- Hooks cannot import from UI components
- Types are the foundation; everything depends on them

---

### 3. Pure Domain Layer

**Rule**: Conditional logic, serialization, and profile estimation are pure functions; no React, no API.

**Why**: 
- Testable without React or network mocks
- Reusable across different contexts
- Predictable behavior (no side effects)

**Domain Layer Characteristics**:
- Functions take inputs and return outputs
- No `useState`, `useEffect`, or React hooks
- No `fetch` or API calls
- No DOM manipulation
- No global state access

**Files in Domain Layer**:
- `lib/forms/conditional-logic.ts`
- `lib/forms/flowchart-serialization.ts`
- `lib/forms/profile-estimation.ts`
- `lib/forms/form-validation.ts`
- `lib/forms/navigation.ts` (if needed)

---

### 4. Thin Containers

**Rule**: No god components. Card form splits into: schema derivation, session (API), navigation state, profile calculation, and presentational views.

**Why**: 
- Easier to test individual pieces
- Better code organization
- Reduced cognitive load
- Easier to maintain and extend

**Card Form Breakdown**:
1. **Schema derivation**: Template → runtime schema
2. **Session management**: Create, restore, update, complete
3. **Navigation state**: Current index, direction, visible fields
4. **Form data**: Values, validation, file uploads
5. **Profile calculation**: Compute and hold result
6. **Presentation**: Layout, transitions, buttons

**Target Structure**:
- `useCardFormSchema.ts` - Schema derivation only
- `useCardFormSession.ts` - Session API only
- `useCardFormNavigation.ts` - Navigation state only
- `useCardFormData.ts` - Form data only
- `useCardFormProfile.ts` - Profile calculation only
- `useCardFormState.ts` - Orchestrator (composes above)
- `CardFormView.tsx` - Presentational only

---

### 5. Shared Where It Pays

**Rule**: Field validation, initial form data, and (where possible) field rendering contract are shared between Simple and Card forms.

**Why**: 
- Reduces code duplication
- Ensures consistent behavior
- Single place to fix bugs

**Shared Components**:
- `form-validation.ts`: `getInitialFormData`, `validateField`, `validateForm`
- `FieldRenderer`: Single component with `mode: 'simple' | 'card'`
- Conditional logic evaluation (used by both forms)

**Not Shared**:
- Navigation logic (card form only)
- Session management (card form only)
- Profile calculation hooks (card form only)

---

### 6. State and Effects Discipline

**Rule**: Minimize `useState` and `useEffect`; prefer derived state with `useMemo`, a single `useReducer` for the form "machine," and reserve `useEffect` only for real side effects.

**Why**: 
- Prevents scattered state
- Avoids fragile dependency arrays
- Eliminates effects that "sync" state that should be derived
- Reduces unnecessary re-renders

**Key Rules**:
1. **Derived state**: Use `useMemo`, never `useEffect` + `setState`
2. **Machine state**: Use `useReducer` for form lifecycle
3. **Side effects only**: `useEffect` for fetching, persisting, analytics, DOM manipulation
4. **No dependency hacks**: If you need `eslint-disable`, the design is wrong

**See**: `02-state-effects-discipline.md` for detailed rules and examples.

---

## No Backwards Compatibility

**Critical Decision**: We do not maintain backwards compatibility. This is a clean re-architecture.

**Implications**:
- All form-type imports must use `@/lib/forms/types`
- Do not re-export form types from `@/lib/api` for legacy callers
- Replace existing form code in place
- No feature flags or gradual rollout for the form module
- API client (`forms.ts`) imports types from `@/lib/forms/types`
- Any consumer importing form types from `@/lib/api` must be updated

**Migration Strategy**:
1. Create new structure
2. Update all imports in one pass
3. Remove old code
4. Run typecheck until clean

---

## Glossary

- **Machine state**: State that represents the form lifecycle (idle, submitting, success, error) and navigation (currentIndex, direction). Updated in one place (reducer).
- **Derived state**: Values computed from other state/props (e.g. `visibleFields` from `schema` + `formData`). Always use `useMemo`; never `useEffect` + `setState`.
- **Orchestrator hook**: A hook that composes smaller hooks (e.g. `useCardFormState` composes schema, session, data, navigation, profile).
- **Domain layer**: Pure functions in `lib/forms/*.ts` with no React or API dependencies.
- **Service layer**: API client (e.g. `formsApi`); the only place that performs form-related HTTP calls.

---

## Next Steps

1. Review `02-state-effects-discipline.md` for detailed state management rules
2. Review `03-dependency-graph.md` for dependency structure
3. Begin implementation with `04-type-layer.md`
