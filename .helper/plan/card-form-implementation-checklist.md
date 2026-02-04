# Card Form System – Implementation Checklist

> Tracks progress for the [Card Form System Research](card-form-system-research.md).  
> Implement in order; each phase builds on the previous.

**Scope / assumptions**

- **No backwards compatibility required.** We do not need to support pre-migration data or old API contracts. Assume the migration has been applied: every `FormTemplate` has `formType`, and the API always returns the new fields. Avoid optional fallbacks, `?? 'SIMPLE'`, or workarounds for “existing” or “legacy” behaviour—implement for the current schema and API only.

---

## Phase 1: Foundation (Core Infrastructure)

- [x] Add `FormType` enum to Prisma schema (`SIMPLE` | `CARD`)
- [x] Add to `FormTemplate`: `formType` (default `SIMPLE`), `cardSettings`, `profileEstimation`, `styling`, `analyticsEnabled` (optional JSON / boolean)
- [x] Backend: update create/update DTOs for form type and new fields (`create-form-template.dto.ts`, `update-form-template.dto.ts`)
- [x] Backend: forms service persists new fields (via existing spread in create/update)
- [x] Frontend: update `FormTemplate`, `CreateFormTemplateDto`, `UpdateFormTemplateDto` types + export `FormType` (`lib/api/endpoints/forms.ts`, `lib/api/index.ts`)
- [x] Frontend: form type selector on create (Simple Form vs Card Form cards on new form page)
- [x] Frontend: rebrand in list and editor (Type column shows "Simple Form" / "Card Form"; create flow labels "Simple Form" / "Card Form")
- [x] Frontend: Card Form create → minimal editor (name, slug, title, display settings); "Card form builder coming soon" banner; schema empty allowed for CARD
- [x] Public form: when `formType === CARD`, show "This interactive card-style form is not yet available" card
- [x] Migration file created: `prisma/migrations/20260203000000_add_form_type_and_card_form_fields/migration.sql` (apply with `bunx prisma migrate dev` when DB is up—manual one-time step)
- [x] Edit page: CARD forms allow empty schema; validation skips “at least one field” and “all labels” for CARD
- [x] Edit page: when template is CARD, show “Card form builder coming soon” banner and hide Form Fields section (same as create)
- [x] No backwards-compat: `FormTemplate.formType` is required; removed all `?? 'SIMPLE'` fallbacks in list and edit

**Phase 1 done.** FormSession model deferred to Phase 2. Edit page loads/saves `formType`, `cardSettings`, `profileEstimation`, `styling`, `analyticsEnabled`. After applying the migration, existing rows get `formType = SIMPLE` by default.

---

## Phase 2: Card Form Renderer (Frontend)

- [x] Card form container component (one question per screen)
- [x] Card transition animations (Framer Motion)
- [x] Field type components for card form (text, email, phone, textarea, select, radio, checkbox, file, image)
- [x] Keyboard navigation (Enter, Esc)
- [x] Progress indicator (bar, dots, numbers from cardSettings)
- [x] Session save/resume (FormSession model + API)
- [x] Mobile responsive layout
- [x] Accessibility (focus management, reduced motion via prefers-reduced-motion)

---

## Phase 3: Flowchart-Based Card Form Builder (Admin)

- [x] Integrate React Flow (@xyflow/react)
- [x] Flowchart canvas with nodes (Start, End, Question, Statement, Result)
- [x] Custom edges with conditional labels (basic implementation)
- [x] Node creation and edge creation (drag/connect)
- [x] Card settings panel on node click
- [x] Zoom/pan; graph serialization (nodes + edges → schema)
- [x] List view toggle
- [x] Media upload per card (image, video, GIF, icon with position options)
- [x] Live preview (opens public form in new tab)

---

## Phase 4: Conditional Logic

- [ ] Condition editor UI (show/hide, jump)
- [ ] Piping (insert previous answers into labels)
- [ ] Runtime: evaluate conditions and branching

---

## Phase 5: Profile Estimation (Rule-Based)

- [ ] Scoring configuration UI (percentage, category, multi-dimension, recommendation)
- [ ] Rule-based calculation for each result type
- [ ] Result visualization components
- [ ] Per-form "Enable AI" toggle (default off)

---

## Phase 6: AI Enhancement (Optional)

- [ ] AI config UI; integrate when enabled
- [ ] Text analysis / personalized descriptions
- [ ] Rule-based fallback when AI disabled

---

## Phase 7: Analytics & Optimization

- [ ] Form view tracking
- [ ] Drop-off analysis; time-per-card
- [ ] Analytics dashboard
- [ ] A/B testing (optional)

---

## Phase 8: Polish & Advanced Features

- [ ] Custom CSS editor; theme templates
- [ ] Form duplication; versioning
- [ ] Webhooks; email notifications
- [ ] Export results to PDF

---

*Last updated: Phase 2 completed*
