import { useReducer, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type {
  FormTemplate,
  FormField,
  CreateFormSubmissionDto,
} from "@/lib/forms/types";
import type { FlowchartNode } from "@/lib/forms/flowchart-types";
import { api } from "@/lib/api";
import { validateForm } from "@/lib/forms/form-validation";
import { useCardFormSchema } from "./useCardFormSchema";
import { useCardFormSession } from "./useCardFormSession";
import { useCardFormNavigation } from "./useCardFormNavigation";
import { useCardFormData } from "./useCardFormData";
import { useCardFormProfile } from "./useCardFormProfile";
import logger from "@/lib/logger";

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
  logger.debug("🔄 useCardFormState: Reducer action", {
    actionType: action.type,
    currentState: {
      currentIndex: state.currentIndex,
      status: state.status,
      hasError: !!state.formError,
    },
  });

  switch (action.type) {
    case "INIT_FROM_SESSION":
      logger.debug("🔄 useCardFormState: INIT_FROM_SESSION", {
        currentIndex: action.payload.currentIndex,
      });
      return {
        ...state,
        currentIndex: action.payload.currentIndex,
        formError: null,
      };
    case "GO_NEXT":
      logger.debug("🔄 useCardFormState: GO_NEXT", {
        nextIndex: action.payload.nextIndex,
        direction: action.payload.direction,
      });
      return {
        ...state,
        currentIndex: action.payload.nextIndex,
        direction: action.payload.direction,
        formError: null,
      };
    case "GO_BACK":
      logger.debug("🔄 useCardFormState: GO_BACK", {
        prevIndex: action.payload.prevIndex,
        direction: action.payload.direction,
      });
      return {
        ...state,
        currentIndex: action.payload.prevIndex,
        direction: action.payload.direction,
        formError: null,
      };
    case "SET_INDEX":
      logger.debug("🔄 useCardFormState: SET_INDEX", {
        index: action.payload.index,
      });
      return { ...state, currentIndex: action.payload.index };
    case "SUBMIT_START":
      logger.debug("🔄 useCardFormState: SUBMIT_START");
      return { ...state, status: "submitting", formError: null };
    case "SUBMIT_SUCCESS":
      logger.debug("🔄 useCardFormState: SUBMIT_SUCCESS");
      return { ...state, status: "success" };
    case "SUBMIT_ERROR":
      logger.debug("🔄 useCardFormState: SUBMIT_ERROR", {
        error: action.payload.error,
      });
      return { ...state, status: "idle", formError: action.payload.error };
    case "SET_PROFILE_RESULT":
      logger.debug("🔄 useCardFormState: SET_PROFILE_RESULT", {
        profileType: action.payload.result.type,
      });
      return { ...state, profileResult: action.payload.result };
    case "SET_ERROR":
      logger.debug("🔄 useCardFormState: SET_ERROR", {
        error: action.payload.error,
      });
      return { ...state, formError: action.payload.error };
    case "SESSION_ERROR":
    case "PERSIST_ERROR":
    case "PROFILE_ERROR":
      logger.debug("🔄 useCardFormState: Error action", {
        actionType: action.type,
        error: action.payload.error,
      });
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

  logger.debug("🚀 useCardFormState: Hook initialized", {
    slug,
    templateId: template.id,
    options,
  });

  // Compose hooks
  const { schema, successCard } = useCardFormSchema(template);
  logger.debug("📋 useCardFormState: Schema derived", {
    schemaLength: schema.length,
    hasSuccessCard: !!successCard,
  });

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
  } = useCardFormNavigation(schema, formData, state.currentIndex, (index) => {
    const newIndex =
      typeof index === "function" ? index(state.currentIndex) : index;
    dispatch({
      type: "SET_INDEX",
      payload: {
        index: newIndex,
      },
    });
  });

  const { profileResult, computeProfile } = useCardFormProfile(
    template,
    schema,
    slug
  );

  // Sync session restore into state
  useEffect(() => {
    if (session && sessionRestored) {
      logger.debug("🔄 useCardFormState: Syncing session into state", {
        sessionToken: session.sessionToken,
        currentCardIndex: session.currentCardIndex,
        partialDataKeys: Object.keys(session.partialData || {}),
      });
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
        logger.debug(
          "🔄 useCardFormState: Syncing partial data into formData",
          {
            partialDataKeys: Object.keys(session.partialData),
          }
        );
        setFormData((prev) => ({ ...prev, ...session.partialData }));
      }
    }
  }, [session, sessionRestored, setFormData]);

  // Sync profile result into state
  useEffect(() => {
    if (profileResult) {
      logger.debug("🔄 useCardFormState: Syncing profile result into state", {
        profileType: profileResult.type,
        resultKeys: Object.keys(profileResult.result),
      });
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
      logger.debug("📤 useCardFormState: Submitting form", {
        slug,
        formTemplateId: template.id,
        formDataKeys: Object.keys(data.formData),
        hasSessionToken: !!data.sessionToken,
      });
      const submissionData: CreateFormSubmissionDto = {
        formTemplateId: template.id,
        data: data.formData,
        source: "card-form",
      };
      return api.forms.submitPublicForm(slug, submissionData);
    },
    onSuccess: async () => {
      logger.debug("✅ useCardFormState: Form submission successful", {
        slug,
      });
      // Complete session after successful submission
      if (session?.sessionToken) {
        await completeSession();
      }
      dispatch({ type: "SUBMIT_SUCCESS" });
    },
    onError: (error) => {
      logger.error("❌ useCardFormState: Form submission failed", {
        slug,
        error,
      });
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
    logger.debug("➡️ useCardFormState: goNext called", {
      currentIndex: state.currentIndex,
      currentFieldId: currentField?.id,
      isLast,
    });

    if (isLast) {
      logger.debug("⏹️ useCardFormState: Already at last card");
      return;
    }

    // Validate current field if required
    if (currentField?.required) {
      const value = formData[currentField.id];
      logger.debug("✅ useCardFormState: Validating required field", {
        fieldId: currentField.id,
        hasValue: !!value,
        valueType: typeof value,
      });
      if (
        !value ||
        (Array.isArray(value) && value.length === 0) ||
        value === ""
      ) {
        logger.debug("❌ useCardFormState: Required field validation failed", {
          fieldId: currentField.id,
          fieldLabel: currentField.label,
        });
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
      logger.debug(
        "💾 useCardFormState: Persisting progress after navigation",
        {
          prevIndex,
          formDataKeys: Object.keys(formData),
        }
      );
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
    logger.debug("⬅️ useCardFormState: goBack called", {
      currentIndex: state.currentIndex,
    });
    baseGoBack();
  }, [baseGoBack, state.currentIndex]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    logger.debug("📝 useCardFormState: handleSubmit called", {
      slug,
      formDataKeys: Object.keys(formData),
    });

    // Validate form
    const isValid = validateForm(schema, formData);
    logger.debug("✅ useCardFormState: Form validation", {
      isValid,
      schemaLength: schema.length,
    });

    if (!isValid) {
      logger.debug("❌ useCardFormState: Form validation failed");
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
        logger.debug(
          "🧮 useCardFormState: Computing profile before submission",
          {
            slug,
          }
        );
        await computeProfile(formData, session?.sessionToken);
      }

      // Submit form using TanStack Query mutation
      logger.debug("📤 useCardFormState: Calling submit mutation", {
        slug,
      });
      await submitMutation.mutateAsync({
        formData,
        sessionToken: session?.sessionToken,
      });
    } catch (error) {
      // Error handled by mutation's onError
      logger.error("❌ useCardFormState: Submit handler error", {
        slug,
        error,
      });
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
      logger.debug("📤 useCardFormState: handleFileUpload called", {
        fieldId,
        fileName: file.name,
        slug,
      });
      await baseHandleFileUpload(fieldId, file, slug, session?.sessionToken);
    },
    [baseHandleFileUpload, slug, session]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      logger.debug("⌨️ useCardFormState: Keyboard event", {
        key: e.key,
        isLast,
      });
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
  const pendingRequestRef = useRef<boolean>(false);
  const MIN_TRACKING_TIME_SECONDS = 1; // Don't track if user spent less than 1 second

  useEffect(() => {
    if (!session?.sessionToken || !options.analyticsEnabled) {
      logger.debug(
        "⏭️ useCardFormState: Skipping analytics (no session token or disabled)",
        {
          hasSessionToken: !!session?.sessionToken,
          analyticsEnabled: options.analyticsEnabled,
        }
      );
      return;
    }

    const currentCardId = visibleFields[currentVisibleIndex]?.id;
    if (!currentCardId) {
      logger.debug("⏭️ useCardFormState: No current card ID for analytics");
      return;
    }

    // Send time for previous card (only if enough time passed and no pending request)
    if (
      prevCardIdRef.current != null &&
      startTimeRef.current != null &&
      !pendingRequestRef.current
    ) {
      const timeSeconds = Math.round(
        (Date.now() - startTimeRef.current) / 1000
      );

      // Only track if user spent meaningful time on the card (>= 1 second)
      if (timeSeconds >= MIN_TRACKING_TIME_SECONDS) {
        pendingRequestRef.current = true;
        logger.debug("📊 useCardFormState: Tracking time for previous card", {
          cardId: prevCardIdRef.current,
          timeSeconds,
        });
        api.forms
          .trackCardTime(slug, {
            sessionToken: session.sessionToken,
            cardId: prevCardIdRef.current,
            timeSeconds,
          })
          .then(() => {
            pendingRequestRef.current = false;
          })
          .catch((err) => {
            pendingRequestRef.current = false;
            // Don't log rate limit errors as errors, just debug
            if (err?.status === 429) {
              logger.debug(
                "⚠️ useCardFormState: Rate limited, skipping analytics",
                {
                  slug,
                  cardId: prevCardIdRef.current,
                }
              );
            } else {
              logger.error("❌ useCardFormState: Analytics error", {
                slug,
                error: err,
              });
            }
          });
      } else {
        logger.debug(
          "⏭️ useCardFormState: Skipping tracking (time too short)",
          {
            cardId: prevCardIdRef.current,
            timeSeconds,
            minRequired: MIN_TRACKING_TIME_SECONDS,
          }
        );
      }
    }

    // Set up tracking for current card
    logger.debug("📊 useCardFormState: Starting analytics tracking for card", {
      cardId: currentCardId,
      currentVisibleIndex,
    });
    prevCardIdRef.current = currentCardId;
    startTimeRef.current = Date.now();

    // Cleanup: send time for current card on unmount (only if meaningful time)
    return () => {
      // Skip cleanup request if we're already sending one in the effect body
      // This prevents double-sending when navigating quickly
      if (pendingRequestRef.current) {
        logger.debug(
          "⏭️ useCardFormState: Skipping cleanup (request already pending)"
        );
        return;
      }

      if (
        prevCardIdRef.current != null &&
        startTimeRef.current != null &&
        session?.sessionToken
      ) {
        const timeSeconds = Math.round(
          (Date.now() - startTimeRef.current) / 1000
        );

        // Only track if user spent meaningful time (>= 1 second)
        if (timeSeconds >= MIN_TRACKING_TIME_SECONDS) {
          pendingRequestRef.current = true;
          logger.debug(
            "📊 useCardFormState: Cleanup - tracking time for current card",
            {
              cardId: prevCardIdRef.current,
              timeSeconds,
            }
          );
          api.forms
            .trackCardTime(slug, {
              sessionToken: session.sessionToken,
              cardId: prevCardIdRef.current,
              timeSeconds,
            })
            .then(() => {
              pendingRequestRef.current = false;
            })
            .catch((err) => {
              pendingRequestRef.current = false;
              // Don't log rate limit errors as errors, just debug
              if (err?.status === 429) {
                logger.debug(
                  "⚠️ useCardFormState: Rate limited in cleanup, skipping",
                  {
                    slug,
                    cardId: prevCardIdRef.current,
                  }
                );
              } else {
                logger.error(
                  "❌ useCardFormState: Analytics error in cleanup",
                  {
                    slug,
                    error: err,
                  }
                );
              }
            });
        }
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
