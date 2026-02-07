"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
} from "@/lib/forms/flowchart-types";
import { flowchartToSchema } from "@/lib/forms/flowchart-serialization";
import { START_NODE_ID, END_NODE_ID } from "@/lib/forms/flowchart-types";
import { getPipingDisplayToken } from "@/lib/forms/conditional-logic";
import type { FormField } from "@/lib/forms/types";
import { generateStableId } from "@/lib/utils/stable-id";

export interface UseCardFormBuilderProps {
  graph: FlowchartGraph;
  onGraphChange: (graph: FlowchartGraph) => void;
  formSlug?: string;
}

export interface UseCardFormBuilderReturn {
  // View state
  viewMode: "canvas" | "list";
  setViewMode: (
    mode: "canvas" | "list" | ((prev: "canvas" | "list") => "canvas" | "list")
  ) => void;
  // Selection
  selectedNodeId: string | undefined;
  selectedNode: FlowchartNode | undefined;
  handleNodeClick: (nodeId: string) => void;
  clearSelection: () => void;
  // Derived data
  orderedContentNodes: FlowchartNode[];
  schemaFromGraph: ReturnType<typeof flowchartToSchema>;
  // Graph actions
  handleGraphChange: (newGraph: FlowchartGraph) => void;
  selectedNodeIndex: number;
  handleNodeDelete: (nodeId: string) => void;
  handleAddNode: (type: "question" | "statement") => void;
  handleReorder: (orderedIds: string[]) => void;
  // Preview
  handlePreview: () => void;
}

/**
 * Encapsulates all card form builder state and graph logic.
 * Keeps CardFormBuilder as a thin UI layer.
 */
export function useCardFormBuilder({
  graph,
  onGraphChange,
  formSlug,
}: UseCardFormBuilderProps): UseCardFormBuilderReturn {
  const [viewMode, setViewMode] = useState<"canvas" | "list">("list");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId),
    [graph.nodes, selectedNodeId]
  );
  const selectedNodeIndex = useMemo(
    () =>
      selectedNodeId
        ? graph.nodes.findIndex((n) => n.id === selectedNodeId)
        : -1,
    [graph.nodes, selectedNodeId]
  );

  const orderedContentNodes = useMemo(() => {
    const schema = flowchartToSchema(graph);
    const ids = schema.map((f) => f.id);
    return ids
      .map((id) => graph.nodes.find((n) => n.id === id))
      .filter(Boolean) as FlowchartNode[];
  }, [graph]);

  const schemaFromGraph = useMemo(() => flowchartToSchema(graph), [graph]);

  const handleGraphChange = useCallback(
    (newGraph: FlowchartGraph) => {
      onGraphChange(newGraph);
    },
    [onGraphChange]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(undefined);
  }, []);

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (nodeId === START_NODE_ID || nodeId === END_NODE_ID) return;
      const updatedNodes = graph.nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = graph.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      handleGraphChange({ ...graph, nodes: updatedNodes, edges: updatedEdges });
      setSelectedNodeId(undefined);
    },
    [graph, handleGraphChange]
  );

  const handleAddNode = useCallback(
    (type: "question" | "statement") => {
      const newNodeId = generateStableId("node");
      const hasStart = graph.nodes.some((n) => n.id === START_NODE_ID);
      const hasEnd = graph.nodes.some((n) => n.id === END_NODE_ID);

      const nodesToAdd: FlowchartNode[] = [];
      if (!hasStart) {
        nodesToAdd.push({
          id: START_NODE_ID,
          type: "start",
          position: { x: 400, y: 0 },
          data: {},
        });
      }
      if (!hasEnd) {
        nodesToAdd.push({
          id: END_NODE_ID,
          type: "end",
          position: { x: 400, y: (graph.nodes.length + 1) * 100 },
          data: {},
        });
      }

      const lastContentNode = graph.nodes
        .filter((n) => n.type === "question" || n.type === "statement")
        .slice(-1)[0];
      const yPos = lastContentNode ? lastContentNode.position.y + 120 : 100;

      const existingSchema = flowchartToSchema(graph);
      const usedTokens = new Set(
        existingSchema.map((f: FormField) => getPipingDisplayToken(f))
      );
      let defaultPipingKey = "question";
      let n = 1;
      while (usedTokens.has(defaultPipingKey)) {
        defaultPipingKey = `question_${n}`;
        n += 1;
      }

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
                fieldType: "radio",
                field: {
                  id: newNodeId,
                  type: "radio",
                  label: "New question",
                  required: false,
                  options: ["Option 1", "Option 2"],
                  pipingKey: defaultPipingKey,
                },
              },
      };

      const newEdge = lastContentNode
        ? {
            id: `e-${lastContentNode.id}-${newNodeId}`,
            source: lastContentNode.id,
            target: newNodeId,
          }
        : {
            id: `e-${START_NODE_ID}-${newNodeId}`,
            source: START_NODE_ID,
            target: newNodeId,
          };

      const edgeBeforeEnd = graph.edges.find((e) => e.target === END_NODE_ID);
      const updatedEdges: FlowchartEdge[] = [
        ...graph.edges.filter((e) => e.target !== END_NODE_ID),
        newEdge as FlowchartEdge,
        edgeBeforeEnd
          ? { ...edgeBeforeEnd, source: newNodeId }
          : ({
              id: `e-${newNodeId}-${END_NODE_ID}`,
              source: newNodeId,
              target: END_NODE_ID,
            } as FlowchartEdge),
      ];

      handleGraphChange({
        ...graph,
        nodes: [...graph.nodes, ...nodesToAdd, newNode],
        edges: updatedEdges,
      });
    },
    [graph, handleGraphChange]
  );

  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      const orderedNodes = orderedIds
        .map((id) => graph.nodes.find((n) => n.id === id))
        .filter(Boolean) as FlowchartNode[];
      const newEdges: FlowchartEdge[] = [];
      const contentCount = orderedNodes.length - 2;
      if (contentCount > 0) {
        newEdges.push({
          id: `e-${START_NODE_ID}-${orderedNodes[1].id}`,
          source: START_NODE_ID,
          target: orderedNodes[1].id,
        } as FlowchartEdge);
        for (let i = 1; i < orderedNodes.length - 1; i++) {
          newEdges.push({
            id: `e-${orderedNodes[i].id}-${orderedNodes[i + 1].id}`,
            source: orderedNodes[i].id,
            target: orderedNodes[i + 1].id,
          } as FlowchartEdge);
        }
      }
      handleGraphChange({ ...graph, edges: newEdges });
    },
    [graph, handleGraphChange]
  );

  const handlePreview = useCallback(() => {
    if (formSlug) {
      window.open(`/forms/card/${formSlug}`, "_blank");
    }
  }, [formSlug]);

  return {
    viewMode,
    setViewMode,
    selectedNodeId,
    selectedNode,
    handleNodeClick,
    clearSelection,
    orderedContentNodes,
    schemaFromGraph,
    handleGraphChange,
    selectedNodeIndex,
    handleNodeDelete,
    handleAddNode,
    handleReorder,
    handlePreview,
  };
}
