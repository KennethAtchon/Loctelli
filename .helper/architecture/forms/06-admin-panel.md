# 06 — Admin Panel: Building Forms

This document explains how admins create and edit forms through the dashboard.

---

## Routes

| Route | What it is |
|-------|------------|
| `/admin/forms` | List all form templates |
| `/admin/forms/new` | Create a new form |
| `/admin/forms/{id}/edit` | Edit an existing form |
| `/admin/forms/submissions` | List all submissions |
| `/admin/forms/submissions/{id}` | View single submission |

---

## Creating a New Form

**Page:** `frontend/app/admin/(main)/forms/new/page.tsx`

### Step 1: Choose Form Type

When you first land on `/admin/forms/new`, you see two cards:

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   Choose Form Type                                           │
│                                                              │
│   ┌─────────────────────┐   ┌─────────────────────┐         │
│   │                     │   │                     │         │
│   │    Simple Form      │   │     Card Form       │         │
│   │                     │   │                     │         │
│   │  All questions on   │   │  One question per   │         │
│   │  one page           │   │  screen with flow   │         │
│   │                     │   │                     │         │
│   │     [Select]        │   │     [Select]        │         │
│   └─────────────────────┘   └─────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Once you click one, `formType` is set and the full builder appears.

### Step 2: Fill Out the Builder

The builder shows different sections based on form type:

**Both types get:**
- Basic Info (name, slug, description)
- Display Settings (title, subtitle, submit button text, success message)

**Simple forms add:**
- Fields Section (list editor)

**Card forms add:**
- Card Builder Section (flowchart)
- Appearance Section (theme: fonts, colors, card/button style)
- Profile Estimation Section (optional results)

---

## Appearance Section (Card forms only)

**Component:** `FormAppearanceSection`

Admins can customize how the card form looks on the public page: theme presets (Minimal, Dark, Light, Brand), heading/body fonts, base font size (with 16–18 recommended), primary and page colors, card border radius and shadow, and button radius/style. Contrast checks (primary vs primary text, primary vs background) show WCAG AA pass or a warning when below 4.5:1. All fields are optional; empty means use app defaults. The section is rendered inside the form and uses `useFormContext` to read/write `styling` on the template form values. See [03-data-structures.md](./03-data-structures.md) for the `FormStyling` shape. Presets live in `frontend/lib/forms/form-styling-presets.ts`; contrast helpers in `frontend/lib/forms/contrast-utils.ts`.

---

## Simple Form Builder

**Component:** `FormFieldsSection`

The Simple form builder is a list:

```
┌─────────────────────────────────────────────────────────────┐
│ Form Fields                                    [+ Add Field] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⠿ Field 1: Name (text)                    [Edit] [×]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⠿ Field 2: Email (text)                   [Edit] [×]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⠿ Field 3: Department (select)            [Edit] [×]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [Import JSON]  [Export JSON]                               │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Add Field**: Opens field editor modal with empty field
- **Edit**: Opens field editor with existing field
- **Remove (×)**: Deletes field from schema
- **Drag (⠿)**: Reorder fields
- **Import JSON**: Paste a schema array
- **Export JSON**: Copy current schema

### Field Editor

**Component:** `FormFieldEditor`

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Field                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Type:        [text ▾]                                       │
│                                                              │
│  Label:       [What's your name?          ]                 │
│                                                              │
│  Placeholder: [Enter your full name       ]                 │
│                                                              │
│  ☑ Required                                                  │
│                                                              │
│  (Options section appears for select/radio/checkbox)        │
│                                                              │
│                              [Cancel]  [Save]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Card Form Builder

**Component:** `FormCardBuilderSection` → `CardFormBuilder`

The Card form builder is a visual flowchart:

```
┌─────────────────────────────────────────────────────────────┐
│ Card Form Builder          [+ Question] [+ Statement]       │
│                            [Canvas | List]  [Preview]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    Canvas View:                 │  Settings Panel:          │
│                                 │                           │
│    ┌─────────┐                  │  Selected: Q1             │
│    │  Start  │                  │                           │
│    └────┬────┘                  │  Type: [text ▾]           │
│         │                       │                           │
│    ┌────▼────┐ ← selected       │  Label:                   │
│    │   Q1    │                  │  [What's your name?]      │
│    └────┬────┘                  │                           │
│         │                       │  ☑ Required               │
│    ┌────▼────┐                  │                           │
│    │   Q2    │                  │  Media:                   │
│    └────┬────┘                  │  [+ Add Image/Video]      │
│         │                       │                           │
│    ┌────▼────┐                  │  Conditional Logic:       │
│    │   End   │                  │  [+ Add Condition]        │
│    └─────────┘                  │                           │
│                                 │                           │
└─────────────────────────────────────────────────────────────┘
```

### Two Views

**Canvas View (default):**
- React Flow powered
- Drag nodes to reposition
- Visual edge connections
- Click node to edit in side panel

**List View:**
- Simple reorderable list
- Faster for quick edits
- Same data, different presentation

### Adding Questions

When you click **+ Question**:

1. New question node created with default values
2. Node inserted after last content node (or after start if empty)
3. Edges rewired: last → new → end
4. Node selected, settings panel opens

### Settings Panel

**Component:** `CardSettingsPanel`

When a node is selected:

```
┌─────────────────────────────────────────────────────────────┐
│ Question Settings                                    [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Type                                                        │
│  [text ▾]                                                    │
│                                                              │
│  Label                                                       │
│  [What's your name?                              ]           │
│                                                              │
│  Placeholder                                                 │
│  [Enter your full name                           ]           │
│                                                              │
│  ☑ Required                                                  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Media                                                       │
│  [+ Add Image] [+ Add Video] [+ Add GIF]                    │
│                                                              │
│  Position: [above ▾]                                         │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Piping                                                      │
│  ☑ Enable piping (use this answer in later questions)       │
│  Key: [name] (use as {{name}})                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Conditional Logic                                           │
│  [+ Show If]  [+ Hide If]  [+ Jump To]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Profile Estimation Section

**Component:** `FormProfileEstimationSection`

Only shown for Card forms:

```
┌─────────────────────────────────────────────────────────────┐
│ Profile Estimation / Results                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ☑ Enable result screen at end of form                      │
│                                                              │
│  Result Type:                                                │
│  ○ Percentage Score                                          │
│  ○ Category Match                                            │
│  ○ Multi-Dimension                                           │
│  ○ Recommendation                                            │
│                                                              │
│  (Configuration UI varies by type)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

Each result type has its own configuration:

**Percentage:** Define scoring per field, set ranges (0-50 = Low, etc.)

**Category:** Define categories with matching rules

**Multi-Dimension:** Define dimensions with scoring rules

**Recommendation:** Define recommendations with criteria

---

## Editing an Existing Form

**Page:** `frontend/app/admin/(main)/forms/[id]/edit/page.tsx`

Flow:

1. Fetch template by ID
2. Convert to form values (including hydrating the graph from `cardSettings.flowchartGraph`)
3. Show same builder UI as create, pre-filled
4. On save: same process as create

The edit page also shows:
- Analytics dashboard (if `analyticsEnabled`)
- Submission count

---

## Form State: Under the Hood

**Hook:** `use-form-template-form-state.ts`

Both new and edit pages use React Hook Form with this shape:

```typescript
interface FormTemplateFormValues {
  name: string;
  slug: string;
  description?: string;
  formType: "SIMPLE" | "CARD";
  title: string;
  subtitle?: string;
  submitButtonText: string;
  successMessage: string;
  
  // Simple form
  schema: FormField[];
  
  // Card form
  cardSettings: {
    flowchartGraph: FlowchartGraph;
    progressStyle?: string;
    saveProgress?: boolean;
    // ...
  };
  profileEstimation?: ProfileEstimation;
  
  // ...
}
```

**For Simple forms:**
- `schema` is edited directly via `addField`, `updateField`, `removeField`
- `cardSettings` is null/ignored

**For Card forms:**
- `cardSettings.flowchartGraph` is edited via `onGraphChange`
- `schema` is derived on save: `flowchartToSchema(graph)`

---

## Saving: What Gets Sent

When you click Save:

**Simple form:**
```typescript
{
  name,
  slug,
  formType: "SIMPLE",
  schema: formValues.schema,  // Direct from form state
  cardSettings: null,
  profileEstimation: null,
  // ...
}
```

**Card form:**
```typescript
{
  name,
  slug,
  formType: "CARD",
  schema: flowchartToSchema(formValues.cardSettings.flowchartGraph),  // Derived!
  cardSettings: formValues.cardSettings,  // Includes graph
  profileEstimation: formValues.profileEstimation,
  // ...
}
```

The API receives both `schema` and `cardSettings` for Card forms. The schema is the runtime truth; the graph is for editing.

---

## Key Files

| File | What it does |
|------|--------------|
| `frontend/app/admin/(main)/forms/new/page.tsx` | Create form page |
| `frontend/app/admin/(main)/forms/[id]/edit/page.tsx` | Edit form page |
| `frontend/app/admin/(main)/forms/hooks/use-form-template-form-state.ts` | Form state hook |
| `frontend/components/admin/forms/form-sections/form-fields-section.tsx` | Simple form field list |
| `frontend/components/admin/forms/form-sections/form-field-editor.tsx` | Field editor modal |
| `frontend/components/admin/forms/form-sections/form-card-builder-section.tsx` | Card builder wrapper |
| `frontend/components/admin/forms/form-sections/form-appearance-section.tsx` | Appearance/theme (card forms only) |
| `frontend/components/admin/forms/card-form-builder/CardFormBuilder.tsx` | Flowchart builder |
| `frontend/components/admin/forms/card-form-builder/CardSettingsPanel.tsx` | Node settings panel |
| `frontend/components/admin/forms/form-sections/form-profile-estimation-section.tsx` | Profile estimation config |

---

## Next

For a quick reference of all file paths, see [07-code-reference.md](./07-code-reference.md)
