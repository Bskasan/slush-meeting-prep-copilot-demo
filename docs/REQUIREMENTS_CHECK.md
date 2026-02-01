# Slush Assignment 2026 — Requirements Compliance (Option 1: LLM-Based App)

**Audit date:** 2026-02-01  
**Track:** Option 1 — LLM-Based Application  
**Repository:** meeting-prep-copilot

---

## A) Option selection

**Option 1: LLM-Based Application** — ✅ Confirmed

| Requirement                              | Status | Evidence (file paths)                                                                                                                                                                                                                  |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LangChain / agent/tool-using or workflow | ✅     | `packages/server/src/services/createChatModel.ts` — `ChatOpenAI` from `@langchain/openai`; `packages/server/src/services/generatePrepPack.ts` — `SystemMessage`, `HumanMessage` from `@langchain/core/messages`, `model.invoke([...])` |
| Prompt design                            | ✅     | `packages/server/src/services/generatePrepPack.ts` — `INJECTION_RULES`, `JSON_SCHEMA_PROMPT`, `SYSTEM_MESSAGE_CONTENT`, `buildRepairPrompt`                                                                                            |
| Clear data flow                          | ✅     | Client → Express API → LangChain/OpenAI → Zod validation → optional repair → response; save via `POST /api/prep-packs`                                                                                                                 |
| Correctness and reliability              | ✅     | Strict Zod schema, repair-once, safe error handling (502 on LLM failure)                                                                                                                                                               |

---

## B) Functional checklist (Pass/Fail)

| Item                                                        | Status | Evidence                                                                                                                                                                                        | Notes                               |
| ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Generate flow** — startup + investor profiles → prep pack | ✅     | `packages/client/src/pages/GeneratorPage.tsx`, `packages/client/src/components/GeneratorForm.tsx`; `packages/server/src/routes/generate.ts`, `packages/server/src/services/generatePrepPack.ts` | End-to-end flow                     |
| **30-sec startup summary** (bullets)                        | ✅     | `packages/server/src/schemas/index.ts` — `startupSummary: z.array(z.string()).min(1)`; `packages/client/src/components/PrepPackView.tsx` renders bullets                                        |                                     |
| **Fit score 0–100 + reasons**                               | ✅     | `fitScore: z.number().min(0).max(100)`, `fitReasons: z.array(z.string()).min(1)`; PrepPackView shows both                                                                                       |                                     |
| **5 tailored questions**                                    | ✅     | `questions: z.tuple([z.string(), ...])` (exactly 5) in `schemas/index.ts`; PrepPackView renders all 5                                                                                           |                                     |
| **15-min agenda buckets** (0–2, 2–7, 7–12, 12–15)           | ✅     | `agendaSchema` with `min0_2`, `min2_7`, `min7_12`, `min12_15` in `schemas/index.ts`; PrepPackView renders all four                                                                              |                                     |
| **Strict schema validation**                                | ✅     | `prepPackResultSchema` with `.strict()` in `schemas/index.ts`; used in `generatePrepPack.ts` and `savePrepPackRequestSchema`                                                                    | No extra keys allowed               |
| **Repair once + graceful fail**                             | ✅     | `packages/server/src/services/generatePrepPack.ts` L186–214: one repair attempt on invalid/validation failure; then `LLMOutputInvalidError` → 502 with safe message                             |                                     |
| **Save notes + list + detail**                              | ✅     | `POST /api/prep-packs`, `GET /api/prep-packs`, `GET /api/prep-packs/:id` in `packages/server/src/routes/prepPacks.ts`; `NotesListPage.tsx`, `NoteDetailPage.tsx`                                | PATCH/DELETE also exist             |
| **Deployed app link**                                       | ⚠️     | README — use placeholder `<DEPLOYED_APP_URL>` until submission                                                                                                                                  | Replace before sending              |
| **App runnable locally from README**                        | ✅     | README "Local Development Setup" — prerequisites, env vars, `docker compose up -d postgres`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`                                             | Commands match root/package scripts |

---

## C) Non-functional checklist

| Item                                  | Status | Evidence                                                                                                                                                                                                                                                                     | Notes             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Clear data flow and typed contracts   | ✅     | TypeScript throughout; Zod request/response schemas; `lib/api.ts` and server routes use typed payloads                                                                                                                                                                       |                   |
| Input validation and safety           | ✅     | `generateRequestSchema`, `savePrepPackRequestSchema` (profile 80–8000 chars, names max 80, title max 120); `isLowSignalText` in `packages/server/src/lib/textHeuristics.ts`; body limit 256 KB in `app.ts`                                                                   |                   |
| Rate limiting                         | ✅     | `packages/server/src/middleware/rateLimit.ts`; applied to `POST /api/generate` only (10 req / 10 min per IP) in `app.ts`                                                                                                                                                     | 429 when exceeded |
| Code structure readability            | ✅     | Monorepo `packages/client`, `packages/server`; clear routes, schemas, services, repos                                                                                                                                                                                        |                   |
| Scope control (no over-engineering)   | ✅     | Generate, save, list, detail; no auth, minimal UI                                                                                                                                                                                                                            |                   |
| Tests and how to run                  | ✅     | Server: `packages/server/src/routes/tests/generate.test.ts`, `services/tests/generatePrepPack.test.ts`, `schemas/tests/index.test.ts`. Client: `packages/client/src/pages/tests/GeneratorPage.test.tsx`, `NotesListPage.test.tsx`. Root: `npm run test` runs both workspaces |                   |
| Deployment docs presence and accuracy | ✅     | README "Deployment (Render)", `render.yaml`; env vars, migrations, CORS documented                                                                                                                                                                                           |                   |

---

## D) Final submission checklist

- [ ] **Repo URL** — Replace placeholder in README with actual repo link
- [ ] **Deployed app URL** — Replace `<DEPLOYED_APP_URL>` with live client URL (or provide screen recording)
- [ ] **Deployed API URL** — Replace `<DEPLOYED_API_URL>` if documented
- [ ] **README** — Complete; design decisions and trade-offs included
- [ ] **Env examples** — `env.example` (root) and `packages/client/.env.example` present; no secrets committed
- [ ] **Email** — Send to aapo.leppanen@slush.org with repo link and deployed link or recording

---

## Step 1 — Repo discovery (evidence summary)

| Area                     | Implementation (file paths)                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client routes**        | `packages/client/src/App.tsx` — `/` (GeneratorPage), `/notes` (NotesListPage), `/notes/:id` (NoteDetailPage)                                                                                                                    |
| **Server endpoints**     | `packages/server/src/app.ts` — `POST /api/generate`, `GET`/`POST`/`PATCH`/`DELETE` `/api/prep-packs`, `GET /api/prep-packs/:id`, `GET /health`, `GET /api/health`                                                               |
| **LLM workflow**         | `packages/server/src/services/generatePrepPack.ts` — prompts, `prepPackResultSchema` from `schemas/index.ts`, extract first `{...}`, parse, Zod validate, repair once, graceful 502 on failure                                  |
| **Prisma schema**        | `packages/server/prisma/schema.prisma` — model `PrepPack`, table `prep_packs`, `resultJson Json` (JSONB)                                                                                                                        |
| **Input validation**     | `packages/server/src/schemas/index.ts` — profile 80–8000 chars, names max 80, title max 120; `packages/server/src/app.ts` — `express.json({ limit: "256kb" })`; `packages/server/src/lib/textHeuristics.ts` — `isLowSignalText` |
| **Rate limit**           | `packages/server/src/middleware/rateLimit.ts` — in-memory; `app.ts` — 10 req / 10 min on `/api/generate`                                                                                                                        |
| **Error response shape** | `packages/server/src/app.ts` — ZodError → 400 `{ error: string }`; HttpError/LLMOutputInvalidError → status + `{ error: string }`                                                                                               |
| **Scripts**              | Root `package.json` — `dev`, `dev:client`, `dev:server`, `build`, `test`, `lint`, `typecheck`, `db:migrate`, `db:seed`; server `package.json` — `start`, `dev`, `db:migrate` = `prisma migrate deploy`                          |
| **Docker**               | `Dockerfile` (root), `docker-compose.yml` (postgres + server), `packages/server/docker-entrypoint.sh` (migrate then exec)                                                                                                       |
| **Tests**                | Jest; server route generate, service generatePrepPack, schemas; client GeneratorPage, NotesListPage. Run: `npm run test`                                                                                                        |
| **Deployment**           | `render.yaml` — API (Node, packages/server) + managed Postgres; env: DATABASE_URL, OPENAI_API_KEY, ALLOWED_ORIGINS. Client: `VITE_API_BASE_URL` at build time                                                                   |
