# AI Card Form Builder – Feature Plan

## Summary

Add an **AI-assisted path** at the top of the Card Form Builder: a button that opens a **modal with an AI text bot**. The AI asks clarifying questions and eventually produces **Card Form Template JSON**; the user can load that into the builder and refine it. This is for users who prefer describing the form in natural language over using the fine-grained flowchart/card-settings UI. **Images are provided via URLs only** (no upload in this flow).

---

## Goals

- **Alternative path**: “Describe what you want” → AI generates form → load and customize.
- **Single output format**: Same `CardFormTemplateJson` used by “Import card form” (flowchart, styling, profile estimation, display text).
- **No image upload in AI flow**: User supplies image/video/gif URLs (e.g. in options or card media); upload remains a manual option in the builder after load.
- **Reuse existing load path**: When AI returns valid JSON, call the same `onImportFullCardForm` used by the Import card form dialog so create/edit pages stay consistent.
- **Current form in context**: The AI always receives the current card form data (from the page the user is on) so it can create from scratch, refine, or extend what’s already there.

---

## User Flow

1. User is on **Create** or **Edit** form (card form type).
2. In the **Card Form Builder** section header (next to “Export card form” / “Import card form”), user sees a button, e.g. **“Build with AI”**.
3. User clicks → **modal** opens with:
   - Chat UI (messages list + input).
   - No file/image upload in the modal; instructions tell user to use **links** for images.
   - **Current card form data** (the form they are creating or editing) is loaded into the AI’s context so the AI can refine, extend, or reference what’s already there.
4. User describes the form (or asks for changes to the current form) (e.g. “I want a short quiz about product fit with 3 questions and a result that shows a percentage”).
5. AI may **ask clarifying questions** (number of questions, types of fields, result type, theme, etc.).
6. When ready, AI responds with:
   - A final message that includes (or is) the **Card Form Template JSON**.
7. Frontend:
   - Detects/parses JSON from the response (e.g. from a markdown code block or dedicated “apply” action).
   - Validates with `isCardFormTemplateJson()`.
   - Calls **`onImportFullCardForm(payload)`** (same as Import card form).
   - Closes modal and shows success toast; user continues in the builder to tweak.
8. If validation fails, show error in modal and allow user to ask the AI to fix or paste/edit JSON manually (optional enhancement: “Paste JSON” fallback in modal).

---

## UI Placement and Components

| Item | Location / Implementation |
|------|---------------------------|
| Trigger button | `FormCardBuilderSection` header, next to Export / Import (e.g. “Build with AI” with Sparkles icon). |
| Modal | New component, e.g. `CardFormAIBuilderModal`, used only when `onImportFullCardForm` and `getFullCardFormPayload` are provided (create/edit). Receives current form payload and sends it to the AI as context. |
| Chat UI | Reuse existing `ChatInterface` (or a simplified variant) inside the modal: messages + text input, no image upload. |
| Apply action | “Apply to form” (or “Use this form”) when the last assistant message contains valid JSON; optional “Copy JSON” / “Paste and import” for manual fix. |

**Copy**: In modal description, state that images are by **link only** (e.g. “For images, provide URLs; you can add uploads later in the builder.”).

---

## Backend: AI Endpoint

- **New endpoint** (e.g. admin-only) for this conversation, e.g.:
  - `POST /admin/forms/card-form-ai-chat` or `POST /forms/ai-card-form` (depending on auth).
- **Input**:
  - `message: string` (user message).
  - **`currentCardFormPayload?: CardFormTemplateJson`** – The current card form the user is on (create or edit). Injected into the AI’s context so the AI can refine or extend it. Omit or send minimal/default when starting a new form.
  - Optionally: `conversationHistory: { role, content }[]` for multi-turn; optionally a session/conversation id.
- **Output**: Assistant message (and optionally a structured `cardFormJson?: CardFormTemplateJson` if the model is instructed to return it in a parseable way).
- **System prompt**: See [Prompt strategy plan](./ai-card-form-builder-prompt-strategy.md). In short: “Ask clarifying questions and create the output (JSON for card builder) for this user. Images only via URLs.” The prompt (or a dynamic section) must state that the model receives the **current form** when provided, and may output an updated full JSON that reflects the user’s requested changes or a new form.
- **Model**: Use existing AI stack (e.g. same as profile estimation or chat: OpenAI / Vercel AI SDK). No image upload; text-only.
- **Rate limiting / cost**: Consider per-admin or per-request limits to avoid abuse.

Implementation options:

- **Stateless**: Each request sends full history + current card form payload; server returns one reply. Simple, no session storage.
- **Session-based**: Store conversation by session id; useful if history is long or you want “Continue conversation” later. Optional for MVP.

---

## Output Format: Card Form Template JSON

The AI must produce (or the frontend must parse) **`CardFormTemplateJson`** as in `frontend/lib/forms/card-form-template-json.ts`:

- **Required**: `flowchartGraph: FlowchartGraph` (`nodes`, `edges`; optional `viewport`).
- **Optional**: `title`, `subtitle`, `submitButtonText`, `successMessage`, `cardSettings`, `styling`, `profileEstimation`, `version`.

**Flowchart → schema**: The builder and public form get the linear schema via `flowchartToSchema(graph)`. So the AI can either:

- Output **full flowchart** (nodes + edges with positions), or  
- Output a **linear list of fields** and let the backend/frontend convert with `schemaToFlowchart(schema)` to produce `flowchartGraph`.

**Recommendation**: Define a single contract—e.g. “AI returns `CardFormTemplateJson` with `flowchartGraph`”—and in the system prompt provide a **compact schema spec** (field types: text, textarea, select, radio, checkbox, statement; options; `CardMedia` with `url` only; optional styling/profileEstimation). That keeps parsing and validation on the frontend simple (reuse `isCardFormTemplateJson` and existing import logic).

**Images**: In the prompt, state that for card media and option images only **URLs** are allowed (e.g. `CardMedia.url`, option `imageUrl`); no base64 or upload.

---

## Frontend Integration with Create/Edit

- **New page**: Reuse existing new/edit form pages; no new route.
- **FormCardBuilderSection** already receives `onImportFullCardForm` and `getFullCardFormPayload` on create and edit. When the AI modal applies JSON, call that same callback with the parsed payload.
- **Current form into context**: The modal (or section) must pass the **current card form** into the AI on each request. Use `getFullCardFormPayload()` (same as Export) to build the payload and send it as `currentCardFormPayload` in the request body. When the form is new/empty, the payload may be the default/initial state (e.g. start + end nodes only)—the AI will still receive it and can treat it as “create from scratch.”
- **State**: Modal is local (open/close, messages, loading). No need to persist AI conversation to form template unless product later adds “Save AI draft”.

---

## Validation and Error Handling

- **Parse**: Prefer extracting JSON from a markdown code block (e.g. “```json … ```”) if the model returns that.
- **Validate**: `isCardFormTemplateJson(parsed)`; ensure `flowchartGraph.nodes` / `edges` exist and are well-formed.
- **On success**: `onImportFullCardForm(payload)`, close modal, toast “Form applied; you can customize further.”
- **On failure**: Show error in modal (“Generated form is invalid: …”), allow user to reply (“Fix the JSON” or “Simplify the form”) or paste corrected JSON if you add that fallback.

---

## Out of Scope (Explicit)

- **Image upload inside the AI modal**: Not in scope; images by link only.
- **Editing the system prompt in UI**: Handled in [prompt strategy](./ai-card-form-builder-prompt-strategy.md) (seed vs hardcoded).
- **Saving AI conversation to DB**: Optional later; MVP can be stateless or short-lived session.

---

## Implementation Phases (Suggested)

1. **Phase 1 – Backend**
   - Add admin (or form-scoped) endpoint for AI card-form chat (text in, text out).
   - Implement system prompt (per prompt strategy doc): clarify questions, output Card Form JSON, images as URLs only.
   - Optionally return a separate `cardFormJson` field for easier parsing.

2. **Phase 2 – Frontend modal and chat**
   - Add “Build with AI” in `FormCardBuilderSection`; open modal with chat.
   - Wire chat to new endpoint; display messages; no image upload.
   - **Send current card form** with each request via `getFullCardFormPayload()` as `currentCardFormPayload`.
   - Copy in modal: “For images, use URLs only.”

3. **Phase 3 – Apply to form**
   - Parse JSON from assistant message (e.g. code block or dedicated field).
   - Validate with `isCardFormTemplateJson`, then call `onImportFullCardForm(payload)`.
   - Toast and close; optional “Paste JSON” fallback in modal.

4. **Phase 4 (optional)**
   - Improve robustness: retry parsing, “Fix this” follow-up, or allow paste-and-import in modal.

---

## Files to Touch (Reference)

- **Frontend**
  - `frontend/components/admin/forms/form-sections/form-card-builder-section.tsx` – Add button, render modal.
  - New: `frontend/components/admin/forms/card-form-ai-builder-modal.tsx` (or under `card-form-builder/`) – Modal + chat + apply logic.
  - `frontend/lib/forms/card-form-template-json.ts` – Reuse `CardFormTemplateJson`, `isCardFormTemplateJson`.
  - Optional: `frontend/lib/api/` – New endpoint client for AI card-form chat.
- **Backend**
  - New controller/service for card-form AI chat (e.g. under `backend-api/src/main-app/modules/forms/` or `admin/`).
  - System prompt: either from seed (PromptTemplate) or hardcoded (see prompt strategy doc).

After implementation, update **AI_Orchastrator.md** with the new feature and any new modules.
