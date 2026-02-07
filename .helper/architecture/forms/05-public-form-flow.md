# 05 — Public Form Flow

This document follows a user from clicking a form link to submitting their answers.

---

## The Two URLs

| URL | What it serves |
|-----|----------------|
| `/forms/{slug}` | Simple forms render here. Card forms show a redirect link. |
| `/forms/card/{slug}` | Card forms render here. Simple forms show an error. |

Why two URLs? Card forms need client-side navigation, sessions, and animations. Keeping them separate simplifies the routing.

---

## Flow: User Opens a Form

```
User clicks link: https://yourapp.com/forms/contact-us
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Page: /forms/[slug]/page.tsx                                │
│                                                              │
│ 1. Extract slug from URL ("contact-us")                     │
│ 2. Fetch template: GET /forms/public/contact-us             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ API returns FormTemplate                                     │
│                                                              │
│ Check template.formType:                                     │
│                                                              │
│ ┌─────────────────────┐     ┌─────────────────────┐         │
│ │ SIMPLE              │     │ CARD                │         │
│ │                     │     │                     │         │
│ │ Render form inline  │     │ Show message:       │         │
│ │ with SimpleFormView │     │ "This is a card     │         │
│ │                     │     │  form. Click here   │         │
│ │                     │     │  to open it."       │         │
│ │                     │     │  → /forms/card/slug │         │
│ └─────────────────────┘     └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

For Card forms, the user clicks through to `/forms/card/{slug}`.

---

## Simple Form: The Easy Path

**Component:** `SimpleFormView`

**What happens:**

1. **Render all fields**: Map over `template.schema`, render each with `FieldRenderer`
2. **Collect answers**: Form state stores `{ [fieldId]: value }`
3. **Validate on submit**: Check required fields, format validation
4. **Submit**: POST to `/forms/public/{slug}/submit`
5. **Show success**: Display `template.successMessage`

```
┌─────────────────────────────────────────────┐
│ SimpleFormView                              │
│                                             │
│  template.schema.map(field =>               │
│    <FieldRenderer                           │
│      field={field}                          │
│      value={formData[field.id]}             │
│      onChange={...}                         │
│    />                                       │
│  )                                          │
│                                             │
│  <Button onClick={handleSubmit}>            │
│    {template.submitButtonText}              │
│  </Button>                                  │
└─────────────────────────────────────────────┘
```

That's it. Simple forms are simple.

---

## Card Form: The Complex Path

**Component:** `CardFormContainer`

Card forms have state machines. Here's the flow:

```
User opens /forms/card/contact-us
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. INITIALIZE                                               │
│                                                              │
│    - Fetch template                                          │
│    - Derive visible fields from schema + conditional logic   │
│    - If saveProgress enabled: create or restore session     │
│    - Set currentCardIndex = 0                                │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SHOW CURRENT CARD                                        │
│                                                              │
│    currentField = visibleFields[currentCardIndex]           │
│                                                              │
│    <CardContainer>                                           │
│      <ProgressBar current={currentCardIndex} total={...} /> │
│      <FieldRenderer field={currentField} ... />              │
│      <Navigation onBack={...} onNext={...} />               │
│    </CardContainer>                                          │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER ANSWERS AND CLICKS NEXT                             │
│                                                              │
│    - Save answer to formData                                 │
│    - If session enabled: PATCH session with partial data    │
│    - Evaluate conditional logic:                             │
│        - Check jumpTo rules → might skip to different field │
│        - Check showIf/hideIf → recalculate visible fields   │
│    - Animate transition                                      │
│    - currentCardIndex = next visible field index            │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
        (Repeat 2-3 until last card)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. LAST CARD COMPLETED                                      │
│                                                              │
│    If profileEstimation enabled:                             │
│      - Calculate result (rule-based or AI)                  │
│      - Show result screen                                    │
│                                                              │
│    User clicks Submit:                                       │
│      - POST to /forms/public/{slug}/submit                  │
│      - If session: mark session complete                    │
│      - Show success message                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Conditional Logic at Runtime

When does the runtime evaluate conditions?

| Event | What happens |
|-------|--------------|
| Initialize | Calculate initial `visibleFields` from schema |
| User answers a question | Re-evaluate all fields' `showIf`/`hideIf` |
| User clicks Next | Check `jumpTo` rules to determine next card |

**showIf/hideIf:**
```typescript
// Simplified
function isFieldVisible(field, formData) {
  if (field.conditionalLogic?.showIf) {
    return evaluateCondition(field.conditionalLogic.showIf, formData);
  }
  if (field.conditionalLogic?.hideIf) {
    return !evaluateCondition(field.conditionalLogic.hideIf, formData);
  }
  return true;  // Default: visible
}
```

**jumpTo:**
```typescript
// Simplified
function getNextCardIndex(currentField, formData, allFields) {
  if (currentField.conditionalLogic?.jumpTo) {
    for (const rule of currentField.conditionalLogic.jumpTo) {
      if (evaluateCondition(rule.conditions, formData)) {
        return allFields.findIndex(f => f.id === rule.targetFieldId);
      }
    }
  }
  return currentCardIndex + 1;  // Default: next field
}
```

---

## Session: Save and Resume

If `cardSettings.saveProgress` is true:

**On start:**
```
POST /forms/sessions/{slug}
→ Returns { sessionToken: "sess_abc123" }
```

**After each card:**
```
PATCH /forms/sessions/{sessionToken}
Body: { currentCardIndex: 3, partialData: { q1: "...", q2: "..." } }
```

**On resume (user returns with token):**
```
GET /forms/sessions/{sessionToken}
→ Returns { currentCardIndex: 3, partialData: {...} }
→ Restore state and continue from where they left off
```

---

## Profile Estimation: Showing Results

If `template.profileEstimation.enabled`:

After the last question, before submit:

1. **Collect all answers**
2. **Calculate result** based on `profileEstimation.type`:

| Type | How it calculates |
|------|-------------------|
| `percentage` | Sum points from fieldScoring, divide by max, map to range |
| `category` | Find first category where all `matchingLogic` rules pass |
| `multi_dimension` | Calculate score for each dimension |
| `recommendation` | Find recommendations where `matchingCriteria` match |

3. **Show result screen** with the calculated result
4. **User clicks final submit**

---

## The Submit Payload

Both Simple and Card forms submit the same shape:

```typescript
POST /forms/public/{slug}/submit

{
  "formTemplateId": "template_abc123",
  "data": {
    "field_1": "John Doe",
    "field_2": "john@example.com",
    "field_3": ["option_a", "option_c"]
  },
  "files": {
    "field_4": {
      "url": "https://storage.../uploads/resume.pdf",
      "originalName": "resume.pdf"
    }
  },
  "source": "direct"
}
```

Same API, same payload shape. The difference is just the UX journey to get there.

---

## FieldRenderer: The Shared Component

Both form types use `FieldRenderer` to render individual fields:

```typescript
<FieldRenderer
  field={field}
  value={formData[field.id]}
  onChange={(value) => setFormData({...formData, [field.id]: value})}
  formData={formData}          // For piping
  allFields={schema}           // For piping lookups
  mode="simple" | "card"       // Adjusts layout
/>
```

FieldRenderer handles:
- Rendering the right input for `field.type`
- Displaying `field.media` (for Card forms)
- Applying piping: replacing `{{fieldId}}` in labels with previous answers
- Applying `dynamicLabel` from conditional logic

---

## Key Files

| File | What it does |
|------|--------------|
| `frontend/app/(main)/forms/[slug]/page.tsx` | Main form page (Simple inline, Card redirect) |
| `frontend/app/(main)/forms/card/[slug]/page.tsx` | Card form page |
| `frontend/components/public/forms/simple-form/SimpleFormView.tsx` | Simple form container |
| `frontend/components/public/forms/card-form/card-form-container.tsx` | Card form container |
| `frontend/components/public/forms/card-form/hooks/useCardFormState.ts` | Card form state management |
| `frontend/components/public/forms/shared/FieldRenderer.tsx` | Renders individual fields |
| `frontend/lib/forms/conditional-logic.ts` | Evaluates conditions |
| `frontend/lib/forms/form-validation.ts` | Validation rules |
| `frontend/lib/forms/profile-estimation.ts` | Calculates results |

---

## Next

Now let's see how admins create and edit forms: [06-admin-panel.md](./06-admin-panel.md)
