"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardFormBuilder } from "../card-form-builder";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";

interface FormCardBuilderSectionProps {
  /** Graph owned by parent (single source of truth). */
  graph: FlowchartGraph;
  onGraphChange: (graph: FlowchartGraph) => void;
  formSlug?: string;
  description?: string;
}

export function FormCardBuilderSection({
  graph,
  onGraphChange,
  formSlug,
  description = "Build your interactive card form using the flowchart editor",
}: FormCardBuilderSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Form Builder</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardFormBuilder
          graph={graph}
          onGraphChange={onGraphChange}
          formSlug={formSlug}
        />
      </CardContent>
    </Card>
  );
}
