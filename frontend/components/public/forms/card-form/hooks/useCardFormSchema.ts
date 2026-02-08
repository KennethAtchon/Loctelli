import { useMemo } from "react";
import type { FormTemplate, FormField } from "@/lib/forms/types";
import type {
  FlowchartGraph,
  FlowchartNode,
} from "@/lib/forms/flowchart-types";
import {
  flowchartToSchema,
  validateFlowchartGraph,
} from "@/lib/forms/flowchart-serialization";
import logger from "@/lib/logger";

/**
 * Hook to derive runtime schema and success card from template.
 * Pure derivation - no state, no effects.
 * Validates flowchartGraph from API before use; falls back to template.schema if invalid.
 */
export function useCardFormSchema(template: FormTemplate): {
  schema: FormField[];
  successCard: FlowchartNode | null;
} {
  const flowchartGraph = useMemo(() => {
    const raw = template.cardSettings;
    const graph = (template.cardSettings as { flowchartGraph?: FlowchartGraph })
      ?.flowchartGraph;
    if (!graph) return undefined;
    const errs = validateFlowchartGraph(graph);
    if (errs.length > 0) {
      logger.warn(
        "📋 useCardFormSchema: invalid flowchartGraph from template, using template.schema",
        {
          templateId: template.id,
          errors: errs.slice(0, 5),
        }
      );
      return undefined;
    }
    logger.debug("📋 useCardFormSchema: flowchartGraph derived", {
      hasCardSettings: raw != null,
      cardSettingsKeys: raw && typeof raw === "object" ? Object.keys(raw) : [],
      hasFlowchartGraph: true,
      nodeCount: graph?.nodes?.length ?? 0,
      edgeCount: graph?.edges?.length ?? 0,
      templateId: template.id,
    });
    return graph;
  }, [template.cardSettings, template.id]);

  const schema = useMemo(() => {
    if (flowchartGraph) {
      const derivedSchema = flowchartToSchema(flowchartGraph);
      logger.debug("📋 useCardFormSchema: Schema derived from flowchart", {
        schemaLength: derivedSchema.length,
        fieldIds: derivedSchema.map((f) => f.id),
      });
      return derivedSchema;
    }
    const fallbackSchema = (template.schema ?? []) as FormField[];
    logger.debug("📋 useCardFormSchema: Using template schema", {
      schemaLength: fallbackSchema.length,
      fieldIds: fallbackSchema.map((f) => f.id),
    });
    return fallbackSchema;
  }, [flowchartGraph, template.schema]);

  const successCard = useMemo(() => {
    if (!flowchartGraph) {
      logger.debug("📋 useCardFormSchema: No flowchart graph, no success card");
      return null;
    }
    const card =
      flowchartGraph.nodes.find(
        (n) => n.type === "statement" && n.data?.isSuccessCard === true
      ) ?? null;
    logger.debug("📋 useCardFormSchema: Success card derived", {
      hasSuccessCard: !!card,
      successCardId: card?.id,
    });
    return card;
  }, [flowchartGraph]);

  return { schema, successCard };
}
