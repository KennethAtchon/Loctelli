# AI Card Form Builder – Prompt Strategy: Seed vs Hardcoded

## Context

The AI Card Form Builder uses a **system prompt** that tells the model to:
- Ask clarifying questions.
- Produce **Card Form Template JSON** for the user.
- Use **images only via links** (no upload).

The product decision: should this prompt be **driven by the existing prompt data model (with a seed)** or **hardcoded on the server** with no user-facing option to change it?

---

## Option A: Prompt Data Model + Seed

**Idea**: Create a **PromptTemplate** (or equivalent in your schema) dedicated to the Card Form Builder AI, seeded via migration/seed script. The backend loads this template when building the system prompt for the card-form AI endpoint. Admins could later edit the prompt in the same UI used for other AI agents (e.g. sales chat).

**Mechanics**:

- **Seed data**: Add a record like `name: "Card Form Builder Agent"`, `category: "forms"` or `"card-form-builder"`, with a long `baseSystemPrompt` (or `systemPrompt`) that includes:
  - Role: “You help users create card forms by asking questions and outputting JSON.”
  - Rules: Ask clarifying questions; output valid `CardFormTemplateJson`; images only via URLs; no image upload.
  - Optional: Short spec of `CardFormTemplateJson` (flowchartGraph required; optional title, styling, profileEstimation).
- **Backend**: Card-form AI endpoint resolves “the” Card Form Builder prompt (e.g. by name/category or a fixed config id), builds the system prompt from that template (with any injected context, e.g. “Current form title: …”), and calls the model.
- **Frontend**: No prompt UI for this flow unless you explicitly add an “Edit system prompt” for Card Form Builder in admin (could be Phase 2).

**Pros**:

- **Consistency**: Same pattern as sales/support bots; one place for “all AI prompts.”
- **Operability**: Support or product can tune the prompt (e.g. add examples, change tone) without a code deploy.
- **A/B / iterations**: You can duplicate the template, change text, and compare behavior.
- **Auditability**: Prompt lives in DB; you can track who changed it and when (if you add that).

**Cons**:

- **Complexity**: Requires a way to “select” this template (e.g. by name/category or a dedicated flag) and possibly different code path than lead-based chat (no lead/strategy).
- **Overkill for single use**: If this is the only “form builder” bot and you never plan to expose editing, the DB and resolution logic add surface area.
- **Seed drift**: If someone deletes or deactivates the seed template, the feature breaks unless you handle fallback.

---

## Option B: Hardcoded Prompt on Server

**Idea**: The system prompt for the Card Form Builder AI is a **constant (or a single file)** in the backend. No DB record, no admin UI to edit it. The endpoint builds the prompt from that constant and optionally injects minimal context (e.g. “Form type: card”).

**Mechanics**:

- **Backend**: e.g. `CARD_FORM_BUILDER_SYSTEM_PROMPT` in `card-form-ai.service.ts` or a small `card-form-ai.prompts.ts`; or a markdown/file read at startup. No Prisma/DB for this prompt.
- **Content**: Same as in Option A (clarifying questions, JSON output, images via URLs only).
- **Frontend**: No option to view or edit the prompt; “Build with AI” just uses whatever the server has.

**Pros**:

- **Simplicity**: No seed, no template resolution, no “which prompt?” logic. Fewer moving parts.
- **Predictability**: Prompt is in code; code review and version control track all changes.
- **No dependency on prompt system**: Works even if PromptTemplate schema or seed scripts change.
- **Fast to ship**: Implement endpoint + constant and you’re done.

**Cons**:

- **No operator tuning**: Any change requires deploy and code change.
- **Inconsistency**: Sales/support use PromptTemplate; card-form builder would be the exception. New devs might look for a template and not find it.
- **Harder to experiment**: Tweaking prompt means editing code and redeploying.

---

## Recommendation

| If you… | Prefer |
|--------|--------|
| Want to ship quickly and keep this feature simple and self-contained | **Option B (hardcoded)** |
| Want one consistent “prompt story” and the ability to tune this prompt without deploys | **Option A (seed + prompt model)** |
| Plan to add “Edit Card Form AI prompt” in admin later | **Option A** |
| Have no plans to expose or edit this prompt | **Option B** |

**Pragmatic default**: Start with **Option B (hardcoded)** for MVP. The Card Form Builder AI is a single, focused use case; a well-documented constant in the backend is easy to maintain and keeps the first version simple. If you later need operator control or consistency with other agents, introduce a **seed template** and refactor the endpoint to load from the prompt model (Option A); the frontend and the rest of the feature plan stay the same.

---

## Implementation Notes for Each Option

### If Option A (Seed)

- Add to seed (e.g. `backend-api/prisma/seed.ts` or a dedicated seed file): one `PromptTemplate` with `name: "Card Form Builder Agent"` and a `baseSystemPrompt` (or `systemPrompt`) containing the full instructions + JSON spec.
- In the card-form AI service: resolve this template by name/category (e.g. `findFirst({ where: { name: "Card Form Builder Agent" } })`). Build system prompt from template; do **not** attach to lead/strategy/subaccount (this is an admin/form-context bot).
- Document in AI_Orchastrator (or architecture) that “Card Form Builder AI” uses the prompt model and which template name to use.

### If Option B (Hardcoded)

- Define the prompt string in the module that handles the card-form AI (e.g. `card-form-ai.service.ts` or `constants/card-form-ai.prompt.ts`). Optionally read from a `.md`/`.txt` file at startup if you want to keep code and copy separate.
- Document in the same file (or AI_Orchastrator) that this prompt is intentional and not user-editable; link to the feature plan and JSON spec.

---

## Summary

- **Option A**: Prompt data model + seed — consistent, editable, more setup.
- **Option B**: Hardcoded on server — simple, no UI, change by deploy.
- **Suggested**: Implement with **Option B** first; migrate to **Option A** later if you need operability or consistency with other AI prompts.
