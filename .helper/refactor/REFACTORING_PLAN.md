# Codebase Refactoring Plan

> **Purpose**: Master refactoring guide based on successful form system migration.  
> **Status**: Active reference document  
> **Last Updated**: February 4, 2026  
> **Based On**: Form system refactoring (`.helper/refactor/form-new/`)

---

## Executive Summary

This document provides a systematic, proven approach to refactoring any part of the codebase. It captures the principles, patterns, and processes that made the form system refactoring successful and applies them universally.

**Key Success Factors**:
- ✅ Clean architecture with clear layer separation
- ✅ Single source of truth for types
- ✅ State/effects discipline
- ✅ Unidirectional dependencies
- ✅ Incremental, phase-based migration
- ✅ No backwards compatibility (clean break)

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Identifying Refactoring Opportunities](#identifying-refactoring-opportunities)
3. [Refactoring Process](#refactoring-process)
4. [Architecture Layers](#architecture-layers)
5. [State Management Discipline](#state-management-discipline)
6. [Dependency Management](#dependency-management)
7. [File Structure Standards](#file-structure-standards)
8. [Verification Checklist](#verification-checklist)
9. [Common Patterns](#common-patterns)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Core Principles

These principles apply to **every** refactoring:

### 0. No Backwards Compatibility

**Rule**: We do not maintain backwards compatibility. The app is in beta. Make clean breaks.

**Why**: Allows for clean architecture without legacy cruft, faster development, and better code quality.

**Implementation**:
- Replace existing code in place
- No feature flags or gradual rollouts
- No compatibility layers or adapters
- Update all imports in one pass
- Remove old code immediately
- No re-exports for "backwards compatibility"

**Migration Strategy**:
1. Create new structure
2. Update all imports in one pass
3. Remove old code
4. Run typecheck until clean
5. **No exceptions** - if it breaks, fix it immediately

**Example**:
```typescript
// ❌ BAD: Maintaining backwards compatibility
export type { FormField } from '@/lib/api/endpoints/forms'; // Re-export for legacy
export type { FormField } from '@/lib/forms/types'; // New location

// ✅ GOOD: Clean break
// lib/api/endpoints/forms.ts - NO form type exports
// All imports must use: import type { FormField } from '@/lib/forms/types';
```

---

### 1. Single Source of Truth

**Rule**: Domain types live in one canonical location. No duplicate type definitions across files.

**Why**: Eliminates type drift, reduces maintenance burden, ensures consistency.

**Implementation**:
- Create `lib/{domain}/types.ts` for domain-specific types
- Remove type definitions from API files, components, and other locations
- All imports use the canonical types file
- No re-exports for "backwards compatibility"

**Example**:
```typescript
// ✅ GOOD: Single source
// lib/forms/types.ts
export interface FormField { ... }

// All files import from here
import type { FormField } from '@/lib/forms/types';

// ❌ BAD: Duplicate definitions
// lib/api/endpoints/forms.ts
export interface FormField { ... } // NO!
```

---

### 2. Unidirectional Dependencies

**Rule**: Dependencies flow in one direction: `Types → Domain → Services → Hooks → UI`

**Why**: Prevents circular dependencies, makes code testable, creates clear boundaries.

**Dependency Graph**:
```
UI (pages, components)
  ↓ imports from
State / Hooks (useXxxState, useXxxSession)
  ↓ imports from
Domain (pure functions)
  ↓ imports from
Services (API client)
  ↓ imports from
Types (lib/{domain}/types.ts)
```

**Enforcement**:
- Domain layer cannot import from hooks or UI
- Services cannot import from hooks or UI
- Hooks cannot import from UI components
- Types are the foundation; everything depends on them

---

### 3. Pure Domain Layer

**Rule**: Business logic functions are pure; no React, no API calls, no side effects.

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
- Only imports from `./types` or `@/lib/{domain}/types`

**Example**:
```typescript
// ✅ GOOD: Pure domain function
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ BAD: Domain with side effects
export function calculateTotal(items: Item[]): number {
  fetch('/api/items'); // NO!
  return useState(0); // NO!
}
```

---

### 4. Thin Containers

**Rule**: No god components. Split large components into focused hooks and presentational components.

**Why**: 
- Easier to test individual pieces
- Better code organization
- Reduced cognitive load
- Easier to maintain and extend

**Breakdown Strategy**:
1. **Schema/Data derivation**: Template → runtime data
2. **Session/State management**: Create, restore, update, complete
3. **Navigation/Flow state**: Current step, direction, visible items
4. **Business logic**: Calculations, transformations
5. **Presentation**: Layout, transitions, buttons

**Target Structure**:
- `useXxxSchema.ts` - Data derivation only
- `useXxxSession.ts` - Session/state API only
- `useXxxNavigation.ts` - Navigation state only
- `useXxxData.ts` - Data management only
- `useXxxState.ts` - Orchestrator (composes above)
- `XxxView.tsx` - Presentational only

---

### 5. Shared Where It Pays

**Rule**: Share validation, utilities, and common logic between similar features.

**Why**: 
- Reduces code duplication
- Ensures consistent behavior
- Single place to fix bugs

**What to Share**:
- Validation logic
- Utility functions
- Common calculations
- Shared UI components (with mode props)

**What NOT to Share**:
- Feature-specific navigation logic
- Feature-specific session management
- Feature-specific business rules

---

### 6. State and Effects Discipline

**Rule**: Minimize `useState` and `useEffect`. Prefer derived state with `useMemo`, `useReducer` for machine state, and `useEffect` only for real side effects.

**Why**: 
- Prevents scattered state
- Avoids fragile dependency arrays
- Eliminates effects that "sync" state that should be derived
- Reduces unnecessary re-renders

**Key Rules**:
1. **Derived state**: Use `useMemo`, never `useEffect` + `setState`
2. **Machine state**: Use `useReducer` for lifecycle/flow state
3. **Side effects only**: `useEffect` for fetching, persisting, analytics, DOM manipulation
4. **No dependency hacks**: If you need `eslint-disable`, the design is wrong

---

### 7. Strict File Structure Enforcement

**Rule**: Files **MUST ALWAYS** be in the correct location according to the architecture. All files **MUST** be sorted alphabetically within their directories.

**Why**: 
- Predictable codebase navigation
- Prevents architectural drift
- Makes refactoring easier
- Reduces cognitive load
- Enforces discipline

**File Location Rules**:
- **Domain types**: `lib/{domain}/types.ts` - NO exceptions
- **Domain functions**: `lib/{domain}/*.ts` - Pure functions only
- **API clients**: `lib/api/endpoints/{domain}.ts` - API calls only
- **Hooks**: `components/{location}/{domain}/use*.ts` - State management
- **Components**: `components/{location}/{domain}/*.tsx` - UI only
- **Pages**: `app/{location}/{domain}/*.tsx` - Route handlers

**File Sorting Rules**:
- **Within directories**: All files sorted alphabetically
- **Import statements**: Sorted alphabetically within groups
- **Export statements**: Sorted alphabetically
- **Type definitions**: Sorted alphabetically within files

**Enforcement**:
- ✅ **Pre-commit hook**: Verify file locations
- ✅ **CI/CD check**: Fail build if files in wrong location
- ✅ **Linter rule**: Enforce import sorting
- ✅ **Code review**: Reject PRs with misplaced files
- ✅ **Automated tooling**: Use scripts to verify structure

**Example**:
```typescript
// ✅ GOOD: Files in correct locations
lib/forms/types.ts                    // Domain types
lib/forms/conditional-logic.ts        // Domain function
lib/api/endpoints/forms.ts            // API client
components/public/forms/card-form/useCardFormState.ts  // Hook
components/public/forms/card-form/CardFormView.tsx      // Component

// ❌ BAD: Files in wrong locations
lib/api/endpoints/forms/types.ts      // Types should be in lib/forms/
components/public/forms/useCardFormState.ts  // Hook should be in card-form/
lib/forms/CardFormView.tsx            // Component should be in components/
```

**File Sorting Example**:
```typescript
// ✅ GOOD: Imports sorted alphabetically
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { FormField } from '@/lib/forms/types';
import { api } from '@/lib/api';
import { validateForm } from '@/lib/forms/form-validation';

// ❌ BAD: Imports not sorted
import { validateForm } from '@/lib/forms/form-validation';
import { useCallback } from 'react';
import type { FormField } from '@/lib/forms/types';
import { useMutation } from '@tanstack/react-query';
```

**Directory Structure Verification**:
```bash
# Verify file structure matches specification
# Run this before committing
./scripts/verify-file-structure.sh

# Auto-sort imports
npm run lint:fix

# Check for misplaced files
npm run check:file-structure
```

---

## Identifying Refactoring Opportunities

### Red Flags

Look for these signs that refactoring is needed:

#### 1. Code Smells

- **God Component**: Single component > 500 lines
- **Duplicate Types**: Same type defined in multiple files
- **Circular Dependencies**: A imports B, B imports A (directly or transitively)
- **Scattered State**: 10+ `useState` calls in one component
- **Effect Hell**: Multiple `useEffect` calls syncing state
- **Mixed Concerns**: Business logic mixed with UI rendering
- **API Types in Components**: Components importing types from API files

#### 2. Architecture Violations

- **Domain importing from hooks/UI**: Business logic depends on React
- **Services importing from hooks/UI**: API client depends on components
- **UI importing domain directly**: Components calling business logic functions
- **Types scattered**: No single source of truth for domain types

#### 3. Maintenance Issues

- **Hard to test**: Requires React/API mocks for business logic
- **Hard to reuse**: Logic tightly coupled to specific components
- **Fragile dependencies**: `eslint-disable` comments in dependency arrays
- **Type drift**: Same concept has different types in different files

---

## Refactoring Process

Follow this systematic process for **every** refactoring:

### Phase 1: Analysis and Planning

**Duration**: 1-2 days

**Tasks**:
1. **Identify scope**: What feature/module needs refactoring?
2. **Document current state**: 
   - List all files involved
   - Map current dependencies
   - Identify circular dependencies
   - List duplicate types
   - Document state management issues
3. **Create architecture spec**: 
   - Define target structure
   - Define dependency graph
   - List all types needed
   - Plan hook breakdown
4. **Create implementation plan**: 
   - Break into phases
   - Define verification steps
   - Estimate time per phase

**Deliverables**:
- Architecture document (similar to `form-new/00-*.md`)
- Dependency graph diagram
- Implementation order document
- File structure plan

---

### Phase 2: Foundation — Types and Domain Layer

**Duration**: 2-3 days

**Steps**:

#### Step 2.1: Create Type Layer
- Create `lib/{domain}/types.ts`
- Consolidate all domain types
- Add JSDoc comments
- Export all types

**Verification**:
- [ ] File exists
- [ ] All types exported
- [ ] TypeScript compiles
- [ ] No duplicate type definitions elsewhere

#### Step 2.2: Create Domain Functions
- Create domain files (`lib/{domain}/*.ts`)
- Extract pure business logic functions
- No React imports
- No API calls
- Only import from `./types`

**Verification**:
- [ ] All functions implemented
- [ ] No React or API imports
- [ ] TypeScript compiles
- [ ] Functions are pure (no side effects)

**Domain Files to Create**:
- `conditional-logic.ts` - Conditional evaluation, visibility
- `validation.ts` - Validation logic
- `calculations.ts` - Business calculations
- `transformations.ts` - Data transformations
- `serialization.ts` - Format conversions (if needed)
- `navigation.ts` - Navigation utilities (if needed)

---

### Phase 3: Service Layer

**Duration**: 1 day

**Steps**:

#### Step 3.1: Update API Client
- Add imports: `import type { ... } from '@/lib/{domain}/types'`
- Remove all domain type definitions
- Remove re-exports of domain types
- Update function signatures to use imported types

**Verification**:
- [ ] No domain type definitions in API file
- [ ] All imports use `@/lib/{domain}/types`
- [ ] TypeScript compiles
- [ ] API functions work (test manually)

---

### Phase 4: State Management Hooks

**Duration**: 3-4 days

**Steps**:

#### Step 4.1: Create Schema/Data Hook
- Create `useXxxSchema.ts` or `useXxxData.ts`
- Only `useMemo`, no state/effects
- Derives runtime data from template/props

**Verification**:
- [ ] Hook implemented
- [ ] No state or effects
- [ ] TypeScript compiles

#### Step 4.2: Create Session/State Hook
- Create `useXxxSession.ts` or `useXxxState.ts`
- One effect for initialization
- Single settlement callback
- Uses TanStack Query mutations

**Verification**:
- [ ] Hook implemented
- [ ] One effect for init
- [ ] Single settlement callback
- [ ] TypeScript compiles

#### Step 4.3: Create Navigation Hook (if needed)
- Create `useXxxNavigation.ts`
- Only `useMemo`, no state/effects
- All derived values use `useMemo`

**Verification**:
- [ ] Hook implemented
- [ ] No state or effects
- [ ] All derived values use `useMemo`
- [ ] TypeScript compiles

#### Step 4.4: Create Data Management Hook
- Create `useXxxData.ts`
- State for data, no effects
- Lazy initialization
- Handlers update state directly

**Verification**:
- [ ] Hook implemented
- [ ] Lazy initialization
- [ ] No effects for syncing
- [ ] TypeScript compiles

#### Step 4.5: Create Business Logic Hook (if needed)
- Create `useXxxCalculation.ts` or `useXxxProfile.ts`
- Computation triggered by function call
- No effects

**Verification**:
- [ ] Hook implemented
- [ ] Computation triggered by function call
- [ ] TypeScript compiles

#### Step 4.6: Create Orchestrator Hook
- Create `useXxxState.ts` (orchestrator)
- Implement reducer for machine state
- Compose all hooks
- Implement analytics/focus effects (if needed)

**Verification**:
- [ ] Hook implemented
- [ ] Reducer for machine state
- [ ] Two effects max: analytics and sync
- [ ] No effects for syncing derived state
- [ ] TypeScript compiles

---

### Phase 5: Components

**Duration**: 2 days

**Steps**:

#### Step 5.1: Create Presentational Component
- Create `XxxView.tsx`
- Extract presentational JSX from current component
- Receive state and callbacks from hook
- No direct API or domain calls

**Verification**:
- [ ] Component created
- [ ] Presentational only
- [ ] Uses state from hook
- [ ] TypeScript compiles
- [ ] Renders correctly

#### Step 5.2: Update Container Component
- Update container file
- Use orchestrator hook
- Pass props to view component
- Remove all logic (moved to hooks)

**Verification**:
- [ ] Container is thin wrapper
- [ ] Uses hook
- [ ] Passes props to view
- [ ] TypeScript compiles
- [ ] Feature works

---

### Phase 6: Shared Components (if applicable)

**Duration**: 2 days

**Steps**:

#### Step 6.1: Create Shared Component
- Create shared component file
- Implement both modes (if needed)
- Support all use cases
- Add error display
- Add accessibility attributes

**Verification**:
- [ ] Component created
- [ ] All modes work
- [ ] All use cases supported
- [ ] TypeScript compiles
- [ ] Renders correctly

#### Step 6.2: Update Components to Use Shared
- Replace duplicate components
- Use shared component
- Test all features

**Verification**:
- [ ] Uses shared component
- [ ] All features work
- [ ] No duplicate code

---

### Phase 7: Cleanup

**Duration**: 1-2 days

**Steps**:

#### Step 7.1: Remove Legacy Code
- Remove old components
- Remove duplicate type definitions
- Remove unused imports
- Remove inline logic that moved to hooks
- **No backwards compatibility** - remove immediately

**Verification**:
- [ ] Legacy code removed
- [ ] No duplicate types
- [ ] TypeScript compiles

#### Step 7.2: Update All Imports
- Find all files importing domain types from wrong location
- Update to import from `@/lib/{domain}/types`
- Update all domain imports
- Update all hook imports
- **Sort all imports alphabetically**

**Verification**:
- [ ] All imports updated
- [ ] No imports from wrong locations
- [ ] All imports sorted alphabetically
- [ ] TypeScript compiles

#### Step 7.3: Enforce File Structure
- **Move files to correct locations** (if any are misplaced)
- **Sort all files alphabetically** within directories
- **Verify file structure** matches specification exactly
- **Run file structure verification script**

**Verification**:
- [ ] All files in correct locations
- [ ] All files sorted alphabetically
- [ ] File structure matches specification
- [ ] No misplaced files

#### Step 7.4: Final Verification
- Run `tsc --noEmit` - should pass
- Run linter - should pass (includes import sorting)
- Run file structure check - should pass
- Test feature - should work
- Check for circular dependencies - should find none
- Verify file structure matches plan exactly

**Verification**:
- [ ] Type check passes
- [ ] Linter passes (imports sorted)
- [ ] File structure check passes
- [ ] Feature works
- [ ] No circular dependencies
- [ ] File structure matches plan exactly

---

## Architecture Layers

### Layer 1: Types (Foundation)

**Location**: `lib/{domain}/types.ts`

**Purpose**: Canonical definitions of all domain-related types.

**Rules**:
- No imports from other layers
- No React types (unless needed for component props)
- No API-specific types (use generic types that API can map to)
- Single source of truth

**Example**:
```typescript
// lib/forms/types.ts
export interface FormField { ... }
export type FormType = 'simple' | 'card';
```

---

### Layer 2: Domain (Pure Functions)

**Location**: `lib/{domain}/*.ts`

**Purpose**: Pure business logic functions with no side effects.

**Dependencies**: 
- ✅ `@/lib/{domain}/types` (types only)
- ❌ No React (`useState`, `useEffect`, etc.)
- ❌ No `fetch` or API calls
- ❌ No hooks or UI components
- ❌ No services layer

**Files**:
- `conditional-logic.ts` - Conditional evaluation
- `validation.ts` - Validation logic
- `calculations.ts` - Business calculations
- `transformations.ts` - Data transformations
- `serialization.ts` - Format conversions
- `navigation.ts` - Navigation utilities

**Example**:
```typescript
// lib/forms/conditional-logic.ts
import type { FormField, ConditionGroup } from './types';

export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown>
): FormField[] {
  // Pure logic, no side effects
}
```

---

### Layer 3: Services (API Client)

**Location**: `lib/api/endpoints/{domain}.ts`

**Purpose**: The only place that performs domain-related HTTP calls.

**Dependencies**:
- ✅ `@/lib/{domain}/types` (for request/response types)
- ❌ No hooks
- ❌ No UI components
- ❌ No domain functions (unless needed for request transformation)

**Example**:
```typescript
// lib/api/endpoints/forms.ts
import type { FormField, FormTemplate } from '@/lib/forms/types';

export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  // API call
}
```

---

### Layer 4: State / Hooks

**Location**: `components/{location}/{domain}/use*.ts`

**Purpose**: React hooks that manage state and compose domain functions.

**Dependencies**:
- ✅ `@/lib/{domain}/types` (types)
- ✅ Domain functions (`@/lib/{domain}/*`)
- ✅ Services (`{domain}Api`)
- ❌ No UI components
- ❌ No other hooks (except React built-ins and composition)

**Example**:
```typescript
// components/public/forms/card-form/useCardFormNavigation.ts
import { getVisibleFields } from '@/lib/forms/conditional-logic';
import { formsApi } from '@/lib/api/endpoints/forms';
import type { FormField } from '@/lib/forms/types';

export function useCardFormNavigation(...) {
  // Uses domain functions and services
}
```

---

### Layer 5: UI (Components and Pages)

**Location**: 
- `components/{location}/{domain}/*.tsx`
- `app/{location}/{domain}/*.tsx`

**Purpose**: Presentational components and page components.

**Dependencies**:
- ✅ Hooks (`useXxxState`, etc.)
- ✅ Services (`{domain}Api` for direct calls if needed)
- ❌ No direct domain function calls (go through hooks)
- ❌ No type imports (types come through hooks)

**Example**:
```typescript
// components/public/forms/card-form/CardFormView.tsx
import { useCardFormState } from './useCardFormState';

export function CardFormView({ slug, template }) {
  const formState = useCardFormState(slug, template);
  // Render using formState
}
```

---

## State Management Discipline

### Rule 1: Derived State — `useMemo` Only

**Principle**: If a value can be computed from existing state/props, compute it in render with `useMemo`. Do not "sync" it in a `useEffect` that calls `setState`.

**Anti-Pattern**:
```typescript
// ❌ BAD: Syncing state in useEffect
useEffect(() => {
  setVisibleFields(getVisibleFields(schema, formData));
}, [schema, formData]);
```

**Correct Pattern**:
```typescript
// ✅ GOOD: Derived state with useMemo
const visibleFields = useMemo(
  () => getVisibleFields(schema, formData),
  [schema, formData]
);
```

---

### Rule 2: Machine State — `useReducer`

**Principle**: Keep lifecycle/flow state in a single reducer so one user action updates all related state in one transition.

**Machine State Shape**:
```typescript
type XxxMachineState = {
  currentIndex: number;
  direction: number;
  status: 'idle' | 'submitting' | 'success';
  error: string | null;
  result: ResultType | null;
};

type XxxMachineAction =
  | { type: 'INIT_FROM_SESSION'; payload: {...} }
  | { type: 'GO_NEXT'; payload: {...} }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } };
```

**Anti-Pattern**:
```typescript
// ❌ BAD: Multiple useState slices
const [currentIndex, setCurrentIndex] = useState(0);
const [direction, setDirection] = useState(1);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Correct Pattern**:
```typescript
// ✅ GOOD: Single reducer for machine state
const [state, dispatch] = useReducer(xxxReducer, initialState);
dispatch({ type: 'GO_NEXT', payload: { nextIndex: 5, direction: 1 } });
```

---

### Rule 3: `useEffect` is for Side Effects Only

**Allowed Effects**:
1. **Session/Data Init** (once per mount)
2. **Analytics** (tracking, timing)
3. **Focus Management** (DOM manipulation)
4. **Cleanup** (unsubscribe, cancel requests)

**Forbidden Patterns**:
- ❌ Syncing derived state
- ❌ "Fixing" state that should be derived
- ❌ One-off boolean flags
- ❌ Watching state to update other state

**Example**:
```typescript
// ✅ GOOD: Session init effect
useEffect(() => {
  let cancelled = false;
  
  async function initSession() {
    const session = await getSession() || await createSession();
    if (!cancelled) {
      onSessionReady(session); // Single settlement callback
    }
  }
  
  initSession();
  return () => { cancelled = true; };
}, [slug]);

// ❌ BAD: Syncing state in effect
useEffect(() => {
  setFormData(initFormData());
}, [initFormData]);
```

---

### Rule 4: No Dependency-Array Hacks

**Principle**: If you need to omit deps and add an `eslint-disable`, the design is wrong.

**Correct Designs**:
- Use `useMemo` for derived values
- Use `useReducer` for transitions
- Use explicit event handlers
- Effects have small, honest dependency arrays

**Anti-Pattern**:
```typescript
// ❌ BAD: Omitting dependencies
useEffect(() => {
  doSomething(formData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex]);
```

**Correct Pattern**:
```typescript
// ✅ GOOD: Include all dependencies or refactor
useEffect(() => {
  doSomething(formData);
}, [currentIndex, formData]);

// OR: Move to event handler
const handleSomething = () => {
  doSomething(formData);
};
```

---

## Dependency Management

### Dependency Graph Enforcement

**Check for Circular Dependencies**:
```bash
# Use madge or depcheck
npx madge --circular frontend/lib/{domain} frontend/components/{location}/{domain}
```

**Fix Circular Dependencies**:
- Move shared code to a lower layer
- Use dependency injection
- Split responsibilities

---

### Import Rules

**Domain Layer**:
- ✅ Import only from `./types` or `@/lib/{domain}/types`
- ❌ No imports from hooks, UI, or services

**Services Layer**:
- ✅ Import types from `@/lib/{domain}/types`
- ❌ No imports from hooks or UI

**Hooks Layer**:
- ✅ Import from domain, services, and types
- ❌ No imports from UI components

**UI Layer**:
- ✅ Import from hooks and services
- ❌ No direct domain function calls

---

## File Structure Standards

**CRITICAL**: File structure is **non-negotiable**. Files **MUST** be in the correct location and **MUST** be sorted alphabetically.

### Domain Layer Structure

**Location**: `lib/{domain}/`

**Required Files** (sorted alphabetically):
```
lib/
└── {domain}/
    ├── calculations.ts             # Business calculations
    ├── conditional-logic.ts       # Conditional evaluation
    ├── navigation.ts               # Navigation utilities (optional)
    ├── serialization.ts            # Format conversions
    ├── transformations.ts          # Data transformations
    ├── types.ts                    # All domain types (MUST be present)
    └── validation.ts               # Validation logic
```

**Rules**:
- ✅ `types.ts` MUST exist and contain all domain types
- ✅ All files sorted alphabetically
- ✅ No subdirectories (flat structure)
- ✅ No files outside this directory for domain logic
- ❌ No components or hooks in domain layer
- ❌ No API calls in domain layer

### Component Structure

**Location**: `components/{location}/{domain}/`

**Required Files** (sorted alphabetically):
```
components/
└── {location}/
    └── {domain}/
        ├── {Domain}View.tsx        # Presentational component (PascalCase)
        ├── {domain}-container.tsx  # Thin wrapper (kebab-case)
        ├── index.tsx               # Re-exports (MUST be present)
        ├── use{Domain}Data.ts      # Data management hook
        ├── use{Domain}Navigation.ts # Navigation hook
        ├── use{Domain}Schema.ts    # Schema derivation hook
        ├── use{Domain}Session.ts   # Session management hook
        └── use{Domain}State.ts     # Orchestrator hook
```

**Shared Components** (if applicable):
```
components/
└── {location}/
    └── {domain}/
        └── shared/                 # Shared components subdirectory
            ├── index.tsx           # Re-exports
            └── SharedComponent.tsx # Shared component
```

**Rules**:
- ✅ `index.tsx` MUST exist for re-exports
- ✅ All files sorted alphabetically
- ✅ Hooks use `use*.ts` naming
- ✅ Components use PascalCase `.tsx`
- ✅ Containers use kebab-case `.tsx`
- ❌ No domain logic in component files
- ❌ No API calls in component files (use hooks)

### Naming Conventions

**Hooks**: `use*.ts` (e.g., `useCardFormState.ts`)
- Must start with `use`
- PascalCase for the rest
- Located in component directories

**Components**: `*.tsx` with PascalCase (e.g., `CardFormView.tsx`)
- PascalCase for all component files
- Located in component directories

**Containers**: `{domain}-container.tsx` (e.g., `card-form-container.tsx`)
- Kebab-case
- Located in component directories

**Domain**: `*.ts` with kebab-case (e.g., `conditional-logic.ts`)
- Kebab-case for all domain files
- Located in `lib/{domain}/`

**Types**: `types.ts` (e.g., `types.ts`)
- Always named `types.ts` (not `*-types.ts`)
- Located in `lib/{domain}/types.ts`

**Index Files**: `index.tsx` or `index.ts`
- Always named `index.tsx` or `index.ts`
- Used for re-exports only
- Located in component directories

**File Sorting**:
- Within each directory, files sorted alphabetically
- Imports within files sorted alphabetically
- Exports within files sorted alphabetically

---

## Verification Checklist

Use this checklist for **every** refactoring:

### Phase 1: Foundation ✅
- [ ] Type layer created (`lib/{domain}/types.ts`)
- [ ] All domain types consolidated
- [ ] Domain functions created (`lib/{domain}/*.ts`)
- [ ] No React or API imports in domain
- [ ] **Files sorted alphabetically**
- [ ] TypeScript compiles

### Phase 2: Service Layer ✅
- [ ] API client updated to use types from `@/lib/{domain}/types`
- [ ] No domain type definitions in API file
- [ ] No re-exports of domain types
- [ ] **No backwards compatibility layer**
- [ ] TypeScript compiles

### Phase 3: Hooks ✅
- [ ] All hooks created in correct location (`components/{location}/{domain}/`)
- [ ] Hooks follow state/effects discipline
- [ ] No effects for syncing derived state
- [ ] All derived values use `useMemo`
- [ ] Machine state uses `useReducer`
- [ ] **Files sorted alphabetically**
- [ ] TypeScript compiles

### Phase 4: Components ✅
- [ ] Presentational component created in correct location
- [ ] Container updated (thin wrapper)
- [ ] No logic in components (moved to hooks)
- [ ] **Files sorted alphabetically**
- [ ] TypeScript compiles
- [ ] Feature works

### Phase 5: Cleanup ✅
- [ ] Legacy code removed (**no backwards compatibility**)
- [ ] All imports updated
- [ ] **All imports sorted alphabetically**
- [ ] No duplicate types
- [ ] No circular dependencies
- [ ] **All files in correct locations**
- [ ] **All files sorted alphabetically**
- [ ] Type check passes (`tsc --noEmit`)
- [ ] Linter passes (includes import sorting)
- [ ] File structure check passes
- [ ] Feature tested and working

---

## Common Patterns

### Pattern 1: Schema Derivation Hook

```typescript
export function useXxxSchema(template: XxxTemplate): {
  schema: XxxItem[];
  metadata: Metadata | null;
} {
  const schema = useMemo(() => {
    return deriveSchema(template);
  }, [template]);
  
  const metadata = useMemo(() => {
    return extractMetadata(template);
  }, [template]);
  
  return { schema, metadata };
}
```

**Key Points**:
- Only `useMemo`, no state/effects
- Pure derivation from props
- Returns derived values

---

### Pattern 2: Session Management Hook

```typescript
export function useXxxSession(
  id: string,
  template: XxxTemplate | null,
  options: { saveProgress: boolean }
): {
  session: Session | null;
  sessionRestored: boolean;
  sessionError: string | null;
  persistProgress: (data: Data) => Promise<void>;
  completeSession: () => Promise<void>;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // TanStack Query mutations
  const createSessionMutation = useMutation({...});
  const updateSessionMutation = useMutation({...});
  const completeSessionMutation = useMutation({...});
  
  // One effect for session initialization
  useEffect(() => {
    if (!template || !options.saveProgress) {
      setSessionRestored(true);
      return;
    }
    
    let cancelled = false;
    
    async function initSession() {
      try {
        const storedToken = sessionStorage.getItem(`session-${id}`);
        let sessionData = null;
        
        if (storedToken) {
          try {
            sessionData = await api.xxx.getSession(id, storedToken);
          } catch (error) {
            sessionData = null;
          }
        }
        
        if (!sessionData) {
          sessionData = await createSessionMutation.mutateAsync();
        }
        
        if (!cancelled) {
          setSession(sessionData);
          setSessionRestored(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(error.message);
          setSessionRestored(true);
        }
      }
    }
    
    initSession();
    return () => { cancelled = true; };
  }, [id, template, options.saveProgress, createSessionMutation]);
  
  const persistProgress = useCallback(async (data: Data) => {
    if (!session?.token || !options.saveProgress) return;
    updateSessionMutation.mutate({ token: session.token, data });
  }, [session?.token, options.saveProgress, updateSessionMutation]);
  
  const completeSession = useCallback(async () => {
    if (!session?.token) return;
    await completeSessionMutation.mutateAsync(session.token);
    sessionStorage.removeItem(`session-${id}`);
  }, [session?.token, id, completeSessionMutation]);
  
  return {
    session,
    sessionRestored,
    sessionError: sessionError || createSessionMutation.error?.message || null,
    persistProgress,
    completeSession
  };
}
```

**Key Points**:
- One effect for session initialization
- Single settlement: `setSession` updates all session state
- `persistProgress` and `completeSession` are callbacks (called from event handlers, not effects)
- Uses TanStack Query mutations

---

### Pattern 3: Navigation Hook

```typescript
export function useXxxNavigation(
  schema: XxxItem[],
  data: Record<string, unknown>,
  currentIndex: number,
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
): {
  visibleItems: XxxItem[];
  currentItem: XxxItem | undefined;
  currentVisibleIndex: number;
  isFirst: boolean;
  isLast: boolean;
  goNext: () => void;
  goBack: () => void;
} {
  const visibleItems = useMemo(
    () => getVisibleItems(schema, data),
    [schema, data]
  );
  
  const currentVisibleIndex = useMemo(
    () => clampToVisible(schema, visibleItems, currentIndex),
    [schema, visibleItems, currentIndex]
  );
  
  const currentItem = visibleItems[currentVisibleIndex];
  
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleItems.length - 1;
  
  const goNext = useCallback(() => {
    const nextIndex = getNextIndex(currentVisibleIndex, visibleItems, data);
    if (nextIndex >= 0) {
      const nextItem = visibleItems[nextIndex];
      const schemaIndex = schema.findIndex(i => i.id === nextItem.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      }
    }
  }, [currentVisibleIndex, visibleItems, data, schema, setCurrentIndex]);
  
  const goBack = useCallback(() => {
    if (currentVisibleIndex > 0) {
      const prevItem = visibleItems[currentVisibleIndex - 1];
      const schemaIndex = schema.findIndex(i => i.id === prevItem.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      }
    }
  }, [currentVisibleIndex, visibleItems, schema, setCurrentIndex]);
  
  return {
    visibleItems,
    currentItem,
    currentVisibleIndex,
    isFirst,
    isLast,
    goNext,
    goBack
  };
}
```

**Key Points**:
- Only `useMemo` for derived values
- No state, no effects
- `goNext`/`goBack` call domain functions and update index
- Handles visibility clamping automatically via `useMemo`

---

### Pattern 4: Orchestrator Hook

```typescript
export function useXxxState(
  id: string,
  template: XxxTemplate,
  options: {
    saveProgress?: boolean;
    analyticsEnabled?: boolean;
  } = {}
): {
  // Schema
  schema: XxxItem[];
  // Data
  data: Record<string, unknown>;
  handleDataChange: (key: string, value: unknown) => void;
  // Navigation
  visibleItems: XxxItem[];
  currentItem: XxxItem | undefined;
  currentVisibleIndex: number;
  isFirst: boolean;
  isLast: boolean;
  // Session
  sessionRestored: boolean;
  sessionError: string | null;
  // State
  currentIndex: number;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  // Actions
  goNext: () => void;
  goBack: () => void;
  handleSubmit: () => Promise<void>;
} {
  const [state, dispatch] = useReducer(xxxReducer, initialState);
  
  // Compose hooks
  const { schema } = useXxxSchema(template);
  const { session, sessionRestored, sessionError, persistProgress, completeSession } = useXxxSession(
    id,
    template,
    { saveProgress: options.saveProgress ?? false }
  );
  const { data, handleDataChange } = useXxxData(schema, session?.partialData);
  const { visibleItems, currentItem, currentVisibleIndex, isFirst, isLast, goNext: baseGoNext, goBack: baseGoBack } = useXxxNavigation(
    schema,
    data,
    state.currentIndex,
    (index) => dispatch({ type: 'SET_INDEX', payload: { index: typeof index === 'function' ? index(state.currentIndex) : index } })
  );
  
  // Sync session restore into state
  useEffect(() => {
    if (session && sessionRestored) {
      dispatch({
        type: 'INIT_FROM_SESSION',
        payload: {
          sessionToken: session.token,
          currentIndex: session.currentIndex,
          partialData: session.partialData
        }
      });
    }
  }, [session, sessionRestored]);
  
  // Navigation handlers
  const goNext = useCallback(async () => {
    if (isLast) return;
    baseGoNext();
    if (session?.token) {
      await persistProgress(state.currentIndex, data);
    }
  }, [isLast, baseGoNext, session, persistProgress, state.currentIndex, data]);
  
  const goBack = useCallback(() => {
    baseGoBack();
  }, [baseGoBack]);
  
  // TanStack Query: Submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: SubmitData) => {
      return api.xxx.submit(id, data);
    },
    onSuccess: async () => {
      if (session?.token) {
        await completeSession();
      }
      dispatch({ type: 'SUBMIT_SUCCESS' });
    },
    onError: (error) => {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: { error: error instanceof Error ? error.message : 'Submission failed' }
      });
    },
  });
  
  const handleSubmit = useCallback(async () => {
    if (!validate(schema, data)) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Validation failed' } });
      return;
    }
    
    dispatch({ type: 'SUBMIT_START' });
    await submitMutation.mutateAsync({ data });
  }, [schema, data, submitMutation]);
  
  // Analytics effect
  const prevItemIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!session?.token || !options.analyticsEnabled) return;
    
    const currentItemId = visibleItems[currentVisibleIndex]?.id;
    if (!currentItemId) return;
    
    if (prevItemIdRef.current != null && startTimeRef.current != null) {
      api.xxx.trackTime(id, {
        sessionToken: session.token,
        itemId: prevItemIdRef.current,
        timeSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      }).catch(err => console.error('Analytics error:', err));
    }
    
    prevItemIdRef.current = currentItemId;
    startTimeRef.current = Date.now();
    
    return () => {
      if (prevItemIdRef.current != null && startTimeRef.current != null && session?.token) {
        api.xxx.trackTime(id, {
          sessionToken: session.token,
          itemId: prevItemIdRef.current,
          timeSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        }).catch(err => console.error('Analytics error:', err));
      }
    };
  }, [currentVisibleIndex, session?.token, options.analyticsEnabled, visibleItems, id]);
  
  return {
    schema,
    data,
    handleDataChange,
    visibleItems,
    currentItem,
    currentVisibleIndex,
    isFirst,
    isLast,
    sessionRestored,
    sessionError,
    currentIndex: state.currentIndex,
    isSubmitting: state.status === 'submitting',
    error: state.error,
    success: state.status === 'success',
    goNext,
    goBack,
    handleSubmit
  };
}
```

**Key Points**:
- Composes all hooks
- Uses reducer for machine state
- Two effects: analytics and session sync
- Handlers call domain functions and dispatch actions
- Uses TanStack Query mutations

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Syncing State in useEffect

```typescript
// ❌ BAD: Syncing state in useEffect
useEffect(() => {
  setVisibleFields(getVisibleFields(schema, formData));
}, [schema, formData]);

// ✅ GOOD: Derived state with useMemo
const visibleFields = useMemo(
  () => getVisibleFields(schema, formData),
  [schema, formData]
);
```

---

### Anti-Pattern 2: Multiple useState for Related State

```typescript
// ❌ BAD: Multiple useState slices
const [currentIndex, setCurrentIndex] = useState(0);
const [direction, setDirection] = useState(1);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

// ✅ GOOD: Single reducer for machine state
const [state, dispatch] = useReducer(xxxReducer, initialState);
```

---

### Anti-Pattern 3: Domain Importing from Hooks/UI

```typescript
// ❌ BAD: Domain importing from hooks
// lib/forms/conditional-logic.ts
import { useFormData } from '../hooks/useCardFormData'; // NO!

// ✅ GOOD: Domain receives data as parameters
export function getVisibleFields(
  fields: FormField[],
  formData: Record<string, unknown> // Passed in, not imported
): FormField[] {
  // ...
}
```

---

### Anti-Pattern 4: Service Defining Domain Types

```typescript
// ❌ BAD: Service defining domain types
// lib/api/endpoints/forms.ts
export interface FormField { ... } // Duplicate definition

// ✅ GOOD: Import from types
import type { FormField } from '@/lib/forms/types';
```

---

### Anti-Pattern 5: UI Importing Domain Directly

```typescript
// ❌ BAD: Component importing domain
// CardFormView.tsx
import { getVisibleFields } from '@/lib/forms/conditional-logic'; // NO!

// ✅ GOOD: Component uses hook
import { useCardFormState } from './useCardFormState';
// Hook internally uses getVisibleFields
```

---

### Anti-Pattern 6: Dependency Array Hacks

```typescript
// ❌ BAD: Omitting dependencies
useEffect(() => {
  doSomething(formData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex]);

// ✅ GOOD: Include all dependencies or refactor
useEffect(() => {
  doSomething(formData);
}, [currentIndex, formData]);

// OR: Move to event handler
const handleSomething = () => {
  doSomething(formData);
};
```

---

## Summary

**Key Principles**:
1. ✅ **No backwards compatibility** (app is in beta)
2. ✅ Single source of truth for types
3. ✅ Unidirectional dependencies
4. ✅ Pure domain layer
5. ✅ Thin containers
6. ✅ Shared where it pays
7. ✅ State/effects discipline
8. ✅ **Strict file structure enforcement**

**Process**:
1. Analyze and plan
2. Create types and domain layer
3. Update service layer
4. Create hooks
5. Create components
6. Cleanup and verify
7. **Enforce file structure**

**Success Metrics**:
- ✅ No circular dependencies
- ✅ No duplicate types
- ✅ No `eslint-disable` comments
- ✅ **All files in correct locations**
- ✅ **All files sorted alphabetically**
- ✅ **All imports sorted alphabetically**
- ✅ TypeScript compiles
- ✅ Linter passes (includes sorting)
- ✅ File structure check passes
- ✅ Feature works
- ✅ Code is testable
- ✅ **No backwards compatibility code**

---

## File Structure Enforcement

**CRITICAL**: File structure is **non-negotiable**. This is enforced at multiple levels.

### Enforcement Rules

1. **Files MUST be in correct location** - No exceptions
2. **Files MUST be sorted alphabetically** - Within directories
3. **Imports MUST be sorted alphabetically** - Within files
4. **Exports MUST be sorted alphabetically** - Within files
5. **No misplaced files** - Move immediately if found
6. **No backwards compatibility** - Remove old code immediately

### File Location Rules

**Domain Layer**:
- ✅ `lib/{domain}/types.ts` - Types only
- ✅ `lib/{domain}/*.ts` - Domain functions only
- ❌ NO components, hooks, or API calls

**Service Layer**:
- ✅ `lib/api/endpoints/{domain}.ts` - API client only
- ❌ NO type definitions, hooks, or components

**Hooks**:
- ✅ `components/{location}/{domain}/use*.ts` - Hooks only
- ❌ NO components or domain logic

**Components**:
- ✅ `components/{location}/{domain}/*.tsx` - Components only
- ❌ NO hooks or domain logic (use hooks instead)

**Pages**:
- ✅ `app/{location}/{domain}/*.tsx` - Route handlers only
- ❌ NO business logic (use hooks/components)

### File Sorting Rules

**Within Directories**:
- All files sorted alphabetically by filename
- `index.tsx` comes after other files (if using strict sorting)
- Subdirectories sorted alphabetically

**Within Files**:
- Import statements sorted alphabetically within groups:
  1. React/Next.js imports
  2. Third-party library imports
  3. Internal imports (sorted by path)
- Export statements sorted alphabetically
- Type definitions sorted alphabetically

**Example**:
```typescript
// ✅ GOOD: Imports sorted alphabetically
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { FormField } from '@/lib/forms/types';
import { api } from '@/lib/api';
import { validateForm } from '@/lib/forms/form-validation';

// ❌ BAD: Imports not sorted
import { validateForm } from '@/lib/forms/form-validation';
import { useCallback } from 'react';
import type { FormField } from '@/lib/forms/types';
```

### File Structure Enforcement Tools

#### Pre-commit Hook

Create `.husky/pre-commit`:
```bash
#!/bin/sh
# Verify file structure
npm run check:file-structure || exit 1
# Sort imports
npm run lint:fix
# Verify again after sorting
npm run check:file-structure || exit 1
```

#### CI/CD Check

Add to GitHub Actions or CI pipeline:
```yaml
- name: Check file structure
  run: npm run check:file-structure
  
- name: Check import sorting
  run: npm run lint:check
  
- name: Fail if file structure violations
  run: |
    if npm run check:file-structure; then
      echo "File structure OK"
    else
      echo "File structure violations found!"
      exit 1
    fi
```

#### Verification Script

Create `scripts/verify-file-structure.sh`:
```bash
#!/bin/bash
set -e

echo "Checking file structure..."

# Check domain files are in lib/{domain}/
# Check hooks are in components/{location}/{domain}/
# Check components are in components/{location}/{domain}/
# Check files are sorted alphabetically
# Exit with error if violations found

echo "File structure OK"
```

#### Linter Configuration

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "import/order": ["error", {
      "groups": [
        ["builtin", "external"],
        "internal",
        ["parent", "sibling", "index"]
      ],
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true
      },
      "newlines-between": "always"
    }]
  }
}
```

#### Package.json Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "check:file-structure": "node scripts/check-file-structure.js",
    "fix:file-structure": "node scripts/fix-file-structure.js",
    "lint:check": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

### File Structure Checklist

Before committing, verify:
- [ ] All files in correct locations according to architecture
- [ ] All files sorted alphabetically within directories
- [ ] All imports sorted alphabetically within files
- [ ] All exports sorted alphabetically within files
- [ ] No misplaced files
- [ ] No backwards compatibility code
- [ ] File structure check passes
- [ ] Linter passes (includes import sorting)

### Common Violations

**Violation 1: File in Wrong Location**
```bash
# ❌ BAD: Hook in wrong location
components/public/forms/useCardFormState.ts

# ✅ GOOD: Hook in correct location
components/public/forms/card-form/useCardFormState.ts
```

**Violation 2: Files Not Sorted**
```bash
# ❌ BAD: Files not sorted
lib/forms/
  validation.ts
  types.ts
  conditional-logic.ts

# ✅ GOOD: Files sorted alphabetically
lib/forms/
  conditional-logic.ts
  types.ts
  validation.ts
```

**Violation 3: Imports Not Sorted**
```typescript
// ❌ BAD: Imports not sorted
import { validateForm } from '@/lib/forms/form-validation';
import { useCallback } from 'react';
import type { FormField } from '@/lib/forms/types';

// ✅ GOOD: Imports sorted alphabetically
import { useCallback } from 'react';
import type { FormField } from '@/lib/forms/types';
import { validateForm } from '@/lib/forms/form-validation';
```

---

## File Structure Enforcement Tools

---

## Next Steps

When starting a new refactoring:

1. **Read this document** - Understand the principles and process
2. **Review form refactoring** - Study `.helper/refactor/form-new/` as a reference
3. **Create architecture spec** - Document target structure and dependencies
4. **Set up file structure checks** - Configure pre-commit hooks and CI checks
5. **Follow the process** - Execute phases systematically
6. **Verify at each step** - Don't proceed until verification passes
7. **Enforce file structure** - Move files immediately if misplaced
8. **Sort everything** - Files, imports, exports must be sorted
9. **No backwards compatibility** - Remove old code immediately
10. **Document learnings** - Update this document with new patterns

---

## References

- **Form System Refactoring**: `.helper/refactor/form-new/`
- **Design Principles**: `.helper/refactor/form-new/01-design-principles.md`
- **State Discipline**: `.helper/refactor/form-new/02-state-effects-discipline.md`
- **Dependency Graph**: `.helper/refactor/form-new/03-dependency-graph.md`
- **Implementation Order**: `.helper/refactor/form-new/12-implementation-order.md`
- **Migration Review**: `.helper/refactor/form-new/MIGRATION_REVIEW.md`

---

**Remember**: This plan is a living document. Update it as you learn new patterns and improve the process.
