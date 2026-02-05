# Implementation Order — Step-by-Step Guide

> **Purpose**: Detailed step-by-step implementation guide for the form system refactoring.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: All previous documents

---

## Overview

This document provides a step-by-step implementation order to ensure a smooth refactoring process. Follow this order to minimize breaking changes and ensure each step builds on the previous one.

---

## Prerequisites

Before starting:
- [ ] Review all architecture documents (01-11)
- [ ] Understand the current form system structure
- [ ] Set up testing environment
- [ ] Create a feature branch

---

## Phase 1: Foundation — Types and Domain Layer

**Goal**: Establish the foundation with types and pure domain functions.

**Estimated Time**: 2-3 days

---

### Step 1.1: Create Type Layer

**File**: `frontend/lib/forms/types.ts`

**Tasks**:
1. Create `lib/forms/types.ts`
2. Copy all form type definitions (see `04-type-layer.md`)
3. Export all types
4. Add JSDoc comments

**Verification**:
- [ ] File exists
- [ ] All types exported
- [ ] TypeScript compiles

**Reference**: `04-type-layer.md`

---

### Step 1.2: Create Domain Functions — Conditional Logic

**File**: `frontend/lib/forms/conditional-logic.ts`

**Tasks**:
1. Create file
2. Import types from `./types`
3. Implement `evaluateCondition`
4. Implement `evaluateConditionGroup`
5. Implement `shouldShowField`
6. Implement `getJumpTarget`
7. Implement `getDynamicLabel`
8. Implement `applyPiping`
9. Implement `getVisibleFields`
10. Implement `getNextCardIndex`

**Verification**:
- [ ] All functions implemented
- [ ] No React or API imports
- [ ] TypeScript compiles
- [ ] Unit tests pass

**Reference**: `05-domain-layer.md`

---

### Step 1.3: Create Domain Functions — Form Validation

**File**: `frontend/lib/forms/form-validation.ts`

**Tasks**:
1. Create file
2. Import types from `./types`
3. Import `shouldShowField` from `./conditional-logic`
4. Implement `getInitialFormData`
5. Implement `validateField`
6. Implement `validateForm`

**Verification**:
- [ ] All functions implemented
- [ ] TypeScript compiles
- [ ] Unit tests pass

**Reference**: `05-domain-layer.md`

---

### Step 1.4: Create Domain Functions — Flowchart Types

**File**: `frontend/lib/forms/flowchart-types.ts`

**Tasks**:
1. Create file
2. Import types from `./types`
3. Import `Node`, `Edge` from `@xyflow/react`
4. Define flowchart types
5. Export all types

**Verification**:
- [ ] All types defined
- [ ] TypeScript compiles

**Reference**: `05-domain-layer.md`

---

### Step 1.5: Create Domain Functions — Flowchart Serialization

**File**: `frontend/lib/forms/flowchart-serialization.ts`

**Tasks**:
1. Create file
2. Import types from `./types` and `./flowchart-types`
3. Implement `flowchartToSchema`
4. Implement `schemaToFlowchart`
5. Implement `mergeFlowchartWithSchema`

**Verification**:
- [ ] All functions implemented
- [ ] TypeScript compiles
- [ ] Unit tests pass

**Reference**: `05-domain-layer.md`

---

### Step 1.6: Create Domain Functions — Profile Estimation

**File**: `frontend/lib/forms/profile-estimation.ts`

**Tasks**:
1. Create file
2. Import types from `./types`
3. Import `evaluateCondition` from `./conditional-logic`
4. Implement `calculatePercentageScore`
5. Implement `matchCategory`
6. Implement `calculateProfileEstimation`

**Verification**:
- [ ] All functions implemented
- [ ] TypeScript compiles
- [ ] Unit tests pass

**Reference**: `05-domain-layer.md`

---

### Step 1.7: Create Domain Functions — Navigation (Optional)

**File**: `frontend/lib/forms/navigation.ts`

**Tasks**:
1. Create file
2. Import types from `./types`
3. Implement `clampToVisible`

**Verification**:
- [ ] Function implemented
- [ ] TypeScript compiles
- [ ] Unit tests pass

**Reference**: `05-domain-layer.md`

---

## Phase 2: Service Layer

**Goal**: Update API client to use new types.

**Estimated Time**: 1 day

---

### Step 2.1: Update API Client

**File**: `frontend/lib/api/endpoints/forms.ts`

**Tasks**:
1. Add imports: `import type { FormField, FormTemplate, ... } from '@/lib/forms/types'`
2. Remove all form type definitions
3. Remove re-exports of form types
4. Update function signatures to use imported types
5. Add transformation layer if backend DTOs don't match (see `11-backend-considerations.md`)

**Verification**:
- [ ] No form type definitions in API file
- [ ] All imports use `@/lib/forms/types`
- [ ] TypeScript compiles
- [ ] API functions work (test manually)

**Reference**: `06-service-layer.md`, `11-backend-considerations.md`

---

## Phase 3: Card Form Hooks

**Goal**: Implement card form hooks following state/effects discipline.

**Estimated Time**: 3-4 days

---

### Step 3.1: Create Schema Hook

**File**: `frontend/components/public/forms/card-form/useCardFormSchema.ts`

**Tasks**:
1. Create file
2. Implement `useCardFormSchema` (only `useMemo`, no state/effects)
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] No state or effects
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`

---

### Step 3.2: Create Session Hook

**File**: `frontend/components/public/forms/card-form/useCardFormSession.ts`

**Tasks**:
1. Create file
2. Implement `useCardFormSession` (one effect for init)
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] One effect for session init
- [ ] Single settlement callback
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`

---

### Step 3.3: Create Navigation Hook

**File**: `frontend/components/public/forms/card-form/useCardFormNavigation.ts`

**Tasks**:
1. Create file
2. Implement `useCardFormNavigation` (only `useMemo`, no state/effects)
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] No state or effects
- [ ] All derived values use `useMemo`
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`

---

### Step 3.4: Create Data Hook

**File**: `frontend/components/public/forms/card-form/useCardFormData.ts`

**Tasks**:
1. Create file
2. Implement `useCardFormData` (state for formData, no effects)
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] Lazy initialization
- [ ] No effects for syncing
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`

---

### Step 3.5: Create Profile Hook

**File**: `frontend/components/public/forms/card-form/useCardFormProfile.ts`

**Tasks**:
1. Create file
2. Implement `useCardFormProfile` (computation function, no effects)
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] Computation triggered by function call
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`

---

### Step 3.6: Create Orchestrator Hook

**File**: `frontend/components/public/forms/card-form/useCardFormState.ts`

**Tasks**:
1. Create file
2. Implement reducer for machine state
3. Compose all hooks
4. Implement analytics effect (time per card)
5. Implement focus effect
6. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] Reducer for machine state
- [ ] Two effects: analytics and focus
- [ ] No effects for syncing derived state
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `07-card-form-hooks.md`, `02-state-effects-discipline.md`

---

## Phase 4: Card Form Components

**Goal**: Create presentational components.

**Estimated Time**: 2 days

---

### Step 4.1: Create CardFormView

**File**: `frontend/components/public/forms/card-form/CardFormView.tsx`

**Tasks**:
1. Create file
2. Extract presentational JSX from current `card-form-container.tsx`
3. Receive state and callbacks from `useCardFormState`
4. Render progress, current card, buttons, success/result screens
5. No direct API or domain calls

**Verification**:
- [ ] Component created
- [ ] Presentational only
- [ ] Uses state from hook
- [ ] TypeScript compiles
- [ ] Renders correctly

**Reference**: `07-card-form-hooks.md`

---

### Step 4.2: Update CardFormContainer

**File**: `frontend/components/public/forms/card-form/card-form-container.tsx`

**Tasks**:
1. Update file
2. Use `useCardFormState` hook
3. Pass props to `CardFormView`
4. Remove all logic (moved to hooks)

**Verification**:
- [ ] Container is thin wrapper
- [ ] Uses hook
- [ ] Passes props to view
- [ ] TypeScript compiles
- [ ] Card form works

**Reference**: `07-card-form-hooks.md`

---

## Phase 5: Shared UI

**Goal**: Create shared field renderer.

**Estimated Time**: 2 days

---

### Step 5.1: Create FieldRenderer

**File**: `frontend/components/public/forms/shared/FieldRenderer.tsx`

**Tasks**:
1. Create file
2. Implement both modes (`simple` and `card`)
3. Support all field types
4. Add piping support (card mode)
5. Add dynamic label support (card mode)
6. Add media rendering (card mode)
7. Add error display
8. Add accessibility attributes

**Verification**:
- [ ] Component created
- [ ] Both modes work
- [ ] All field types supported
- [ ] TypeScript compiles
- [ ] Renders correctly

**Reference**: `09-shared-ui.md`

---

### Step 5.2: Update Card Form to Use FieldRenderer

**File**: `frontend/components/public/forms/card-form/CardFormView.tsx`

**Tasks**:
1. Replace `CardFieldRenderer` with `FieldRenderer` (mode="card")
2. Test card form rendering

**Verification**:
- [ ] Uses `FieldRenderer`
- [ ] Card form works
- [ ] Media, piping, dynamic labels work

**Reference**: `09-shared-ui.md`

---

## Phase 6: Simple Form

**Goal**: Implement simple form.

**Estimated Time**: 1-2 days

---

### Step 6.1: Create Simple Form Hook

**File**: `frontend/components/public/forms/simple-form/useSimpleFormState.ts`

**Tasks**:
1. Create file
2. Implement `useSimpleFormState`
3. Test hook

**Verification**:
- [ ] Hook implemented
- [ ] TypeScript compiles
- [ ] Tests pass

**Reference**: `08-simple-form-hooks.md`

---

### Step 6.2: Create SimpleFormView

**File**: `frontend/components/public/forms/simple-form/SimpleFormView.tsx`

**Tasks**:
1. Create file
2. Use `useSimpleFormState`
3. Use `FieldRenderer` (mode="simple")
4. Render form fields and submit button

**Verification**:
- [ ] Component created
- [ ] Uses hook and `FieldRenderer`
- [ ] TypeScript compiles
- [ ] Renders correctly

**Reference**: `08-simple-form-hooks.md`

---

### Step 6.3: Update Simple Form Page

**File**: `frontend/app/(main)/forms/[slug]/page.tsx`

**Tasks**:
1. Update page
2. Use `SimpleFormView` for simple forms
3. Redirect or render card form for card forms

**Verification**:
- [ ] Page updated
- [ ] Simple form works
- [ ] Card form redirect works

**Reference**: `08-simple-form-hooks.md`

---

## Phase 7: Cleanup

**Goal**: Remove legacy code and verify everything works.

**Estimated Time**: 1-2 days

---

### Step 7.1: Remove Legacy Components

**Tasks**:
1. Remove `CardFieldRenderer` (if exists)
2. Remove inline simple form field rendering
3. Remove duplicate type definitions
4. Remove unused imports

**Verification**:
- [ ] Legacy code removed
- [ ] No duplicate types
- [ ] TypeScript compiles

---

### Step 7.2: Update All Imports

**Tasks**:
1. Find all files importing form types from `@/lib/api`
2. Update to import from `@/lib/forms/types`
3. Update all domain imports
4. Update all hook imports

**Verification**:
- [ ] All imports updated
- [ ] No imports from `@/lib/api` for form types
- [ ] TypeScript compiles

---

### Step 7.3: Final Verification

**Tasks**:
1. Run `tsc --noEmit` - should pass
2. Run linter - should pass
3. Test card form - should work
4. Test simple form - should work
5. Test form submission - should work
6. Test file uploads - should work
7. Test profile calculation - should work
8. Test analytics - should work

**Verification**:
- [ ] Type check passes
- [ ] Linter passes
- [ ] All forms work
- [ ] All features work

---

## Testing Strategy

**Unit Tests** (during implementation):
- Domain functions (conditional-logic, validation, etc.)
- Hooks (each hook individually)
- Components (presentational components)

**Integration Tests** (after each phase):
- Card form flow
- Simple form flow
- Form submission
- File uploads
- Profile calculation

**Manual Testing** (after completion):
- Full form flows
- Edge cases
- Error handling
- Analytics

---

## Rollback Plan

If issues arise:
1. Keep feature branch
2. Document issues
3. Fix incrementally
4. Test after each fix
5. Merge when stable

---

## Summary

**Implementation Order**:
1. **Phase 1**: Types and Domain Layer (foundation)
2. **Phase 2**: Service Layer (API client)
3. **Phase 3**: Card Form Hooks (state management)
4. **Phase 4**: Card Form Components (presentation)
5. **Phase 5**: Shared UI (field renderer)
6. **Phase 6**: Simple Form (simple form implementation)
7. **Phase 7**: Cleanup (remove legacy code)

**Key Principles**:
- Build foundation first (types, domain)
- Implement incrementally
- Test after each step
- Verify before moving to next phase

---

## Next Steps

1. Start with Phase 1, Step 1.1
2. Complete each step before moving to next
3. Test after each step
4. Document any issues
5. Proceed to `13-testing.md` for testing guidelines
