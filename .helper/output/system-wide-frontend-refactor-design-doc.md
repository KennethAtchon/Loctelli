# System-Wide Frontend Refactor Design Doc

## Executive Summary
This document proposes a system-wide frontend refactor that standardizes architecture, state ownership, data flow, and component boundaries across the entire React app. The refactor aligns with existing patterns in the codebase (Next.js App Router, TanStack Query, shadcn/ui, Tailwind), eliminates nested form ownership conflicts, and establishes clear, testable modules. The outcome is a maintainable, scalable frontend that reduces regressions, improves performance, and supports long-term feature velocity.

## Objectives
- Establish a single, consistent ownership model for state (form, data, UI).
- Minimize re-renders and remounts by stabilizing keys, references, and memoization.
- Decompose monolithic components into predictable domains and layers.
- Enforce uniform folder structures, naming conventions, and component patterns.
- Improve testability by isolating domain logic from UI.

## Non-Goals
- Rewriting the backend.
- Changing product behavior, layout, or UX flows.
- Introducing a new UI system or component library.

## Current System Snapshot (From Existing Code Patterns)
- **Framework**: Next.js (React) with App Router.
- **Routing**: Next.js file-based routing (`app/`).
- **Data**: TanStack Query, REST API client.
- **UI**: shadcn/ui + Tailwind.
- **Forms**: react-hook-form (RHF) extensively in admin flows.
- **State**: Mostly local state + RHF + small context usage.

## Principles
- **Single Source of Truth**: Avoid dual ownership of the same data.
- **RHF Ownership**: One RHF instance per form surface; children use `useFormContext`.
- **Explicit Data Boundaries**: Domain logic in `lib`, UI in `components`.
- **Minimal Rehydration**: Use `reset()` only on true external updates.
- **Stable Keys**: Use persisted IDs, not `Date.now()` in render paths.
- **Predictable Composition**: Parents orchestrate, children render.

## Proposed Architecture

### 1) Directory Structure (Aligned With Current Repo)
```
frontend/
  app/                           # Next.js App Router routes
  components/
    ui/                           # shadcn components (unchanged)
    admin/
      forms/
        form-sections/            # high-level sections
        profile-estimation/       # feature module
  hooks/                          # shared hooks
  lib/
    api/                          # API client + query helpers
    forms/                        # domain types and utilities
    utils/                        # shared helpers
  docs/                           # frontend docs
```

### 2) Layering Model
- **Route Layer**: Orchestrates data fetching and page layout.
- **Feature Layer**: Manages a specific domain slice (e.g., Profile Estimation).
- **UI Layer**: Stateless components and UI primitives.
- **Domain Layer** (`lib/`): Types, validation, transforms, and shared logic.

## State Ownership Model

### Global Data
Use TanStack Query with:
- Typed query keys.
- Normalized transforms at the edge (`select`).
- Cache invalidation on mutations only.

### Form State
**Single RHF instance per form surface**  
All form sections and nested components consume a shared RHF context. This avoids value echo loops and prevents focus loss caused by `reset()` on re-mounting arrays.

**Rules**
- Parent creates the form with `useForm` and wraps children with `FormProvider`; children must not create their own form (no nested `useForm`).
- Children consume via `useFormContext` only—no local form state or per-keystroke sync to parent.
- `useFieldArray` lives at the closest stable parent layer.
- `reset()` only on true external changes (load, change template).

### Local UI State
Keep transient UI state (open/close, tabs, toggles, drag state) local in the component. Do not synchronize ephemeral UI state to parent.

## Component Design Standards

### Component Types
- **Section Components**: Orchestrate a section of a form or page.
- **Input Components**: Stateless UI inputs wired to RHF.
- **Block Components**: Small composed structures that render inputs or displays.

### Naming Conventions
- `FormXyzSection` for top-level form sections.
- `XyzConfig` for configuration blocks.
- `XyzInput` for leaf inputs.

### Memoization
- Use `memo` only when you can guarantee stable props.
- Prefer `useMemo` for derived values, not to block rendering.
- Never memoize with computed `Math.random()` or time-dependent IDs.

## Form Refactor Strategy

### Target: Profile Estimation (Pilot)
The current flow mixes local RHF with parent RHF updates, causing reset loops.
Refactor to:
- Use the parent form’s RHF context (`useFormContext`) instead of a nested form.
- Move `useFieldArray` to the nearest stable parent section.
- Ensure category IDs are persisted and never regenerated on render.

### General Form Migration Checklist
- Replace nested `useForm` with `useFormContext`.
- Replace per-keystroke `onChange` to parent with RHF direct binding.
- Keep `reset()` only in top-level route after external loads.
- Stabilize list keys using persistent IDs (avoid `Date.now()`).

## Data Flow Standards

### Queries
- Use TanStack Query hooks in route or feature layer.
- Convert API payloads at the boundary into UI-ready shapes.

### Mutations
- Mutate via typed helpers.
- Invalidate only relevant queries.

### Error Handling
- Use shared error handlers already implemented (`frontend/lib/api/react-query-error-handler.ts`).
- Keep UI error boundaries local to features when necessary.

## Performance and Rendering Policy
- Avoid `useMemo` as a cache; only use for computed values.
- Avoid console logs in render paths for production.
- Use `React.memo` only for leaf components with stable props.
- Keep list rows pure; avoid injecting unstable callbacks or arrays.

## Styling and UI Consistency
- Continue shadcn/ui components and Tailwind classes.
- Centralize variants and sizes in `components/ui`.
- Avoid new inline styling patterns; use existing className conventions.

## Testing Strategy

### Unit Tests
- Domain utilities in `lib/forms` and `lib/utils`.
- Transform and validation functions.

### Integration Tests
- Form sections with RHF context.
- Field array add/remove flows.

### E2E Tests
- Full form creation and edit flows.
- Profile Estimation setup within card forms.

## Migration Plan

### Phase 0: Prep
- Audit form sections and nested RHF usage.
- Catalog all field arrays and key sources.

### Phase 1: Pilot (Profile Estimation)
- Convert to parent-owned RHF.
- Validate focus stability and no reset loops.
- Ensure dirty tracking and submit still work.

### Phase 2: High-Risk Forms
- Card builder and complex config modules.
- Standardize section boundaries and ownership.

### Phase 3: Global Cleanup
- Remove stale utilities.
- Normalize patterns and docs.

## Rollback Plan
- Refactor each feature behind a branch and guard.
- Keep the old component version available until validated.

## Acceptance Criteria
- No focus loss in any input while typing.
- No redundant resets on internal updates.
- Consistent form state on save and reload.
- Stable list rendering with persistent keys.
- No regressions in routes or existing tests.

## Open Questions
- Should some flows remain local-first for draft behavior?
- Is a shared “Form Sync” utility desired for cross-feature consistency?

## References
- `frontend/components/admin/forms/`
- `frontend/lib/forms/`
- `frontend/docs/react-query-improvements.md`
