# 01 — Types and Form Template (Baseline)

This document gives you the baseline: what a form template is, how it’s stored, and what types both form systems use. Read this first; later deep dives build on it.

---

## What is a form template?

A **form template** is the definition of a form that admins create and that end users fill out. It lives in the database and is fetched by the public form page using a **slug** (e.g. `/forms/contact-us` → template with `slug: "contact-us"`).

One template is exactly one of two kinds:

- **SIMPLE** — traditional single-page form (all fields on one page).
- **CARD** — one-question-per-screen form with optional branching, progress, and profile estimation.

The template type is fixed when the form is created and is stored as `formType: "SIMPLE" | "CARD"` on the template.

---

## Where types live (single source of truth)

All form-related types are in **one file** so the rest of the app doesn’t redefine them:

- **`frontend/lib/forms/types.ts`**

Use this file for:

- `FormTemplate`, `FormField`, `FormType`
- Condition types (`Condition`, `ConditionGroup`, `ConditionBlock`, `ConditionalLogic`)
- Profile estimation types (`ProfileEstimation`, `ScoringRule`, etc.)
- DTOs for create/update and submissions

Flowchart-specific types (nodes, edges, graph) live in **`frontend/lib/forms/flowchart-types.ts`** and reference the same `FormField` and condition types.

---

## FormTemplate (the top-level record)

A form template is the root entity. In code it’s the `FormTemplate` interface. Conceptually it has:

| Concept | Field | Meaning |
|--------|--------|---------|
| Identity | `id`, `slug` | `id` for API/DB; `slug` for public URL (`/forms/{slug}`) |
| Type | `formType` | `"SIMPLE"` or `"CARD"` — determines builder and runtime |
| Content | `schema` | Linear list of `FormField[]` — the questions/inputs |
| Card-only | `cardSettings` | Holds `flowchartGraph` (and options like progress style); only used when `formType === "CARD"` |
| Result config | `profileEstimation` | Optional; only used by card forms for score/category/recommendation results |
| Copy | `title`, `subtitle`, `submitButtonText`, `successMessage` | Shown on the public form |
| Flags | `isActive`, `analyticsEnabled` | Behavior and infra |

Important: for **CARD** forms the backend stores both:

- **`schema`** — linear `FormField[]` used at runtime (validation, order, profile estimation).
- **`cardSettings.flowchartGraph`** — the visual graph (nodes, edges, positions) used by the admin flowchart builder.

The schema for card forms is **derived from the graph** when saving (see [05-flowchart-system.md](./05-flowchart-system.md)); the graph is the editor’s source of truth.

---

## FormField (one question or statement)

Every question or “statement” (info block) is a **FormField**. Same shape for both simple and card forms; card forms add optional fields.

Core (both systems):

- `id` — unique in the form (used as key, for piping, and for conditional logic).
- `type` — e.g. `text`, `textarea`, `select`, `checkbox`, `radio`, `file`, `image`, `statement`.
- `label` — the question or text shown to the user.
- `placeholder`, `options` (for select/radio/checkbox), `required` — input behavior.

Card-only optional:

- `media` — image/video/gif/icon and position (above/below/background/…).
- `conditionalLogic` — showIf, hideIf, jumpTo, dynamicLabel (see conditional logic docs).
- `enablePiping`, `pipingKey` — use previous answers in labels (e.g. `{{name}}`).

So: **one type, one schema format**. Simple forms use a subset; card forms use the full set and add branching/result logic on top.

---

## FormType and how it drives behavior

- **`FormType = "SIMPLE" | "CARD"`**

Everything that differs between “simple” and “card” (admin builder, public URL, runtime component) branches on this:

- Admin: which builder section is shown (field list vs flowchart), and whether profile estimation is available.
- Public: which page and component render the form (`/forms/[slug]` vs `/forms/card/[slug]`, and `SimpleFormView` vs `CardFormContainer`).

There are no other form types; the system is deliberately two-path.

---

## Submissions and sessions

- **FormSubmission** — one record per submitted form (template id, `data` payload, files, metadata). Same for both types.
- **FormSession** — only for card forms: partial progress (current card index, `partialData`). Used for “save and continue later” and analytics.

Types for these (and their DTOs) are in `frontend/lib/forms/types.ts`.

---

## Where to look when you need to…

- **Change or extend what a form template can store**  
  Edit `FormTemplate` and related DTOs in `frontend/lib/forms/types.ts`; then API and admin form state as needed.

- **Add a new field type (e.g. date, rating)**  
  Extend `FormFieldType` and the shared `FieldRenderer` (and any admin field-type UI). See [03-what-the-systems-share.md](./03-what-the-systems-share.md).

- **Understand condition or profile-estimation shapes**  
  Same file: `Condition`, `ConditionGroup`, `ConditionBlock`, `ConditionalLogic`, `ScoringRule`, `ProfileEstimation`, etc.

Next: [02-simple-vs-card-difference.md](./02-simple-vs-card-difference.md) — what’s different between simple and card in behavior and UX.
