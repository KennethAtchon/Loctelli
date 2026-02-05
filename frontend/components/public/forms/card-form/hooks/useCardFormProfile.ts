import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { FormField, FormTemplate } from "@/lib/forms/types";
import { calculateProfileEstimation } from "@/lib/forms/profile-estimation";
import { api } from "@/lib/api";
import logger from "@/lib/logger";

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
      logger.debug("🤖 useCardFormProfile: Starting AI profile calculation", {
        slug,
        answerCount: Object.keys(answers).length,
      });
      return api.forms.calculateProfileEstimation(slug, answers);
    },
    onError: (error) => {
      logger.warn("⚠️ useCardFormProfile: AI profile calculation failed", {
        slug,
        error,
      });
    },
  });

  const computeProfile = useCallback(
    async (
      formData: Record<string, unknown>,
      sessionToken?: string
    ): Promise<void> => {
      logger.debug("🧮 useCardFormProfile: computeProfile called", {
        slug,
        hasTemplate: !!template,
        profileEstimationEnabled: template?.profileEstimation?.enabled,
        formDataKeys: Object.keys(formData),
        hasSessionToken: !!sessionToken,
      });

      if (!template?.profileEstimation?.enabled) {
        logger.debug("⏭️ useCardFormProfile: Profile estimation disabled");
        setProfileResult(null);
        return;
      }

      try {
        const config = template.profileEstimation;

        // Try rule-based first
        logger.debug("📊 useCardFormProfile: Calculating rule-based profile", {
          hasAiConfig: !!config.aiConfig?.enabled,
        });
        const ruleBasedResult = calculateProfileEstimation(
          config,
          formData,
          schema
        );

        // If AI is enabled, use AI; otherwise use rule-based
        if (config.aiConfig?.enabled) {
          try {
            logger.debug("🤖 useCardFormProfile: Using AI profile calculation");
            const aiResult = await aiProfileMutation.mutateAsync(formData);
            logger.debug(
              "✅ useCardFormProfile: AI profile calculation successful",
              {
                profileType: aiResult.type,
                resultKeys: Object.keys(aiResult.result),
              }
            );
            setProfileResult({
              type: aiResult.type,
              result: aiResult.result,
            });
          } catch (error) {
            // Fallback to rule-based on AI failure
            logger.warn(
              "⚠️ useCardFormProfile: AI profile calculation failed, using rule-based",
              {
                error,
                hasRuleBasedResult: !!ruleBasedResult,
              }
            );
            if (ruleBasedResult) {
              logger.debug("✅ useCardFormProfile: Using rule-based fallback", {
                profileType: ruleBasedResult.type,
              });
              setProfileResult({
                type: ruleBasedResult.type,
                result: ruleBasedResult.result,
              });
            } else {
              logger.debug(
                "❌ useCardFormProfile: No rule-based result available"
              );
              setProfileResult(null);
            }
          }
        } else {
          logger.debug("📊 useCardFormProfile: Using rule-based profile only");
          if (ruleBasedResult) {
            logger.debug(
              "✅ useCardFormProfile: Rule-based profile calculated",
              {
                profileType: ruleBasedResult.type,
              }
            );
            setProfileResult({
              type: ruleBasedResult.type,
              result: ruleBasedResult.result,
            });
          } else {
            logger.debug("❌ useCardFormProfile: No rule-based result");
            setProfileResult(null);
          }
        }
      } catch (error) {
        logger.error("❌ useCardFormProfile: Profile calculation failed", {
          slug,
          error,
        });
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
