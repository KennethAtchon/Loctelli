import type {
  ProfileEstimation,
  ScoringRule,
  FieldScoring,
  FormField,
} from "./types";
/**
 * Calculate percentage score based on field scoring
 */
export function calculatePercentageScore(
  answers: Record<string, unknown>,
  fields: FormField[],
  fieldScoring: FieldScoring[]
): number {
  let totalPoints = 0;
  let maxPoints = 0;

  for (const fieldScore of fieldScoring) {
    const field = fields.find((f) => f.id === fieldScore.fieldId);
    if (!field) continue;

    const answer = answers[fieldScore.fieldId];
    const scoringRule = fieldScore.scoring.find((s) => {
      if (Array.isArray(answer)) {
        return answer.includes(s.answer);
      }
      return String(s.answer) === String(answer);
    });

    if (scoringRule) {
      totalPoints += scoringRule.points;
    }

    // Calculate max possible for this field
    const maxForField = Math.max(...fieldScore.scoring.map((s) => s.points), 0);
    maxPoints += maxForField;
  }

  if (maxPoints === 0) return 0;
  return Math.round((totalPoints / maxPoints) * 100);
}

/**
 * Match category based on scoring rules
 */
export function matchCategory(
  answers: Record<string, unknown>,
  categories: NonNullable<
    NonNullable<ProfileEstimation["categoryConfig"]>["categories"]
  >
): { category: (typeof categories)[0]; score: number } | null {
  if (!categories || categories.length === 0) return null;

  let bestMatch = categories[0];
  let highestScore = 0;

  for (const category of categories) {
    let score = 0;
    let totalWeight = 0;

    for (const rule of category.matchingLogic) {
      const answer = answers[rule.fieldId];
      const weight = rule.weight || 1;
      totalWeight += weight;

      if (evaluateScoringRule(answer, rule)) {
        score += weight;
      }
    }

    // Normalize score to percentage
    const normalizedScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

    if (normalizedScore > highestScore) {
      highestScore = normalizedScore;
      bestMatch = category;
    }
  }

  return { category: bestMatch, score: Math.round(highestScore) };
}

/**
 * Calculate multi-dimension scores
 */
export function calculateMultiDimensionScores(
  answers: Record<string, unknown>,
  fields: FormField[],
  dimensions: NonNullable<ProfileEstimation["dimensionConfig"]>["dimensions"]
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const dimension of dimensions) {
    let totalPoints = 0;
    let maxPoints = 0;

    for (const fieldScore of dimension.fields) {
      const field = fields.find((f) => f.id === fieldScore.fieldId);
      if (!field) continue;

      const answer = answers[fieldScore.fieldId];
      const scoringRule = fieldScore.scoring.find((s) => {
        if (Array.isArray(answer)) {
          return answer.includes(s.answer);
        }
        return String(s.answer) === String(answer);
      });

      if (scoringRule) {
        totalPoints += scoringRule.points;
      }

      const maxForField = Math.max(
        ...fieldScore.scoring.map((s) => s.points),
        0
      );
      maxPoints += maxForField;
    }

    const percentage =
      maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    scores[dimension.id] = percentage;
  }

  return scores;
}

/**
 * Match recommendations based on scoring rules
 */
export function matchRecommendations(
  answers: Record<string, unknown>,
  recommendations: NonNullable<
    NonNullable<ProfileEstimation["recommendationConfig"]>["recommendations"]
  >
): Array<{ recommendation: (typeof recommendations)[0]; score: number }> {
  if (!recommendations || recommendations.length === 0) return [];

  const scored = recommendations.map((rec) => {
    let score = 0;
    let totalWeight = 0;

    for (const rule of rec.matchingCriteria) {
      const answer = answers[rule.fieldId];
      const weight = rule.weight || 1;
      totalWeight += weight;

      if (evaluateScoringRule(answer, rule)) {
        score += weight;
      }
    }

    const normalizedScore = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
    return {
      recommendation: rec,
      score: Math.round(normalizedScore),
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Evaluate a single scoring rule
 */
function evaluateScoringRule(answer: unknown, rule: ScoringRule): boolean {
  switch (rule.operator) {
    case "equals":
      if (Array.isArray(answer)) {
        return answer.includes(rule.value);
      }
      return String(answer) === String(rule.value);
    case "contains":
      if (Array.isArray(answer)) {
        return answer.some((a) =>
          String(a).toLowerCase().includes(String(rule.value).toLowerCase())
        );
      }
      return String(answer)
        .toLowerCase()
        .includes(String(rule.value).toLowerCase());
    case "greater_than":
      return Number(answer) > Number(rule.value);
    case "less_than":
      return Number(answer) < Number(rule.value);
    default:
      return false;
  }
}

/**
 * Calculate profile estimation result based on configuration
 */
export function calculateProfileEstimation(
  profileEstimation: ProfileEstimation,
  answers: Record<string, unknown>,
  fields: FormField[]
): {
  type: ProfileEstimation["type"];
  result: Record<string, unknown>;
} | null {
  if (!profileEstimation.enabled) return null;

  switch (profileEstimation.type) {
    case "percentage": {
      if (!profileEstimation.percentageConfig) return null;

      // For percentage, we need field scoring from the config
      // If fieldScoring is not configured, return 0
      const fieldScoring = (
        profileEstimation.percentageConfig as Record<string, unknown>
      ).fieldScoring as FieldScoring[] | undefined;
      const score = fieldScoring
        ? calculatePercentageScore(answers, fields, fieldScoring)
        : 0;

      const range =
        profileEstimation.percentageConfig.ranges.find(
          (r) => score >= r.min && score <= r.max
        ) || profileEstimation.percentageConfig.ranges[0];

      return {
        type: "percentage",
        result: {
          score: score as unknown,
          range: range?.label || "",
          description: range?.description || "",
        } as Record<string, unknown>,
      };
    }

    case "category": {
      if (!profileEstimation.categoryConfig) return null;
      const match = matchCategory(
        answers,
        profileEstimation.categoryConfig.categories
      );
      if (!match) return null;

      return {
        type: "category",
        result: {
          category: match.category,
          confidence: match.score,
        },
      };
    }

    case "multi_dimension": {
      if (!profileEstimation.dimensionConfig) return null;
      const scores = calculateMultiDimensionScores(
        answers,
        fields,
        profileEstimation.dimensionConfig.dimensions
      );

      return {
        type: "multi_dimension",
        result: {
          scores,
          dimensions: profileEstimation.dimensionConfig.dimensions,
          visualization: profileEstimation.dimensionConfig.visualization,
        },
      };
    }

    case "recommendation": {
      if (!profileEstimation.recommendationConfig) return null;
      const matches = matchRecommendations(
        answers,
        profileEstimation.recommendationConfig.recommendations
      );

      return {
        type: "recommendation",
        result: {
          recommendations: matches,
        },
      };
    }

    default:
      return null;
  }
}
