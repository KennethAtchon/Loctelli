# Form System Deep Dives

This folder contains **bottom-up deep dives** into the form system. They are written so you can read **top to bottom** and build knowledge in order: baseline concepts first, then differences, shared pieces, admin setup, flowchart, and public flow.

The main overview (which assumes you already know the system) is in **[../08-form-system.md](../08-form-system.md)**. Use these deep dives when you need to **learn** the system or **answer specific questions** like:

- What is a form template?
- What is the functional difference between simple and card form?
- What do the two systems share?
- How is the admin panel set up for each type?
- What is the flowchart system and how does it work?
- How does the public form flow work from URL to submit?

---

## Reading order (recommended)

Read in this order so each doc builds on the previous:

| # | Document | Answers |
|---|----------|---------|
| 1 | [01-types-and-form-template.md](./01-types-and-form-template.md) | What is a form template? FormField, FormType, where types live. Baseline for everything else. |
| 2 | [02-simple-vs-card-difference.md](./02-simple-vs-card-difference.md) | Functional difference between simple and card; when to use which. |
| 3 | [03-what-the-systems-share.md](./03-what-the-systems-share.md) | Shared types, FieldRenderer, validation, API, form state. |
| 4 | [04-admin-panel-setup.md](./04-admin-panel-setup.md) | How the admin panel is set up: new/edit, type selector, which sections for simple vs card. |
| 5 | [05-flowchart-system.md](./05-flowchart-system.md) | What the flowchart is, graph vs schema, how it works, where to change it. |
| 6 | [06-public-form-flow.md](./06-public-form-flow.md) | Public URLs, fetch template, simple vs card runtime, submit flow. |

---

## Quick reference: where to go for what

- **Add or change a field type** → [01](./01-types-and-form-template.md) (FormField), [03](./03-what-the-systems-share.md) (FieldRenderer).
- **Understand simple vs card** → [02](./02-simple-vs-card-difference.md).
- **Change validation or shared behavior** → [03](./03-what-the-systems-share.md).
- **Change admin create/edit or builder sections** → [04](./04-admin-panel-setup.md).
- **Change flowchart or graph ↔ schema** → [05](./05-flowchart-system.md).
- **Change public form pages or runtime** → [06](./06-public-form-flow.md).

---

## Diagram index

- **Admin edit + save (card):** [04-admin-panel-setup.md — Sequence: admin edits and save (card)](./04-admin-panel-setup.md#sequence-admin-edits-and-save-card).
- **Flowchart add question:** [05-flowchart-system.md — Sequence: user adds a question](./05-flowchart-system.md#sequence-user-adds-a-question-high-level).
- **Card form runtime:** [06-public-form-flow.md — Data flow summary (card)](./06-public-form-flow.md#data-flow-summary-card).

More sequence diagrams (full submission, profile estimation, etc.) are in the main overview: [../08-form-system.md](../08-form-system.md).
