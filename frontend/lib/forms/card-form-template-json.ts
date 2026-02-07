/**
 * Full card form template JSON — a single payload that defines the entire card form:
 * flow (flowchart), display text, card settings, styling (CSS layer), profile estimation
 * (personality/results), and conditional logic (lives on fields in the graph).
 *
 * This is separate from the simple-form schema format. Use "Import card form" / "Export card form"
 * for this format; use "Import JSON" / "Export JSON" for schema-only (linear FormField[]).
 */

import type { FormStyling, ProfileEstimation } from "./types";
import type { FlowchartGraph } from "./flowchart-types";

export const CARD_FORM_TEMPLATE_JSON_VERSION = 1;

export interface CardFormTemplateJson {
  /** Schema version for future migrations. */
  version?: number;
  /** Display: title, subtitle, buttons, success message. */
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  /** Flow: full flowchart (nodes, edges, viewport). Preserves positions, branching, conditions. */
  flowchartGraph: FlowchartGraph;
  /** Card behavior: progress style, save progress, animation, etc. */
  cardSettings?: Record<string, unknown>;
  /** Theme / CSS layer: fonts, colors, card style, buttons, progress, result screen. */
  styling?: FormStyling | null;
  /** Results / personality: percentage, category, multi-dimension, recommendation, AI. */
  profileEstimation?: ProfileEstimation | null;
}

export function isCardFormTemplateJson(
  value: unknown
): value is CardFormTemplateJson {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (!o.flowchartGraph || typeof o.flowchartGraph !== "object") return false;
  const g = o.flowchartGraph as Record<string, unknown>;
  return Array.isArray(g.nodes) && Array.isArray(g.edges);
}
