# 03 — What the Systems Share

Both simple and card forms use the same types, the same field renderer, the same validation and API patterns, and the same submission model. This document spells out **what is shared** so you know where to change things once and have both systems benefit.

Read [01-types-and-form-template.md](./01-types-and-form-template.md) and [02-simple-vs-card-difference.md](./02-simple-vs-card-difference.md) first.

---

## 1. Types (single source of truth)

- **`frontend/lib/forms/types.ts`**
  - `FormTemplate`, `FormField`, `FormType`, `FormSubmission`, condition types, profile estimation types, DTOs.
- **`frontend/lib/forms/flowchart-types.ts`**
  - Used only by the card form builder; they still reference `FormField` and condition types from `types.ts`.

No duplicate form-field or template type definitions; both systems import from here.

---

## 2. Field rendering: FieldRenderer

Both simple and card **public** forms render individual fields with the same component:

- **`frontend/components/public/forms/shared/FieldRenderer.tsx`**

It:

- Renders by `field.type` (text, textarea, select, checkbox, radio, file, image, statement).
- Supports `media` (image/video/gif/icon) for card-style layout.
- Applies **piping** (e.g. `{{fieldId}}` or `{{pipingKey}}` in labels) using `formData` and `allFields`.
- Applies **dynamic labels** from conditional logic (card forms).
- Receives `mode: "simple" | "card"` so it can adjust layout/behavior if needed.

So: **one place to add or change how a field type is rendered** for both form types. Admin builders use different UIs (field editor vs card settings panel) but the public-facing field shape is the same `FormField` and the same renderer.

---

## 3. Validation and initial data

- **`frontend/lib/forms/form-validation.ts`**
  - Validation rules and helpers used by both runtimes (e.g. required, format).
- **Initial / default values** for fields are derived from the same schema (e.g. empty string, empty array for multi-value); used by both simple and card form state.

So: validation and default-value logic are shared; each runtime (simple vs card) calls them when validating before submit or when building initial form data.

---

## 4. API: fetch template and submit

- **Get public form by slug**  
  Same endpoint for both: e.g. `GET /forms/public/:slug` (or equivalent via `api.forms.getPublicForm(slug)`). Response is a `FormTemplate`; the client decides what to render based on `template.formType`.

- **Submit**  
  Same submission endpoint: e.g. `POST /forms/public/:slug/submit` (or similar). Payload is the same shape: template id, `data` (keyed by field id), optional files. Card forms may first create/update a session, but the final submit is the same concept.

So: **one “get template” and one “submit” API surface**; only card adds session and profile-calculation endpoints.

---

## 5. Conditional logic engine (used by card; types shared)

- **`frontend/lib/forms/conditional-logic.ts`**
  - Evaluates conditions (showIf, hideIf, jumpTo, dynamicLabel).
  - Applies piping in text.

Simple forms don’t use show/hide or jump at runtime, but the **types** for conditions (`Condition`, `ConditionGroup`, `ConditionBlock`, `ConditionalLogic`) live in `types.ts` and are shared. The **LogicBuilder** in the admin (used for card question settings and profile estimation config) also shares this. So: one condition model, one evaluation engine; only card form runtime and card admin UI use it for flow.

---

## 6. Form template form state (admin)

When editing or creating a form in the admin, both types use the same **form state** shape for the bits that are common:

- **`frontend/app/admin/(main)/forms/hooks/use-form-template-form-state.ts`**
  - Defines `FormTemplateFormValues`: name, slug, title, schema, cardSettings, profileEstimation, etc.
  - For simple: `schema` is edited directly (field list).
  - For card: `cardSettings.flowchartGraph` is edited; `schema` is derived on save via `flowchartToSchema`.

So: **one admin form state type**; the difference is which section feeds “schema” (list vs flowchart) and whether profile estimation section is shown.

---

## 7. Profile estimation (card-only config; shared types)

Profile estimation **configuration** (percentage, category, multi-dimension, recommendation) is card-only, but the **types** (`ProfileEstimation`, `ScoringRule`, etc.) are in `types.ts`. The **LogicBuilder** used in profile-estimation admin (category/recommendation matching) is the same component used for card question logic. So: shared types and shared builder UI; only card forms have the profile estimation section and runtime result.

---

## Summary diagram (conceptual)

```
                    types.ts (FormTemplate, FormField, …)
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                         │
   form-validation.ts      FieldRenderer.tsx         conditional-logic.ts
         │                       │                         │
         └───────────┬───────────┴───────────┬─────────────┘
                     │                       │
              Simple form runtime      Card form runtime
              (SimpleFormView)        (CardFormContainer + hooks)
                     │                       │
                     └───────────┬───────────┘
                                 │
                    API: getPublicForm(slug), submit(...)
```

---

## Where to look when you need to…

- **Add or change a field type**  
  Extend `FormFieldType` in `types.ts`, then implement (and optionally restrict) it in `FieldRenderer.tsx`; add admin UI in `FormFieldEditor` (simple) and/or card settings panel (card).

- **Change validation rules**  
  `frontend/lib/forms/form-validation.ts`; both runtimes use it.

- **Change how piping or dynamic labels work**  
  `frontend/lib/forms/conditional-logic.ts` and the usage inside `FieldRenderer.tsx`.

- **Change API contract for template or submit**  
  `frontend/lib/api/endpoints/forms.ts` and backend form module; both systems use the same get/submit.

Next: [04-admin-panel-setup.md](./04-admin-panel-setup.md) — how the admin panel is set up for each form type (new/edit, sections, builders).
