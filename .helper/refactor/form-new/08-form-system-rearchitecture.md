# Form System — Code-First Re-Architecture

> **Purpose**: Target architecture for a maintainable, readable form system. Types and contracts first; implementation follows this spec.  
> **Status**: Specification (implementation guide)  
> **Replaces**: Use this doc as the source of truth for structure; `08-form-system.md` remains as feature/flow reference.

---

## No Backwards Compatibility

**We do not maintain backwards compatibility.** This is a clean re-architecture:

- All form-type imports must use `@/lib/forms/types`. Do not re-export form types from `@/lib/api` for legacy callers.
- Replace existing form code in place; no feature flags or gradual rollout for the form module.
- API client (`forms.ts`) imports types from `@/lib/forms/types` and stops defining its own FormField/Condition/etc.; any consumer that imported form types from `@/lib/api` must be updated to `@/lib/forms/types`.
- Backend DTOs stay as-is; frontend types are the source of truth and must align with the API contract. No runtime compatibility layer for “old” vs “new” types.

---

## 1. Design Principles

- **Single source of truth**: Form domain types live in one place; no duplicate `CardMedia` / `FormField` across api vs flowchart.
- **Unidirectional dependencies**: `types` ← `domain` ← `services` ← `state/hooks` ← `UI`. No layer imports from a higher layer.
- **Pure domain layer**: Conditional logic, serialization, and profile estimation are pure functions; no React, no API.
- **Thin containers**: No god components. Card form splits into: schema derivation, session (API), navigation state, profile calculation, and presentational views.
- **Shared where it pays**: Field validation, initial form data, and (where possible) field rendering contract are shared between Simple and Card forms.
- **State and effects discipline**: Minimize `useState` and `useEffect`; prefer derived state with `useMemo`, a single `useReducer` for the form “machine,” and reserve `useEffect` only for real side effects (see §2).

---

## 2. State and Effects Discipline (useState / useEffect)

The current card form overuses `useState` and `useEffect`, which leads to scattered state, fragile dependency arrays, and effects that “sync” state that should be derived. This section defines the rules so the re-architecture avoids that.

### 2.1 Golden Rules

1. **Derived state: `useMemo` only — never `useEffect` + `setState`.**  
   If a value can be computed from existing state/props (e.g. `visibleFields` from `schema` + `formData`, or `currentField` from `visibleFields[currentVisibleIndex]`), compute it in render with `useMemo`. Do not “sync” it in a `useEffect` that calls `setState`; that causes extra renders and dependency hell.

2. **One place for “machine” state: prefer `useReducer`.**  
   The card form has a small state machine: index, direction, success, profileResult, error, submitting. Keep that in a single reducer so one user action (e.g. GO_NEXT, SUBMIT_SUCCESS) updates all related state in one transition. Avoid 10+ independent `useState` slices that can get out of sync.

3. **`useEffect` is for side effects only.**  
   Use effects only for: fetching (session init), persisting (sessionStorage, API progress), analytics (track card time), and imperative DOM (e.g. focus). Do not use effects to “fix” current index when visibility changes; handle that in the reducer or in a pure function that computes the next index.

4. **No dependency-array hacks.**  
   If you need to omit deps and add an `eslint-disable`, the design is wrong. Correct designs use `useMemo` for derived values and `useReducer` (or explicit event handlers) for transitions, so effects have small, honest dependency arrays.

### 2.2 Current Anti-Patterns (What to Remove)

| Anti-pattern | Where it appears | Target approach |
|--------------|------------------|------------------|
| `useEffect(() => setFormData(initFormData()), [initFormData])` | Sync “initial” form data to schema | Initialize form data once when schema is ready (e.g. in reducer init or a single `useState(initFormData(schema))` keyed by schema identity), not an effect. |
| `useEffect` that calls `setCurrentIndex` when “current field becomes hidden” | React to formData/visibility | In reducer: when formData changes, or in a `goNext`/tick, compute “effective” index (e.g. clamp to next visible) in one place; no separate effect. |
| Many `useState` (formData, currentIndex, direction, sessionToken, sessionRestored, isSubmitting, formError, success, profileResult, uploadingFiles, cardStartTimes, formViewed, uploadedFiles) | One component owns 13+ slices | Collapse UI-machine state into one `useReducer`; keep formData and uploadedFiles as separate state only if they are large and updated frequently (or put in reducer if acceptable). |
| `useEffect` for “track time per card” with refs and omitted deps | Analytics | One effect: “when currentIndex (or currentCardId) changes, send previous card time; then record new start time.” Use a ref for “previous card id” and “start time”; dependency array is `[currentIndex, sessionToken, slug, ...]`. No need to omit `visibleFields` if “current card id” is derived in the effect from a stable schema/visibleFields. |
| `useEffect` for focus on current card | DOM | Single effect: `useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [currentIndex]);` — acceptable; dependency is correct. |
| `formViewed` state + effect that sets it once | Redundant | Either derive “has viewed” from session creation or remove; avoid one-off boolean state + effect. |

### 2.3 Allowed Effects (Explicit List)

Card form hooks may use `useEffect` only for:

1. **Session init (once per mount)**  
   Run async: read sessionStorage → getFormSession or createFormSession → then call a single callback (e.g. `onSessionReady({ sessionToken, currentCardIndex, partialData })`) so the parent or reducer updates token, index, and formData in one place. No multiple `setState` calls from inside the effect; one “settlement” callback.

2. **Persist progress (on navigation/submit)**  
   Called from event handlers (e.g. after `goNext` or in submit flow), not from an effect. So no “effect that watches currentIndex and formData and calls updateFormSession” — call `persistProgress` from the same place that updates `currentIndex`.

3. **Analytics: time per card**  
   One effect. **Depend on `currentVisibleIndex`** (derived), not `currentIndex`, so the dependency array is honest. Derive `currentCardId` from `visibleFields[currentVisibleIndex]?.id`. Use refs for previous card id and start time; on run: if previous exists, send trackCardTime; then set refs to current card and Date.now(). Cleanup: on unmount, send time for current card. Example: deps `[currentVisibleIndex, sessionToken, slug, analyticsEnabled]` (and pass `visibleFields` or `currentCardId` from outside so the effect can read it without putting it in deps if it’s derived from the same inputs).

4. **Focus management**  
   `useEffect(() => ref.current?.focus({ preventScroll: true }), [currentIndex]);` — fine.

5. **No other effects**  
   No “when visible fields change, adjust index”; no “when formData changes, re-init form data”; no “set formViewed to true.” Those are either derived (useMemo) or one-time/reducer updates.

### 2.4 Recommended State Shape (Card Form)

- **Reducer state** (single `useReducer` for the “machine”):  
  `{ currentIndex: number; direction: number; status: 'idle' | 'submitting' | 'success'; formError: string | null; profileResult: ProfileResult | null }`  
  Actions: `INIT_FROM_SESSION`, `GO_NEXT`, `GO_BACK`, `SET_INDEX`, `SUBMIT_START`, `SUBMIT_SUCCESS`, `SUBMIT_ERROR`, `SET_PROFILE_RESULT`, `SET_ERROR`.

- **formData**: Prefer putting it in the reducer for atomic updates and a single source of truth. Use action `UPDATE_FIELD` / `UPDATE_FIELDS` (e.g. for session restore). If you keep it as `useState` (e.g. for very large forms or to avoid reducer size), document why and ensure handlers (goNext, submit) read the latest formData; do not rely on effects to sync it.

- **uploadedFiles / uploadingFiles**: Small; can stay `useState` or live in reducer. Session token and sessionRestored: set once by session init; either reducer state (`INIT_FROM_SESSION`) or returned from `useCardFormSession` (see §7.3).

- **Always derived (useMemo), never state:**  
  `schema`, `visibleFields`, `currentVisibleIndex`, `currentField`, `isFirst`, `isLast`, `totalCards`, `direction` (can also be derived from “previous index vs current” if you need it only for animation).

**Performance**: `visibleFields = useMemo(() => getVisibleFields(schema, formData), [schema, formData])` is fine; formData changes frequently but the computation is cheap. If profiling shows cost with very large schemas, consider a stable ref + shallow comparison only for formData keys that affect visibility (conditional fieldIds). No need to debounce formData for getVisibleFields unless measured. Putting formData in the reducer does not add meaningful overhead.

---

## 2.5 Glossary

- **Machine state**: State that represents the form lifecycle (idle, submitting, success, error) and navigation (currentIndex, direction). Updated in one place (reducer).
- **Derived state**: Values computed from other state/props (e.g. `visibleFields` from `schema` + `formData`). Always use `useMemo`; never `useEffect` + `setState`.
- **Orchestrator hook**: A hook that composes smaller hooks (e.g. `useCardFormState` composes schema, session, data, navigation, profile).
- **Domain layer**: Pure functions in `lib/forms/*.ts` with no React or API dependencies.
- **Service layer**: API client (e.g. `formsApi`); the only place that performs form-related HTTP calls.

**Hook composition:**

```
useCardFormState (orchestrator)
├── useCardFormSchema (derives schema, successCard)
├── useCardFormData (formData, uploadedFiles, handlers)
├── useCardFormSession (session state, persistProgress, completeSession)
├── useCardFormNavigation (visibleFields, currentField, goNext, goBack)
└── useCardFormProfile (computeProfile, profileResult)
```

---

## 2.6 Common Pitfalls

```ts
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

```ts
// ❌ BAD: Multiple setState in session effect
useEffect(() => {
  initSession().then(({ token, index, data }) => {
    setSessionToken(token);
    setCurrentIndex(index);
    setFormData(data);
  });
}, []);

// ✅ GOOD: One settlement (callback or setSession)
useEffect(() => {
  initSession().then((session) => {
    onSessionReady(session);  // or setSession(session)
  });
}, []);
```

---

## 3. Dependency Graph (Enforced)

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

- **Types**: Canonical `FormField`, `Condition`, `ConditionGroup`, `CardMedia`, `ProfileEstimation`, etc.
- **Domain**: `conditional-logic.ts`, `flowchart-serialization.ts`, `profile-estimation.ts`, `form-validation.ts`. They import only from types.
- **Services**: API client (existing `formsApi`). Hooks may call `formsApi` and domain functions.
- **UI**: Uses only hooks + API; no direct domain calls except through hooks or small adapters.

---

## 4. Type Layer — Single Source of Truth

**Rule**: All form-related types used across the app (API, flowchart, conditional logic, profile estimation) are defined once in `frontend/lib/forms/types.ts`. The API layer imports from `@/lib/forms/types` and does not define or re-export form types. There is no backwards compatibility: every file that needs form types imports from `@/lib/forms/types`.

### 4.1 Target: `frontend/lib/forms/types.ts`

This file defines (or re-exports) every form type. No duplication.

```ts
// frontend/lib/forms/types.ts

/** Shared media for card form fields */
export interface CardMedia {
  type: "image" | "video" | "gif" | "icon";
  url?: string;
  altText?: string;
  position: "above" | "below" | "background" | "left" | "right";
  videoType?: "youtube" | "vimeo" | "upload";
  videoId?: string;
}

export type ConditionOperator =
  | "equals" | "not_equals" | "contains" | "not_contains"
  | "greater_than" | "less_than" | "is_empty" | "is_not_empty"
  | "starts_with" | "ends_with";

export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}

export interface ConditionalLogic {
  showIf?: ConditionGroup;
  hideIf?: ConditionGroup;
  jumpTo?: { conditions: ConditionGroup; targetFieldId: string }[];
  dynamicLabel?: { conditions: ConditionGroup; label: string }[];
}

export type FormFieldType =
  | "text" | "email" | "phone" | "textarea" | "select"
  | "checkbox" | "radio" | "file" | "image" | "statement";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  media?: CardMedia;
  conditionalLogic?: ConditionalLogic;
  enablePiping?: boolean;
}

// Profile estimation types (subset needed by domain + UI)
export interface ScoringRule { fieldId: string; operator: string; value: unknown; weight?: number; }
export interface FieldScoring { fieldId: string; scoring: { answer: unknown; points: number; dimension?: string }[]; }
export interface AIProfileConfig { enabled: boolean; model?: string; prompt?: string; analysisType?: string; outputFormat?: string; }
export interface ProfileEstimation {
  enabled: boolean;
  type: "percentage" | "category" | "multi_dimension" | "recommendation";
  aiConfig?: AIProfileConfig;
  percentageConfig?: { title: string; description: string; fieldScoring?: FieldScoring[]; ranges: { min: number; max: number; label: string; description: string; image?: string }[] };
  categoryConfig?: { title: string; categories: { id: string; name: string; description: string; image?: string; matchingLogic: ScoringRule[] }[] };
  dimensionConfig?: { title: string; dimensions: { id: string; name: string; fields: FieldScoring[] }[] };
  recommendationConfig?: { title: string; recommendations: { id: string; name: string; description: string; image?: string; matchingCriteria: ScoringRule[] }[] };
}
```

- **Migration (no backward compat)**: Create `lib/forms/types.ts` with all types. Update `lib/api/endpoints/forms.ts` to `import type { FormField, ... } from '@/lib/forms/types'` and remove every form type definition from the API layer. Find all `from '@/lib/api'` or `from "@/lib/api"` usages that use form types and change them to `from '@/lib/forms/types'`. Run typecheck; fix until clean. Do not add re-exports in the API for form types.

---

## 5. Domain Layer — Pure Functions

All under `frontend/lib/forms/`. No React, no `fetch`. Import only from `./types` (or `@/lib/forms/types`).

### 5.1 File: `frontend/lib/forms/conditional-logic.ts`

**Imports**: `Condition`, `ConditionGroup`, `FormField` from `./types`.

**Exports** (signatures only; behavior unchanged):

```ts
export function evaluateCondition(condition: Condition, formData: Record<string, unknown>): boolean;
export function evaluateConditionGroup(group: ConditionGroup, formData: Record<string, unknown>): boolean;
export function shouldShowField(field: FormField, formData: Record<string, unknown>): boolean;
export function getJumpTarget(field: FormField, formData: Record<string, unknown>): string | null;
export function getDynamicLabel(field: FormField, formData: Record<string, unknown>): string;
export function applyPiping(text: string, formData: Record<string, unknown>, fields: FormField[]): string;
export function getNextCardIndex(currentIndex: number, visibleFields: FormField[], formData: Record<string, unknown>): number;
export function getVisibleFields(fields: FormField[], formData: Record<string, unknown>): FormField[];
```

### 5.2 File: `frontend/lib/forms/flowchart-serialization.ts`

**Imports**: `FormField` from `./types`; flowchart node/edge types from `./flowchart-types`. `flowchart-types` should import only `FormField` (and optionally `ConditionGroup`) from `./types`, not from `@/lib/api`.

**Exports**:

```ts
export function flowchartToSchema(graph: FlowchartGraph): FormField[];
export function schemaToFlowchart(schema: FormField[], viewport?: { x: number; y: number; zoom: number }): FlowchartGraph;
export function mergeFlowchartWithSchema(graph: FlowchartGraph, schema: FormField[]): FlowchartGraph;
```

### 5.3 File: `frontend/lib/forms/flowchart-types.ts`

**Imports**: `FormField`, `ConditionGroup` from `./types`; `Node`, `Edge` from `@xyflow/react`. No import from `@/lib/api`.

**Exports**: `FlowchartNodeType`, `CardMedia` (re-export from types or drop if unified in types), `FlowchartNodeData`, `FlowchartEdgeData`, `FlowchartNode`, `FlowchartEdge`, `FlowchartViewport`, `FlowchartGraph`, `START_NODE_ID`, `END_NODE_ID`.

### 5.4 File: `frontend/lib/forms/profile-estimation.ts`

**Imports**: `ProfileEstimation`, `FieldScoring`, `FormField`, etc. from `./types`; `evaluateCondition` from `./conditional-logic`.

**Exports**: Same public functions as today (e.g. `calculatePercentageScore`, `matchCategory`, `calculateProfileEstimation`, etc.). Signature of main entry:

```ts
export function calculateProfileEstimation(
  config: ProfileEstimation,
  answers: Record<string, unknown>,
  fields: FormField[]
): { type: string; result: Record<string, unknown> } | null;
```

### 5.5 New File: `frontend/lib/forms/form-validation.ts`

Shared validation for both Simple and Card forms.

**Exports**:

```ts
export function getInitialFormData(schema: FormField[]): Record<string, unknown>;
export function validateField(field: FormField, value: unknown): boolean;
export function validateForm(schema: FormField[], formData: Record<string, unknown>): boolean;
```

- `getInitialFormData`: checkbox → `[]`, else `""`.
- `validateField`: required check + type-specific rules.
- `validateForm`: all required fields present and valid.

---

## 6. Service Layer — API Client

**Existing**: `frontend/lib/api/endpoints/forms.ts` and `api.forms` (FormsApi). Keep as is; it must import all form types from `@/lib/forms/types` and must not define or re-export form types (no backwards compatibility).

**Contract**: FormsApi remains the only place that talks to the backend for forms (templates, session, submit, file upload, profile calculation, analytics). No direct `fetch` in form UI or hooks.

---

## 7. State / Hooks Layer — Card Form

Goal: Remove the 880-line god component. Split into:

1. **Schema derivation** (template → schema for runtime)
2. **Session** (create, restore, update, complete)
3. **Navigation state** (current index, direction, visible fields)
4. **Form data** (values, validation, file uploads)
5. **Profile result** (compute and hold result for result screen)
6. **Presentation** (layout, card transition, buttons)

### 7.1 Target Files

| File | Responsibility |
|------|----------------|
| `frontend/components/public/forms/card-form/useCardFormSchema.ts` | From `template` + `cardSettings.flowchartGraph` produce `schema: FormField[]` and optional `successCard`. Pure derivation, memoized. |
| `frontend/components/public/forms/card-form/useCardFormSession.ts` | Create/restore/update/complete session; expose `sessionToken`, `sessionRestored`, `persistProgress(sessionToken, currentIndex, partialData)`, `completeSession()`. |
| `frontend/components/public/forms/card-form/useCardFormNavigation.ts` | Given `schema`, `formData`, and `currentIndex`, expose `visibleFields`, `currentField`, `currentVisibleIndex`, `isFirst`, `isLast`, `goNext(formData)`, `goBack()`, `setCurrentIndex`. Uses `getVisibleFields`, `getNextCardIndex` from domain. |
| `frontend/components/public/forms/card-form/useCardFormData.ts` | `formData`, `setFormData`, `handleInputChange`, `handleCheckboxChange`, `uploadedFiles`, `uploadingFiles`, `handleFileUpload`. Initializes from `getInitialFormData(schema)`. |
| `frontend/components/public/forms/card-form/useCardFormProfile.ts` | Given `template.profileEstimation`, `formData`, `schema`, and `formsApi`/`slug`: on submit path, compute rule-based or call AI; return `profileResult` and `computeProfile()` function. |
| `frontend/components/public/forms/card-form/useCardFormState.ts` | Composes the above hooks; exposes a single state interface: schema, session, navigation, form data, validation, profile, and actions (goNext, goBack, submit, etc.). Handles analytics (track card time) inside this or a small dedicated hook. |
| `frontend/components/public/forms/card-form/CardFormView.tsx` | Presentational: receives state and callbacks from `useCardFormState`; renders progress, current card (AnimatePresence), buttons, success/result screens. No direct API or domain calls. |
| `frontend/components/public/forms/card-form/card-form-container.tsx` | Thin wrapper: `slug`, `template`, `formsApi`, `saveProgress`, `progressStyle`. Uses `useCardFormState(slug, template, formsApi, options)` and renders `<CardFormView ... />`. |

### 7.2 State and effects in hooks (mandatory)

- **useCardFormSchema**: Only `useMemo`. No state, no effects.
- **useCardFormData**: `useState` for `formData`, `uploadedFiles`, `uploadingFiles`. Initial value: `getInitialFormData(schema)` — use lazy init or a key so when schema identity changes you reset once; no `useEffect` to “sync” formData from schema.
- **useCardFormNavigation**: Only `useMemo` for `visibleFields`, `currentVisibleIndex`, `currentField`, `isFirst`, `isLast`. Receives `currentIndex` and `setCurrentIndex` (or dispatch). `goNext` / `goBack` call domain (`getNextCardIndex`, etc.) and then dispatch or set index; no effects.
- **useCardFormSession**: One `useEffect` for session init; inside it call a single `onSessionReady(...)` callback so the orchestrator (or reducer) applies token + index + partialData in one transition. Expose `persistProgress` and `completeSession` as callbacks called from event handlers, not from effects.
- **useCardFormState (orchestrator)**: Holds the **reducer** for machine state (currentIndex, direction, status, formError, profileResult). Session init effect’s callback dispatches `INIT_FROM_SESSION`. `goNext` / `goBack` / submit dispatch actions; reducer may call `persistProgress` via a thunk or the handler calls it after dispatch. At most one small effect for analytics (time per card) and one for focus. No effect that “when visible fields change, set current index”; handle “current field hidden” inside navigation logic or reducer (e.g. when computing next index).

### 7.3 Hook Contracts (Code-First)

**useCardFormSchema.ts**

```ts
export function useCardFormSchema(template: FormTemplate): {
  schema: FormField[];
  successCard: FlowchartNode | null;
} {
  const flowchartGraph = useMemo(() => (template.cardSettings as { flowchartGraph?: FlowchartGraph })?.flowchartGraph, [template.cardSettings]);
  const schema = useMemo(() => flowchartGraph ? flowchartToSchema(flowchartGraph) : (template.schema ?? []) as FormField[], [flowchartGraph, template.schema]);
  const successCard = useMemo(() => flowchartGraph?.nodes.find(n => n.type === "statement" && n.data?.isSuccessCard === true) ?? null, [flowchartGraph]);
  return { schema, successCard };
}
```

**useCardFormSession.ts**

Single `useEffect` for session init. Two valid patterns (choose one):

**Pattern A — Callback:** On completion, call one callback `onSessionReady({ sessionToken, currentCardIndex, partialData })` so the orchestrator/reducer applies all session state in one place. No multiple `setState` calls from inside the effect.

**Pattern B — Return session state (recommended):** The hook holds `session: { sessionToken, currentCardIndex, partialData } | null` and `sessionRestored: boolean` in local state. The effect runs async init and then `setSession(sessionData)`. The orchestrator (`useCardFormState`) reads `session` and, when it changes from null to a value, dispatches `INIT_FROM_SESSION` with that payload. This avoids callback prop drilling and keeps session ownership in one place.

```ts
// Pattern B signature:
export function useCardFormSession(
  slug: string,
  template: FormTemplate | null,
  options: { saveProgress: boolean; totalCards: number }
): {
  session: { sessionToken: string; currentCardIndex: number; partialData: Record<string, unknown> } | null;
  sessionRestored: boolean;
  sessionError: string | null;
  persistProgress: (currentIndex: number, partialData: Record<string, unknown>) => Promise<void>;
  completeSession: () => Promise<void>;
  clearStoredToken: () => void;
} {
  // One effect: create or restore session; setSession(result) or setSessionError. persistProgress/completeSession called from event handlers only.
}
```

**useCardFormNavigation.ts**

Only `useMemo` for derived values; no state, no effects. `goNext` / `goBack` call domain and then invoke `setCurrentIndex` (or dispatch); “current field became hidden” is handled by computing next index in one place (e.g. when dispatching GO_NEXT or in a clamp), not by a separate effect.

```ts
export function useCardFormNavigation(
  schema: FormField[],
  formData: Record<string, unknown>,
  currentIndex: number,
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
): {
  visibleFields: FormField[];
  currentField: FormField | undefined;
  currentVisibleIndex: number;
  isFirst: boolean;
  isLast: boolean;
  goNext: () => void;
  goBack: () => void;
} {
  const visibleFields = useMemo(() => getVisibleFields(schema, formData), [schema, formData]);
  const currentVisibleIndex = useMemo(() => clampToVisible(schema, visibleFields, currentIndex), [schema, visibleFields, currentIndex]);
  const currentField = visibleFields[currentVisibleIndex];
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleFields.length - 1;
  // goNext: getNextCardIndex(..., formData) → schema index → setCurrentIndex; goBack: previous visible → setCurrentIndex
  return { visibleFields, currentField, currentVisibleIndex, isFirst, isLast, goNext, goBack };
}
```

**clampToVisible** — specified behavior (forward bias): When the field at `currentIndex` is not in `visibleFields` (e.g. conditional logic hid it), return the visible index of the next visible field after `currentIndex`, or `0` if none. Clamping happens automatically in render via `useMemo` whenever `formData` or `schema` changes; no `useEffect`. Implement in domain (e.g. `lib/forms/navigation.ts`) or next to the hook:

```ts
function clampToVisible(
  schema: FormField[],
  visibleFields: FormField[],
  currentIndex: number
): number {
  const currentField = schema[currentIndex];
  if (currentField && visibleFields.some(f => f.id === currentField.id)) {
    return visibleFields.findIndex(f => f.id === currentField.id);
  }
  const nextVisible = visibleFields.findIndex(f => schema.findIndex(s => s.id === f.id) >= currentIndex);
  return nextVisible >= 0 ? nextVisible : 0;
}
```

**useCardFormState.ts** (orchestrator)

- Calls `useCardFormSchema(template)`.
- Calls `useCardFormData(schema)` for formData and handlers.
- Calls `useCardFormSession(slug, template, { saveProgress, totalCards: visibleFields.length })` with `schema`/`formData` for init; syncs restored index and partialData into formData/currentIndex.
- Calls `useCardFormNavigation(schema, formData, currentIndex, setCurrentIndex)`.
- Uses `validateField`/`validateForm` from `form-validation` for goNext/submit.
- Calls `useCardFormProfile` when on submit path; exposes `profileResult` and submit flow that saves, computes profile (or AI), then submits and completes session.
- **Analytics**: One effect; depend on `currentVisibleIndex` (and sessionToken, slug, analyticsEnabled). Derive `currentCardId = visibleFields[currentVisibleIndex]?.id` inside the effect or pass it in. Refs: `prevCardIdRef`, `startTimeRef`. On run: if prev exists, call `trackCardTime(prevCardId, duration)`; then set refs to current. Cleanup: send time for current card on unmount. No eslint-disable.

```ts
useEffect(() => {
  if (!sessionToken || !analyticsEnabled) return;
  const currentCardId = visibleFields[currentVisibleIndex]?.id;
  if (!currentCardId) return;
  if (prevCardIdRef.current != null && startTimeRef.current != null) {
    trackCardTime(sessionToken, prevCardIdRef.current, Date.now() - startTimeRef.current);
  }
  prevCardIdRef.current = currentCardId;
  startTimeRef.current = Date.now();
  return () => {
    if (prevCardIdRef.current != null && startTimeRef.current != null)
      trackCardTime(sessionToken, prevCardIdRef.current, Date.now() - startTimeRef.current);
  };
}, [currentVisibleIndex, sessionToken, analyticsEnabled, visibleFields]);
```

- Returns one object: `{ schema, successCard, formData, currentField, visibleFields, totalCards, currentVisibleIndex, isFirst, isLast, sessionRestored, isSubmitting, formError, success, profileResult, handleInputChange, handleCheckboxChange, handleFileUpload, goNext, goBack, handleSubmit, handleKeyDown }` for `CardFormView`.

---

### 7.4 Error Handling

- **Session init failure**: `useCardFormSession` sets `sessionError`; orchestrator can dispatch `SESSION_ERROR` and set `formError`, `status: 'idle'`. Form remains usable (e.g. without save/resume).
- **persistProgress failure**: Non-blocking; optionally dispatch `PERSIST_ERROR` and set a transient `formError` (“Failed to save progress. Please try again.”). User can retry or continue.
- **Profile calculation failure** (AI timeout, invalid config): Fall back to rule-based if AI was enabled; otherwise set `formError` and `profileResult: null`. Dispatch `PROFILE_ERROR` with message.
- **File upload failure**: Handle in `handleFileUpload`; set field-level or global formError; do not block submit.

Reducer actions to support: `SESSION_ERROR`, `PERSIST_ERROR`, `PROFILE_ERROR`, `SET_ERROR`. Recoverability: session errors do not block form interaction; persist errors are transient; profile errors show message and optional retry.

---

## 8. State / Hooks — Simple Form

- **useSimpleFormState(schema, formsApi, slug)**: formData (from `getInitialFormData`), uploadedFiles, uploadingFiles, validateForm, handleSubmit, handleInputChange, handleCheckboxChange, handleFileUpload. No session or navigation.
- **SimpleFormView**: Receives template + form state; renders single-page form (list of fields) and submit button. Can use a shared **FieldRenderer** that supports both “inline” (simple) and “card” (with media) modes.

---

## 9. Shared UI — Field Rendering

**Chosen: Option A** — One **FieldRenderer** component with `mode: 'simple' | 'card'` to avoid drift.

- **Props**: `field`, `value`, `onChange`, `mode`, optional `formData`, `fields` (for piping/dynamic label), `uploading`, `uploadedFile`, `onFileUpload`, `disabled`.
- **Card mode**: Uses dynamic label and piping; renders media; same behavior as current CardFieldRenderer.
- **Simple mode**: Renders label and control only; no media.

**Migration**: (1) Add `FieldRenderer` with both modes, implemented by delegating to existing Card/Simple internals or new shared primitives. (2) CardFormView uses `FieldRenderer` with `mode="card"`. (3) SimpleFormView / simple form page uses `FieldRenderer` with `mode="simple"`. (4) Remove legacy CardFieldRenderer and inline simple field renderer once both paths use FieldRenderer. (5) Test both modes.

---

## 10. File Tree (Target)

```
frontend/
├── lib/
│   ├── forms/
│   │   ├── types.ts                    # Canonical form types (new or consolidated)
│   │   ├── conditional-logic.ts        # Import from ./types
│   │   ├── flowchart-types.ts          # Import from ./types
│   │   ├── flowchart-serialization.ts # Import from ./types + flowchart-types
│   │   ├── profile-estimation.ts       # Import from ./types + conditional-logic
│   │   ├── form-validation.ts          # New: getInitialFormData, validateField, validateForm
│   │   └── form-utils.ts               # Keep if needed; no duplicate types
│   └── api/
│       └── endpoints/forms.ts          # Import types from @/lib/forms/types only; no form type definitions
├── components/
│   ├── public/forms/
│   │   ├── card-form/
│   │   │   ├── index.tsx               # Re-export CardFormContainer
│   │   │   ├── card-form-container.tsx # Thin: useCardFormState + CardFormView
│   │   │   ├── CardFormView.tsx        # Presentational only
│   │   │   ├── useCardFormSchema.ts
│   │   │   ├── useCardFormSession.ts
│   │   │   ├── useCardFormNavigation.ts
│   │   │   ├── useCardFormData.ts
│   │   │   ├── useCardFormProfile.ts
│   │   │   ├── useCardFormState.ts     # Composes all card form hooks
│   │   │   ├── card-field-renderer.tsx
│   │   │   ├── progress-indicator.tsx
│   │   │   └── results/                # Unchanged
│   │   └── simple-form/
│   │       └── SimpleFormView.tsx      # Optional: extract from page for reuse
│   └── admin/forms/
│       ├── card-form-builder/          # Unchanged structure; import from @/lib/forms
│       ├── form-field-editor.tsx
│       └── ...
└── app/
    ├── (main)/forms/
    │   ├── [slug]/page.tsx             # Fetch template; if CARD → redirect or embed card; else SimpleFormView
    │   └── card/[slug]/page.tsx        # Fetch template; CardFormContainer
```

---

## 11. Backend

No structural change required. Keep:

- `backend-api/src/main-app/modules/forms/forms.controller.ts`
- `backend-api/src/main-app/modules/forms/forms.service.ts`
- `backend-api/src/main-app/modules/forms/services/form-analytics.service.ts`
- `backend-api/src/main-app/modules/forms/services/profile-estimation-ai.service.ts`
- DTOs and Prisma schema as-is.

Ensure DTOs align with `frontend/lib/forms/types` (or current api types) so that formType, schema, cardSettings, profileEstimation, and session payloads stay consistent.

---

## 12. Implementation Order

1. **Types**: Add `frontend/lib/forms/types.ts` with all form types. Update `lib/api/endpoints/forms.ts` to import from `@/lib/forms/types` and remove every form type definition. Update all consumers to import form types from `@/lib/forms/types` (no backwards compatibility; no re-exports). Update `flowchart-types.ts`, `conditional-logic.ts`, `profile-estimation.ts` to import from `./types`.
2. **Form validation**: Add `frontend/lib/forms/form-validation.ts` with `getInitialFormData`, `validateField`, `validateForm`. Use in both simple and card form.
3. **Card form hooks**: Implement `useCardFormSchema`, `useCardFormSession`, `useCardFormData`, `useCardFormNavigation`, `useCardFormProfile`, then `useCardFormState` that composes them. Follow §2 and §7.2: useReducer for machine state, useMemo for all derived values, no useEffect for “syncing” state; only the allowed effects (session init, analytics time-per-card, focus).
4. **CardFormView**: Extract presentational JSX from current `card-form-container.tsx` into `CardFormView.tsx`; container only composes `useCardFormState` and passes props to `CardFormView`.
5. **Analytics**: One effect in `useCardFormState` or `useCardFormAnalytics` with honest deps; refs for previous card id and start time; cleanup to send time on unmount. No eslint-disable on dependency array.
6. **Simple form**: Refactor `(main)/forms/[slug]/page.tsx` to use `getInitialFormData` and `validateForm` from `form-validation`; optionally extract `SimpleFormView` for clarity.
7. **Cleanup**: Remove any duplicate types; ensure no circular imports; run lint and typecheck.

---

## 13. Testing Recommendations

- **Domain**: Unit tests for `evaluateCondition`, `evaluateConditionGroup`, `shouldShowField`, `getJumpTarget`, `getVisibleFields`, `getNextCardIndex`, `clampToVisible`, `flowchartToSchema`, `schemaToFlowchart`, `mergeFlowchartWithSchema`, `calculateProfileEstimation`, `getInitialFormData`, `validateField`, `validateForm`.
- **Hooks**: Test `useCardFormSchema` with mock template (with/without flowchartGraph). Test `useCardFormNavigation` with mock schema and formData: e.g. when `formData` changes so the current field becomes hidden, `currentVisibleIndex` should clamp (e.g. to 0) without an effect — assert on `result.current.currentVisibleIndex` after `rerender({ formData: { ... }, currentIndex })`. Test `useCardFormState` with mocked formsApi (session create/update/complete, submit) and assert reducer state after actions.
- **UI**: React Testing Library for CardFormView (buttons, navigation, submit) and simple form submit flow.

---

## 14. Summary

| Before | After |
|--------|--------|
| Form types in api + flowchart-types | Single `lib/forms/types.ts` |
| CardFormContainer ~880 lines | useCardFormState + CardFormView + 5 small hooks |
| 13+ useState + many useEffect (sync/visibility) | useReducer for machine; useMemo for derived; effects only for session, analytics, focus (§2) |
| Validation/initial data ad hoc | Shared `form-validation.ts` |
| Domain imports from @/lib/api | Domain imports only from ./types |
| Simple form logic in page | Shared validation; optional SimpleFormView |

This re-architecture yields a maintainable, readable form system with clear boundaries, no circular dependencies, and disciplined state/effects (no haphazard useState/useEffect), and keeps the codebase ready for future form features (e.g. multi-step simple forms) without touching the card form core.
