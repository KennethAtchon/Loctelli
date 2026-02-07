# 02 — Simple vs Card Forms

Now that you understand what a form template is, let's look at the two types of forms and when to use each.

---

## The One-Sentence Difference

- **Simple**: All questions on one page. User scrolls and submits.
- **Card**: One question per screen. User clicks Next/Back through a flow.

---

## Visual Comparison

**Simple Form:**
```
┌─────────────────────────────────────┐
│ Contact Us                          │
├─────────────────────────────────────┤
│ Name: [_______________]             │
│                                     │
│ Email: [_______________]            │
│                                     │
│ Message:                            │
│ [                                 ] │
│ [                                 ] │
│                                     │
│ [Submit]                            │
└─────────────────────────────────────┘
```

**Card Form:**
```
┌─────────────────────────────────────┐
│                            Card 1/5 │
│                                     │
│         What's your name?           │
│                                     │
│        [_______________]            │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘

         User clicks Next...

┌─────────────────────────────────────┐
│                            Card 2/5 │
│                                     │
│    Hi {{name}}! What's your email?  │
│                                     │
│        [_______________]            │
│                                     │
│         [← Back] [Next →]           │
└─────────────────────────────────────┘
```

---

## Feature Comparison

| Feature | Simple | Card |
|---------|--------|------|
| Layout | Single scrollable page | One question per screen |
| Navigation | Scroll, submit once | Next/Back buttons, progress bar |
| Branching | No | Yes — show/hide questions, jump to different paths |
| Results | No | Yes — percentage scores, categories, recommendations |
| Piping | No | Yes — use previous answers in later questions (`{{name}}`) |
| Session save | No | Yes — user can leave and resume later |
| Analytics | Basic (views, submissions) | Rich (drop-off per card, time per card) |
| Builder | List editor | Visual flowchart |

---

## When to Use Each

### Use Simple Form when:

- You need a quick contact form, signup form, or short survey
- All questions fit on one page without overwhelming the user
- Order is strictly linear (no "if X then skip to Y")
- You don't need a calculated result at the end
- You want the simplest possible setup

**Examples:** Contact forms, newsletter signup, basic feedback forms, registration forms

### Use Card Form when:

- You want a one-question-at-a-time experience (feels more engaging)
- You need branching ("If you selected X, show these questions")
- You want a result screen ("Your score is 85%", "You're Type A", "We recommend Plan X")
- You want progress indication
- You want to track where users drop off
- Users might need to save and continue later

**Examples:** Quizzes, assessments, onboarding flows, lead qualification, personality tests, product recommendations

---

## How the Type Affects Everything

The `formType` field (`"SIMPLE"` or `"CARD"`) is set when the form is created. It determines:

### 1. Admin Experience

| Simple | Card |
|--------|------|
| Shows a list editor | Shows a visual flowchart builder |
| Add/edit/remove/reorder fields in a list | Add question/statement nodes, connect with edges |
| No profile estimation section | Shows profile estimation config for results |

### 2. Data Storage

| Simple | Card |
|--------|------|
| `schema` is the source of truth | `cardSettings.flowchartGraph` is the source of truth |
| Edit schema directly | Schema is *derived* from graph on save |
| No `cardSettings` | `cardSettings` stores graph + display options |

### 3. Public Form Experience

| Simple | Card |
|--------|------|
| URL: `/forms/{slug}` | URL: `/forms/card/{slug}` |
| Component: `SimpleFormView` | Component: `CardFormContainer` |
| Shows all fields at once | Shows one card at a time |
| No session | Creates FormSession for save/resume |

### 4. Available Features

| Simple | Card |
|--------|------|
| Basic field types only | Full field types + media |
| No conditional logic | showIf/hideIf/jumpTo/dynamicLabel |
| No piping | `{{fieldId}}` in labels |
| No results | Percentage/category/dimension/recommendation |

---

## The Same Underneath

Despite these differences, both form types share:

- **Same `FormField` type** — Card just uses more properties
- **Same `FormTemplate` type** — Card just uses `cardSettings` and `profileEstimation`
- **Same submission API** — Both POST to the same endpoint
- **Same field renderer** — `FieldRenderer` component handles all field types
- **Same validation** — `form-validation.ts` used by both

This is by design. The system is "two experiences, one foundation."

---

## Next

Now let's look at the actual data structures with real JSON examples: [03-data-structures.md](./03-data-structures.md)
