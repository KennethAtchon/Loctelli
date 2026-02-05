# Card Form Hooks — State Management

> **Purpose**: Detailed implementation guide for card form hooks following state/effects discipline.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `02-state-effects-discipline.md`, `04-type-layer.md`, `05-domain-layer.md`, `06-service-layer.md`

---

## Overview

The card form is split into focused hooks that compose together. Each hook has a single responsibility and follows the state/effects discipline rules.

**Goal**: Remove the 880-line god component and replace it with:
1. Schema derivation hook
2. Session management hook
3. Navigation state hook
4. Form data hook
5. Profile calculation hook
6. Orchestrator hook that composes them all

---

## Hook Architecture

```
useCardFormState (orchestrator)
├── useCardFormSchema (derives schema, successCard)
├── useCardFormData (formData, uploadedFiles, handlers)
├── useCardFormSession (session state, persistProgress, completeSession)
├── useCardFormNavigation (visibleFields, currentField, goNext, goBack)
└── useCardFormProfile (computeProfile, profileResult)
```

---

## Hook 1: `useCardFormSchema.ts`

**Purpose**: Derives runtime schema and success card from template.

**Location**: `frontend/components/public/forms/card-form/useCardFormSchema.ts`

**State**: None (pure derivation)

**Effects**: None

**Dependencies**: Domain (`flowchartToSchema`)

---

### Implementation

```ts
import { useMemo } from 'react';
import type { FormTemplate } from '@/lib/forms/types';
import type { FlowchartGraph, FlowchartNode } from '@/lib/forms/flowchart-types';
import { flowchartToSchema } from '@/lib/forms/flowchart-serialization';

export function useCardFormSchema(template: FormTemplate): {
  schema: FormField[];
  successCard: FlowchartNode | null;
} {
  const flowchartGraph = useMemo(() => {
    return (template.cardSettings as { flowchartGraph?: FlowchartGraph })?.flowchartGraph;
  }, [template.cardSettings]);
  
  const schema = useMemo(() => {
    if (flowchartGraph) {
      return flowchartToSchema(flowchartGraph);
    }
    return (template.schema ?? []) as FormField[];
  }, [flowchartGraph, template.schema]);
  
  const successCard = useMemo(() => {
    if (!flowchartGraph) return null;
    return flowchartGraph.nodes.find(
      n => n.type === "statement" && n.data?.isSuccessCard === true
    ) ?? null;
  }, [flowchartGraph]);
  
  return { schema, successCard };
}
```

**Key Points**:
- Only `useMemo` - no state, no effects
- Derives schema from template
- Returns both schema and success card

---

## Hook 2: `useCardFormSession.ts`

**Purpose**: Manages form session (create, restore, update, complete).

**Location**: `frontend/components/public/forms/card-form/useCardFormSession.ts`

**State**: Session state (token, restored flag, error)

**Effects**: One effect for session initialization

**Dependencies**: Service (`formsApi`)

---

### Implementation

```ts
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { FormTemplate } from '@/lib/forms/types';
import { api } from '@/lib/api';
import type { CreateFormSessionDto, UpdateFormSessionDto } from '@/lib/forms/types';

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
  const [session, setSession] = useState<{
    sessionToken: string;
    currentCardIndex: number;
    partialData: Record<string, unknown>;
  } | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // TanStack Query: Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data?: CreateFormSessionDto) => {
      return api.forms.createFormSession(slug, data);
    },
  });
  
  // TanStack Query: Update session mutation (optimistic updates)
  const updateSessionMutation = useMutation({
    mutationFn: async ({ token, data }: { token: string; data: UpdateFormSessionDto }) => {
      return api.forms.updateFormSession(slug, token, data);
    },
    // Non-blocking; don't throw on failure
    onError: (error) => {
      console.error('Failed to persist progress:', error);
    },
  });
  
  // TanStack Query: Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (token: string) => {
      return api.forms.completeFormSession(slug, token);
    },
  });
  
  // Session initialization effect (once per mount)
  useEffect(() => {
    if (!template || !options.saveProgress) {
      setSessionRestored(true);
      return;
    }
    
    let cancelled = false;
    
    async function initSession() {
      try {
        // Try to restore from sessionStorage
        const storedToken = sessionStorage.getItem(`form-session-${slug}`);
        let sessionData;
        
        if (storedToken) {
          // Use TanStack Query to fetch session
          try {
            sessionData = await api.forms.getFormSession(slug, storedToken);
          } catch (error) {
            // Session not found or expired, create new one
            console.warn('Failed to restore session, creating new:', error);
            sessionData = null;
          }
        }
        
        // If no stored session or restore failed, create new using mutation
        if (!sessionData) {
          const result = await createSessionMutation.mutateAsync();
          sessionData = result;
        }
        
        if (!cancelled) {
          setSession(sessionData);
          if (sessionData.sessionToken) {
            sessionStorage.setItem(`form-session-${slug}`, sessionData.sessionToken);
          }
          setSessionRestored(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(error instanceof Error ? error.message : 'Failed to initialize session');
          setSessionRestored(true); // Still allow form to work without session
        }
      }
    }
    
    initSession();
    
    return () => {
      cancelled = true;
    };
  }, [slug, template, options.saveProgress, createSessionMutation]);
  
  const persistProgress = useCallback(async (
    currentIndex: number,
    partialData: Record<string, unknown>
  ) => {
    if (!session?.sessionToken || !options.saveProgress) return;
    
    // Use TanStack Query mutation for session update
    updateSessionMutation.mutate({
      token: session.sessionToken,
      data: { currentCardIndex: currentIndex, partialData },
    });
  }, [session?.sessionToken, options.saveProgress, updateSessionMutation]);
  
  const completeSession = useCallback(async () => {
    if (!session?.sessionToken) return;
    
    // Use TanStack Query mutation for session completion
    try {
      await completeSessionMutation.mutateAsync(session.sessionToken);
      sessionStorage.removeItem(`form-session-${slug}`);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  }, [session?.sessionToken, slug, completeSessionMutation]);
  
  const clearStoredToken = useCallback(() => {
    sessionStorage.removeItem(`form-session-${slug}`);
  }, [slug]);
  
  return {
    session,
    sessionRestored,
    sessionError: sessionError || createSessionMutation.error?.message || null,
    persistProgress,
    completeSession,
    clearStoredToken
  };
}
```

**Key Points**:
- One effect for session initialization
- Single settlement: `setSession` updates all session state at once
- `persistProgress` and `completeSession` are callbacks (called from event handlers, not effects)
- Non-blocking errors (form works without session)

---

## Hook 3: `useCardFormNavigation.ts`

**Purpose**: Manages navigation state (visible fields, current field, navigation actions).

**Location**: `frontend/components/public/forms/card-form/useCardFormNavigation.ts`

**State**: None (all derived)

**Effects**: None

**Dependencies**: Domain (`getVisibleFields`, `getNextCardIndex`, `clampToVisible`)

---

### Implementation

```ts
import { useMemo, useCallback } from 'react';
import type { FormField } from '@/lib/forms/types';
import { getVisibleFields, getNextCardIndex } from '@/lib/forms/conditional-logic';
import { clampToVisible } from '@/lib/forms/navigation';

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
  // Derived: visible fields
  const visibleFields = useMemo(
    () => getVisibleFields(schema, formData),
    [schema, formData]
  );
  
  // Derived: clamped visible index
  const currentVisibleIndex = useMemo(
    () => clampToVisible(schema, visibleFields, currentIndex),
    [schema, visibleFields, currentIndex]
  );
  
  // Derived: current field
  const currentField = visibleFields[currentVisibleIndex];
  
  // Derived: navigation flags
  const isFirst = currentVisibleIndex === 0;
  const isLast = currentVisibleIndex === visibleFields.length - 1;
  
  // Navigation actions
  const goNext = useCallback(() => {
    const nextIndex = getNextCardIndex(currentVisibleIndex, visibleFields, formData);
    if (nextIndex >= 0) {
      // Convert visible index back to schema index
      const nextField = visibleFields[nextIndex];
      const schemaIndex = schema.findIndex(f => f.id === nextField.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      }
    }
  }, [currentVisibleIndex, visibleFields, formData, schema, setCurrentIndex]);
  
  const goBack = useCallback(() => {
    if (currentVisibleIndex > 0) {
      const prevField = visibleFields[currentVisibleIndex - 1];
      const schemaIndex = schema.findIndex(f => f.id === prevField.id);
      if (schemaIndex >= 0) {
        setCurrentIndex(schemaIndex);
      }
    }
  }, [currentVisibleIndex, visibleFields, schema, setCurrentIndex]);
  
  return {
    visibleFields,
    currentField,
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

## Hook 4: `useCardFormData.ts`

**Purpose**: Manages form data state and input handlers.

**Location**: `frontend/components/public/forms/card-form/useCardFormData.ts`

**State**: `formData`, `uploadedFiles`, `uploadingFiles`

**Effects**: None (initialization via lazy init)

**Dependencies**: Domain (`getInitialFormData`), Service (`formsApi` for uploads)

---

### Implementation

```ts
import { useState, useCallback, useRef } from 'react';
import type { FormField } from '@/lib/forms/types';
import { getInitialFormData } from '@/lib/forms/form-validation';
import { formsApi } from '@/lib/api/endpoints/forms';

export function useCardFormData(
  schema: FormField[],
  initialData?: Record<string, unknown>
): {
  formData: Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (fieldId: string, value: string, checked: boolean) => void;
  handleFileUpload: (fieldId: string, file: File, slug: string, sessionToken?: string) => Promise<void>;
} {
  // Initialize formData once when schema is ready (lazy init)
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (initialData) {
      return { ...getInitialFormData(schema), ...initialData };
    }
    return getInitialFormData(schema);
  });
  
  // Reset formData when schema identity changes
  const schemaId = schema.map(f => f.id).join(',');
  const prevSchemaIdRef = useRef(schemaId);
  
  if (schemaId !== prevSchemaIdRef.current) {
    prevSchemaIdRef.current = schemaId;
    setFormData(initialData ? { ...getInitialFormData(schema), ...initialData } : getInitialFormData(schema));
  }
  
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  
  const handleInputChange = useCallback((fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);
  
  const handleCheckboxChange = useCallback((
    fieldId: string,
    value: string,
    checked: boolean
  ) => {
    setFormData(prev => {
      const current = (prev[fieldId] as string[]) || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, value] };
      } else {
        return { ...prev, [fieldId]: current.filter(v => v !== value) };
      }
    });
  }, []);
  
  // TanStack Query: File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async ({ fieldId, file, sessionToken }: { fieldId: string; file: File; sessionToken?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      return api.forms.uploadFormFile(slug, formData);
    },
  });
  
  const handleFileUpload = useCallback(async (
    fieldId: string,
    file: File,
    slug: string,
    sessionToken?: string
  ) => {
    setUploadingFiles(prev => ({ ...prev, [fieldId]: true }));
    try {
      const result = await fileUploadMutation.mutateAsync({ fieldId, file, sessionToken });
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), file]
      }));
      // Store file URL in formData if needed
      setFormData(prev => ({
        ...prev,
        [fieldId]: [...((prev[fieldId] as File[]) || []), file]
      }));
    } catch (error) {
      console.error('File upload failed:', error);
      throw error; // Let caller handle error
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: false }));
    }
  }, [fileUploadMutation]);
  
  return {
    formData,
    setFormData,
    uploadedFiles,
    uploadingFiles,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload
  };
}
```

**Key Points**:
- Lazy initialization of `formData` from schema
- Resets when schema identity changes (no effect needed)
- Handlers update state directly
- File upload handled with loading state

---

## Hook 5: `useCardFormProfile.ts`

**Purpose**: Computes profile estimation result.

**Location**: `frontend/components/public/forms/card-form/useCardFormProfile.ts`

**State**: `profileResult`, `isCalculating`

**Effects**: None (computation triggered by function call)

**Dependencies**: Domain (`calculateProfileEstimation`), Service (`formsApi` for AI)

---

### Implementation

```ts
import { useState, useCallback } from 'react';
import type { FormField, FormTemplate, ProfileEstimation } from '@/lib/forms/types';
import { calculateProfileEstimation } from '@/lib/forms/profile-estimation';
import { formsApi } from '@/lib/api/endpoints/forms';

export function useCardFormProfile(
  template: FormTemplate | null,
  schema: FormField[]
): {
  profileResult: { type: string; result: Record<string, unknown> } | null;
  isCalculating: boolean;
  computeProfile: (formData: Record<string, unknown>, slug: string, sessionToken?: string) => Promise<void>;
} {
  const [profileResult, setProfileResult] = useState<{
    type: string;
    result: Record<string, unknown>;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const computeProfile = useCallback(async (
    formData: Record<string, unknown>,
    slug: string,
    sessionToken?: string
  ) => {
    if (!template?.profileEstimation?.enabled) {
      setProfileResult(null);
      return;
    }
    
    setIsCalculating(true);
    try {
      const config = template.profileEstimation;
      
      // Try rule-based first
      const ruleBasedResult = calculateProfileEstimation(
        config,
        formData,
        schema
      );
      
      // If AI is enabled, use AI; otherwise use rule-based
      if (config.aiConfig?.enabled) {
        try {
          const aiResult = await formsApi.calculateProfile(slug, formData, sessionToken);
          setProfileResult(aiResult);
        } catch (error) {
          // Fallback to rule-based on AI failure
          console.warn('AI profile calculation failed, using rule-based:', error);
          setProfileResult(ruleBasedResult);
        }
      } else {
        setProfileResult(ruleBasedResult);
      }
    } catch (error) {
      console.error('Profile calculation failed:', error);
      setProfileResult(null);
    } finally {
      setIsCalculating(false);
    }
  }, [template, schema]);
  
  return {
    profileResult,
    isCalculating,
    computeProfile
  };
}
```

**Key Points**:
- Computation triggered by function call (not effect)
- Falls back to rule-based if AI fails
- Handles errors gracefully

---

## Hook 6: `useCardFormState.ts` (Orchestrator)

**Purpose**: Composes all hooks and manages machine state with reducer.

**Location**: `frontend/components/public/forms/card-form/useCardFormState.ts`

**State**: Reducer for machine state

**Effects**: Analytics (time per card), focus management

**Dependencies**: All other hooks, domain, service

---

### Implementation

```ts
import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { FormTemplate } from '@/lib/forms/types';
import { formsApi } from '@/lib/api/endpoints/forms';
import { validateForm } from '@/lib/forms/form-validation';
import { useCardFormSchema } from './useCardFormSchema';
import { useCardFormSession } from './useCardFormSession';
import { useCardFormNavigation } from './useCardFormNavigation';
import { useCardFormData } from './useCardFormData';
import { useCardFormProfile } from './useCardFormProfile';

// Reducer types
type FormMachineState = {
  currentIndex: number;
  direction: number;
  status: 'idle' | 'submitting' | 'success';
  formError: string | null;
  profileResult: { type: string; result: Record<string, unknown> } | null;
};

type FormMachineAction =
  | { type: 'INIT_FROM_SESSION'; payload: { sessionToken: string; currentIndex: number; partialData: Record<string, unknown> } }
  | { type: 'GO_NEXT'; payload: { nextIndex: number; direction: number } }
  | { type: 'GO_BACK'; payload: { prevIndex: number; direction: number } }
  | { type: 'SET_INDEX'; payload: { index: number } }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } }
  | { type: 'SET_PROFILE_RESULT'; payload: { result: { type: string; result: Record<string, unknown> } } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SESSION_ERROR'; payload: { error: string } }
  | { type: 'PERSIST_ERROR'; payload: { error: string } }
  | { type: 'PROFILE_ERROR'; payload: { error: string } };

function formReducer(state: FormMachineState, action: FormMachineAction): FormMachineState {
  switch (action.type) {
    case 'INIT_FROM_SESSION':
      return {
        ...state,
        currentIndex: action.payload.currentIndex,
        formError: null
      };
    case 'GO_NEXT':
      return {
        ...state,
        currentIndex: action.payload.nextIndex,
        direction: action.payload.direction,
        formError: null
      };
    case 'GO_BACK':
      return {
        ...state,
        currentIndex: action.payload.prevIndex,
        direction: action.payload.direction,
        formError: null
      };
    case 'SET_INDEX':
      return { ...state, currentIndex: action.payload.index };
    case 'SUBMIT_START':
      return { ...state, status: 'submitting', formError: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'success' };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'idle', formError: action.payload.error };
    case 'SET_PROFILE_RESULT':
      return { ...state, profileResult: action.payload.result };
    case 'SET_ERROR':
      return { ...state, formError: action.payload.error };
    case 'SESSION_ERROR':
    case 'PERSIST_ERROR':
    case 'PROFILE_ERROR':
      return { ...state, formError: action.payload.error };
    default:
      return state;
  }
}

const initialState: FormMachineState = {
  currentIndex: 0,
  direction: 1,
  status: 'idle',
  formError: null,
  profileResult: null
};

export function useCardFormState(
  slug: string,
  template: FormTemplate,
  options: {
    saveProgress?: boolean;
    analyticsEnabled?: boolean;
  } = {}
): {
  // Schema
  schema: FormField[];
  successCard: FlowchartNode | null;
  // Form data
  formData: Record<string, unknown>;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (fieldId: string, value: string, checked: boolean) => void;
  handleFileUpload: (fieldId: string, file: File) => Promise<void>;
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
  // Navigation
  visibleFields: FormField[];
  currentField: FormField | undefined;
  currentVisibleIndex: number;
  isFirst: boolean;
  isLast: boolean;
  totalCards: number;
  // Session
  sessionRestored: boolean;
  sessionError: string | null;
  // State
  currentIndex: number;
  isSubmitting: boolean;
  formError: string | null;
  success: boolean;
  profileResult: { type: string; result: Record<string, unknown> } | null;
  // Actions
  goNext: () => void;
  goBack: () => void;
  handleSubmit: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const [state, dispatch] = useReducer(formReducer, initialState);
  
  // Compose hooks
  const { schema, successCard } = useCardFormSchema(template);
  
  const { session, sessionRestored, sessionError, persistProgress, completeSession } = useCardFormSession(
    slug,
    template,
    { saveProgress: options.saveProgress ?? false, totalCards: 0 } // Will update when visibleFields is known
  );
  
  const { formData, setFormData, uploadedFiles, uploadingFiles, handleInputChange, handleCheckboxChange, handleFileUpload: baseHandleFileUpload } = useCardFormData(
    schema,
    session?.partialData
  );
  
  const { visibleFields, currentField, currentVisibleIndex, isFirst, isLast, goNext: baseGoNext, goBack: baseGoBack } = useCardFormNavigation(
    schema,
    formData,
    state.currentIndex,
    (index) => dispatch({ type: 'SET_INDEX', payload: { index: typeof index === 'function' ? index(state.currentIndex) : index } })
  );
  
  const { profileResult, computeProfile } = useCardFormProfile(template, schema);
  
  // Sync session restore into state
  useEffect(() => {
    if (session && sessionRestored) {
      dispatch({
        type: 'INIT_FROM_SESSION',
        payload: {
          sessionToken: session.sessionToken,
          currentIndex: session.currentCardIndex,
          partialData: session.partialData
        }
      });
    }
  }, [session, sessionRestored]);
  
  // Sync profile result into state
  useEffect(() => {
    if (profileResult) {
      dispatch({ type: 'SET_PROFILE_RESULT', payload: { result: profileResult } });
    }
  }, [profileResult]);
  
  // Navigation handlers
  const goNext = useCallback(async () => {
    if (isLast) return;
    
    // Validate current field if required
    if (currentField?.required) {
      const value = formData[currentField.id];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        dispatch({ type: 'SET_ERROR', payload: { error: `${currentField.label} is required` } });
        return;
      }
    }
    
    baseGoNext();
    
    // Persist progress
    if (session?.sessionToken) {
      await persistProgress(state.currentIndex, formData);
    }
  }, [isLast, currentField, formData, baseGoNext, session, persistProgress, state.currentIndex]);
  
  const goBack = useCallback(() => {
    baseGoBack();
  }, [baseGoBack]);
  
  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm(schema, formData)) {
      dispatch({ type: 'SET_ERROR', payload: { error: 'Please fill in all required fields' } });
      return;
    }
    
    dispatch({ type: 'SUBMIT_START' });
    
    try {
      // Compute profile if enabled
      if (template.profileEstimation?.enabled) {
        await computeProfile(formData, slug, session?.sessionToken);
      }
      
      // Submit form
      await formsApi.submitForm(slug, formData, session?.sessionToken);
      
      // Complete session
      if (session?.sessionToken) {
        await completeSession();
      }
      
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (error) {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: { error: error instanceof Error ? error.message : 'Submission failed' }
      });
    }
  }, [schema, formData, template, computeProfile, slug, session, completeSession]);
  
  // File upload handler
  const handleFileUpload = useCallback(async (fieldId: string, file: File) => {
    await baseHandleFileUpload(fieldId, file, slug, session?.sessionToken);
  }, [baseHandleFileUpload, slug, session]);
  
  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLast) {
      goNext();
    } else if (e.key === 'ArrowLeft') {
      goBack();
    } else if (e.key === 'ArrowRight' && !isLast) {
      goNext();
    }
  }, [isLast, goNext, goBack]);
  
  // Analytics: time per card
  const prevCardIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!session?.sessionToken || !options.analyticsEnabled) return;
    
    const currentCardId = visibleFields[currentVisibleIndex]?.id;
    if (!currentCardId) return;
    
    // Send time for previous card
    if (prevCardIdRef.current != null && startTimeRef.current != null) {
      formsApi.trackCardTime(
        session.sessionToken,
        prevCardIdRef.current,
        Date.now() - startTimeRef.current
      ).catch(err => console.error('Analytics error:', err));
    }
    
    // Set up tracking for current card
    prevCardIdRef.current = currentCardId;
    startTimeRef.current = Date.now();
    
    // Cleanup: send time for current card on unmount
    return () => {
      if (prevCardIdRef.current != null && startTimeRef.current != null && session?.sessionToken) {
        formsApi.trackCardTime(
          session.sessionToken,
          prevCardIdRef.current,
          Date.now() - startTimeRef.current
        ).catch(err => console.error('Analytics error:', err));
      }
    };
  }, [currentVisibleIndex, session?.sessionToken, options.analyticsEnabled, visibleFields]);
  
  return {
    // Schema
    schema,
    successCard,
    // Form data
    formData,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
    uploadedFiles,
    uploadingFiles,
    // Navigation
    visibleFields,
    currentField,
    currentVisibleIndex,
    isFirst,
    isLast,
    totalCards: visibleFields.length,
    // Session
    sessionRestored,
    sessionError,
    // State
    currentIndex: state.currentIndex,
    isSubmitting: state.status === 'submitting',
    formError: state.formError,
    success: state.status === 'success',
    profileResult: state.profileResult,
    // Actions
    goNext,
    goBack,
    handleSubmit,
    handleKeyDown
  };
}
```

**Key Points**:
- Composes all hooks
- Uses reducer for machine state
- Two effects: analytics and session sync
- Handlers call domain functions and dispatch actions

---

## Implementation Checklist

- [ ] Create `useCardFormSchema.ts` - schema derivation only
- [ ] Create `useCardFormSession.ts` - session management with one effect
- [ ] Create `useCardFormNavigation.ts` - navigation with derived state
- [ ] Create `useCardFormData.ts` - form data with lazy init
- [ ] Create `useCardFormProfile.ts` - profile calculation
- [ ] Create `useCardFormState.ts` - orchestrator with reducer
- [ ] Verify no `useEffect` for syncing derived state
- [ ] Verify all derived values use `useMemo`
- [ ] Test each hook in isolation
- [ ] Test composed hook

---

## Summary

**Hook Responsibilities**:
1. **useCardFormSchema** - Derives schema (no state/effects)
2. **useCardFormSession** - Session API (one init effect)
3. **useCardFormNavigation** - Navigation (derived state only)
4. **useCardFormData** - Form data (state, no effects)
5. **useCardFormProfile** - Profile calculation (computation function)
6. **useCardFormState** - Orchestrator (reducer + 2 effects: analytics, sync)

**State Discipline**:
- ✅ Reducer for machine state
- ✅ `useMemo` for all derived values
- ✅ `useEffect` only for side effects (session init, analytics, sync)
- ✅ No effects for syncing derived state

---

## Next Steps

1. Implement hooks following this guide
2. Test each hook
3. Proceed to `08-simple-form-hooks.md` or `09-shared-ui.md`
