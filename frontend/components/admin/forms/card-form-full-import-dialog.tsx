"use client";

import { useState } from "react";
import { Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type CardFormTemplateJson,
  CARD_FORM_TEMPLATE_JSON_VERSION,
  isCardFormTemplateJson,
} from "@/lib/forms/card-form-template-json";
import { schemaToFlowchart } from "@/lib/forms/flowchart-serialization";
import type { FormField } from "@/lib/forms/types";

interface CardFormFullImportDialogProps {
  onImport: (payload: CardFormTemplateJson) => void;
}

/** Same shape as manual builder: flowchartGraph (canonical nodes + edges). */
function getFullCardFormExample(): CardFormTemplateJson {
  const schema: FormField[] = [
    {
      id: "welcome",
      type: "statement",
      label: "Welcome! Answer a few questions to get your personalized result.",
    },
    {
      id: "name",
      type: "text",
      label: "What's your name?",
      placeholder: "Your name",
      required: true,
    },
    {
      id: "interest",
      type: "select",
      label: "What are you most interested in?",
      options: ["Option A", "Option B", "Option C"],
      required: true,
    },
    {
      id: "score",
      type: "radio",
      label: "On a scale of 1–3, how would you rate?",
      options: ["1", "2", "3"],
      required: true,
    },
  ];
  const flowchartGraph = schemaToFlowchart(schema);
  return {
    version: CARD_FORM_TEMPLATE_JSON_VERSION,
    title: "Quick Assessment",
    subtitle: "Get your personalized result in under a minute.",
    submitButtonText: "See my result",
    successMessage: "Thanks! We've received your answers.",
    flowchartGraph,
    cardSettings: {
      progressStyle: "bar",
      showProgressText: true,
      saveProgress: true,
      animationStyle: "slide",
    },
    styling: {
      fontFamily: { heading: "Inter", body: "Inter" },
      colors: {
        primary: "#0d9488",
        primaryForeground: "#ffffff",
        background: "#f9fafb",
        foreground: "#111827",
        card: "#ffffff",
        border: "#e5e7eb",
      },
      card: { borderRadius: 12, shadow: "md" },
      buttons: { borderRadius: 8, style: "solid" },
    },
    profileEstimation: {
      enabled: true,
      type: "percentage",
      percentageConfig: {
        title: "Your score",
        description: "Based on your answers.",
        fieldScoring: [
          {
            fieldId: "score",
            scoring: [
              { answer: "1", points: 25 },
              { answer: "2", points: 50 },
              { answer: "3", points: 75 },
            ],
          },
        ],
        ranges: [
          {
            min: 0,
            max: 33,
            label: "Getting started",
            description: "Keep exploring.",
          },
          {
            min: 34,
            max: 66,
            label: "On track",
            description: "You're doing well.",
          },
          {
            min: 67,
            max: 100,
            label: "Expert",
            description: "You've got this.",
          },
        ],
      },
    },
  };
}

export function CardFormFullImportDialog({
  onImport,
}: CardFormFullImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleLoadExample = () => {
    setJsonInput(JSON.stringify(getFullCardFormExample(), null, 2));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonInput) as unknown;
      if (!isCardFormTemplateJson(parsed)) {
        throw new Error(
          "Invalid card form JSON: must include flowchartGraph (nodes + edges in same shape as manual builder / Export)."
        );
      }
      onImport(parsed);
      setJsonInput("");
      setShowDialog(false);
      toast({
        title: "Card form imported",
        description: "Flow, styling, and profile estimation have been applied.",
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Invalid JSON",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import card form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import full card form</DialogTitle>
          <DialogDescription>
            Paste a full card form JSON to load flow, styling, profile
            estimation, and display settings in one go. This replaces the
            current card flow, theme, and results config.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col">
            <Label htmlFor="card-form-json-input">Card form JSON</Label>
            <Textarea
              id="card-form-json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "version": 1, "flowchartGraph": { "nodes": [...], "edges": [...] }, ... }'
              className="min-h-[240px] font-mono text-sm mt-1 resize-y"
            />
          </div>
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Load example
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setJsonInput("");
                  setShowDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!jsonInput.trim()}
              >
                Import card form
              </Button>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground flex-shrink-0">
            <strong>Format:</strong> Same as manual builder and Export:{" "}
            <code>flowchartGraph</code> with <code>nodes</code> (id, type,
            position, data) and <code>edges</code> (source, target). Question
            nodes: <code>data.field</code>; statement: <code>data.fieldId</code>
            , <code>data.statementText</code>, <code>data.label</code>.
            Optional: <code>title</code>, <code>cardSettings</code>,{" "}
            <code>styling</code>, <code>profileEstimation</code>. Use &quot;Load
            example&quot; or &quot;Export card form&quot;.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
