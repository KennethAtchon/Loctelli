# Plan: Flowchart conditions — visible and built on the canvas

**Goal:** (1) Make branch conditions **visible** on the flowchart. (2) Let admins **build** conditions on the flowchart (edit conditions on edges), so the canvas is the primary way to define branching.

**Current problem:** Conditions only exist in node settings (and there's no Jump To UI yet). The flowchart doesn't show them, and you can't define "when Answer = Yes, go here" by working with the graph.

---

## Part A: Build conditions on the flowchart (source of truth = edges)

**Feasibility:** Yes. The types already support it: `FlowchartEdgeData` has optional `condition` and `label`. We make the **edge** the source of truth for branch conditions; schema/runtime is derived from the graph.

### Design: Edge as source of truth

- **Store condition on the edge:** When the user attaches a condition to an edge (e.g. "when Q1 = Yes"), we store it in `edge.data.condition` (and can derive `edge.data.label` for display). No duplicate storage on the node.
- **One "default" path per node:** From a question node, one outgoing edge can have **no** condition — that's the "else" / default next. All other outgoing edges have a condition. So: draw an edge from Q1 to Q2 (no condition) = default next is Q2; draw another edge from Q1 to Q3 with condition "Answer = Yes" = conditional branch to Q3.
- **Schema/runtime derived from graph:** When we build the schema (e.g. for save or runtime), we derive each question node's `field.conditionalLogic.jumpTo` from its **outgoing edges that have a condition**: each such edge becomes one `{ conditions, targetFieldId }` rule. The edge with no condition defines the **default next** card when no rule matches. That may require adding something like `defaultTargetId` to the runtime (or deriving it from the graph) so "when no jumpTo matches, go to this card" is explicit.

### UI: Building conditions on the flowchart

1. **Select an edge**  
   User clicks an edge (we need edge selection; enable `edgesDeletable` / selection so edges are interactive).

2. **Edge panel / popover**  
   When the selected element is an **edge** whose **source** is a question node (or statement, if we support it), show a small **Edge** panel (or popover near the edge) with:
   - **Condition builder** — same kind of UI as LogicBuilder (field, operator, value; AND/OR). "When should this path be taken?" If the user leaves it empty, this edge is treated as the **default** path from that source node.
   - Optional: short **label** override for the edge (otherwise we derive it from the condition).

3. **Only one default per source**  
   At most one outgoing edge per source node with no condition = default. If the user adds a condition to an edge that was the default, it becomes a conditional branch; we may need to auto-pick another outgoing edge as default (e.g. first in list) or prompt.

### Serialization: Graph → Schema (and runtime)

- **flowchartToSchema (or companion)**  
  When building `FormField[]` from the graph:
  - For each **question** node, look at its **outgoing edges**.
  - Edges **with** `data.condition` → add `{ conditions: edge.data.condition, targetFieldId: edge.target }` to that field's `conditionalLogic.jumpTo`.
  - The edge **without** a condition → that edge's `target` is the **default next** when no jumpTo rule matches.

- **Runtime**  
  Today `getJumpTarget(field, formData)` returns the first matching jumpTo or `null`. When `null`, the app likely goes to "next in order." To support arbitrary default targets from the flowchart, we need a way to say "if no jumpTo matches, go to **this** card" — e.g. add `defaultTargetId` to `ConditionalLogic` (or pass graph/defaults into the runtime) and use it when `getJumpTarget` returns null.

### Type / runtime tweak

- In `lib/forms/types.ts`, add optional `defaultTargetId?: string` to `ConditionalLogic` so the runtime knows where to go when no `jumpTo` rule matches.
- In `flowchart-serialization.ts`, when building each field from the graph, set both `jumpTo` (from edges with a condition) and `defaultTargetId` (from the edge without a condition, if any).

---

## Part B: Make conditions visible on the canvas

Once conditions live on edges (Part A), visibility is straightforward: any edge with `data.condition` (or `data.label`) is drawn as a **conditional** edge with a short label on the line.

### Design (visibility)

1. **Label on edge**  
   Use `edge.data.label` if set; otherwise derive a short string from `edge.data.condition` (e.g. "Q1 = Yes", "Score > 80") via a small formatter so the flowchart is readable at a glance.

2. **Edge type and styling**  
   Edges that have a condition use the **conditional** edge type (e.g. dashed line) and show the label on the edge. Edges with no condition stay default type; we can optionally show "Else" / "Default" on the default edge.

3. **Single source of truth**  
   Conditions are stored on the **edge** (Part A). Visibility just reads `edge.data.condition` / `edge.data.label` — no separate node-based derivation for branch logic.

---

## Implementation steps (combined)

### Phase 1: Edge as source of truth + build UI

1. **Types / runtime**  
   Add `defaultTargetId?: string` to `ConditionalLogic`. Update runtime (card form container / orchestrator) to use it when `getJumpTarget` returns null.

2. **Serialization**  
   In `flowchartToSchema` (or a dedicated helper), when building each question node's field: set `conditionalLogic.jumpTo` from outgoing edges that have `data.condition`; set `conditionalLogic.defaultTargetId` from the outgoing edge that has no condition (if exactly one such edge).

3. **Edge selection + Edge panel**  
   - In `FlowchartCanvas` / `CardFormBuilder`: track **selected edge** (e.g. `selectedEdgeId`). Pass `onEdgeClick` and ensure edges are selectable; enable `edgesDeletable` so Delete works.
   - Add **EdgeSettingsPanel** (or reuse a popover): when an edge is selected and its source is a question node, show LogicBuilder-style condition editor. "When should this path be taken?" — save to `edge.data.condition` (and optionally `edge.data.label`). Empty condition = this edge is the default path.
   - On save, call `onGraphChange` with updated edges (one edge's `data` updated).

4. **Default-edge rule**  
   If a source node has multiple outgoing edges and more than one has no condition, decide rule: e.g. "first in list is default" or show a warning and let user pick.

### Phase 2: Visibility on canvas

5. **Condition → short label (domain)**  
   Add `formatConditionGroup(group, fieldIdToLabel)` in `lib/forms/condition-labels.ts` (or similar). Produces e.g. "Q1 = Yes", "Score > 80 AND Q2 contains X".

6. **Enrich edges for display**  
   Before passing edges to React Flow: for edges that have `data.condition`, set `type: "conditional"` and set `data.label` from `formatConditionGroup` if not already set. Pass enriched list to React Flow (view-only; stored graph keeps raw `condition`).

7. **Conditional edge component**  
   Update `ConditionalEdge` to use `data.label` (or `label` prop); ensure label is readable (e.g. background/padding).

8. **Optional: "Else" label**  
   For the one outgoing edge per node that has no condition (when that node has at least one conditional edge), optionally show "Else" or "Default" on that edge.

### Phase 3: Documentation

9. **Architecture doc**  
   In `08-form-system.md`, document: conditions are built and stored on **edges**; schema/runtime derives `jumpTo` and `defaultTargetId` from the graph; conditions are visible on the flowchart as edge labels.

---

## Files to touch (summary)

| File | Change |
|------|--------|
| `lib/forms/types.ts` | Add `defaultTargetId?` to `ConditionalLogic` |
| `lib/forms/flowchart-serialization.ts` | Build `jumpTo` and `defaultTargetId` from graph edges |
| `lib/forms/condition-labels.ts` (new) | `formatConditionGroup(group, fieldIdToLabel)` → short string |
| Card form runtime (orchestrator/container) | Use `defaultTargetId` when `getJumpTarget` returns null |
| `card-form-builder.tsx` | Track selected edge; pass to Edge panel |
| `flowchart-canvas.tsx` | Edge selection callback; `edgesDeletable`; enrich edges for display |
| Edge panel / popover (new or extend) | Condition builder for selected edge; write to `edge.data.condition` |
| `edges/conditional-edge.tsx` | Use `data.label`; readable styling |
| `.helper/architecture/08-form-system.md` | Document edge-based conditions and visibility |

---

## Order of work

1. Types + serialization (graph → jumpTo + defaultTargetId).
2. Runtime: use defaultTargetId when getJumpTarget is null.
3. Edge selection + Edge panel with condition builder; persist to edge.data.
4. Condition formatter + enrich edges + ConditionalEdge label.
5. Optional "Else" label; docs.

After this, admins can build branching by drawing edges and setting conditions on those edges, and the flowchart clearly shows which condition leads where.
