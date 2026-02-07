"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
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
  const nodes = graph.nodes as Node[];
  const edges = graph.edges as Edge[];

  const onNodesChangeHandler: OnNodesChange = useCallback(
    (changes) => {
      const nextNodes = applyNodeChanges(changes, nodes) as FlowchartNode[];
      onGraphChange({
        ...graph,
        nodes: nextNodes,
      });
    },
    [graph, nodes, onGraphChange]
  );

  const onEdgesChangeHandler: OnEdgesChange = useCallback(
    (changes) => {
      const nextEdges = applyEdgeChanges(changes, edges) as FlowchartEdge[];
      onGraphChange({
        ...graph,
        edges: nextEdges,
      });
    },
    [graph, edges, onGraphChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: FlowchartEdge = {
        id: `e-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        type: "default",
      };
      onGraphChange({
        ...graph,
        edges: addEdge(newEdge as Edge, edges) as FlowchartEdge[],
      });
    },
    [graph, edges, onGraphChange]
  );

  const onNodeClickHandler = useCallback(
    (_event: React.MouseEvent, node: Node) => {
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
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
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
