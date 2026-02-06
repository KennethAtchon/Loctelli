"use client";

import { Button } from "@/components/ui/button";
import { Plus, List, LayoutGrid, Eye, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlowchartCanvas } from "./flowchart-canvas";
import { CardSettingsPanel } from "./card-settings-panel";
import { ListView } from "./list-view";
import { useCardFormBuilder } from "./hooks/use-card-form-builder";
import type { FlowchartGraph } from "@/lib/forms/flowchart-types";

export interface CardFormBuilderProps {
  /** Graph is owned by parent; builder is controlled. */
  graph: FlowchartGraph;
  onGraphChange: (graph: FlowchartGraph) => void;
  formSlug?: string;
}

export function CardFormBuilder({
  graph,
  onGraphChange,
  formSlug,
}: CardFormBuilderProps) {
  const {
    viewMode,
    setViewMode,
    selectedNodeId,
    selectedNode,
    handleNodeClick,
    clearSelection,
    orderedContentNodes,
    schemaFromGraph,
    handleGraphChange,
    handleNodeUpdate,
    handleNodeDelete,
    handleAddNode,
    handleReorder,
    handlePreview,
  } = useCardFormBuilder({ graph, onGraphChange, formSlug });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddNode("question")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddNode("statement")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Statement
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setViewMode((m) => (m === "canvas" ? "list" : "canvas"))
            }
          >
            {viewMode === "canvas" ? (
              <>
                <List className="h-4 w-4 mr-2" />
                List View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Canvas
              </>
            )}
          </Button>
          {formSlug && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3 w-full">
        {viewMode === "canvas" && (
          <Alert
            variant="default"
            className="border-amber-500/50 bg-amber-500/10"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Canvas view is a work in progress
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              The flowchart canvas may not work as expected. For a reliable
              experience, use{" "}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-amber-500/50 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/20"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="h-[600px] w-full">
          {viewMode === "canvas" ? (
            <FlowchartCanvas
              graph={graph}
              onGraphChange={handleGraphChange}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId}
            />
          ) : (
            <div className="h-full overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <ListView
                nodes={orderedContentNodes}
                onNodeClick={handleNodeClick}
                onNodeDelete={handleNodeDelete}
                onReorder={handleReorder}
              />
            </div>
          )}
        </div>
      </div>

      <CardSettingsPanel
        node={selectedNode ?? null}
        open={!!selectedNode}
        onOpenChange={(open) => {
          if (!open) clearSelection();
        }}
        onUpdate={handleNodeUpdate}
        onDelete={handleNodeDelete}
        formSlug={formSlug}
        allFields={schemaFromGraph}
      />
    </div>
  );
}
