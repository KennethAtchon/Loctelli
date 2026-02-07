# 02 — Functional Difference: Simple vs Card Form

This document answers: *What is the functional difference between simple and card form?* and *When do I use which?* You should have read [01-types-and-form-template.md](./01-types-and-form-template.md) first.

---

## One-sentence summary

- **Simple form**: All fields on one page; user scrolls and submits once. Built by editing a linear list of fields.
- **Card form**: One question (or statement) per screen; user moves forward/back with optional branching and a result at the end. Built with a flowchart (nodes and edges).

---

## Side-by-side comparison

| Aspect | Simple Form | Card Form |
|--------|-------------|-----------|
| **Layout** | Single page; all fields visible (or scrollable). | One question/statement per “card”; user advances step by step. |
| **Navigation** | Scroll; no step state. | Next/Back; current step and optional progress bar. |
| **Admin builder** | Field list: add/edit/remove/reorder fields in a list. | Flowchart: add question/statement nodes, connect with edges, optional branching. |
| **Schema source** | Stored directly: `template.schema` is the list of fields. | Derived from graph: `template.schema = flowchartToSchema(cardSettings.flowchartGraph)` on save; graph is source of truth. |
| **Conditional logic** | Not used in the current implementation. | showIf / hideIf / jumpTo / dynamicLabel per field. |
| **Profile estimation** | No. | Optional: percentage, category, multi-dimension, or recommendation result at the end. |
| **Session / partial save** | No. | Yes: FormSession stores current card and partialData; user can resume later. |
| **Analytics** | Basic (views, submissions). | Richer: drop-off by card, time per card, profile result distribution. |
| **Public URL** | `/forms/[slug]` | `/forms/card/[slug]` (main slug page may redirect to this). |

So: **simple = one page, list builder, no branching or results**. **Card = multi-step, flowchart builder, branching, optional results and sessions.**

---

## When to use which

- **Use Simple Form when**
  - You need a quick contact form, short survey, or registration form.
  - All questions can sit on one page and order is linear.
  - You don’t need “if they answer X, skip to question 5” or different paths.
  - You don’t need a calculated result (score, category, recommendations) at the end.

- **Use Card Form when**
  - You want one-question-per-screen UX (quizzes, assessments, onboarding).
  - You need branching (show/hide or jump based on answers).
  - You want a result screen (e.g. “Your score”, “You’re type A”, “We recommend X”).
  - You want progress indication, optional “save and continue later,” or detailed analytics (drop-off, time per card).

---

## How the difference shows in code

- **Admin**
  - Simple: `FormFieldsSection` + `FormFieldEditor`; form state holds `schema: FormField[]`; save sends that schema.
  - Card: `FormCardBuilderSection` + `CardFormBuilder`; form state holds `cardSettings.flowchartGraph`; save derives `schema` from the graph and sends both.

- **Public**
  - Simple: One page component (`SimpleFormView`) that renders all fields, validates, and submits once.
  - Card: Container + hooks manage current card, visibility (conditional logic), navigation (including jump), session persistence, and profile estimation; then submit.

- **Data**
  - Same `FormField` and `FormTemplate` types; same submission payload shape. Card adds `FormSession` and optional `profileEstimation` config on the template.

---

## Where to look when you need to…

- **Change simple-form behavior (e.g. validation, layout)**  
  `frontend/components/public/forms/simple-form/` and shared `FieldRenderer` / `lib/forms/form-validation.ts`.

- **Change card-form behavior (e.g. navigation, session, results)**  
  `frontend/components/public/forms/card-form/` and hooks in `card-form/hooks/`; conditional logic in `lib/forms/conditional-logic.ts`; profile estimation in `lib/forms/profile-estimation.ts`.

- **Change how the simple-form builder works**  
  `frontend/components/admin/forms/form-sections/form-fields-section.tsx` and `form-field-editor.tsx`.

- **Change how the card-form builder works**  
  `frontend/components/admin/forms/card-form-builder/` and [05-flowchart-system.md](./05-flowchart-system.md).

Next: [03-what-the-systems-share.md](./03-what-the-systems-share.md) — what’s shared (types, field rendering, validation, API).
