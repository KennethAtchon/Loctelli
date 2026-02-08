/**
 * Full card form template JSON — same shape as the manual builder state.
 * flowchartGraph must use the canonical format from flowchart-serialization.ts
 * (edge ids e-{source}-{target}, positions y=100/220/340..., node data shape).
 * Export, Import, Load example, and AI prompt all use this same shape.
 */

import type { FormField, FormStyling, ProfileEstimation } from "./types";
import type { FlowchartGraph } from "./flowchart-types";
import type { FlowchartEdgeSpec } from "./flowchart-serialization";

export const CARD_FORM_TEMPLATE_JSON_VERSION = 1;

export type { FlowchartEdgeSpec };

export interface CardFormTemplateJson {
  /** Schema version for future migrations. */
  version?: number;
  /** Display: title, subtitle, buttons, success message. */
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  /** Flow: same as manual builder. Required for import/export/AI. */
  flowchartGraph?: FlowchartGraph;
  /** Optional: schema + flowchartEdges (we build graph from these if flowchartGraph missing). */
  schema?: FormField[];
  flowchartEdges?: FlowchartEdgeSpec[];
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
  const g = o.flowchartGraph as Record<string, unknown> | undefined;
  const hasGraph =
    g &&
    typeof g === "object" &&
    Array.isArray(g.nodes) &&
    Array.isArray(g.edges);
  const hasSchema =
    Array.isArray(o.schema) && (o.schema as unknown[]).length > 0;
  return Boolean(hasGraph || hasSchema);
}
