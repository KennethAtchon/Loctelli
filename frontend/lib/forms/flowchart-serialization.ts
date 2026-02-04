import type { FormField } from "@/lib/api";
import type { FlowchartNodeData } from "./flowchart-types";
import type { FlowchartGraph, FlowchartNode } from "./flowchart-types";
import { START_NODE_ID, END_NODE_ID } from "./flowchart-types";

/**
 * Traverse graph from Start following edges (BFS) and return node ids in order.
 * Excludes start and end nodes.
 */
function getOrderedNodeIds(graph: FlowchartGraph): string[] {
  const outEdges = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source)!.push(e.target);
  }
  const ordered: string[] = [];
  const queue = outEdges.get(START_NODE_ID) ?? [];
  const visited = new Set<string>([START_NODE_ID]);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === END_NODE_ID || visited.has(id)) continue;
    visited.add(id);
    ordered.push(id);
    const next = outEdges.get(id) ?? [];
    for (const n of next) {
      if (!visited.has(n)) queue.push(n);
    }
  }
  return ordered;
}

/**
 * Build linear FormField[] from flowchart for the public form.
 * Question nodes contribute their data.field; statement nodes contribute a synthetic statement field.
 */
export function flowchartToSchema(graph: FlowchartGraph): FormField[] {
  const orderedIds = getOrderedNodeIds(graph);
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const schema: FormField[] = [];
  for (const id of orderedIds) {
    const node = nodeMap.get(id);
    if (!node) continue;
    const data = node.data ?? {};
    if (node.type === "question" && data.field) {
      const field = { ...data.field };
      // Include media from node data
      if (data.media) {
        field.media = data.media;
      }
      schema.push(field);
    } else if (node.type === "statement") {
      const statementField: FormField = {
        id: data.fieldId ?? node.id,
        type: "statement",
        label: data.statementText ?? data.label ?? "Statement",
        placeholder: data.label,
        required: false,
      };
      // Include media from node data
      if (data.media) {
        statementField.media = data.media;
      }
      schema.push(statementField);
    }
    // result nodes: skip for now (Phase 5)
  }
  return schema;
}

/**
 * Build default FlowchartGraph from linear schema (when no saved graph).
 */
export function schemaToFlowchart(
  schema: FormField[],
  viewport?: { x: number; y: number; zoom: number }
): FlowchartGraph {
  const nodes: FlowchartNode[] = [];
  const edges: { id: string; source: string; target: string }[] = [];

  nodes.push({
    id: START_NODE_ID,
    type: "start",
    position: { x: 400, y: 0 },
    data: {},
  });

  let y = 80;
  const stepY = 100;
  let prevId = START_NODE_ID;
  for (let i = 0; i < schema.length; i++) {
    const field = schema[i];
    const nodeId = field.id;
    nodes.push({
      id: nodeId,
      type: "question",
      position: { x: 400, y },
      data: {
        fieldId: field.id,
        label: field.label,
        fieldType: field.type,
        field: { ...field },
      },
    });
    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
    });
    prevId = nodeId;
    y += stepY;
  }

  nodes.push({
    id: END_NODE_ID,
    type: "end",
    position: { x: 400, y },
    data: {},
  });
  edges.push({
    id: `e-${prevId}-${END_NODE_ID}`,
    source: prevId,
    target: END_NODE_ID,
  });

  return {
    nodes,
    edges,
    viewport,
  };
}

/**
 * Merge saved flowchart graph with current schema: use saved nodes/edges/viewport,
 * and ensure every question/statement node has up-to-date field data from the given
 * schema (by matching field id). Used when loading a form that has both schema and flowchartGraph.
 */
export function mergeFlowchartWithSchema(
  graph: FlowchartGraph,
  schema: FormField[]
): FlowchartGraph {
  const schemaById = new Map(schema.map((f) => [f.id, f]));
  const nodes = graph.nodes.map((node) => {
    if (node.type === "question" && node.data?.fieldId) {
      const updated = schemaById.get(node.data.fieldId);
      if (updated) {
        return {
          ...node,
          data: {
            ...node.data,
            label: updated.label,
            fieldType: updated.type,
            field: updated,
          },
        };
      }
    }
    return node;
  });
  return { ...graph, nodes };
}
