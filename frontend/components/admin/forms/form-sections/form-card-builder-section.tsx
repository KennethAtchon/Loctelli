"use client";

import { useCallback, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardFormBuilder } from "../card-form-builder";
import { CardFormFullImportDialog } from "../card-form-full-import-dialog";
import { CardFormAIBuilderModal } from "../card-form-ai-builder-modal";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";
import type { CardFormTemplateJson } from "@/lib/forms/card-form-template-json";

interface FormCardBuilderSectionProps {
  /** Graph owned by parent (single source of truth). */
  graph: FlowchartGraph;
  onGraphChange: (graph: FlowchartGraph) => void;
  /** Build full card form payload for export (flow, styling, profile, etc.). When provided, "Export card form" is shown. */
  getFullCardFormPayload?: () => CardFormTemplateJson;
  /** When user imports a full card form JSON. When provided, "Import card form" is shown. */
  onImportFullCardForm?: (payload: CardFormTemplateJson) => void;
  formSlug?: string;
  description?: string;
}

export function FormCardBuilderSection({
  graph,
  onGraphChange,
  getFullCardFormPayload,
  onImportFullCardForm,
  formSlug,
  description = "Build your interactive card form using the flowchart editor. Use Import card form / Export card form for a single JSON that includes flow, styling, and profile estimation.",
}: FormCardBuilderSectionProps) {
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleExportFullCardForm = useCallback(() => {
    if (!getFullCardFormPayload) return;
    const payload = getFullCardFormPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formSlug ?? "card-form"}-full.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getFullCardFormPayload, formSlug]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Card Form Builder</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {getFullCardFormPayload && onImportFullCardForm && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setAiModalOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Build with AI
                </Button>
              )}
              {getFullCardFormPayload && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportFullCardForm}
                  disabled={graph.nodes.length <= 2}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export card form
                </Button>
              )}
              {onImportFullCardForm && (
                <CardFormFullImportDialog onImport={onImportFullCardForm} />
              )}
            </div>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <CardFormBuilder
          graph={graph}
          onGraphChange={onGraphChange}
          formSlug={formSlug}
        />
      </CardContent>
      {getFullCardFormPayload && onImportFullCardForm && (
        <CardFormAIBuilderModal
          open={aiModalOpen}
          onOpenChange={setAiModalOpen}
          getFullCardFormPayload={getFullCardFormPayload}
          onImportFullCardForm={onImportFullCardForm}
        />
      )}
    </Card>
  );
}
