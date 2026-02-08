import type { ProfileEstimation, ScoringRule } from "@/lib/forms/types";
import type {
  ProfileEstimationFormValues,
  AIProfileConfigFormValues,
} from "./profile-estimation-form-types";
import { getConditionsFromGroupOrBlock } from "@/lib/forms/conditional-logic";
import { generateStableId } from "@/lib/utils/stable-id";

const DEFAULT_PERCENTAGE_RANGES: ProfileEstimationFormValues["percentageConfig"]["ranges"] =
  [
    { min: 0, max: 33, label: "Low", description: "", image: "" },
    { min: 34, max: 66, label: "Medium", description: "", image: "" },
    { min: 67, max: 100, label: "High", description: "", image: "" },
  ];

function defaultAiConfig(
  v?: ProfileEstimation["aiConfig"]
): AIProfileConfigFormValues {
  return {
    enabled: v?.enabled ?? false,
    model: v?.model ?? "gpt-4",
    prompt: v?.prompt ?? "",
    analysisType: v?.analysisType ?? "personality",
    outputFormat: v?.outputFormat ?? "category",
  };
}

/**
 * Build form default values from optional ProfileEstimation (for reset/initial).
 */
export function getDefaultFormValues(
  value?: ProfileEstimation
): ProfileEstimationFormValues {
  const percentageRanges =
    value?.percentageConfig?.ranges && value.percentageConfig.ranges.length > 0
      ? value.percentageConfig.ranges.map((r) => ({
          min: r.min,
          max: r.max,
          label: r.label,
          description: r.description ?? "",
          image: r.image ?? "",
        }))
      : DEFAULT_PERCENTAGE_RANGES;

  return {
    enabled: value?.enabled ?? false,
    type: value?.type ?? "percentage",
    aiConfig: defaultAiConfig(value?.aiConfig),
    percentageConfig: {
      title: value?.percentageConfig?.title ?? "",
      description: value?.percentageConfig?.description ?? "",
      ranges: percentageRanges,
      fieldScoring: value?.percentageConfig?.fieldScoring ?? [],
    },
    categoryConfig: {
      title: value?.categoryConfig?.title ?? "",
      categories: (() => {
        const cats = value?.categoryConfig?.categories;
        return cats && cats.length > 0
          ? cats.map((c) => {
              const rules = c.matchingLogic ?? [];
              return {
                id: c.id,
                name: c.name,
                description: c.description ?? "",
                image: c.image ?? "",
                matchingLogic:
                  rules.length > 0
                    ? {
                        operator: "AND" as const,
                        conditions: rules.map((r) => ({
                          fieldId: r.fieldId,
                          operator: r.operator,
                          value: r.value,
                        })),
                      }
                    : undefined,
              };
            })
          : [
              {
                id: generateStableId("cat"),
                name: "",
                description: "",
                image: "",
                matchingLogic:
                  undefined as ProfileEstimationFormValues["categoryConfig"]["categories"][0]["matchingLogic"],
              },
            ];
      })(),
    },
    dimensionConfig: {
      title: value?.dimensionConfig?.title ?? "",
      visualization: value?.dimensionConfig?.visualization ?? "bars",
      dimensions: (() => {
        const dims = value?.dimensionConfig?.dimensions;
        return dims && dims.length > 0
          ? dims
          : [
              {
                id: generateStableId("dim"),
                name: "",
                maxScore: 100,
                fields: [],
              },
            ];
      })(),
    },
    recommendationConfig: {
      title: value?.recommendationConfig?.title ?? "",
      recommendations: (() => {
        const recs = value?.recommendationConfig?.recommendations;
        return recs && recs.length > 0
          ? recs.map((r) => {
              const rules = r.matchingCriteria ?? [];
              return {
                id: r.id,
                name: r.name,
                description: r.description ?? "",
                image: r.image ?? "",
                matchingCriteria:
                  rules.length > 0
                    ? {
                        operator: "AND" as const,
                        conditions: rules.map((cr) => ({
                          fieldId: cr.fieldId,
                          operator: cr.operator,
                          value: cr.value,
                        })),
                      }
                    : undefined,
              };
            })
          : [
              {
                id: generateStableId("rec"),
                name: "",
                description: "",
                image: "",
                matchingCriteria:
                  undefined as ProfileEstimationFormValues["recommendationConfig"]["recommendations"][0]["matchingCriteria"],
              },
            ];
      })(),
    },
  };
}

/**
 * Convert current form values to ProfileEstimation for parent onChange.
 */
export function formValuesToProfileEstimation(
  values: ProfileEstimationFormValues
): ProfileEstimation | undefined {
  if (!values.enabled) return undefined;

  const result: ProfileEstimation = {
    enabled: true,
    type: values.type,
    aiConfig: values.aiConfig.enabled
      ? {
          enabled: true,
          model: values.aiConfig.model,
          prompt: values.aiConfig.prompt || undefined,
          analysisType: values.aiConfig.analysisType,
          outputFormat: values.aiConfig.outputFormat,
        }
      : undefined,
  };

  if (values.type === "percentage") {
    result.percentageConfig = {
      title: values.percentageConfig.title,
      description: values.percentageConfig.description,
      ranges: values.percentageConfig.ranges.map((r) => ({
        ...r,
        image: r.image || undefined,
      })),
      fieldScoring:
        values.percentageConfig.fieldScoring.length > 0
          ? values.percentageConfig.fieldScoring
          : undefined,
    };
  }

  if (values.type === "category") {
    result.categoryConfig = {
      title: values.categoryConfig.title,
      categories: values.categoryConfig.categories.map((c) => {
        const conditions = getConditionsFromGroupOrBlock(c.matchingLogic);
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          image: c.image || undefined,
          matchingLogic: conditions.map((cond) => ({
            fieldId: cond.fieldId,
            operator: cond.operator as ScoringRule["operator"],
            value: cond.value,
            weight: 1,
          })),
        };
      }),
    };
  }

  if (values.type === "multi_dimension") {
    result.dimensionConfig = {
      title: values.dimensionConfig.title,
      visualization: values.dimensionConfig.visualization,
      dimensions: values.dimensionConfig.dimensions,
    };
  }

  if (values.type === "recommendation") {
    result.recommendationConfig = {
      title: values.recommendationConfig.title,
      recommendations: values.recommendationConfig.recommendations.map((r) => {
        const conditions = getConditionsFromGroupOrBlock(r.matchingCriteria);
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image || undefined,
          matchingCriteria: conditions.map((cond) => ({
            fieldId: cond.fieldId,
            operator: cond.operator as ScoringRule["operator"],
            value: cond.value,
            weight: 1,
          })),
        };
      }),
    };
  }

  return result;
}
