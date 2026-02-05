"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, List, LayoutGrid, Eye } from "lucide-react";
import { FlowchartCanvas } from "./flowchart-canvas";
import { CardSettingsPanel } from "./card-settings-panel";
import { ListView } from "./list-view";
import type {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
} from "@/lib/forms/flowchart-types";
import {
  flowchartToSchema,
  schemaToFlowchart,
  mergeFlowchartWithSchema,
} from "@/lib/forms/flowchart-serialization";
import { START_NODE_ID, END_NODE_ID } from "@/lib/forms/flowchart-types";
import type { FormField } from "@/lib/api";

export interface CardFormBuilderProps {
  schema: FormField[];
  cardSettings?: Record<string, unknown>;
  onSchemaChange: (schema: FormField[]) => void;
  onCardSettingsChange: (settings: Record<string, unknown>) => void;
  formSlug?: string;
}

export function CardFormBuilder({
  schema,
  cardSettings,
  onSchemaChange,
  onCardSettingsChange,
  formSlug,
}: CardFormBuilderProps) {
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [graph, setGraph] = useState<FlowchartGraph>(() => {
    const savedGraph = cardSettings?.flowchartGraph as
      | FlowchartGraph
      | undefined;
    if (savedGraph) {
      return mergeFlowchartWithSchema(savedGraph, schema);
    }
    return schemaToFlowchart(
      schema,
      cardSettings?.flowchartViewport as
        | { x: number; y: number; zoom: number }
        | undefined
    );
  });

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );

  const handleGraphChange = useCallback(
    (newGraph: FlowchartGraph) => {
      setGraph(newGraph);
      const newSchema = flowchartToSchema(newGraph);
      onSchemaChange(newSchema);
      onCardSettingsChange({
        ...cardSettings,
        flowchartGraph: newGraph,
        flowchartViewport: newGraph.viewport,
      });
    },
    [cardSettings, onSchemaChange, onCardSettingsChange]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<FlowchartNode["data"]>) => {
      const updatedNodes = graph.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
      );
      const updatedGraph = { ...graph, nodes: updatedNodes };
      handleGraphChange(updatedGraph);
      setSelectedNodeId(undefined);
    },
    [graph, handleGraphChange]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (nodeId === START_NODE_ID || nodeId === END_NODE_ID) return;
      const updatedNodes = graph.nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = graph.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      const updatedGraph = {
        ...graph,
        nodes: updatedNodes,
        edges: updatedEdges,
      };
      handleGraphChange(updatedGraph);
      setSelectedNodeId(undefined);
    },
    [graph, handleGraphChange]
  );

  const handleAddNode = useCallback(
    (type: "question" | "statement") => {
      const newNodeId = `node_${Date.now()}`;
      const lastQuestionNode = graph.nodes
        .filter((n) => n.type === "question" || n.type === "statement")
        .slice(-1)[0];
      const yPos = lastQuestionNode ? lastQuestionNode.position.y + 120 : 100;

      const newNode: FlowchartNode = {
        id: newNodeId,
        type,
        position: { x: 400, y: yPos },
        data:
          type === "statement"
            ? { statementText: "New statement", label: "New statement" }
            : {
                fieldId: newNodeId,
                label: "New question",
                fieldType: "text",
                field: {
                  id: newNodeId,
                  type: "text",
                  label: "New question",
                  required: false,
                },
              },
      };

      const newEdge = lastQuestionNode
        ? {
            id: `e-${lastQuestionNode.id}-${newNodeId}`,
            source: lastQuestionNode.id,
            target: newNodeId,
          }
        : {
            id: `e-${START_NODE_ID}-${newNodeId}`,
            source: START_NODE_ID,
            target: newNodeId,
          };

      const edgeBeforeEnd = graph.edges.find((e) => e.target === END_NODE_ID);
      const updatedEdges = [
        ...graph.edges.filter((e) => e.target !== END_NODE_ID),
        newEdge,
        edgeBeforeEnd
          ? { ...edgeBeforeEnd, source: newNodeId }
          : {
              id: `e-${newNodeId}-${END_NODE_ID}`,
              source: newNodeId,
              target: END_NODE_ID,
            },
      ];

      const updatedGraph = {
        ...graph,
        nodes: [...graph.nodes, newNode],
        edges: updatedEdges,
      };
      handleGraphChange(updatedGraph);
    },
    [graph, handleGraphChange]
  );

  const handlePreview = useCallback(() => {
    if (formSlug) {
      window.open(`/forms/card/${formSlug}`, "_blank");
    }
  }, [formSlug]);

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

      <div className="h-[600px] w-full mt-4">
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
              nodes={graph.nodes}
              onNodeClick={handleNodeClick}
              onNodeDelete={handleNodeDelete}
              onReorder={(orderedIds) => {
                const orderedNodes = orderedIds
                  .map((id) => graph.nodes.find((n) => n.id === id))
                  .filter(Boolean) as FlowchartNode[];
                const newEdges: FlowchartEdge[] = [];
                if (orderedNodes.length > 0) {
                  newEdges.push({
                    id: `e-${START_NODE_ID}-${orderedNodes[0].id}`,
                    source: START_NODE_ID,
                    target: orderedNodes[0].id,
                  });
                  for (let i = 0; i < orderedNodes.length - 1; i++) {
                    newEdges.push({
                      id: `e-${orderedNodes[i].id}-${orderedNodes[i + 1].id}`,
                      source: orderedNodes[i].id,
                      target: orderedNodes[i + 1].id,
                    });
                  }
                  newEdges.push({
                    id: `e-${orderedNodes[orderedNodes.length - 1].id}-${END_NODE_ID}`,
                    source: orderedNodes[orderedNodes.length - 1].id,
                    target: END_NODE_ID,
                  });
                }
                const updatedGraph = { ...graph, edges: newEdges };
                handleGraphChange(updatedGraph);
              }}
            />
          </div>
        )}
      </div>

      <CardSettingsPanel
        node={selectedNode ?? null}
        open={!!selectedNode}
        onOpenChange={(open) => {
          if (!open) setSelectedNodeId(undefined);
        }}
        onUpdate={handleNodeUpdate}
        onDelete={handleNodeDelete}
        formSlug={formSlug}
        allFields={schema}
      />
    </div>
  );
}
