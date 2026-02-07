# 01 — Concepts: What is a Form?

Before diving into code, let's build a mental model of what "a form" actually is in this system.

---

## The Core Idea

A **form** in this system is made of three layers:

```
┌─────────────────────────────────────────────┐
│  FormTemplate                                │
│  The container. Has a name, slug, settings.  │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  schema: FormField[]                    │ │
│  │  The questions. An ordered list.        │ │
│  │                                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │ Field 1  │ │ Field 2  │ │ Field 3  │ │ │
│  │  │ (text)   │ │ (select) │ │ (radio)  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

1. **FormTemplate** — The "form definition". Created by admins, stored in the database, fetched by the public form page.
2. **schema** — The list of questions/fields in order. This is what the user actually fills out.
3. **FormField** — One question. Has a type (text, select, radio, etc.), a label, options, validation rules.

---

## FormTemplate: The Container

A FormTemplate is the root entity. Think of it as "the form" that admins create and users fill out.

Key properties:

| Property | What it is |
|----------|------------|
| `id` | Database ID |
| `slug` | URL-friendly identifier. Form is accessed at `/forms/{slug}` |
| `name` | Internal name (shown in admin list) |
| `title` | Public title (shown to users) |
| `formType` | `"SIMPLE"` or `"CARD"` — determines everything else |
| `schema` | The list of fields (questions) |
| `cardSettings` | Card-form-only: contains the flowchart graph and display options |
| `profileEstimation` | Card-form-only: result/score configuration |

The `formType` is set when the form is created and never changes. It determines:
- Which builder UI the admin sees
- Which runtime component renders the form
- What features are available (branching, results, sessions)

---

## Schema: The Questions

The `schema` is an array of `FormField` objects. Order matters — it determines the order questions appear.

```typescript
schema: FormField[]  // e.g., [field1, field2, field3, ...]
```

For **Simple forms**: This is edited directly in the admin (add/remove/reorder).

For **Card forms**: This is *derived* from the flowchart graph. The admin edits the flowchart, and when they save, the system converts the graph to a linear list of fields. More on this in [04-the-flowchart.md](./04-the-flowchart.md).

---

## FormField: One Question

Every question or statement is a FormField. The same type works for both Simple and Card forms — Card forms just use more of its properties.

**Core properties (both form types):**

| Property | What it is |
|----------|------------|
| `id` | Unique within the form. Used as the key in submission data. |
| `type` | `text`, `textarea`, `select`, `checkbox`, `radio`, `file`, `image`, `statement` |
| `label` | The question text shown to users |
| `placeholder` | Hint text in the input |
| `options` | For select/radio/checkbox: the choices |
| `required` | Whether the field must be filled |

**Card-form-only properties:**

| Property | What it is |
|----------|------------|
| `media` | Image/video/gif to display with the question |
| `conditionalLogic` | Rules for show/hide/jump based on previous answers |
| `enablePiping` | Allow inserting previous answers into this field's label |
| `pipingKey` | Human-readable name for piping (e.g., "name" so you can use `{{name}}`) |

Simple forms use a subset of FormField. Card forms use the full set.

---

## How They Connect

```
User visits /forms/contact-us
         │
         ▼
┌─────────────────────────────────────┐
│ Fetch FormTemplate by slug          │
│ GET /forms/public/contact-us        │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Check template.formType             │
│                                     │
│ SIMPLE → render all fields on page  │
│ CARD   → render one field at a time │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ User fills out template.schema      │
│ (the FormField[] list)              │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Submit: POST with answers           │
│ { fieldId: answer, ... }            │
└─────────────────────────────────────┘
```

---

## Key Insight: One Type System, Two Experiences

The same `FormTemplate` and `FormField` types are used everywhere. The difference between Simple and Card isn't in the data model — it's in:

1. **How admins build it** (list editor vs flowchart)
2. **How users experience it** (one page vs one-card-at-a-time)
3. **What features are available** (Card adds branching, results, sessions)

This shared type system means:
- One API for fetching templates
- One API for submitting
- One field renderer component
- One validation system

The branching happens at the UI layer, not the data layer.

---

## Next

Now that you understand templates, schema, and fields, let's look at the two form types in detail: [02-simple-vs-card.md](./02-simple-vs-card.md)
