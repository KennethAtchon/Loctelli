# Form System Documentation

This folder teaches you how the form system works, from first principles to implementation details.

---

## How to Read These Docs

**Start at 01 and read in order.** Each document builds on the previous one. By the end, you'll understand:

- What a form template is and how it's stored
- The difference between Simple and Card forms
- The actual data structures (with real JSON examples)
- How the flowchart system works for Card forms
- How users fill out forms (the runtime flow)
- How admins build forms (the admin panel)

---

## Document Map

| # | Document | What You'll Learn |
|---|----------|-------------------|
| 01 | [Concepts](./01-concepts.md) | Mental model: templates, schema, fields. The foundation everything else builds on. |
| 02 | [Simple vs Card](./02-simple-vs-card.md) | The two form types, when to use each, and how they differ. |
| 03 | [Data Structures](./03-data-structures.md) | **Actual JSON examples** of FormTemplate, FormField, cardSettings, FlowchartGraph. The stuff the other docs hint at but never show. |
| 04 | [The Flowchart](./04-the-flowchart.md) | Deep dive on Card form's visual builder: nodes, edges, how graph becomes schema. |
| 05 | [Public Form Flow](./05-public-form-flow.md) | What happens when a user visits a form URL, fills it out, and submits. |
| 06 | [Admin Panel](./06-admin-panel.md) | How admins create and edit forms in the dashboard. |
| 07 | [Code Reference](./07-code-reference.md) | All file paths in one place. Use this when you need to find where something lives. |

---

## Quick Links by Task

**"I need to understand the system"**
→ Start at [01-concepts.md](./01-concepts.md) and read through.

**"I need to see actual data structures"**
→ Go to [03-data-structures.md](./03-data-structures.md). It has real JSON examples.

**"I need to change how the flowchart works"**
→ Read [04-the-flowchart.md](./04-the-flowchart.md), then check [07-code-reference.md](./07-code-reference.md) for file paths.

**"I need to change the public form experience"**
→ Read [05-public-form-flow.md](./05-public-form-flow.md).

**"I need to find a specific file"**
→ Go directly to [07-code-reference.md](./07-code-reference.md).

---

## Related Documentation

- **Main overview** (assumes you already know the system): [../08-form-system.md](../08-form-system.md)
- **Flowchart types**: `frontend/lib/forms/flowchart-types.ts`
- **All form types**: `frontend/lib/forms/types.ts`
