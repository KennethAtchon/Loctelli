# Plan: Image options for radio, checkbox, and select (text vs images, no mix)

**Feature request:** Radio buttons, checkboxes, and other multiple-choice fields can show **images** instead of text for each option. Users (admins) choose per field: either **all text** or **all image** options—no mixing within one question.

---

## 1. Goals and constraints

- **Goal:** Allow form builders to define choice options as either text labels or images (e.g. “Pick a style” with 3 product images).
- **Constraint:** Per field, options are either all text or all images. No mixed text + image in the same field.
- **Scope:** Applies to fields that use `options`: `radio`, `checkbox`, `select`. Same behavior for Simple and Card forms where applicable.
- **Submission/analytics:** Stored value remains a string (or string[] for checkbox). Conditional logic and profile estimation continue to use these values. No change to submission payload shape.

---

## 2. Data model

### 2.1 Option display mode (per field)

Add a field-level property that decides how options are rendered:

- **`optionDisplay`** (optional): `'text' | 'image'`
  - Omitted or `'text'`: current behavior—options are text-only.
  - `'image'`: each option is represented by an image (with optional label for accessibility).

Default: treat missing `optionDisplay` as `'text'` for backward compatibility.

### 2.2 Option shape

Today options are `string[]` (label = value). To support images we need a unified option type that works for both modes.

**Option A (recommended): structured options array**

- **`options`** becomes an array of objects when `optionDisplay === 'image'`, and can remain string[] when `optionDisplay === 'text'` for backward compatibility.
- Type definition (e.g. in `lib/forms/types.ts`):

```ts
// Value used in form data, conditional logic, and submission
export type FormFieldOption =
  | string
  | { value: string; imageUrl: string; altText?: string };

// On FormField
optionDisplay?: 'text' | 'image';
options?: FormFieldOption[];  // string[] for text (legacy), OptionObject[] for image
```

- **Text mode:** Keep allowing `options: string[]`. When rendering, treat each string as `{ value: s, label: s }` (value = label). No schema migration required for existing forms.
- **Image mode:** `options` must be `{ value, imageUrl, altText? }[]`. `value` is what gets stored in `formData` and used in conditions; `imageUrl` is the image src; `altText` is for a11y and optional (fallback to value).

**Option B: separate array for image URLs**

- Keep `options: string[]` (values/labels) and add `optionImages?: string[]` (parallel array). Simpler type-wise but brittle (order must match, no per-option alt text without another array). Not recommended.

**Recommendation:** Option A with backward compatibility: if `optionDisplay` is missing or `'text'`, allow and render `options` as string[]; if `optionDisplay === 'image'`, require options as `{ value, imageUrl, altText? }[]`.

### 2.3 Backward compatibility

- Existing templates have no `optionDisplay` and `options` as string[]. They keep working as today (text-only).
- New/edited fields can set `optionDisplay: 'image'` and use structured options. Validation: when `optionDisplay === 'image'`, ensure every element of `options` is an object with `value` and `imageUrl`.

---

## 3. Admin UI (form builder)

### 3.1 Where to change

- **Simple form:** `FormFieldEditor` (or equivalent) where “Options” are edited for select/radio/checkbox.
- **Card form:** Card form builder’s question/field settings panel (e.g. `CardSettingsPanel` / options section) where options are edited for question nodes with option-based types.

### 3.2 UI flow

1. **Display mode selector** (only when field type is select/radio/checkbox):
   - Radio or select: “Options display: **Text** | **Images**.”
   - Default: Text (and existing fields without `optionDisplay` behave as Text).

2. **When “Text” is selected:**
   - Keep current UI: list of text inputs, each = one option (label = value).
   - Save as `options: string[]`, do not set (or set) `optionDisplay: 'text'`.

3. **When “Images” is selected:**
   - Show “No mixing” note: “All options for this question use images.”
   - Per option: **Value** (required, used in logic/submission), **Image URL** (required), **Alt text** (optional, for screen readers). Optionally show a small preview of the image.
   - Add/remove option rows like today. Validation: value and imageUrl required for each row.

4. **Switching from Text to Images:**
   - Convert current string[] options to `{ value: s, imageUrl: '', altText: s }[]` so structure is valid; admin fills in image URLs.
   - Or clear options and show empty image-option list (simpler; admin re-adds).

5. **Switching from Images to Text:**
   - Convert to string[] using each option’s `value` (or altText/value). Image URLs are discarded.

### 3.3 Validation rules

- If `optionDisplay === 'image'`: require `options` to be an array of objects, each with `value` (non-empty) and `imageUrl` (non-empty). Optional `altText`.
- Do not allow saving a field with mixed content (e.g. some options as strings, some as objects). Schema/validation layer (e.g. Zod) can enforce this.

---

## 4. Public form rendering

### 4.1 Where to change

- **FieldRenderer** (or equivalent shared component) that renders select, radio, and checkbox. Same component may be used by both Simple and Card form views.

### 4.2 Text mode (current)

- When `optionDisplay` is missing or `'text'` and options are string[]: keep current rendering (text labels only). No change.

### 4.3 Image mode

- When `optionDisplay === 'image'` and options are `{ value, imageUrl, altText? }[]`:
  - **Radio:** Render each option as a clickable card/tile: image (with alt from `altText` or `value`), optional caption (e.g. value or altText). Selection state (border/background) like current card-style radio. Value stored is `option.value`.
  - **Checkbox:** Same idea: each option = image tile + optional caption; multiple selections stored as array of `option.value`.
  - **Select:** Options in dropdown can show a small thumbnail + value text, or value only (dropdowns are often compact). Prefer at least value for accessibility; image optional inside SelectItem.

Use Next.js `Image` (or `<img>`) with proper `alt` and loading; consider aspect ratio / object-fit so image options look consistent (e.g. fixed height, object-cover).

### 4.4 Accessibility

- Image options must have `alt` text (from `altText` or `value`).
- Keyboard and focus behavior for radio/checkbox must stay correct when the control is wrapped with an image.
- Ensure “option display: Images” does not break screen reader flow (labels/roles still associated with inputs).

---

## 5. Conditional logic and profile estimation

- **Conditional logic:** Conditions reference field **values** (e.g. “equals”, “contains”). Continue to use `option.value` (and for checkbox, array of values). No change to condition shape; only the way options are defined and rendered changes.
- **Profile estimation:** Same: scoring and matching use the stored value(s). Ensure percentage/category/multi-dimension configs still resolve option labels for display from the same `value` (e.g. when showing “You chose X”, map value back to option and show altText or value). If current code assumes options are strings, extend it to support both string and `{ value, imageUrl, altText? }` when resolving “label” for a chosen value.

---

## 6. File and implementation order

| Area              | Files / locations to touch |
|-------------------|----------------------------|
| Types             | `frontend/lib/forms/types.ts` – add `FormFieldOption`, `optionDisplay`, update `FormField.options` type. |
| Validation        | Form schema (e.g. Zod) and any runtime checks – allow string[] or option objects based on `optionDisplay`. |
| Admin – Simple    | Form field editor component – add display toggle, text vs image option inputs. |
| Admin – Card      | Card form builder options section – same: display mode + image option (value, imageUrl, altText) rows. |
| Helpers            | `lib/forms` – add small helpers: `isImageOption(o)`, `getOptionValue(o)`, `getOptionLabel(o)` / `getOptionAlt(o)` for rendering and logic. |
| Public render     | `FieldRenderer` (or equivalent) – branch on `optionDisplay` and option shape; render image tiles for radio/checkbox/select in image mode. |
| Profile estimation | Percentage / category / multi-dimension configs – ensure they use `getOptionValue` / get label from option object when present. |

Suggested implementation order:

1. **Types and helpers** – Define `FormFieldOption`, `optionDisplay`, and helper functions; keep backward compatibility (string[] when no optionDisplay).
2. **Admin – one builder** – Implement display mode + image options in either Simple or Card builder first (e.g. Card), then mirror in the other.
3. **Public rendering** – Add image-mode rendering in FieldRenderer for radio, then checkbox, then select.
4. **Validation** – Enforce “no mix” and required fields for image mode in form submit and (if used) builder save.
5. **Profile estimation** – Use helpers so result screens and config UIs show correct labels for chosen values.

---

## 7. Edge cases and notes

- **Empty image URL:** In image mode, require imageUrl before save; in render, if imageUrl is missing, show placeholder or value text so the form doesn’t break.
- **Broken image:** Use `onError` on img to show fallback (e.g. value or “Image unavailable”).
- **Select in image mode:** Dropdowns with large images can be heavy; prefer compact representation (small thumb + value) or value-only in the dropdown.
- **Existing data:** Old submissions store string values; they remain valid. New submissions with image options still store only the `value` string(s).

---

## 8. Summary

- Add **`optionDisplay: 'text' | 'image'`** and support **structured options** `{ value, imageUrl, altText? }` for image mode; keep **string[]** for text mode.
- **Admin:** Toggle “Text” vs “Images” per field; in image mode, edit value + imageUrl + optional altText per option; no mixing.
- **Public:** In image mode, render radio/checkbox (and select) as image-based choices; store only `value`(s); keep a11y and conditional logic/profile estimation aligned with values.
- **Backward compatible:** Omitted `optionDisplay` + string[] options = current text-only behavior.

This plan keeps the “text or images, not mix” rule at the field level and reuses the same submission and logic pipeline.
