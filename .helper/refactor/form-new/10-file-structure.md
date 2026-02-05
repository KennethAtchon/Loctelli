# File Structure — Target Organization

> **Purpose**: Complete file structure for the refactored form system.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: All previous documents

---

## Overview

This document defines the target file structure after refactoring. All files should be organized according to this structure.

---

## Complete File Tree

```
frontend/
├── lib/
│   ├── forms/
│   │   ├── types.ts                    # Canonical form types (from 04-type-layer.md)
│   │   ├── conditional-logic.ts        # Field visibility, conditions (from 05-domain-layer.md)
│   │   ├── flowchart-types.ts          # Flowchart type definitions (from 05-domain-layer.md)
│   │   ├── flowchart-serialization.ts  # Schema ↔ flowchart conversion (from 05-domain-layer.md)
│   │   ├── profile-estimation.ts       # Profile calculation logic (from 05-domain-layer.md)
│   │   ├── form-validation.ts          # Validation and initial data (from 05-domain-layer.md)
│   │   └── navigation.ts               # Navigation utilities (optional, from 05-domain-layer.md)
│   └── api/
│       └── endpoints/
│           └── forms.ts                 # API client (from 06-service-layer.md)
│
├── components/
│   ├── public/
│   │   └── forms/
│   │       ├── shared/
│   │       │   └── FieldRenderer.tsx   # Shared field renderer (from 09-shared-ui.md)
│   │       ├── card-form/
│   │       │   ├── index.tsx           # Re-export CardFormContainer
│   │       │   ├── card-form-container.tsx  # Thin wrapper (from 07-card-form-hooks.md)
│   │       │   ├── CardFormView.tsx    # Presentational component (from 07-card-form-hooks.md)
│   │       │   ├── useCardFormSchema.ts      # Schema derivation hook
│   │       │   ├── useCardFormSession.ts    # Session management hook
│   │       │   ├── useCardFormNavigation.ts # Navigation hook
│   │       │   ├── useCardFormData.ts       # Form data hook
│   │       │   ├── useCardFormProfile.ts    # Profile calculation hook
│   │       │   ├── useCardFormState.ts      # Orchestrator hook
│   │       │   ├── progress-indicator.tsx   # Progress bar component
│   │       │   └── results/                # Result components (unchanged)
│   │       │       ├── PercentageResult.tsx
│   │       │       ├── CategoryResult.tsx
│   │       │       └── ...
│   │       └── simple-form/
│   │           ├── SimpleFormView.tsx  # Simple form component (from 08-simple-form-hooks.md)
│   │           └── useSimpleFormState.ts   # Simple form hook
│   └── admin/
│       └── forms/
│           ├── card-form-builder/       # Unchanged structure
│           ├── form-field-editor.tsx    # Unchanged
│           └── ...
│
└── app/
    ├── (main)/
    │   └── forms/
    │       ├── [slug]/
    │       │   └── page.tsx             # Route: fetch template, render SimpleFormView or redirect
    │       └── card/
    │           └── [slug]/
    │               └── page.tsx         # Route: fetch template, render CardFormContainer
```

---

## Directory Descriptions

### `lib/forms/` - Domain Layer

**Purpose**: Pure business logic functions.

**Files**:
- `types.ts` - All form type definitions
- `conditional-logic.ts` - Condition evaluation, visibility, jumps, piping
- `flowchart-types.ts` - Flowchart-specific types
- `flowchart-serialization.ts` - Schema ↔ flowchart conversion
- `profile-estimation.ts` - Profile calculation (rule-based)
- `form-validation.ts` - Validation and initial data
- `navigation.ts` - Navigation utilities (optional)

**Rules**:
- No React imports
- No API calls
- Import only from `./types`

---

### `lib/api/endpoints/forms.ts` - Service Layer

**Purpose**: API client for form-related HTTP calls.

**Files**:
- `forms.ts` - All form API functions

**Rules**:
- Imports types from `@/lib/forms/types`
- No type definitions
- No re-exports of form types

---

### `components/public/forms/shared/` - Shared UI

**Purpose**: Shared components used by both form types.

**Files**:
- `FieldRenderer.tsx` - Field rendering component

---

### `components/public/forms/card-form/` - Card Form

**Purpose**: Card form components and hooks.

**Files**:
- `index.tsx` - Re-exports
- `card-form-container.tsx` - Thin wrapper component
- `CardFormView.tsx` - Presentational component
- `useCardFormSchema.ts` - Schema hook
- `useCardFormSession.ts` - Session hook
- `useCardFormNavigation.ts` - Navigation hook
- `useCardFormData.ts` - Data hook
- `useCardFormProfile.ts` - Profile hook
- `useCardFormState.ts` - Orchestrator hook
- `progress-indicator.tsx` - Progress bar
- `results/` - Result components

---

### `components/public/forms/simple-form/` - Simple Form

**Purpose**: Simple form components and hooks.

**Files**:
- `SimpleFormView.tsx` - Simple form component
- `useSimpleFormState.ts` - Simple form hook

---

### `app/(main)/forms/` - Routes

**Purpose**: Page components that fetch templates and render forms.

**Files**:
- `[slug]/page.tsx` - Simple form route
- `card/[slug]/page.tsx` - Card form route

---

## File Naming Conventions

**Hooks**: `use*.ts` (e.g., `useCardFormState.ts`)

**Components**: `*.tsx` with PascalCase (e.g., `CardFormView.tsx`)

**Domain**: `*.ts` with kebab-case (e.g., `conditional-logic.ts`)

**Types**: `types.ts` or `*-types.ts` (e.g., `types.ts`, `flowchart-types.ts`)

---

## Import Paths

**Absolute Imports** (preferred):
- `@/lib/forms/types` - Form types
- `@/lib/forms/conditional-logic` - Domain functions
- `@/lib/api/endpoints/forms` - API client
- `@/components/public/forms/shared/FieldRenderer` - Shared components

**Relative Imports** (within same directory):
- `./useCardFormSchema` - Same directory
- `../shared/FieldRenderer` - Parent/sibling directory

---

## Migration Checklist

### Phase 1: Create Domain Layer

- [ ] Create `lib/forms/types.ts`
- [ ] Create `lib/forms/conditional-logic.ts`
- [ ] Create `lib/forms/flowchart-types.ts`
- [ ] Create `lib/forms/flowchart-serialization.ts`
- [ ] Create `lib/forms/profile-estimation.ts`
- [ ] Create `lib/forms/form-validation.ts`
- [ ] Create `lib/forms/navigation.ts` (optional)

---

### Phase 2: Update Service Layer

- [ ] Update `lib/api/endpoints/forms.ts` to import types
- [ ] Remove form type definitions from API file
- [ ] Remove re-exports

---

### Phase 3: Create Card Form Hooks

- [ ] Create `components/public/forms/card-form/useCardFormSchema.ts`
- [ ] Create `components/public/forms/card-form/useCardFormSession.ts`
- [ ] Create `components/public/forms/card-form/useCardFormNavigation.ts`
- [ ] Create `components/public/forms/card-form/useCardFormData.ts`
- [ ] Create `components/public/forms/card-form/useCardFormProfile.ts`
- [ ] Create `components/public/forms/card-form/useCardFormState.ts`

---

### Phase 4: Create Card Form Components

- [ ] Create `components/public/forms/card-form/CardFormView.tsx`
- [ ] Update `components/public/forms/card-form/card-form-container.tsx`
- [ ] Create `components/public/forms/card-form/index.tsx` (re-exports)

---

### Phase 5: Create Shared UI

- [ ] Create `components/public/forms/shared/FieldRenderer.tsx`

---

### Phase 6: Create Simple Form

- [ ] Create `components/public/forms/simple-form/useSimpleFormState.ts`
- [ ] Create `components/public/forms/simple-form/SimpleFormView.tsx`

---

### Phase 7: Update Routes

- [ ] Update `app/(main)/forms/[slug]/page.tsx`
- [ ] Update `app/(main)/forms/card/[slug]/page.tsx`

---

### Phase 8: Cleanup

- [ ] Remove legacy `CardFieldRenderer` (if exists)
- [ ] Remove inline simple form field rendering
- [ ] Remove duplicate type definitions
- [ ] Update all imports to use new paths
- [ ] Run typecheck
- [ ] Run linter
- [ ] Test all forms

---

## File Size Guidelines

**Hooks**: Keep under 200 lines per hook. If larger, split responsibilities.

**Components**: Keep under 300 lines per component. Extract sub-components if needed.

**Domain Functions**: Keep functions focused (one responsibility). File can be longer if it contains related functions.

---

## Testing File Structure

**Unit Tests**: Mirror source structure:

```
__tests__/
├── lib/
│   └── forms/
│       ├── conditional-logic.test.ts
│       ├── form-validation.test.ts
│       └── ...
└── components/
    └── public/
        └── forms/
            └── card-form/
                ├── useCardFormState.test.ts
                └── ...
```

---

## Summary

**Key Directories**:
- `lib/forms/` - Domain layer (pure functions)
- `lib/api/endpoints/` - Service layer (API client)
- `components/public/forms/shared/` - Shared UI
- `components/public/forms/card-form/` - Card form
- `components/public/forms/simple-form/` - Simple form
- `app/(main)/forms/` - Routes

**Key Principles**:
- Clear separation of concerns
- Single responsibility per file
- Consistent naming conventions
- Absolute imports preferred

---

## Next Steps

1. Review this structure
2. Create directories
3. Follow migration checklist
4. Proceed to `11-backend-considerations.md` for backend alignment
5. Proceed to `12-implementation-order.md` for step-by-step guide
