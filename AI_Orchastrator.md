# AI_Orchastrator

## Updates
- 2026-02-07: Card settings panel (node edit dialog) refactored to use parent form: CardSettingsPanel no longer uses its own useForm(); it uses useFormContext<FormTemplateFormValues>() and reads/writes node data at cardSettings.flowchartGraph.nodes[nodeIndex].data. Single form ownership—avoids nested form sync issues. CardFormBuilder passes nodeIndex; handleNodeUpdate removed.
- 2026-02-07: Implemented system-wide frontend refactor (Phase 1 pilot): parent-owned RHF for Profile Estimation; single form in route (new/edit pages), children use `useFormContext` only; `useFieldArray` moved to `ProfileEstimationSetup` (setup-wizard) and passed to CategoryConfig, PercentageConfig, MultiDimensionConfig, RecommendationConfig as props; stable IDs via `lib/utils/stable-id.ts` (`generateStableId`) replacing all `Date.now()` for categories, dimensions, recommendations, schema fields; `reset()` on edit page remains only in `loadTemplate()` after API fetch (true external load). Profile Estimation configs: `frontend/components/admin/forms/profile-estimation/`. Form template pages: `frontend/app/admin/(main)/forms/new/page.tsx`, `[id]/edit/page.tsx`.
- 2026-02-06: Avoid reset on same-value updates in `ProfileEstimationSetup` by comparing serialized signatures, preventing input focus loss while typing in category names.
- 2026-02-06: Added design doc for local-first Profile Estimation editing to prevent focus loss while typing.
- 2026-02-06: Added system-wide frontend refactor design doc.
