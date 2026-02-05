import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormTemplate } from "@/lib/forms/types";
import { api } from "@/lib/api";
import type {
  CreateFormSessionDto,
  UpdateFormSessionDto,
  FormSessionPayload,
} from "@/lib/forms/types";
import { getCardFormSessionKey } from "./progress-indicator";

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

  // TanStack Query: Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data?: CreateFormSessionDto) => {
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
      return api.forms.updateFormSession(slug, token, data);
    },
    // Non-blocking; don't throw on failure
    onError: (error) => {
      console.error("Failed to persist progress:", error);
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
        const storedToken = sessionStorage.getItem(getCardFormSessionKey(slug));
        let sessionData: FormSessionPayload | null = null;

        if (storedToken) {
          // Try to restore session
          try {
            sessionData = await api.forms.getFormSession(slug, storedToken);
          } catch (error) {
            // Session not found or expired, create new one
            console.warn("Failed to restore session, creating new:", error);
            sessionData = null;
          }
        }

        // If no stored session or restore failed, create new using mutation
        if (!sessionData) {
          const result = await createSessionMutation.mutateAsync(undefined);
          sessionData = result;
        }

        if (!cancelled) {
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
          }
          setSessionRestored(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Failed to initialize session"
          );
          setSessionRestored(true); // Still allow form to work without session
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
  }, [slug, template, options.saveProgress, createSessionMutation]);

  const persistProgress = useCallback(
    async (
      currentIndex: number,
      partialData: Record<string, unknown>
    ): Promise<void> => {
      if (!session?.sessionToken || !options.saveProgress) return;

      // Use TanStack Query mutation for session update
      updateSessionMutation.mutate({
        token: session.sessionToken,
        data: { currentCardIndex: currentIndex, partialData },
      });
    },
    [session?.sessionToken, options.saveProgress, updateSessionMutation]
  );

  const completeSession = useCallback(async (): Promise<void> => {
    if (!session?.sessionToken) return;

    // Use TanStack Query mutation for session completion
    try {
      await completeSessionMutation.mutateAsync(session.sessionToken);
      sessionStorage.removeItem(getCardFormSessionKey(slug));
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  }, [session?.sessionToken, slug, completeSessionMutation]);

  const clearStoredToken = useCallback(() => {
    sessionStorage.removeItem(getCardFormSessionKey(slug));
  }, [slug]);

  return {
    session,
    sessionRestored,
    sessionError:
      sessionError ||
      createSessionMutation.error?.message ||
      null,
    persistProgress,
    completeSession,
    clearStoredToken,
  };
}
