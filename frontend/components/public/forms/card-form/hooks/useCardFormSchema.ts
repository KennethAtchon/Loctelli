import { useMemo } from "react";
import type { FormTemplate, FormField } from "@/lib/forms/types";
import type {
  FlowchartGraph,
  FlowchartNode,
} from "@/lib/forms/flowchart-types";
import { flowchartToSchema } from "@/lib/forms/flowchart-serialization";
import logger from "@/lib/logger";

/**
 * Hook to derive runtime schema and success card from template.
 * Pure derivation - no state, no effects.
 */
export function useCardFormSchema(template: FormTemplate): {
  schema: FormField[];
  successCard: FlowchartNode | null;
} {
  const flowchartGraph = useMemo(() => {
    const graph = (template.cardSettings as { flowchartGraph?: FlowchartGraph })
      ?.flowchartGraph;
    logger.debug("📋 useCardFormSchema: Flowchart graph derived", {
      hasFlowchartGraph: !!graph,
      nodeCount: graph?.nodes?.length ?? 0,
    });
    return graph;
  }, [template.cardSettings]);

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
