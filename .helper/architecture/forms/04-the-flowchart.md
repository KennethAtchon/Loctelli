# 04 — The Flowchart System

The flowchart is the most complex part of the form system. This document explains how it works, piece by piece.

---

## Why a Flowchart?

Card forms need something Simple forms don't: **visual editing of a flow with branches**.

If you have a quiz where "Answer A" leads to questions 2-3-4 but "Answer B" skips to question 5, you can't represent that in a simple list. You need a graph.

```
                    ┌─────────┐
                    │  Start  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ Q1: Are │
                    │you a... │
                    └────┬────┘
                    ╱         ╲
           "Business"        "Individual"
                 ╱                 ╲
        ┌───────▼───────┐   ┌──────▼──────┐
        │ Q2: Company   │   │ Q3: What's  │
        │    name?      │   │ your goal?  │
        └───────┬───────┘   └──────┬──────┘
                │                   │
                └─────────┬─────────┘
                          │
                    ┌─────▼─────┐
                    │    End    │
                    └───────────┘
```

The flowchart lets admins build this visually.

---

## Two Representations of the Same Form

Card forms have **two** representations of the questions:

| What | Where | Purpose |
|------|-------|---------|
| **FlowchartGraph** | `cardSettings.flowchartGraph` | Visual editing. Has positions, edges, branches. |
| **Schema** | `template.schema` | Runtime. Linear list the form actually uses. |

**The graph is the source of truth.** When you save a Card form:

1. Graph is saved as-is to `cardSettings.flowchartGraph`
2. Graph is converted to linear schema via `flowchartToSchema()`
3. Both are stored on the template

Why keep both? Because:
- You can't recreate the graph from the schema (no positions, no edge routing, no branch labels)
- The runtime needs a simple list, not a graph

---

## FlowchartGraph Structure

```typescript
interface FlowchartGraph {
  nodes: FlowchartNode[];   // The boxes
  edges: FlowchartEdge[];   // The arrows
  viewport?: FlowchartViewport;  // Canvas pan/zoom
}
```

### Nodes

Every box on the canvas is a node:

```typescript
interface FlowchartNode {
  id: string;                    // Unique identifier
  type: "start" | "end" | "question" | "statement" | "result";
  position: { x: number, y: number };  // Canvas position
  data: FlowchartNodeData;       // Content varies by type
}
```

**Node types:**

| Type | What it is | `data` contains |
|------|-----------|-----------------|
| `start` | Entry point. Exactly one per graph. | `{ label: "Start" }` |
| `end` | Exit point. Exactly one per graph. | `{ label: "End" }` |
| `question` | A form field | `{ field: FormField, fieldType, label, media? }` |
| `statement` | Info display (no input) | `{ statementText, isSuccessCard?, media? }` |
| `result` | Result screen | `{ label }` |

### Edges

Edges connect nodes:

```typescript
interface FlowchartEdge {
  id: string;
  source: string;      // Node ID where arrow starts
  target: string;      // Node ID where arrow ends
  data?: {
    condition?: ConditionGroup;  // If present, this is a conditional branch
    label?: string;              // Text shown on the arrow
  }
}
```

**Edge types:**

| Type | What it means |
|------|---------------|
| No `data.condition` | Default path. Always followed. |
| Has `data.condition` | Conditional path. Only followed if condition matches. |

---

## Graph → Schema Conversion

The key function: `flowchartToSchema(graph)`

**Location:** `frontend/lib/forms/flowchart-serialization.ts`

**Algorithm:**

1. Start at the `start` node
2. BFS (breadth-first search) through edges
3. For each node visited (except start/end):
   - If `question`: Add `data.field` to schema
   - If `statement`: Add a synthetic field with `type: "statement"`
4. Return the ordered list

**What this means:**

- Schema order = BFS traversal order from start
- Branches are flattened into a single list
- The runtime uses conditional logic (on each field) to handle branching, not the edges

**Example:**

```
Graph:  start → Q1 → Q2 → Q3 → end
                 ↘ Q4 ↗

BFS order: Q1, Q2, Q4, Q3
Schema: [Q1, Q2, Q4, Q3]
```

The branch from Q1→Q4 and Q2→Q3 still exists in the schema, but as conditional logic on the fields, not as graph edges.

---

## Why Not Just Use the Graph at Runtime?

Good question. Here's why we derive a linear schema:

1. **Simpler runtime logic**: "Show field N, then field N+1" is easier than graph traversal
2. **Conditional logic lives on fields**: Each field has `showIf`/`hideIf`/`jumpTo`. The runtime checks these, not edges.
3. **Validation is linear**: "Is this field required? Check value." Works on a list.
4. **Profile estimation needs field list**: Scoring rules reference fields by ID; easier with a list.
5. **Session storage**: Store `currentCardIndex` (a number), not "current node in graph"

The graph is for **building**. The schema is for **running**.

---

## The Builder: How Changes Flow

The flowchart builder is a **controlled component**. It doesn't own the graph — the parent does.

```
┌─────────────────────────────────────────────────────────────┐
│ EditPage (or NewPage)                                       │
│                                                             │
│   formState.cardSettings.flowchartGraph ← source of truth   │
│                         │                                   │
│                         ▼                                   │
│   ┌─────────────────────────────────────────┐              │
│   │ FormCardBuilderSection                  │              │
│   │                                          │              │
│   │   props: graph, onGraphChange           │              │
│   │                         │                │              │
│   │                         ▼                │              │
│   │   ┌─────────────────────────────────┐   │              │
│   │   │ CardFormBuilder                 │   │              │
│   │   │                                  │   │              │
│   │   │  User clicks "Add Question"     │   │              │
│   │   │           │                      │   │              │
│   │   │           ▼                      │   │              │
│   │   │  Creates new node + edges       │   │              │
│   │   │           │                      │   │              │
│   │   │           ▼                      │   │              │
│   │   │  onGraphChange(newGraph)        │   │              │
│   │   └──────────────┬──────────────────┘   │              │
│   └──────────────────┼──────────────────────┘              │
│                      │                                      │
│                      ▼                                      │
│   setValue("cardSettings", { ...cardSettings,               │
│            flowchartGraph: newGraph })                      │
│                      │                                      │
│                      ▼                                      │
│   Component re-renders with new graph                       │
└─────────────────────────────────────────────────────────────┘
```

**Key point:** Every change goes through `onGraphChange`. The builder never mutates the graph directly.

---

## Adding a Question: Step by Step

When you click "Add Question":

1. **Create node**: New node with unique ID, position calculated from last node
2. **Update edges**: 
   - Find the last content node (or start if empty)
   - Remove edge from last → end
   - Add edge from last → new node
   - Add edge from new node → end
3. **Call onGraphChange**: Pass the updated graph to parent
4. **Parent updates state**: `setValue("cardSettings.flowchartGraph", newGraph)`
5. **Component re-renders**: New node appears on canvas

---

## Reordering: The List View

The builder has two views:
- **Canvas view**: Drag nodes around freely (React Flow)
- **List view**: Reorder questions in a simple list

When you reorder in list view:

1. Change the order of nodes in the array
2. Rebuild all edges to match new order: start → node1 → node2 → ... → end
3. Call onGraphChange

The list view is just a different way to edit the same graph.

---

## Canvas Positioning

When nodes are added or reordered, positions are calculated automatically:

```typescript
// Rough logic
const VERTICAL_SPACING = 100;

function calculatePosition(nodeIndex: number): Position {
  return {
    x: 250,  // Centered
    y: nodeIndex * VERTICAL_SPACING
  };
}
```

Positions are stored in the graph and preserved when saving. This is why the graph can't be reconstructed from schema — schema has no position info.

---

## Viewport

The viewport stores pan/zoom state:

```json
{
  "viewport": {
    "x": -50,    // Pan X
    "y": -100,   // Pan Y
    "zoom": 0.8  // Zoom level
  }
}
```

This is saved so the admin returns to the same view when editing later.

---

## Key Files

| File | What it does |
|------|--------------|
| `frontend/lib/forms/flowchart-types.ts` | Type definitions |
| `frontend/lib/forms/flowchart-serialization.ts` | `flowchartToSchema`, `schemaToFlowchart` |
| `frontend/components/admin/forms/card-form-builder/CardFormBuilder.tsx` | Main builder component |
| `frontend/components/admin/forms/card-form-builder/hooks/use-card-form-builder.ts` | Graph mutation logic |
| `frontend/components/admin/forms/card-form-builder/FlowchartCanvas.tsx` | React Flow canvas |
| `frontend/components/admin/forms/card-form-builder/ListView.tsx` | List reorder view |
| `frontend/components/admin/forms/card-form-builder/CardSettingsPanel.tsx` | Edit selected node |

---

## Common Operations

### Add a new node type

1. Add to `FLOWCHART_NODE_TYPES` in `flowchart-types.ts`
2. Create node component in `card-form-builder/nodes/`
3. Register in React Flow's `nodeTypes`
4. Update `flowchartToSchema` if it should produce a field

### Change how schema is derived

Edit `flowchartToSchema` in `flowchart-serialization.ts`

### Change node editing UI

Edit `CardSettingsPanel.tsx`

### Change canvas rendering

Edit `FlowchartCanvas.tsx` and the node components

---

## Next

Now let's see how users actually fill out forms: [05-public-form-flow.md](./05-public-form-flow.md)
