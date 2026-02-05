import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormTemplate } from "@/lib/forms/types";
import { api } from "@/lib/api";
import type {
  CreateFormSessionDto,
  UpdateFormSessionDto,
  FormSessionPayload,
} from "@/lib/forms/types";
import { getCardFormSessionKey } from "../progress-indicator";
import logger from "@/lib/logger";

/**
 * Check if an error is a rate limit error (429 Too Many Requests)
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") ||
      error.message.includes("Too Many Requests") ||
      error.message.includes("ThrottlerException") ||
      error.message.includes("Rate limit")
    );
  }
  return false;
}

/**
 * Hook to manage form session (create, restore, update, complete).
 * Uses TanStack Query mutations for session operations.
 */
export function useCardFormSession(
  slug: string,
  template: FormTemplate | null,
  options: { saveProgress: boolean; totalCards: number }
): {
  session: {
    sessionToken: string;
    currentCardIndex: number;
    partialData: Record<string, unknown>;
  } | null;
  sessionRestored: boolean;
  sessionError: string | null;
  persistProgress: (
    currentIndex: number,
    partialData: Record<string, unknown>
  ) => Promise<void>;
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
  const initializationInProgressRef = useRef(false);

  // TanStack Query: Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data?: CreateFormSessionDto) => {
      logger.debug("🆕 useCardFormSession: Creating new session", {
        slug,
        hasData: !!data,
      });
      return api.forms.createFormSession(slug, data);
    },
  });

  // TanStack Query: Update session mutation (optimistic updates)
  const updateSessionMutation = useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: UpdateFormSessionDto;
    }) => {
      logger.debug("💾 useCardFormSession: Updating session", {
        slug,
        currentCardIndex: data.currentCardIndex,
        partialDataKeys: Object.keys(data.partialData || {}),
      });
      return api.forms.updateFormSession(slug, token, data);
    },
    // Non-blocking; don't throw on failure
    onError: (error) => {
      logger.error("❌ useCardFormSession: Failed to persist progress", {
        slug,
        error,
      });
    },
  });

  // TanStack Query: Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (token: string) => {
      logger.debug("✅ useCardFormSession: Completing session", {
        slug,
      });
      return api.forms.completeFormSession(slug, token);
    },
  });

  // Session initialization effect (once per mount)
  useEffect(() => {
    logger.debug("🚀 useCardFormSession: Initialization effect triggered", {
      slug,
      hasTemplate: !!template,
      saveProgress: options.saveProgress,
    });

    if (!template || !options.saveProgress) {
      logger.debug(
        "⏭️ useCardFormSession: Skipping session init (no template or saveProgress disabled)"
      );
      setSessionRestored(true);
      return;
    }

    // Prevent multiple simultaneous initialization attempts
    if (initializationInProgressRef.current) {
      logger.debug("⏸️ useCardFormSession: Initialization already in progress");
      return;
    }

    let cancelled = false;
    initializationInProgressRef.current = true;

    async function initSession() {
      try {
        // Try to restore from sessionStorage
        const storedToken = sessionStorage.getItem(getCardFormSessionKey(slug));
        logger.debug("🔍 useCardFormSession: Checking for stored session", {
          slug,
          hasStoredToken: !!storedToken,
        });
        let sessionData: FormSessionPayload | null = null;

        if (storedToken) {
          // Try to restore session
          try {
            logger.debug(
              "🔄 useCardFormSession: Attempting to restore session",
              {
                slug,
              }
            );
            sessionData = await api.forms.getFormSession(slug, storedToken);
            logger.debug(
              "✅ useCardFormSession: Session restored successfully",
              {
                slug,
                currentCardIndex: sessionData.currentCardIndex,
                partialDataKeys: Object.keys(sessionData.partialData || {}),
              }
            );
          } catch (error) {
            // If rate limited, don't try to create new session - just work without session
            if (isRateLimitError(error)) {
              logger.warn(
                "⚠️ useCardFormSession: Rate limited while restoring session. Form will work without session persistence.",
                { slug }
              );
              if (!cancelled) {
                setSessionError("Rate limited - session persistence disabled");
                setSessionRestored(true);
                initializationInProgressRef.current = false;
              }
              return;
            }
            // Session not found or expired, create new one
            logger.warn(
              "⚠️ useCardFormSession: Failed to restore session, creating new",
              {
                slug,
                error,
              }
            );
            sessionData = null;
          }
        }

        // If no stored session or restore failed, create new using mutation
        if (!sessionData) {
          try {
            logger.debug("🆕 useCardFormSession: Creating new session", {
              slug,
            });
            const result = await createSessionMutation.mutateAsync(undefined);
            sessionData = result;
            logger.debug("✅ useCardFormSession: New session created", {
              slug,
              sessionToken: sessionData.sessionToken,
            });
          } catch (error) {
            // If rate limited, allow form to work without session
            if (isRateLimitError(error)) {
              logger.warn(
                "⚠️ useCardFormSession: Rate limited while creating session. Form will work without session persistence.",
                { slug }
              );
              if (!cancelled) {
                setSessionError("Rate limited - session persistence disabled");
                setSessionRestored(true);
                initializationInProgressRef.current = false;
              }
              return;
            }
            throw error; // Re-throw non-rate-limit errors
          }
        }

        if (!cancelled) {
          logger.debug("💾 useCardFormSession: Setting session state", {
            slug,
            currentCardIndex: sessionData.currentCardIndex,
            partialDataKeys: Object.keys(sessionData.partialData || {}),
          });
          setSession({
            sessionToken: sessionData.sessionToken,
            currentCardIndex: sessionData.currentCardIndex,
            partialData: sessionData.partialData,
          });
          if (sessionData.sessionToken) {
            sessionStorage.setItem(
              getCardFormSessionKey(slug),
              sessionData.sessionToken
            );
            logger.debug("💾 useCardFormSession: Session token stored", {
              slug,
            });
          }
          setSessionRestored(true);
          initializationInProgressRef.current = false;
          logger.debug(
            "✅ useCardFormSession: Session initialization complete",
            {
              slug,
            }
          );
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("❌ useCardFormSession: Session initialization failed", {
            slug,
            error,
            isRateLimit: isRateLimitError(error),
          });
          // If rate limited, allow form to work without session
          if (isRateLimitError(error)) {
            setSessionError("Rate limited - session persistence disabled");
          } else {
            setSessionError(
              error instanceof Error
                ? error.message
                : "Failed to initialize session"
            );
          }
          setSessionRestored(true); // Still allow form to work without session
          initializationInProgressRef.current = false;
        }
      }
    }

    initSession();

    return () => {
      logger.debug(
        "🧹 useCardFormSession: Cleanup - cancelling initialization",
        {
          slug,
        }
      );
      cancelled = true;
      initializationInProgressRef.current = false;
    };
  }, [slug, template, options.saveProgress]); // Removed createSessionMutation from deps - it's stable from TanStack Query

  const persistProgress = useCallback(
    async (
      currentIndex: number,
      partialData: Record<string, unknown>
    ): Promise<void> => {
      logger.debug("💾 useCardFormSession: persistProgress called", {
        slug,
        currentIndex,
        hasSessionToken: !!session?.sessionToken,
        saveProgress: options.saveProgress,
        partialDataKeys: Object.keys(partialData),
      });

      if (!session?.sessionToken || !options.saveProgress) {
        logger.debug(
          "⏭️ useCardFormSession: Skipping persist (no session token or saveProgress disabled)"
        );
        return;
      }

      // Use TanStack Query mutation for session update
      updateSessionMutation.mutate({
        token: session.sessionToken,
        data: { currentCardIndex: currentIndex, partialData },
      });
    },
    [session?.sessionToken, options.saveProgress, updateSessionMutation, slug]
  );

  const completeSession = useCallback(async (): Promise<void> => {
    logger.debug("✅ useCardFormSession: completeSession called", {
      slug,
      hasSessionToken: !!session?.sessionToken,
    });

    if (!session?.sessionToken) {
      logger.debug(
        "⏭️ useCardFormSession: No session token, skipping completion"
      );
      return;
    }

    // Use TanStack Query mutation for session completion
    try {
      await completeSessionMutation.mutateAsync(session.sessionToken);
      sessionStorage.removeItem(getCardFormSessionKey(slug));
      logger.debug(
        "✅ useCardFormSession: Session completed and token removed",
        {
          slug,
        }
      );
    } catch (error) {
      logger.error("❌ useCardFormSession: Failed to complete session", {
        slug,
        error,
      });
    }
  }, [session?.sessionToken, slug, completeSessionMutation]);

  const clearStoredToken = useCallback(() => {
    logger.debug("🧹 useCardFormSession: Clearing stored token", {
      slug,
    });
    sessionStorage.removeItem(getCardFormSessionKey(slug));
  }, [slug]);

  return {
    session,
    sessionRestored,
    sessionError: sessionError || createSessionMutation.error?.message || null,
    persistProgress,
    completeSession,
    clearStoredToken,
  };
}
