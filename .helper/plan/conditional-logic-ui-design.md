# Conditional Logic UI – Design Document

## 1. Context and goals

### 1.1 Why “Available IDs” is essential

- **Field IDs are randomly generated** (e.g. node IDs from the flowchart). Users cannot guess or type them.
- **Piping** uses `{{fieldId}}` in labels/placeholders; **conditional logic** uses field IDs when choosing “which field” in a condition.
- Without a clear list of **available field IDs** (with human-readable labels), admins cannot reliably:
  - Reference the right field in piping.
  - Build conditions that reference the correct question.
- Therefore the **“Available IDs (earlier questions)”** list (and equivalent for logic) is **strictly necessary**, not optional. The UI must always expose which IDs exist and what they represent (e.g. label + ID).

### 1.2 Current gaps

- **UI only implements Show If**  
  Backend and types already support `showIf`, `hideIf`, `jumpTo`, `dynamicLabel`. Only **Show this field if** is wired in the card settings panel.
- **No Hide If, Jump to, or Dynamic label** in the admin UI.
- **Complex logic not representable**  
  Today a condition is a single **ConditionGroup**: one operator (AND or OR) and a flat list of conditions. That cannot express:
  - “(A and B) **or** (C and D)”
  - “(A or B) **and** (C or D)”
- **Field picker** in Logic Builder does not emphasize that IDs are opaque; showing “label + ID” (or ID in tooltip) would align with the need for “available IDs” everywhere.

---

## 2. Current data model (reference)

From `frontend/lib/forms/types.ts`:

```ts
interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}

interface ConditionalLogic {
  showIf?: ConditionGroup;
  hideIf?: ConditionGroup;
  jumpTo?: { conditions: ConditionGroup; targetFieldId: string }[];
  dynamicLabel?: { conditions: ConditionGroup; label: string }[];
}
```

- **Runtime** (`conditional-logic.ts`) already evaluates `showIf`, `hideIf`, `jumpTo`, `dynamicLabel`; no backend change required for adding UI for the latter three.
- **Limitation**: Each of `showIf` / `hideIf` is a **single** `ConditionGroup`. So we can only express one AND-group or one OR-group, not “(group1) OR (group2)”.

---

## 3. Complex logic: data model extension

To support expressions like “Show if (A and B) OR (C and D)” we need one level of grouping above the current `ConditionGroup`.

### 3.1 Option A – Top-level “group of groups” (recommended)

Introduce a structure that combines **multiple** `ConditionGroup`s with a single top-level operator:

```ts
/** One group of conditions (all AND or all OR) */
interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}

/** Top-level: match any of these groups / all of these groups */
interface ConditionBlock {
  operator: "AND" | "OR";  // between groups
  groups: ConditionGroup[];
}

// Then:
interface ConditionalLogic {
  showIf?: ConditionGroup | ConditionBlock;  // backward compatible
  hideIf?: ConditionGroup | ConditionBlock;
  jumpTo?: { conditions: ConditionGroup | ConditionBlock; targetFieldId: string }[];
  dynamicLabel?: { conditions: ConditionGroup | ConditionBlock; label: string }[];
}
```

- **Backward compatible**: A single `ConditionGroup` is still valid; runtime can treat “single group” as “one group in a block” (e.g. `{ operator: "AND", groups: [showIf] }`).
- **Expressive**: “(A and B) OR (C and D)” → `{ operator: "OR", groups: [ { operator: "AND", conditions: [A,B] }, { operator: "AND", conditions: [C,D] } ] }`.
- **One level only**: No recursive nesting; keeps UI and evaluation simple.

### 3.2 Option B – Recursive nesting

Allow `ConditionGroup.conditions` to be `(Condition | ConditionGroup)[]`. Maximum flexibility but more complex UI and evaluation; not recommended for v1.

### 3.3 Runtime evaluation

- Add a small helper, e.g. `evaluateConditionBlock(block: ConditionGroup | ConditionBlock, formData)`:
  - If it’s a single `ConditionGroup`, call existing `evaluateConditionGroup`.
  - If it’s a `ConditionBlock`, evaluate each group, then combine with `block.operator` (AND/OR).
- Use this in `shouldShowField`, `getJumpTarget`, `getDynamicLabel` wherever we currently pass a single group.

---

## 4. UI design: conditional logic section

### 4.1 Placement and structure

- **Location**: Same “Conditional Logic & Piping” area in the card settings panel (question cards only).
- **Order** (top to bottom):
  1. **Piping** (existing: Enable piping + “How to use” + **Available IDs (earlier questions)**).
  2. **Show this field if** (enhanced – see 4.3).
  3. **Hide this field if** (new).
  4. **Jump to** (new).
  5. **Dynamic label** (new).

Each of 2–5 is collapsible (e.g. `Collapsible` with a clear heading) so the panel doesn’t overwhelm.

### 4.2 Field picker and “Available IDs”

- **Every place** that selects a “field” (conditions, jump target, etc.) must make **field identity** clear:
  - **Dropdown**: Show **label** as primary text; show **field ID** as secondary (e.g. subtitle or `id: xyz`).
  - **Tooltip** on hover: full label + “ID: &lt;fieldId&gt;” so users can correlate with piping’s “Available IDs”.
- **Jump to** target: Same field selector; only list **other** question/statement cards (not current), in form order. Optionally group by “Earlier” / “Later” to avoid invalid jumps if needed later.
- **Available IDs for piping** remains as-is (earlier questions only); consider reusing the same “field list with IDs” component in the logic builder for consistency.

### 4.3 Show If / Hide If – single group vs “group of groups”

- **Default**: One group (current behavior). One AND/OR and a list of conditions. “Add condition” adds to this group.
- **“Add group”** (or “Add OR group” / “Add AND group”): When the user needs “(A and B) OR (C and D)”:
  - Add a second **group**.
  - Top-level control: “Match **any** of the following groups” (OR) vs “Match **all** of the following groups” (AND).
  - Each group has its own AND/OR and condition list.
- **UI sketch**:
  - **Show this field if** [Match any ▼] of the following:
    - **Group 1** [AND ▼]  
      - [Field ▼] [operator ▼] [value]  [remove]  
      - [Field ▼] [operator ▼] [value]  [remove]  
      - [Add condition]
    - **Group 2** [AND ▼]  
      - …
    - [Add group]
- Same pattern for **Hide this field if** (with copy like “Hide this field if **any** / **all** of the following groups match”).

### 4.4 Jump to

- **Copy**: “After this card, jump to another card when…”
- **List of rules** (same as backend `jumpTo[]`):
  - **When** [condition group builder – reuse LogicBuilder]
  - **Jump to** [field selector – target card]
  - [Remove rule]
- **Add rule**: Appends a new `{ conditions, targetFieldId }`. Order matters (first match wins).
- **Field selector**: Only cards that can be jumped to (e.g. other questions/statements; exclude current). Show label + ID.

### 4.5 Dynamic label

- **Copy**: “Change this card’s question text based on previous answers.”
- **List of rules** (same as backend `dynamicLabel[]`):
  - **When** [condition group builder]
  - **Show label** [text input or textarea]
  - [Remove rule]
- **Add rule**: Appends a new `{ conditions, label }`. First match wins.
- **Piping**: Dynamic label text can support `{{fieldId}}`; ensure the same piping help (“Available IDs”) is discoverable from this section (e.g. link or short hint).

### 4.6 Shared “condition group” builder

- **LogicBuilder** (or a new name like `ConditionGroupBuilder`) should:
  - Accept `value: ConditionGroup | ConditionBlock` and `onChange`.
  - Render either a single group (current) or multiple groups with a top-level “Match any / all” and “Add group”.
- **Reuse** this component for:
  - Show If
  - Hide If
  - Each Jump to rule (“when”)
  - Each Dynamic label rule (“when”).

---

## 5. Implementation phases

### Phase 1 – Expose existing features (no model change)

- Add **Hide this field if** using current `ConditionGroup` and existing `LogicBuilder`.
- Add **Jump to** UI: list of rules, each with LogicBuilder (conditions) + field select (target). Persist to `conditionalLogic.jumpTo`.
- Add **Dynamic label** UI: list of rules, each with LogicBuilder + label input. Persist to `conditionalLogic.dynamicLabel`.
- Improve **field picker** everywhere: show label + ID (e.g. in select items or tooltip).

**Deliverable**: All four branches (Show/Hide/Jump/Dynamic label) configurable; complex logic still single group only.

### Phase 2 – Complex logic (ConditionBlock)

- Extend types: `ConditionBlock`, and `showIf`/`hideIf`/etc. accept `ConditionGroup | ConditionBlock`.
- Add runtime `evaluateConditionBlock` and use it in `shouldShowField`, `getJumpTarget`, `getDynamicLabel`.
- Extend LogicBuilder (or add `ConditionBlockBuilder`) to support “Add group” and top-level AND/OR.
- Migrate existing `showIf`/`hideIf` (single group) so they remain valid (no migration needed if we treat single group as legacy shape and normalize at read time if desired).

**Deliverable**: “(A and B) OR (C and D)” and similar expressible in UI and evaluated correctly.

### Phase 3 – Polish

- Collapsible sections; optional “?” tooltips explaining Show vs Hide vs Jump vs Dynamic label.
- Ensure “Available IDs” (and any shared field-ID list) is consistent between Piping and Conditional Logic.
- Accessibility and keyboard flow for the new blocks.

---

## 6. Summary

| Item | Status / Action |
|------|------------------|
| **Available IDs** | Strictly necessary; keep and reuse pattern in logic field pickers (label + ID). |
| **Show If** | Keep; enhance later with “group of groups” (Phase 2). |
| **Hide If** | Add UI (Phase 1); engine already supports. |
| **Jump to** | Add UI (Phase 1); engine already supports. |
| **Dynamic label** | Add UI (Phase 1); engine already supports. |
| **Complex logic (OR of ANDs, etc.)** | Phase 2: introduce `ConditionBlock`, extend builder, add evaluation. |
| **Field picker** | Everywhere: show label + ID; align with “Available IDs” mental model. |

This design keeps the current runtime and types as much as possible, adds the missing UI for Hide If, Jump to, and Dynamic label, and then extends the model once for complex logic with a clear, backward-compatible shape.
