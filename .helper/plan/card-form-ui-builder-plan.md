# Plan: Card Form UI Builder (Theme / Styling Layer)

**Goal:** Add a UI “builder” layer for card forms so admins can customize fonts, colors, and other visual options. The public card form experience is then rendered using these settings—no code deploy needed to change look and feel.

**Status:** Phase 1, 2 & 3 implemented  
**Created:** February 7, 2026  
**Scope:** Card forms only (Simple forms out of scope for this plan)

---

## Table of Contents

1. [Context & Problem](#1-context--problem)
2. [Design Principles](#2-design-principles)
3. [Data Model: Form Styling](#3-data-model-form-styling)
4. [Scope: What Can Be Styled](#4-scope-what-can-be-styled)
5. [Admin Experience: Where the Builder Lives](#5-admin-experience-where-the-builder-lives)
6. [Public Experience: Applying Styling](#6-public-experience-applying-styling)
7. [Implementation Phases](#7-implementation-phases)
8. [Risks, Dependencies & Open Questions](#8-risks-dependencies--open-questions)
9. [File & Doc Touchpoints](#9-file--doc-touchpoints)

---

## 1. Context & Problem

### Current State

- **FormTemplate** already has:
  - `styling?: Record<string, unknown>` in frontend types
  - `styling Json?` in Prisma (comment: "FormStyling: theme, colors, transitions")
- **cardSettings** already carries display-related options:
  - `progressStyle` (bar / dots / numbers)
  - `showProgressText`, `saveProgress`, `animationStyle` (slide / fade / none)
- There is **no** formal `FormStyling` (or equivalent) type and **no** admin UI to edit styling. So every visual change today requires code/theming changes.

### Problem

Admins cannot:

- Match card form look to brand (fonts, primary/accent colors)
- Tweak card layout (corners, shadow, spacing) or button style
- Customize result screen or progress indicator appearance

So we need a **UI change layer**: a structured way to store and apply “theme” settings for card forms, with an admin UI to edit them.

### Out of Scope (This Plan)

- Simple form styling (can be a follow-up)
- Per-card overrides (e.g. “this card uses font X”) — consider later if needed
- Full drag-and-drop layout builder (we’re doing theme/settings, not canvas layout)

---

## 2. Design Principles

- **Single source of truth:** Styling lives on `FormTemplate.styling` (already in DB). One JSON object per template.
- **Optional:** If `styling` is null/empty, public form uses app defaults. No breaking change for existing forms.
- **Layer separation:** Types in `lib/forms/types.ts`; admin UI in admin components; public application of styles in public card form components. No circular dependency.
- **Progressive enhancement:** Ship a minimal set of options first (e.g. fonts, primary/accent, card/button basics), then extend (e.g. result screen, progress bar colors).
- **Accessibility:** Ensure contrast and font-size constraints (or presets) so custom colors/fonts don’t break a11y.

---

## 3. Data Model: Form Styling

### 3.1 Introduce a formal type (frontend + backend)

**Location:** `frontend/lib/forms/types.ts` (and mirror in backend DTOs if needed).

Proposed shape (minimal first version):

```ts
/** Card form theme / UI builder settings. All optional; missing = use app default. */
export interface FormStyling {
  /** Typography */
  fontFamily?: {
    heading?: string;   // e.g. "Inter", "Playfair Display"
    body?: string;      // e.g. "Inter", "Open Sans"
  };
  /** Base font size (e.g. 16). Optional; default from app. */
  baseFontSize?: number;

  /** Colors (hex or CSS color) */
  colors?: {
    primary?: string;      // Buttons, links, progress fill
    primaryForeground?: string;
    accent?: string;       // Highlights, selected state
    background?: string;   // Page/card background
    foreground?: string;   // Text
    card?: string;        // Card background
    cardForeground?: string;
    border?: string;
    muted?: string;
    mutedForeground?: string;
  };

  /** Card container (the question card) */
  card?: {
    borderRadius?: number | string;  // px or "0.5rem"
    shadow?: "none" | "sm" | "md" | "lg";
    padding?: number | string;
  };

  /** Buttons (Next, Back, Submit) */
  buttons?: {
    borderRadius?: number | string;
    style?: "solid" | "outline" | "ghost";
  };

  /** Progress indicator */
  progress?: {
    style?: "bar" | "dots" | "numbers";  // Could live in cardSettings; can mirror here for theme
    barHeight?: number;
    color?: string;  // Override progress bar color
  };

  /** Result screen (profile estimation result) */
  resultScreen?: {
    layout?: "centered" | "full";
    titleFontSize?: number | string;
  };
}
```

- `FormTemplate.styling` should be typed as `FormStyling | null` (or `Record<string, unknown>` until we ship the type, then tighten).
- Backend: keep `styling` as JSONB; validate shape in service/DTO if desired, but no DB migration needed (column exists).

### 3.2 Where it’s stored

- **FormTemplate.styling** — one object per template. Same as today; we’re just defining the shape and UI to edit it.

### 3.3 Defaults

- Public form: if a key is missing, fall back to app default (existing Tailwind/theme). No need to persist “default” in DB; treat “not set” as default.

---

## 4. Scope: What Can Be Styled

Phase the feature set so the first release is shippable and extensible.

| Area              | Phase 1 (MVP)                     | Phase 2+ (later)                          |
|-------------------|-----------------------------------|------------------------------------------|
| Fonts             | Heading + body font family        | Google Fonts picker, font size scale      |
| Colors            | primary, primaryForeground, background, foreground, card, border | accent, muted, progress color |
| Card              | borderRadius, shadow              | padding, border width                    |
| Buttons           | borderRadius, style (solid/outline)| Custom label? (keep copy in display settings) |
| Progress          | Reuse cardSettings.progressStyle   | Bar color, height, dot color             |
| Result screen     | —                                 | layout, title size                        |
| Animation         | Already in cardSettings           | Optional easing / duration               |

Start with: **fonts (heading + body), primary + primaryForeground, background, foreground, card (bg + border radius + shadow), buttons (radius + style).** That already gives a strong “UI builder” feel.

---

## 5. Admin Experience: Where the Builder Lives

### 5.1 Placement

- **Recommended:** A dedicated **“Appearance” or “Theme”** section in the card form edit flow, alongside “Basic info”, “Display settings”, “Card builder”, “Profile estimation”.
- **Alternative:** A tab on the edit page: “Content” vs “Appearance”.
- **Not recommended:** Burying theme under card builder or inside each node (we want one theme per form).

### 5.2 UI patterns

- **Fonts:** Dropdown or searchable list of font names (Phase 1: a curated list; Phase 2: Google Fonts or similar). Show “Heading” and “Body” with live preview if feasible.
- **Colors:** Color pickers (hex) with optional presets (e.g. “Brand primary”, “Light background”). Show small preview (card + button) for the selected template.
- **Card / Buttons:** Number inputs for radius, dropdown for shadow; dropdown for button style.
- **Preview:** “Preview form” should render the public form in a new tab or modal using the same template (and thus same `styling`). No extra “preview styling” state—preview = real template with current form data.

### 5.3 Form state

- In `use-form-template-form-state.ts` (or equivalent), add `styling: FormStyling | null` to form values.
- On load: `styling = template.styling ?? null`.
- On save: send `styling` in the PATCH payload; backend persists to `FormTemplate.styling`.

### 5.4 Validation

- Optional: max lengths for font names, hex regex for colors, min/max for numbers (e.g. border radius 0–24). Keep validation light in v1.

---

## 6. Public Experience: Applying Styling

### 6.1 Strategy: CSS variables + theme class

- **Recommended:** Public card form page (or a layout wrapper for `/forms/card/[slug]`) reads `template.styling` and injects CSS variables (e.g. `--form-primary`, `--form-font-heading`) onto a wrapper div (e.g. `data-theme="card-form"`).
- Components (CardFormView, ProgressIndicator, buttons, result screens) use these variables instead of hardcoded theme colors/fonts. Example: `backgroundColor: 'var(--form-primary)'`, `fontFamily: 'var(--form-font-heading)'`.
- **Fallback:** Variables get a fallback in CSS or in the injector: e.g. `--form-primary: ${styling?.colors?.primary ?? 'hsl(var(--primary))'}`.

### 6.2 Where to inject

- **Option A (recommended):** In the page that fetches the template (`app/(main)/forms/card/[slug]/page.tsx`), or in `CardFormContainer`, render a wrapper that:
  - Accepts `template` (including `template.styling`).
  - Computes a flat object of CSS variables from `template.styling`.
  - Applies them to a wrapper div (e.g. `<div style={computedStyle}>` or a `<style>` tag scoped to a class).
- **Option B:** A small runtime that generates a `<style>` block from `FormStyling` and injects it once per form load. Same variables, different delivery.

### 6.3 Font loading

- If we allow custom fonts (e.g. Google Fonts), the public page or layout must load the font (e.g. link tag or font-face). Prefer loading only the fonts referenced in `template.styling` to avoid bloat. Phase 1 could limit to system + a few bundled fonts to avoid loading logic.

### 6.4 Components to touch

- **CardFormView:** Card container (border radius, shadow, background), title/label (font), buttons (primary style, radius).
- **ProgressIndicator:** Bar/dots color and size if we add progress styling.
- **Result components** (PercentageResult, CategoryResult, etc.): Use `--form-*` for headings and backgrounds when we add result-screen styling.
- **FieldRenderer:** Use body font and foreground color from variables so all fields inherit the theme.

---

## 7. Implementation Phases

### Phase 1: Data model + minimal admin UI + public application (MVP)

**Goal:** One coherent path from “admin sets fonts + a few colors + card/button options” to “public form looks different.”

1. **Types**
   - Add `FormStyling` (and optionally `FormStylingColors`, etc.) to `frontend/lib/forms/types.ts`.
   - Set `FormTemplate.styling` to `FormStyling | null` (or keep `Record<string, unknown>` and document the shape).
   - Backend: ensure PATCH template accepts `styling` and persists to Prisma (likely already does; verify).

2. **Admin form state**
   - In `use-form-template-form-state.ts`, add `styling` to form values; default `{}` or `null` for new forms; from template for edit.
   - On submit, include `styling` in payload.

3. **Admin UI: “Appearance” section**
   - New section component (e.g. `FormAppearanceSection.tsx` or `FormThemeSection.tsx`) used only when `formType === "CARD"`.
   - Fields: heading font, body font (dropdown with ~5–10 options to start), primary color, primary foreground, background, foreground, card background, card border radius, card shadow, button radius, button style.
   - No preview required for Phase 1 but desirable if cheap (e.g. small card + button mockup).

4. **Public: apply styling**
   - In card form page or `CardFormContainer`, derive CSS variables from `template.styling`.
   - Wrap public card form in a div that sets these variables (inline style or class + generated style).
   - Update `CardFormView` (and progress/buttons) to use `var(--form-*)` with fallbacks.
   - Ensure no layout shift when styling is null (all vars have fallbacks).

5. **Docs**
   - Update `.helper/architecture/forms/03-data-structures.md` with `FormStyling` example.
   - Update `08-form-system.md` (or admin panel doc) to mention the Appearance section and that styling is card-form-only for now.

### Phase 2: Expand options + preview + fonts

6. **More options**
   - Add accent, muted, progress bar color, result screen layout/size to type and admin UI.
   - Optionally move or mirror `progressStyle` into `styling.progress` for consistency (or keep in cardSettings and only add “progress color” in styling).

7. **Preview**
   - “Preview” button opens public form URL in new tab (or iframe) so admin sees real form with current styling (and current graph). No duplicate preview state.

8. **Font loading**
   - If adding Google Fonts (or similar): font picker in admin; on public load, inject link for chosen fonts only. Restrict to a safe list in Phase 2.

### Phase 3: Polish + accessibility ✅

9. **Presets** ✅
   - Optional “Theme presets” (e.g. “Dark”, “Minimal”, “Brand A”) that prefill `FormStyling` so admins can start from a base.

10. **Accessibility** ✅ — Contrast check (primary vs primary text, primary vs background); WCAG AA pass/warning. Base font size 14–24 with recommended 16–18 hint.

11. **Per-card overrides (optional)**
    - If product asks for it: allow a card (node) to override e.g. background or font for that card only. Would extend flowchart node data and schema; separate small design doc recommended.

---

## 8. Risks, Dependencies & Open Questions

| Risk / Question | Mitigation |
|-----------------|------------|
| Too many options overwhelms admins | Phase 1: small set; presets in Phase 3. |
| Custom fonts slow load or fail | Phase 1: system + limited list; Phase 2: load only selected fonts; fallback to system font. |
| Styling breaks layout on small screens | Use relative units where possible (e.g. rem); test progress and buttons on mobile. |
| Backend doesn’t accept `styling` | Verify DTO and Prisma; add `styling` to update DTO if missing. |
| Existing forms with `styling: null` | Treated as “use defaults”; no migration needed. |

**Dependencies:**

- Form template edit flow and form state hook (existing).
- Public card form components (CardFormView, ProgressIndicator, results) — must accept or read theme variables.
- No new backend endpoints if PATCH template already supports `styling`; otherwise add to DTO and service.

**Open questions:**

- Exact list of Phase 1 font options (system only vs 1–2 web fonts).
- Whether “Preview” is same-tab, new tab, or iframe (recommend new tab for simplicity).
- Whether to unify `progressStyle` (and similar) under `styling` later for one place for “look and feel.”

---

## 9. File & Doc Touchpoints

| Area | Files / docs |
|------|------------------|
| Types | `frontend/lib/forms/types.ts` (FormStyling, FormTemplate.styling) |
| Admin form state | `frontend/app/admin/(main)/forms/hooks/use-form-template-form-state.ts` |
| Admin section | New: `frontend/components/admin/forms/form-sections/form-appearance-section.tsx` (or form-theme-section.tsx) |
| Edit page | `frontend/app/admin/(main)/forms/[id]/edit/page.tsx` — add Appearance section for CARD |
| Public page | `frontend/app/(main)/forms/card/[slug]/page.tsx` — pass template, inject theme vars |
| Card form container | `frontend/components/public/forms/card-form/card-form-container.tsx` — optional theme wrapper here |
| Card form view | `frontend/components/public/forms/card-form/CardFormView.tsx` — use CSS vars for card, title, buttons |
| Progress | `frontend/components/public/forms/card-form/progress-indicator.tsx` — use vars for color/size |
| Results | `frontend/components/public/forms/card-form/results/*.tsx` — use vars when resultScreen styling added |
| Backend | `backend-api/.../forms/dto/update-form-template.dto.ts` — allow `styling`; service persists as-is |
| Docs | `.helper/architecture/forms/03-data-structures.md` (FormStyling example); `06-admin-panel.md` (Appearance section); `08-form-system.md` (brief mention) |

---

## Summary

- Add a **FormStyling** type and use **FormTemplate.styling** as the single source of truth for card form theme.
- Add an **Appearance (Theme) section** in the card form admin with fonts, colors, card, and button options (Phase 1).
- On the **public card form**, derive **CSS variables** from `template.styling` and apply them via a wrapper; have **CardFormView**, progress, and buttons use those variables with fallbacks.
- Phase in: MVP (types + minimal UI + application) → more options + preview + fonts → presets + a11y + optional per-card overrides.

This plan keeps the change layer scoped to card forms, fits the existing form system architecture, and stays extensible for future UI builder options.
