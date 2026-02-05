import { useReducer, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormTemplate, FormField, CreateFormSubmissionDto } from "@/lib/forms/types";
import type { FlowchartNode } from "@/lib/forms/flowchart-types";
import { api } from "@/lib/api";
import { validateForm } from "@/lib/forms/form-validation";
import { useCardFormSchema } from "./useCardFormSchema";
import { useCardFormSession } from "./useCardFormSession";
import { useCardFormNavigation } from "./useCardFormNavigation";
import { useCardFormData } from "./useCardFormData";
import { useCardFormProfile } from "./useCardFormProfile";

// Reducer types
type FormMachineState = {
  currentIndex: number;
  direction: number;
  status: "idle" | "submitting" | "success";
  formError: string | null;
  profileResult: { type: string; result: Record<string, unknown> } | null;
};

type FormMachineAction =
  | {
      type: "INIT_FROM_SESSION";
      payload: {
        sessionToken: string;
        currentIndex: number;
        partialData: Record<string, unknown>;
      };
    }
  | {
      type: "GO_NEXT";
      payload: { nextIndex: number; direction: number };
    }
  | {
      type: "GO_BACK";
      payload: { prevIndex: number; direction: number };
    }
  | { type: "SET_INDEX"; payload: { index: number } }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: { error: string } }
  | {
      type: "SET_PROFILE_RESULT";
      payload: { result: { type: string; result: Record<string, unknown> } };
    }
  | { type: "SET_ERROR"; payload: { error: string | null } }
  | { type: "SESSION_ERROR"; payload: { error: string } }
  | { type: "PERSIST_ERROR"; payload: { error: string } }
  | { type: "PROFILE_ERROR"; payload: { error: string } };

function formReducer(
  state: FormMachineState,
  action: FormMachineAction
): FormMachineState {
  switch (action.type) {
    case "INIT_FROM_SESSION":
      return {
        ...state,
        currentIndex: action.payload.currentIndex,
        formError: null,
      };
    case "GO_NEXT":
      return {
        ...state,
        currentIndex: action.payload.nextIndex,
        direction: action.payload.direction,
        formError: null,
      };
    case "GO_BACK":
      return {
        ...state,
        currentIndex: action.payload.prevIndex,
        direction: action.payload.direction,
        formError: null,
      };
    case "SET_INDEX":
      return { ...state, currentIndex: action.payload.index };
    case "SUBMIT_START":
      return { ...state, status: "submitting", formError: null };
    case "SUBMIT_SUCCESS":
      return { ...state, status: "success" };
    case "SUBMIT_ERROR":
      return { ...state, status: "idle", formError: action.payload.error };
    case "SET_PROFILE_RESULT":
      return { ...state, profileResult: action.payload.result };
    case "SET_ERROR":
      return { ...state, formError: action.payload.error };
    case "SESSION_ERROR":
    case "PERSIST_ERROR":
    case "PROFILE_ERROR":
      return { ...state, formError: action.payload.error };
    default:
      return state;
  }
}

const initialState: FormMachineState = {
  currentIndex: 0,
  direction: 1,
  status: "idle",
  formError: null,
  profileResult: null,
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
  handleCheckboxChange: (
    fieldId: string,
    value: string,
    checked: boolean
  ) => void;
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

  const {
    session,
    sessionRestored,
    sessionError,
    persistProgress,
    completeSession,
  } = useCardFormSession(slug, template, {
    saveProgress: options.saveProgress ?? false,
    totalCards: 0, // Will update when visibleFields is known
  });

  const {
    formData,
    setFormData,
    uploadedFiles,
    uploadingFiles,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload: baseHandleFileUpload,
  } = useCardFormData(schema, session?.partialData);

  const {
    visibleFields,
    currentField,
    currentVisibleIndex,
    isFirst,
    isLast,
    goNext: baseGoNext,
    goBack: baseGoBack,
  } = useCardFormNavigation(
    schema,
    formData,
    state.currentIndex,
    (index) => {
      const newIndex =
        typeof index === "function" ? index(state.currentIndex) : index;
      dispatch({
        type: "SET_INDEX",
        payload: {
          index: newIndex,
        },
      });
    }
  );

  const { profileResult, computeProfile } = useCardFormProfile(
    template,
    schema,
    slug
  );

  // Sync session restore into state
  useEffect(() => {
    if (session && sessionRestored) {
      dispatch({
        type: "INIT_FROM_SESSION",
        payload: {
          sessionToken: session.sessionToken,
          currentIndex: session.currentCardIndex,
          partialData: session.partialData,
        },
      });
      // Also sync partial data into formData
      if (
        session.partialData &&
        typeof session.partialData === "object" &&
        Object.keys(session.partialData).length > 0
      ) {
        setFormData((prev) => ({ ...prev, ...session.partialData }));
      }
    }
  }, [session, sessionRestored, setFormData]);

  // Sync profile result into state
  useEffect(() => {
    if (profileResult) {
      dispatch({
        type: "SET_PROFILE_RESULT",
        payload: { result: profileResult },
      });
    }
  }, [profileResult]);

  // TanStack Query: Form submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: {
      formData: Record<string, unknown>;
      sessionToken?: string;
    }) => {
      const submissionData: CreateFormSubmissionDto = {
        formTemplateId: template.id,
        data: data.formData,
        source: "card-form",
      };
      return api.forms.submitPublicForm(slug, submissionData);
    },
    onSuccess: async () => {
      // Complete session after successful submission
      if (session?.sessionToken) {
        await completeSession();
      }
      dispatch({ type: "SUBMIT_SUCCESS" });
    },
    onError: (error) => {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: {
          error: error instanceof Error ? error.message : "Submission failed",
        },
      });
    },
  });

  // Navigation handlers
  const goNext = useCallback(async () => {
    if (isLast) return;

    // Validate current field if required
    if (currentField?.required) {
      const value = formData[currentField.id];
      if (
        !value ||
        (Array.isArray(value) && value.length === 0) ||
        value === ""
      ) {
        dispatch({
          type: "SET_ERROR",
          payload: { error: `${currentField.label} is required` },
        });
        return;
      }
    }

    const prevIndex = state.currentIndex;
    
    // Call base navigation which will update index via dispatch
    baseGoNext();

    // Persist progress after navigation
    // Note: We persist with current formData, the index will be updated by the reducer
    if (session?.sessionToken) {
      await persistProgress(prevIndex, formData);
    }
  }, [
    isLast,
    currentField,
    formData,
    baseGoNext,
    session,
    persistProgress,
    state.currentIndex,
  ]);

  const goBack = useCallback(() => {
    baseGoBack();
  }, [baseGoBack]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm(schema, formData)) {
      dispatch({
        type: "SET_ERROR",
        payload: { error: "Please fill in all required fields" },
      });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      // Compute profile if enabled
      if (template.profileEstimation?.enabled) {
        await computeProfile(formData, session?.sessionToken);
      }

      // Submit form using TanStack Query mutation
      await submitMutation.mutateAsync({
        formData,
        sessionToken: session?.sessionToken,
      });
    } catch (error) {
      // Error handled by mutation's onError
    }
  }, [
    schema,
    formData,
    template,
    computeProfile,
    slug,
    session,
    submitMutation,
  ]);

  // File upload handler
  const handleFileUpload = useCallback(
    async (fieldId: string, file: File) => {
      await baseHandleFileUpload(fieldId, file, slug, session?.sessionToken);
    },
    [baseHandleFileUpload, slug, session]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isLast) {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goBack();
      } else if (e.key === "ArrowRight" && !isLast) {
        goNext();
      }
    },
    [isLast, goNext, goBack]
  );

  // Analytics: time per card
  const prevCardIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session?.sessionToken || !options.analyticsEnabled) return;

    const currentCardId = visibleFields[currentVisibleIndex]?.id;
    if (!currentCardId) return;

    // Send time for previous card
    if (prevCardIdRef.current != null && startTimeRef.current != null) {
      api.forms
        .trackCardTime(slug, {
          sessionToken: session.sessionToken,
          cardId: prevCardIdRef.current,
          timeSeconds: Math.round(
            (Date.now() - startTimeRef.current) / 1000
          ),
        })
        .catch((err) => console.error("Analytics error:", err));
    }

    // Set up tracking for current card
    prevCardIdRef.current = currentCardId;
    startTimeRef.current = Date.now();

    // Cleanup: send time for current card on unmount
    return () => {
      if (
        prevCardIdRef.current != null &&
        startTimeRef.current != null &&
        session?.sessionToken
      ) {
        api.forms
          .trackCardTime(slug, {
            sessionToken: session.sessionToken,
            cardId: prevCardIdRef.current,
            timeSeconds: Math.round(
              (Date.now() - startTimeRef.current) / 1000
            ),
          })
          .catch((err) => console.error("Analytics error:", err));
      }
    };
  }, [
    currentVisibleIndex,
    session?.sessionToken,
    options.analyticsEnabled,
    visibleFields,
    slug,
  ]);

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
    isSubmitting: state.status === "submitting",
    formError: state.formError,
    success: state.status === "success",
    profileResult: state.profileResult,
    // Actions
    goNext,
    goBack,
    handleSubmit,
    handleKeyDown,
  };
}
