import type { Node, Edge } from "@xyflow/react";
import type { FormField, ConditionGroup, CardMedia } from "./types";

export const FLOWCHART_NODE_TYPES = [
  "start",
  "end",
  "question",
  "statement",
  "result",
] as const;
export type FlowchartNodeType = (typeof FLOWCHART_NODE_TYPES)[number];

export interface FlowchartNodeData {
  fieldId?: string;
  label?: string;
  fieldType?: string;
  /** Full field definition for question nodes */
  field?: FormField;
  /** Statement-only: display text */
  statementText?: string;
  /** Statement-only: if true, this card is shown after form submission */
  isSuccessCard?: boolean;
  /** Media (image/video/gif) for this card */
  media?: CardMedia;
}

export interface FlowchartEdgeData {
  /** Condition for this edge (if present, edge is conditional) */
  condition?: ConditionGroup;
  /** Label shown on the edge */
  label?: string;
}

export type FlowchartNode = Node<
  FlowchartNodeData & Record<string, unknown>,
  FlowchartNodeType
>;
export type FlowchartEdge = Edge<FlowchartEdgeData & Record<string, unknown>>;

export interface FlowchartViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FlowchartGraph {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  viewport?: FlowchartViewport;
}

export const START_NODE_ID = "start";
export const END_NODE_ID = "end";
