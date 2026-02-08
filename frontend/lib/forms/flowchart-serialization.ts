import type { FormField } from "./types";
import type {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
} from "./flowchart-types";
import { START_NODE_ID, END_NODE_ID } from "./flowchart-types";

const CANONICAL_NODE_TYPES = new Set<string>([
  "start",
  "end",
  "question",
  "statement",
]);

/** Valid FormField.type values (must match types.FormFieldType). Used so schema/rendering never see invalid types. */
const FORM_FIELD_TYPES = new Set<string>([
  "text",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "file",
  "image",
  "statement",
]);

/** Option-based field types that require data.field.options to be an array. */
const OPTION_FIELD_TYPES = new Set<string>(["select", "radio", "checkbox"]);

/**
 * Canonical flowchart format (single source of truth for manual builder, import, export, AI):
 * - Edge id: "e-{source}-{target}" (e.g. "e-start-welcome"). Duplicate (source,target) may use "e-{source}-{target}-{n}".
 * - Positions: start at (400,0); first content node y=100; each next +120 (100, 220, 340, ...); end at last y.
 * - Nodes: source/target (not from/to); question nodes have data.field (full FormField), data.fieldId, data.label, data.fieldType; statement nodes have data.fieldId, data.statementText, data.label, data.isSuccessCard; types lowercase "start"|"end"|"question"|"statement".
 * AI prompt (card-form-ai-prompt.config.ts) and frontend Load example (schemaToFlowchart / buildFlowchartFromSchemaAndEdges) must match this.
 */

/**
 * Validates that a flowchart graph matches the canonical shape and that all consumers
 * (flowchartToSchema, React Flow, card settings, public form) will not hit runtime errors.
 * Returns an array of error messages; empty means valid.
 */
export function validateFlowchartGraph(graph: FlowchartGraph): string[] {
  const errors: string[] = [];

  if (!graph || typeof graph !== "object") {
    errors.push("flowchartGraph must be an object");
    return errors;
  }
  if (!Array.isArray(graph.nodes))
    errors.push("flowchartGraph.nodes must be an array");
  if (!Array.isArray(graph.edges))
    errors.push("flowchartGraph.edges must be an array");
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  const nodeIds = new Set<string>();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node == null || typeof node !== "object") {
      errors.push(`nodes[${i}]: must be an object`);
      continue;
    }
    if (typeof node.id !== "string" || node.id === "") {
      errors.push(`nodes[${i}]: missing or invalid 'id' (string required)`);
    } else {
      if (nodeIds.has(node.id))
        errors.push(`nodes[${i}]: duplicate node id "${node.id}"`);
      nodeIds.add(node.id);
    }
    const type = node.type;
    if (typeof type !== "string" || !CANONICAL_NODE_TYPES.has(type)) {
      errors.push(
        `nodes[${i}] (id=${node.id}): type must be one of: start, end, question, statement (lowercase)`
      );
    }
    const pos = node.position;
    if (
      pos == null ||
      typeof pos !== "object" ||
      typeof pos.x !== "number" ||
      typeof pos.y !== "number"
    ) {
      errors.push(
        `nodes[${i}] (id=${node.id}): position must be { x: number, y: number }`
      );
    }
    const data = node.data ?? {};
    if (type === "question") {
      const field = data.field;
      if (!field || typeof field !== "object") {
        errors.push(
          `nodes[${i}] (question): missing 'data.field' (full FormField object)`
        );
      } else {
        const f = field as FormField;
        if (typeof f.id !== "string")
          errors.push(`nodes[${i}].data.field: missing id`);
        if (typeof f.type !== "string")
          errors.push(`nodes[${i}].data.field: missing type`);
        else if (!FORM_FIELD_TYPES.has(f.type)) {
          errors.push(
            `nodes[${i}].data.field: type must be one of: ${[...FORM_FIELD_TYPES].join(", ")}`
          );
        }
        if (typeof f.label !== "string")
          errors.push(`nodes[${i}].data.field: missing label`);
        if (
          OPTION_FIELD_TYPES.has(f.type) &&
          f.options !== undefined &&
          !Array.isArray(f.options)
        ) {
          errors.push(
            `nodes[${i}].data.field: options must be an array for type "${f.type}"`
          );
        }
      }
    }
    if (type === "statement") {
      if (typeof data.fieldId !== "string")
        errors.push(`nodes[${i}] (statement): missing data.fieldId`);
      if (typeof data.statementText !== "string")
        errors.push(`nodes[${i}] (statement): missing data.statementText`);
      if (typeof data.label !== "string")
        errors.push(`nodes[${i}] (statement): missing data.label`);
    }
  }

  let startCount = 0;
  let endCount = 0;
  for (const node of nodes) {
    if (node?.type === "start") {
      startCount++;
      if (node.id !== START_NODE_ID) {
        errors.push(
          `Node with type "start" must have id "${START_NODE_ID}" (found "${node.id}")`
        );
      }
    }
    if (node?.type === "end") {
      endCount++;
      if (node.id !== END_NODE_ID) {
        errors.push(
          `Node with type "end" must have id "${END_NODE_ID}" (found "${node.id}")`
        );
      }
    }
  }
  if (startCount !== 1)
    errors.push(`Exactly one "start" node required (found ${startCount})`);
  if (endCount !== 1)
    errors.push(`Exactly one "end" node required (found ${endCount})`);

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e == null || typeof e !== "object") {
      errors.push(`edges[${i}]: must be an object`);
      continue;
    }
    if (typeof e.source !== "string") {
      errors.push(
        `edges[${i}]: missing or invalid 'source' (use source/target, not from/to)`
      );
    } else if (!nodeIds.has(e.source)) {
      errors.push(
        `edges[${i}]: source "${e.source}" does not match any node id`
      );
    }
    if (typeof e.target !== "string") {
      errors.push(`edges[${i}]: missing or invalid 'target'`);
    } else if (!nodeIds.has(e.target)) {
      errors.push(
        `edges[${i}]: target "${e.target}" does not match any node id`
      );
    }
  }

  if (
    errors.length === 0 &&
    nodeIds.has(START_NODE_ID) &&
    nodeIds.has(END_NODE_ID)
  ) {
    const reachable = new Set<string>();
    const queue = [START_NODE_ID];
    reachable.add(START_NODE_ID);
    const outEdges = new Map<string, string[]>();
    for (const edge of edges) {
      if (
        typeof edge?.source === "string" &&
        typeof edge?.target === "string"
      ) {
        if (!outEdges.has(edge.source)) outEdges.set(edge.source, []);
        outEdges.get(edge.source)!.push(edge.target);
      }
    }
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const t of outEdges.get(id) ?? []) {
        if (!reachable.has(t)) {
          reachable.add(t);
          queue.push(t);
        }
      }
    }
    if (!reachable.has(END_NODE_ID)) {
      errors.push(
        "No path from start node to end node (graph is disconnected)"
      );
    }
  }

  return errors;
}

/**
 * Traverse graph from Start following edges (BFS) and return node ids in order.
 * Excludes start and end nodes. Expects a normalized graph (edges have source/target).
 */
function getOrderedNodeIds(graph: FlowchartGraph): string[] {
  const outEdges = new Map<string, string[]>();
  for (const e of graph.edges) {
    const src = e.source;
    const tgt = e.target;
    if (typeof src !== "string" || typeof tgt !== "string") continue;
    if (!outEdges.has(src)) outEdges.set(src, []);
    outEdges.get(src)!.push(tgt);
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
 * Expects a normalized graph (question nodes have data.field).
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
      const field: FormField = {
        ...data.field,
        type: (data.fieldType as FormField["type"]) ?? data.field.type,
      };
      if (data.media) {
        field.media = data.media;
      }
      schema.push(field);
    } else if (node.type === "statement") {
      if (data.isSuccessCard === true) continue;
      const statementField: FormField = {
        id: data.fieldId ?? node.id,
        type: "statement",
        label: data.statementText ?? data.label ?? "Statement",
        placeholder: data.label,
        required: false,
      };
      if (data.media) {
        statementField.media = data.media;
      }
      schema.push(statementField);
    }
  }
  return schema;
}

/** Edge list format: source and target node ids (e.g. from AI or import). */
export interface FlowchartEdgeSpec {
  source: string;
  target: string;
}

/**
 * Build a canonical FlowchartGraph from schema + edge list. This is the only way
 * we produce graph node shapes from external content (e.g. AI): we never accept
 * raw nodes from outside, we build them here so the format is always correct.
 * Use for "Build with AI" when the payload has schema + flowchartEdges.
 */
export function buildFlowchartFromSchemaAndEdges(
  schema: FormField[],
  edgeSpecs: FlowchartEdgeSpec[],
  viewport?: { x: number; y: number; zoom: number }
): FlowchartGraph {
  const schemaById = new Map(schema.map((f) => [f.id, f]));
  const outEdges = new Map<string, string[]>();
  for (const e of edgeSpecs) {
    const src = e.source;
    const tgt = e.target;
    if (typeof src !== "string" || typeof tgt !== "string") continue;
    if (!outEdges.has(src)) outEdges.set(src, []);
    outEdges.get(src)!.push(tgt);
  }
  const orderedIds: string[] = [];
  const queue = outEdges.get(START_NODE_ID) ?? [];
  const visited = new Set<string>([START_NODE_ID]);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === END_NODE_ID) {
      if (!orderedIds.includes(END_NODE_ID)) orderedIds.push(END_NODE_ID);
      continue;
    }
    if (visited.has(id)) continue;
    visited.add(id);
    orderedIds.push(id);
    const next = outEdges.get(id) ?? [];
    for (const n of next) {
      if (n !== END_NODE_ID && !visited.has(n)) queue.push(n);
    }
  }
  if (!orderedIds.includes(END_NODE_ID)) orderedIds.push(END_NODE_ID);

  const nodes: FlowchartNode[] = [];
  const stepY = 120;
  let y = 100;
  nodes.push({
    id: START_NODE_ID,
    type: "start",
    position: { x: 400, y: 0 },
    data: {},
  });
  for (const nodeId of orderedIds) {
    if (nodeId === END_NODE_ID) break;
    const field = schemaById.get(nodeId);
    if (!field) continue;
    if (field.type === "statement") {
      nodes.push({
        id: field.id,
        type: "statement",
        position: { x: 400, y },
        data: {
          fieldId: field.id,
          label: field.label,
          statementText: field.label,
          isSuccessCard: false,
          media: field.media,
        },
      });
    } else {
      nodes.push({
        id: field.id,
        type: "question",
        position: { x: 400, y },
        data: {
          fieldId: field.id,
          label: field.label,
          fieldType: field.type,
          field: { ...field },
          media: field.media,
        },
      });
    }
    y += stepY;
  }
  nodes.push({
    id: END_NODE_ID,
    type: "end",
    position: { x: 400, y },
    data: {},
  });

  const edgeIdCount = new Map<string, number>();
  const edges: FlowchartEdge[] = edgeSpecs.map((e) => {
    const key = `${e.source}-${e.target}`;
    const n = edgeIdCount.get(key) ?? 0;
    edgeIdCount.set(key, n + 1);
    const id =
      n === 0 ? `e-${e.source}-${e.target}` : `e-${e.source}-${e.target}-${n}`;
    return { id, source: e.source, target: e.target } as FlowchartEdge;
  });

  return {
    nodes,
    edges,
    viewport,
  };
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

  let y = 100;
  const stepY = 120;
  let prevId = START_NODE_ID;
  for (let i = 0; i < schema.length; i++) {
    const field = schema[i];
    const nodeId = field.id;
    if (field.type === "statement") {
      nodes.push({
        id: nodeId,
        type: "statement",
        position: { x: 400, y },
        data: {
          fieldId: field.id,
          label: field.label,
          statementText: field.label,
          isSuccessCard: false,
          media: field.media,
        },
      });
    } else {
      nodes.push({
        id: nodeId,
        type: "question",
        position: { x: 400, y },
        data: {
          fieldId: field.id,
          label: field.label,
          fieldType: field.type,
          field: { ...field },
          media: field.media,
        },
      });
    }
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
 *
 * IMPORTANT: The graph is the source of truth - we preserve ALL nodes from the graph.
 * Schema is only used to update field data, not to add/remove nodes.
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
      // If schema doesn't have this node, keep the node as-is (graph is source of truth)
    } else if (node.type === "statement") {
      // For statements, update from schema if available, but preserve the node
      const updated = schemaById.get(node.data?.fieldId ?? node.id);
      if (updated && updated.type === "statement") {
        return {
          ...node,
          data: {
            ...node.data,
            statementText: updated.label,
            label: updated.label,
          },
        };
      }
    }
    // Preserve all other nodes (start, end, or nodes not in schema)
    return node;
  });
  return { ...graph, nodes };
}
