import type { Node, Edge } from "@xyflow/react";
import type { FormField } from "@/lib/api";

export const FLOWCHART_NODE_TYPES = [
  "start",
  "end",
  "question",
  "statement",
  "result",
] as const;
export type FlowchartNodeType = (typeof FLOWCHART_NODE_TYPES)[number];

export interface CardMedia {
  type: "image" | "video" | "gif" | "icon";
  url?: string;
  altText?: string;
  position: "above" | "below" | "background" | "left" | "right";
  /** Video-specific: source type */
  videoType?: "youtube" | "vimeo" | "upload";
  /** Video-specific: video ID for YouTube/Vimeo */
  videoId?: string;
}

export interface FlowchartNodeData {
  fieldId?: string;
  label?: string;
  fieldType?: string;
  /** Full field definition for question nodes */
  field?: FormField;
  /** Statement-only: display text */
  statementText?: string;
  /** Media (image/video/gif) for this card */
  media?: CardMedia;
}

export type FlowchartNode = Node<FlowchartNodeData, FlowchartNodeType>;
export type FlowchartEdge = Edge;

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
