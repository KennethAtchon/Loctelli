/**
 * React Hook Form values type for Profile Estimation.
 * Mirrors ProfileEstimation with arrays always present (for useFieldArray).
 */
import type {
  ProfileEstimation,
  AIProfileConfig,
  FieldScoring,
  ScoringRule,
} from "@/lib/forms/types";

export type ProfileEstimationFormValues = {
  enabled: boolean;
  type: ProfileEstimation["type"];
  aiConfig: AIProfileConfigFormValues;
  percentageConfig: {
    title: string;
    description: string;
    ranges: Array<{
      min: number;
      max: number;
      label: string;
      description: string;
      image: string;
    }>;
    fieldScoring: FieldScoringFormValues[];
  };
  categoryConfig: {
    title: string;
    categories: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
      matchingLogic: ScoringRule[];
    }>;
  };
  dimensionConfig: {
    title: string;
    visualization: "bars" | "radar" | "pie";
    dimensions: Array<{
      id: string;
      name: string;
      maxScore: number;
      fields: FieldScoringFormValues[];
    }>;
  };
  recommendationConfig: {
    title: string;
    recommendations: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
      matchingCriteria: ScoringRule[];
    }>;
  };
};

export type AIProfileConfigFormValues = {
  enabled: boolean;
  model: "gpt-4" | "claude" | "custom";
  prompt: string;
  analysisType: "sentiment" | "personality" | "recommendation";
  outputFormat: "percentage" | "category" | "freeform";
};

export type FieldScoringFormValues = FieldScoring;
