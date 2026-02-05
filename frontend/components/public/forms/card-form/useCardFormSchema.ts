import { useMemo } from "react";
import type { FormTemplate, FormField } from "@/lib/forms/types";
import type { FlowchartGraph, FlowchartNode } from "@/lib/forms/flowchart-types";
import { flowchartToSchema } from "@/lib/forms/flowchart-serialization";

/**
 * Hook to derive runtime schema and success card from template.
 * Pure derivation - no state, no effects.
 */
export function useCardFormSchema(template: FormTemplate): {
  schema: FormField[];
  successCard: FlowchartNode | null;
} {
  const flowchartGraph = useMemo(() => {
    return (template.cardSettings as { flowchartGraph?: FlowchartGraph })
      ?.flowchartGraph;
  }, [template.cardSettings]);

  const schema = useMemo(() => {
    if (flowchartGraph) {
      return flowchartToSchema(flowchartGraph);
    }
    return (template.schema ?? []) as FormField[];
  }, [flowchartGraph, template.schema]);

  const successCard = useMemo(() => {
    if (!flowchartGraph) return null;
    return (
      flowchartGraph.nodes.find(
        (n) => n.type === "statement" && n.data?.isSuccessCard === true
      ) ?? null
    );
  }, [flowchartGraph]);

  return { schema, successCard };
}
