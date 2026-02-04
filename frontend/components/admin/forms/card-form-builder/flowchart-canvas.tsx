"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
} from "@/lib/forms/flowchart-types";
import { StartNode } from "./nodes/start-node";
import { EndNode } from "./nodes/end-node";
import { QuestionNode } from "./nodes/question-node";
import { StatementNode } from "./nodes/statement-node";
import { ResultNode } from "./nodes/result-node";
import { ConditionalEdge } from "./edges/conditional-edge";

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  question: QuestionNode,
  statement: StatementNode,
  result: ResultNode,
};

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

export interface FlowchartCanvasProps {
  graph: FlowchartGraph;
  onGraphChange: (graph: FlowchartGraph) => void;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

export function FlowchartCanvas({
  graph,
  onGraphChange,
  onNodeClick,
  selectedNodeId: _selectedNodeId,
}: FlowchartCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges as Edge[]);

  // Sync external graph changes
  React.useEffect(() => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const graphNodeIds = new Set(graph.nodes.map((n) => n.id));
    const nodesChanged =
      nodes.length !== graph.nodes.length ||
      ![...nodeIds].every((id) => graphNodeIds.has(id)) ||
      nodes.some((n) => {
        const g = graph.nodes.find((gn) => gn.id === n.id);
        return !g || JSON.stringify(g) !== JSON.stringify(n);
      });
    if (nodesChanged) {
      setNodes(graph.nodes as Node[]);
    }
  }, [graph.nodes, nodes, setNodes]);

  React.useEffect(() => {
    const edgeIds = new Set(edges.map((e) => e.id));
    const graphEdgeIds = new Set(graph.edges.map((e) => e.id));
    const edgesChanged =
      edges.length !== graph.edges.length ||
      ![...edgeIds].every((id) => graphEdgeIds.has(id));
    if (edgesChanged) {
      setEdges(graph.edges as Edge[]);
    }
  }, [graph.edges, edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: FlowchartEdge = {
        id: `e-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        type: "default",
      };
      setEdges((eds) => addEdge(newEdge as Edge, eds));
      onGraphChange({
        nodes: nodes as FlowchartNode[],
        edges: [...edges, newEdge] as FlowchartEdge[],
        viewport: graph.viewport,
      });
    },
    [nodes, edges, graph.viewport, onGraphChange, setEdges]
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      const updatedNodes = changes.reduce((acc: Node[], change) => {
        if (
          change.type === "position" &&
          "dragging" in change &&
          change.dragging === false &&
          "id" in change &&
          change.id &&
          "position" in change &&
          change.position
        ) {
          return acc.map((n) =>
            n.id === change.id ? { ...n, position: change.position! } : n
          );
        }
        return acc;
      }, nodes);
      if (updatedNodes.length > 0) {
        onGraphChange({
          nodes: updatedNodes as FlowchartNode[],
          edges: edges as FlowchartEdge[],
          viewport: graph.viewport,
        });
      }
    },
    [nodes, edges, graph.viewport, onGraphChange, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (_changes: unknown[]) => {
      onEdgesChange(_changes as Parameters<typeof onEdgesChange>[0]);
      onGraphChange({
        nodes: nodes as FlowchartNode[],
        edges: edges as FlowchartEdge[],
        viewport: graph.viewport,
      });
    },
    [nodes, edges, graph.viewport, onGraphChange, onEdgesChange]
  );

  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  const defaultViewport = useMemo(
    () => graph.viewport ?? { x: 0, y: 0, zoom: 1 },
    [graph.viewport]
  );

  return (
    <div className="w-full h-full border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        fitView
        className="bg-muted/20"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
