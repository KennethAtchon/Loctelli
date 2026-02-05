import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormField, FormTemplate } from "@/lib/forms/types";
import { calculateProfileEstimation } from "@/lib/forms/profile-estimation";
import { api } from "@/lib/api";

/**
 * Hook to compute profile estimation result.
 * Computation triggered by function call (not effect).
 */
export function useCardFormProfile(
  template: FormTemplate | null,
  schema: FormField[],
  slug: string
): {
  profileResult: { type: string; result: Record<string, unknown> } | null;
  isCalculating: boolean;
  computeProfile: (
    formData: Record<string, unknown>,
    sessionToken?: string
  ) => Promise<void>;
} {
  const [profileResult, setProfileResult] = useState<{
    type: string;
    result: Record<string, unknown>;
  } | null>(null);

  // TanStack Query: AI profile calculation mutation
  const aiProfileMutation = useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      return api.forms.calculateProfileEstimation(slug, answers);
    },
    onError: (error) => {
      console.warn("AI profile calculation failed:", error);
    },
  });

  const computeProfile = useCallback(
    async (
      formData: Record<string, unknown>,
      sessionToken?: string
    ): Promise<void> => {
      if (!template?.profileEstimation?.enabled) {
        setProfileResult(null);
        return;
      }

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
            const aiResult = await aiProfileMutation.mutateAsync(formData);
            setProfileResult({
              type: aiResult.type,
              result: aiResult.result,
            });
          } catch (error) {
            // Fallback to rule-based on AI failure
            console.warn(
              "AI profile calculation failed, using rule-based:",
              error
            );
            if (ruleBasedResult) {
              setProfileResult({
                type: ruleBasedResult.type,
                result: ruleBasedResult.result,
              });
            } else {
              setProfileResult(null);
            }
          }
        } else {
          if (ruleBasedResult) {
            setProfileResult({
              type: ruleBasedResult.type,
              result: ruleBasedResult.result,
            });
          } else {
            setProfileResult(null);
          }
        }
      } catch (error) {
        console.error("Profile calculation failed:", error);
        setProfileResult(null);
      }
    },
    [template, schema, slug, aiProfileMutation]
  );

  return {
    profileResult,
    isCalculating: aiProfileMutation.isPending,
    computeProfile,
  };
}
