# 05 — The Flowchart System: How It Works

This document is a **deep dive on the flowchart**: what it is, where it lives, how it turns into the schema the runtime uses, and how the admin builder keeps them in sync. Read [01-types-and-form-template.md](./01-types-and-form-template.md) and [04-admin-panel-setup.md](./04-admin-panel-setup.md) first.

---

## What is the flowchart?

The flowchart is the **visual model** for a card form. It represents the form as a **graph** of **nodes** and **edges**:

- **Nodes** — Start, End, Question, Statement, (and optionally Result). Each question/statement node corresponds to one “card” (one step) in the public form.
- **Edges** — Connections between nodes. They define order and, optionally, conditional branching (e.g. “if answer is X, go to node Y”).

The **runtime** does not run the flowchart directly. It runs on a **linear list of fields** (`FormField[]`). That list is **derived** from the flowchart by traversing the graph and collecting question/statement nodes in order. So:

- **Editor source of truth:** flowchart graph (nodes + edges + viewport).
- **Runtime source of truth:** schema (`FormField[]`), which is derived from the graph when saving and stored on the template.

---

## Where the flowchart lives

- **In the database:** The template has `cardSettings` (JSON). Inside it, `cardSettings.flowchartGraph` holds the graph: `{ nodes, edges, viewport? }`.
- **In admin form state:** When editing a card form, the React form state holds `cardSettings.flowchartGraph` as the live graph. The **parent** (new/edit page) owns this state; the builder does not.
- **Controlled builder:** `CardFormBuilder` receives `graph` and `onGraphChange(graph)`. Every user action (add node, delete, reorder, edit in settings panel) calls `onGraphChange(updatedGraph)`; the parent updates `cardSettings.flowchartGraph` and re-renders. So there is **no local copy** of the graph inside the builder — single source of truth in the parent.

---

## Graph shape (types)

**File:** `frontend/lib/forms/flowchart-types.ts`

- **FlowchartGraph**  
  `{ nodes: FlowchartNode[], edges: FlowchartEdge[], viewport?: FlowchartViewport }`

- **FlowchartNode**  
  React Flow `Node` with `id`, `type` (`"start"` | `"end"` | `"question"` | `"statement"` | `"result"`), `position`, and `data`.  
  - Question nodes: `data.field` (full `FormField`), `data.fieldType`, `data.media`, etc.  
  - Statement nodes: `data.statementText`, `data.isSuccessCard`, `data.media`, etc.

- **FlowchartEdge**  
  `source`, `target`, optional `data.condition` / `data.label` for conditional edges.

- **Constants:** `START_NODE_ID = "start"`, `END_NODE_ID = "end"`.

---

## Graph → Schema: flowchartToSchema

**File:** `frontend/lib/forms/flowchart-serialization.ts`

**Purpose:** Turn the flowchart graph into the linear `FormField[]` that the public form and the backend use.

**Algorithm (conceptually):**

1. **Traverse from Start**  
   From the `start` node, follow edges in a BFS (breadth-first) order. Collect node ids in that order; skip `start` and `end`.

2. **Build schema in that order**  
   For each collected node id:
   - **Question node:** Push `data.field` (with `data.fieldType` as type) and optional `data.media` as one `FormField`.
   - **Statement node:** Unless `data.isSuccessCard === true`, push a synthetic statement `FormField` (id, type `"statement"`, label from `data.statementText` / `data.label`, optional media).
   - **Result node:** Skipped for the main flow (result screen is driven by profile estimation config, not a node in the linear schema).

So the **order of cards** at runtime is the **BFS order** from the graph. Branches (multiple out-edges from one node) mean multiple possible “next” nodes; the runtime uses conditional logic and jump rules to decide which node to show next, but the **schema** is still a single linear list; visibility and “next card” are computed at runtime from that list plus conditions.

---

## Schema → Graph: schemaToFlowchart

**File:** same, `flowchart-serialization.ts`

**Purpose:** Build a default graph when there is no saved flowchart (e.g. first time or migration). Used to produce an initial `FlowchartGraph` from a linear `FormField[]`:

- One `start` node, one `end` node.
- One node per field in schema order, connected in a chain: start → field1 → field2 → … → end.
- All nodes created as `question` type (statements are represented as fields with `type: "statement"`).

So: **schema → graph** is only for bootstrapping or fallback; the **editor** always works on the graph and derives schema from it.

---

## mergeFlowchartWithSchema

**Purpose:** When loading a template that has both a saved graph and a schema (e.g. after a backend fix or migration), merge them so that **graph structure** (nodes, edges, positions) is preserved but **field content** (labels, type, media) can be updated from the schema. Used when loading an existing card form so the builder shows the saved layout with up-to-date field data.

---

## How “add question” / “add statement” keeps parity

There is **no separate “add to schema” action** in the card form builder. Adding a card = adding a **node**:

- **Add Question** — Inserts a new question node and wires edges: from previous node (or start) to the new node, and from the new node to the next (or end). Reconnecting may involve updating multiple edges.
- **Add Statement** — Same idea with a statement node.

Because the schema is **derived** from the graph via `flowchartToSchema`:

- One new node ⇒ one new field in the derived schema.
- Delete node ⇒ that field disappears from the derived schema.
- Reorder (e.g. in list view) ⇒ edges are updated so the graph’s BFS order matches the new order ⇒ derived schema order changes.

So **parity is by design**: the graph is the only source of truth in the editor; schema is always `flowchartToSchema(graph)` when needed (profile estimation section, validation, save).

---

## Where schema is derived (and when)

| Use case | Where | When |
|----------|--------|------|
| Save template | New/Edit page | On submit: `flowchartToSchema(cardSettings.flowchartGraph)` → send `schema` + `cardSettings` |
| Profile estimation section | `useFormTemplateFormStateRHF` | `cardFormSchema` = `flowchartToSchema(graph)` so the list of fields is available for configuring rules |
| Card settings panel | CardFormBuilder / CardSettingsPanel | When opening settings for a node, “all fields” can be derived from the current graph for piping/conditional logic UI |

---

## Builder components (where to change things)

| Component | Role |
|-----------|------|
| **CardFormBuilder** | Top-level controlled component: receives `graph`, `onGraphChange`; toolbar (Add Question, Add Statement, List/Canvas, Preview); delegates to canvas or list view and to CardSettingsPanel. |
| **useCardFormBuilder** | Hook that holds view mode (canvas vs list), selection (selectedNodeId), and all graph mutations (add, delete, reorder); calls `onGraphChange` for every change. |
| **FlowchartCanvas** | React Flow canvas: renders nodes and edges; not the owner of the graph. |
| **ListView** | Linear list of cards; reorder updates edges so BFS order matches. |
| **CardSettingsPanel** | Side panel for the selected node: edit label, type, media, validation, showIf/hideIf/jumpTo/dynamicLabel; calls back to update node data → parent calls `onGraphChange`. |
| **Nodes** (`nodes/question-node.tsx`, etc.) | How each node type is rendered on the canvas. |
| **Edges** (`edges/conditional-edge.tsx`) | How edges (including conditional labels) are rendered. |

Serialization and BFS logic: **`frontend/lib/forms/flowchart-serialization.ts`**. Types: **`frontend/lib/forms/flowchart-types.ts`**.

---

## Sequence: user adds a question (high level)

```mermaid
sequenceDiagram
    participant Admin
    participant CardFormBuilder
    participant useCardFormBuilder
    participant Parent (EditPage)
    participant FormState

    Admin->>CardFormBuilder: Click "Add Question"
    CardFormBuilder->>useCardFormBuilder: handleAddNode("question")
    useCardFormBuilder->>useCardFormBuilder: Create new node + edges (insert after last content node or start)
    useCardFormBuilder->>Parent: onGraphChange(newGraph)
    Parent->>FormState: setValue("cardSettings", { ...cardSettings, flowchartGraph: newGraph })
    FormState->>CardFormBuilder: Re-render with new graph
    Note over CardFormBuilder: New node appears; schema is not stored separately
```

---

## Summary

- The **flowchart** is the graph (nodes + edges) stored in `cardSettings.flowchartGraph`.
- The **schema** is a linear `FormField[]` derived by **flowchartToSchema(graph)** (BFS from start, collect question/statement nodes).
- The builder is **controlled**: graph lives in the parent; **onGraphChange** is the only way to change it; schema is derived whenever needed, never stored separately in the builder.
- To add or change how cards are ordered or how schema is built, you touch **flowchart-serialization.ts** and/or the hook’s add/reorder/delete logic in **use-card-form-builder.ts**.

Next: [06-public-form-flow.md](./06-public-form-flow.md) — how a user opens a form by URL and how simple vs card runtime is chosen and run.
