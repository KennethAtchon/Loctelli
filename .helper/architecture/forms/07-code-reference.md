# 07 — Code Reference

Quick lookup for where things live. No explanations here — that's what the other docs are for.

---

## Types

| What | File |
|------|------|
| All form types (FormTemplate, FormField, etc.) | `frontend/lib/forms/types.ts` |
| Flowchart types (FlowchartGraph, FlowchartNode, etc.) | `frontend/lib/forms/flowchart-types.ts` |
| Backend DTOs | `backend-api/src/main-app/modules/forms/dto/` |

---

## Core Logic

| What | File |
|------|------|
| Graph ↔ Schema conversion | `frontend/lib/forms/flowchart-serialization.ts` |
| Conditional logic evaluation | `frontend/lib/forms/conditional-logic.ts` |
| Validation rules | `frontend/lib/forms/form-validation.ts` |
| Profile estimation calculation | `frontend/lib/forms/profile-estimation.ts` |

---

## API

| What | File |
|------|------|
| Frontend API client (forms) | `frontend/lib/api/endpoints/forms.ts` |
| Backend controller | `backend-api/src/main-app/modules/forms/forms.controller.ts` |
| Backend service | `backend-api/src/main-app/modules/forms/forms.service.ts` |

---

## Admin Pages

| What | File |
|------|------|
| Form list | `frontend/app/admin/(main)/forms/page.tsx` |
| Create form | `frontend/app/admin/(main)/forms/new/page.tsx` |
| Edit form | `frontend/app/admin/(main)/forms/[id]/edit/page.tsx` |
| Submissions list | `frontend/app/admin/(main)/forms/submissions/page.tsx` |
| View submission | `frontend/app/admin/(main)/forms/submissions/[id]/page.tsx` |

---

## Admin Components

| What | File |
|------|------|
| Form state hook | `frontend/app/admin/(main)/forms/hooks/use-form-template-form-state.ts` |
| Basic info card | `frontend/components/admin/forms/form-sections/form-basic-info-card.tsx` |
| Display settings card | `frontend/components/admin/forms/form-sections/form-display-settings-card.tsx` |
| Simple form fields section | `frontend/components/admin/forms/form-sections/form-fields-section.tsx` |
| Field editor | `frontend/components/admin/forms/form-sections/form-field-editor.tsx` |
| Card builder section | `frontend/components/admin/forms/form-sections/form-card-builder-section.tsx` |
| Profile estimation section | `frontend/components/admin/forms/form-sections/form-profile-estimation-section.tsx` |

---

## Card Form Builder

| What | File |
|------|------|
| Main builder component | `frontend/components/admin/forms/card-form-builder/CardFormBuilder.tsx` |
| Builder state hook | `frontend/components/admin/forms/card-form-builder/hooks/use-card-form-builder.ts` |
| React Flow canvas | `frontend/components/admin/forms/card-form-builder/FlowchartCanvas.tsx` |
| List view | `frontend/components/admin/forms/card-form-builder/ListView.tsx` |
| Settings panel | `frontend/components/admin/forms/card-form-builder/CardSettingsPanel.tsx` |
| Start node | `frontend/components/admin/forms/card-form-builder/nodes/start-node.tsx` |
| End node | `frontend/components/admin/forms/card-form-builder/nodes/end-node.tsx` |
| Question node | `frontend/components/admin/forms/card-form-builder/nodes/question-node.tsx` |
| Statement node | `frontend/components/admin/forms/card-form-builder/nodes/statement-node.tsx` |
| Conditional edge | `frontend/components/admin/forms/card-form-builder/edges/conditional-edge.tsx` |

---

## Public Form Pages

| What | File |
|------|------|
| Main form page (/forms/[slug]) | `frontend/app/(main)/forms/[slug]/page.tsx` |
| Card form page (/forms/card/[slug]) | `frontend/app/(main)/forms/card/[slug]/page.tsx` |

---

## Public Form Components

### Simple Form

| What | File |
|------|------|
| Container | `frontend/components/public/forms/simple-form/SimpleFormView.tsx` |
| State hook | `frontend/components/public/forms/simple-form/hooks/useSimpleFormState.ts` |

### Card Form

| What | File |
|------|------|
| Container | `frontend/components/public/forms/card-form/card-form-container.tsx` |
| Main state hook | `frontend/components/public/forms/card-form/hooks/useCardFormState.ts` |
| Schema hook | `frontend/components/public/forms/card-form/hooks/useCardFormSchema.ts` |
| Session hook | `frontend/components/public/forms/card-form/hooks/useCardFormSession.ts` |
| Navigation hook | `frontend/components/public/forms/card-form/hooks/useCardFormNavigation.ts` |
| Data hook | `frontend/components/public/forms/card-form/hooks/useCardFormData.ts` |
| Profile hook | `frontend/components/public/forms/card-form/hooks/useCardFormProfile.ts` |

### Shared

| What | File |
|------|------|
| Field renderer | `frontend/components/public/forms/shared/FieldRenderer.tsx` |

---

## Database

| What | File |
|------|------|
| Prisma schema (forms) | `backend-api/prisma/schema.prisma` (search for `FormTemplate`, `FormSubmission`, `FormSession`) |

---

## By Task

### Add a new field type

1. Add to `FormFieldType` in `frontend/lib/forms/types.ts`
2. Handle in `FieldRenderer.tsx`
3. Add to field type dropdown in `FormFieldEditor` and `CardSettingsPanel`
4. Add validation in `form-validation.ts` if needed

### Change how the flowchart converts to schema

Edit `flowchartToSchema` in `frontend/lib/forms/flowchart-serialization.ts`

### Change conditional logic behavior

Edit `frontend/lib/forms/conditional-logic.ts`

### Change how results are calculated

Edit `frontend/lib/forms/profile-estimation.ts`

### Change the admin builder UI

- Simple: `form-fields-section.tsx`, `form-field-editor.tsx`
- Card: `CardFormBuilder.tsx`, `CardSettingsPanel.tsx`

### Change the public form experience

- Simple: `SimpleFormView.tsx`
- Card: `card-form-container.tsx` and hooks in `card-form/hooks/`

### Add a new API endpoint

1. Add to `forms.controller.ts` (backend)
2. Add to `forms.service.ts` (backend)
3. Add to `frontend/lib/api/endpoints/forms.ts` (frontend)

### Change form template fields

1. Update `FormTemplate` in `frontend/lib/forms/types.ts`
2. Update DTOs in `backend-api/src/main-app/modules/forms/dto/`
3. Update Prisma schema if it's a database field
4. Update admin form state in `use-form-template-form-state.ts`
