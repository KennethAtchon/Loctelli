# State and Effects Discipline

> **Purpose**: Detailed rules and patterns for managing state and effects in the form system.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`

---

## Overview

The current card form overuses `useState` and `useEffect`, which leads to:
- Scattered state across 13+ `useState` calls
- Fragile dependency arrays
- Effects that "sync" state that should be derived
- Extra renders and dependency hell

This document defines the rules to avoid these problems in the re-architecture.

---

## Golden Rules

### Rule 1: Derived State — `useMemo` Only, Never `useEffect` + `setState`

**Principle**: If a value can be computed from existing state/props, compute it in render with `useMemo`. Do not "sync" it in a `useEffect` that calls `setState`.

**Why**: 
- `useEffect` + `setState` causes extra renders
- Dependency arrays become fragile
- State can get out of sync

**Examples**:
- `visibleFields` from `schema` + `formData` → `useMemo`
- `currentField` from `visibleFields[currentVisibleIndex]` → `useMemo`
- `isFirst` / `isLast` from `currentVisibleIndex` → `useMemo`
- `direction` from previous index vs current → `useMemo` or derive in reducer

**Anti-Pattern**:
```ts
// ❌ BAD: Syncing state in useEffect
useEffect(() => {
  setVisibleFields(getVisibleFields(schema, formData));
}, [schema, formData]);
```

**Correct Pattern**:
```ts
// ✅ GOOD: Derived state with useMemo
const visibleFields = useMemo(
  () => getVisibleFields(schema, formData),
  [schema, formData]
);
```

---

### Rule 2: One Place for "Machine" State — Prefer `useReducer`

**Principle**: The card form has a small state machine: index, direction, success, profileResult, error, submitting. Keep that in a single reducer so one user action (e.g. GO_NEXT, SUBMIT_SUCCESS) updates all related state in one transition.

**Why**: 
- Avoids 10+ independent `useState` slices that can get out of sync
- Atomic state updates
- Clear state transitions
- Easier to debug

**Machine State Shape**:
```ts
type FormMachineState = {
  currentIndex: number;
  direction: number;
  status: 'idle' | 'submitting' | 'success';
  formError: string | null;
  profileResult: ProfileResult | null;
};
```

**Actions**:
- `INIT_FROM_SESSION` - Initialize from restored session
- `GO_NEXT` - Move to next card
- `GO_BACK` - Move to previous card
- `SET_INDEX` - Set current index directly
- `SUBMIT_START` - Begin submission
- `SUBMIT_SUCCESS` - Submission succeeded
- `SUBMIT_ERROR` - Submission failed
- `SET_PROFILE_RESULT` - Set profile calculation result
- `SET_ERROR` - Set form error
- `SESSION_ERROR` - Session initialization failed
- `PERSIST_ERROR` - Progress save failed
- `PROFILE_ERROR` - Profile calculation failed

**Anti-Pattern**:
```ts
// ❌ BAD: Multiple useState slices
const [currentIndex, setCurrentIndex] = useState(0);
const [direction, setDirection] = useState(1);
const [isSubmitting, setIsSubmitting] = useState(false);
const [formError, setFormError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
```

**Correct Pattern**:
```ts
// ✅ GOOD: Single reducer for machine state
const [state, dispatch] = useReducer(formReducer, initialState);

// One action updates multiple related fields atomically
dispatch({ type: 'GO_NEXT', payload: { nextIndex: 5, direction: 1 } });
```

---

### Rule 3: `useEffect` is for Side Effects Only

**Principle**: Use effects only for: fetching (session init), persisting (sessionStorage, API progress), analytics (track card time), and imperative DOM (e.g. focus).

**Do NOT use effects for**:
- "Fixing" current index when visibility changes → Handle in reducer or pure function
- Syncing formData from schema → Initialize once, not in effect
- Setting one-off boolean flags → Derive or set in reducer

**Allowed Effects**:

#### 1. Session Init (Once Per Mount)
```ts
useEffect(() => {
  let cancelled = false;
  
  async function initSession() {
    const session = await getFormSession(slug) || await createFormSession(slug);
    if (!cancelled) {
      // Single settlement callback - updates all session state in one place
      onSessionReady({
        sessionToken: session.token,
        currentCardIndex: session.currentIndex,
        partialData: session.data
      });
    }
  }
  
  initSession();
  return () => { cancelled = true; };
}, [slug]); // Only slug in deps
```

**Pattern**: One callback (`onSessionReady`) that updates token, index, and formData in one place. No multiple `setState` calls from inside the effect.

#### 2. Persist Progress (On Navigation/Submit)
```ts
// ✅ GOOD: Called from event handlers, not from effect
const handleGoNext = async () => {
  dispatch({ type: 'GO_NEXT', payload: { nextIndex } });
  await persistProgress(sessionToken, nextIndex, formData);
};

// ❌ BAD: Effect that watches currentIndex and formData
useEffect(() => {
  updateFormSession(sessionToken, currentIndex, formData);
}, [currentIndex, formData]); // Creates dependency hell
```

**Pattern**: Call `persistProgress` from the same place that updates `currentIndex`. Not from an effect.

#### 3. Analytics: Time Per Card
```ts
const prevCardIdRef = useRef<string | null>(null);
const startTimeRef = useRef<number | null>(null);

useEffect(() => {
  if (!sessionToken || !analyticsEnabled) return;
  
  const currentCardId = visibleFields[currentVisibleIndex]?.id;
  if (!currentCardId) return;
  
  // Send time for previous card
  if (prevCardIdRef.current != null && startTimeRef.current != null) {
    trackCardTime(
      sessionToken,
      prevCardIdRef.current,
      Date.now() - startTimeRef.current
    );
  }
  
  // Set up tracking for current card
  prevCardIdRef.current = currentCardId;
  startTimeRef.current = Date.now();
  
  // Cleanup: send time for current card on unmount
  return () => {
    if (prevCardIdRef.current != null && startTimeRef.current != null) {
      trackCardTime(
        sessionToken,
        prevCardIdRef.current,
        Date.now() - startTimeRef.current
      );
    }
  };
}, [currentVisibleIndex, sessionToken, analyticsEnabled, visibleFields]);
```

**Key Points**:
- Depend on `currentVisibleIndex` (derived), not `currentIndex`
- Use refs for previous card id and start time
- Cleanup sends time on unmount
- No `eslint-disable` needed

#### 4. Focus Management
```ts
const cardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  cardRef.current?.focus({ preventScroll: true });
}, [currentIndex]);
```

**Acceptable**: Simple DOM manipulation with correct dependency.

#### 5. No Other Effects

**Forbidden Patterns**:
- ❌ `useEffect(() => { setFormData(initFormData()); }, [initFormData])` → Initialize once when schema is ready
- ❌ `useEffect(() => { setCurrentIndex(...); }, [visibleFields])` → Handle in reducer or navigation logic
- ❌ `useEffect(() => { setFormViewed(true); }, [])` → Derive from session or remove

---

### Rule 4: No Dependency-Array Hacks

**Principle**: If you need to omit deps and add an `eslint-disable`, the design is wrong.

**Why**: 
- Missing dependencies cause stale closures
- Hidden bugs that are hard to track down
- Indicates architectural problem

**Correct Designs**:
- Use `useMemo` for derived values
- Use `useReducer` for transitions
- Use explicit event handlers
- Effects have small, honest dependency arrays

**Anti-Pattern**:
```ts
// ❌ BAD: Omitting dependencies
useEffect(() => {
  // Uses formData but not in deps
  doSomething(formData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex]);
```

**Correct Pattern**:
```ts
// ✅ GOOD: Include all dependencies or refactor
useEffect(() => {
  doSomething(formData);
}, [currentIndex, formData]);

// OR: Move to event handler if formData changes frequently
const handleSomething = () => {
  doSomething(formData);
};
```

---

## Current Anti-Patterns (What to Remove)

| Anti-pattern | Where it appears | Target approach |
|--------------|------------------|------------------|
| `useEffect(() => setFormData(initFormData()), [initFormData])` | Sync "initial" form data to schema | Initialize form data once when schema is ready (e.g. in reducer init or a single `useState(initFormData(schema))` keyed by schema identity), not an effect. |
| `useEffect` that calls `setCurrentIndex` when "current field becomes hidden" | React to formData/visibility | In reducer: when formData changes, or in a `goNext`/tick, compute "effective" index (e.g. clamp to next visible) in one place; no separate effect. |
| Many `useState` (formData, currentIndex, direction, sessionToken, sessionRestored, isSubmitting, formError, success, profileResult, uploadingFiles, cardStartTimes, formViewed, uploadedFiles) | One component owns 13+ slices | Collapse UI-machine state into one `useReducer`; keep formData and uploadedFiles as separate state only if they are large and updated frequently (or put in reducer if acceptable). |
| `useEffect` for "track time per card" with refs and omitted deps | Analytics | One effect: "when currentIndex (or currentCardId) changes, send previous card time; then record new start time." Use a ref for "previous card id" and "start time"; dependency array is `[currentIndex, sessionToken, slug, ...]`. No need to omit `visibleFields` if "current card id" is derived in the effect from a stable schema/visibleFields. |
| `useEffect` for focus on current card | DOM | Single effect: `useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [currentIndex]);` — acceptable; dependency is correct. |
| `formViewed` state + effect that sets it once | Redundant | Either derive "has viewed" from session creation or remove; avoid one-off boolean state + effect. |

---

## Recommended State Shape (Card Form)

### Reducer State (Single `useReducer` for the "Machine")

```ts
type FormMachineState = {
  currentIndex: number;
  direction: number;
  status: 'idle' | 'submitting' | 'success';
  formError: string | null;
  profileResult: ProfileResult | null;
};

type FormMachineAction =
  | { type: 'INIT_FROM_SESSION'; payload: { sessionToken: string; currentIndex: number; partialData: Record<string, unknown> } }
  | { type: 'GO_NEXT'; payload: { nextIndex: number; direction: number } }
  | { type: 'GO_BACK'; payload: { prevIndex: number; direction: number } }
  | { type: 'SET_INDEX'; payload: { index: number } }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } }
  | { type: 'SET_PROFILE_RESULT'; payload: { result: ProfileResult } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SESSION_ERROR'; payload: { error: string } }
  | { type: 'PERSIST_ERROR'; payload: { error: string } }
  | { type: 'PROFILE_ERROR'; payload: { error: string } };
```

### Form Data

**Option A (Recommended)**: Put `formData` in reducer for atomic updates and single source of truth.

```ts
type FormState = FormMachineState & {
  formData: Record<string, unknown>;
};

// Actions: UPDATE_FIELD, UPDATE_FIELDS (for session restore)
```

**Option B**: Keep `formData` as `useState` if form is very large or to avoid reducer size. Document why and ensure handlers (goNext, submit) read the latest formData; do not rely on effects to sync it.

### Uploaded Files

Small; can stay `useState` or live in reducer:

```ts
type FormState = FormMachineState & {
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
};
```

### Session State

Set once by session init; either reducer state (`INIT_FROM_SESSION`) or returned from `useCardFormSession`:

```ts
type SessionState = {
  sessionToken: string | null;
  sessionRestored: boolean;
  sessionError: string | null;
};
```

### Always Derived (useMemo), Never State

These should **never** be `useState`:

- `schema` - Derived from template
- `visibleFields` - `useMemo(() => getVisibleFields(schema, formData), [schema, formData])`
- `currentVisibleIndex` - `useMemo(() => clampToVisible(schema, visibleFields, currentIndex), [schema, visibleFields, currentIndex])`
- `currentField` - `visibleFields[currentVisibleIndex]`
- `isFirst` - `currentVisibleIndex === 0`
- `isLast` - `currentVisibleIndex === visibleFields.length - 1`
- `totalCards` - `visibleFields.length`
- `direction` - Can be derived from "previous index vs current" if needed only for animation

**Performance Note**: `visibleFields = useMemo(() => getVisibleFields(schema, formData), [schema, formData])` is fine; formData changes frequently but the computation is cheap. If profiling shows cost with very large schemas, consider a stable ref + shallow comparison only for formData keys that affect visibility (conditional fieldIds). No need to debounce formData for getVisibleFields unless measured. Putting formData in the reducer does not add meaningful overhead.

---

## Common Pitfalls

### Pitfall 1: Syncing State in useEffect

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

### Pitfall 2: Multiple setState in Session Effect

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
    onSessionReady(session);  // or dispatch({ type: 'INIT_FROM_SESSION', payload: session })
  });
}, []);
```

### Pitfall 3: Effect for Visibility Changes

```ts
// ❌ BAD: Effect that adjusts index when visibility changes
useEffect(() => {
  if (!visibleFields.some(f => f.id === schema[currentIndex]?.id)) {
    setCurrentIndex(0); // or find next visible
  }
}, [visibleFields, currentIndex, schema]);

// ✅ GOOD: Handle in reducer or navigation logic
const goNext = () => {
  const nextIndex = getNextCardIndex(currentIndex, visibleFields, formData);
  dispatch({ type: 'GO_NEXT', payload: { nextIndex, direction: 1 } });
};

// OR: Clamp in derived value
const currentVisibleIndex = useMemo(() => {
  return clampToVisible(schema, visibleFields, currentIndex);
}, [schema, visibleFields, currentIndex]);
```

---

## Summary

**Do**:
- ✅ Use `useMemo` for all derived state
- ✅ Use `useReducer` for machine state (index, status, errors)
- ✅ Use `useEffect` only for side effects (fetching, persisting, analytics, DOM)
- ✅ Keep dependency arrays honest and complete
- ✅ Initialize formData once when schema is ready

**Don't**:
- ❌ Use `useEffect` + `setState` to sync derived values
- ❌ Use multiple `useState` for related machine state
- ❌ Omit dependencies and use `eslint-disable`
- ❌ Use effects to "fix" state that should be derived
- ❌ Use effects for one-off boolean flags

---

## Next Steps

1. Review `07-card-form-hooks.md` for hook implementation details
2. Implement hooks following these rules
3. Test that no `eslint-disable` comments are needed
