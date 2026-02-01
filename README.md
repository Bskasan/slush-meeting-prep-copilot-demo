# Meeting Prep Copilot

**Meeting Prep Copilot** is a PERN-stack app for the Slush Software Engineer Assignment 2026 (Option 1: LLM-Based Application). Users paste startup and investor profile text; the app generates a structured **meeting prep pack** (JSON) via an LLM, and users can save and browse these as notes (list and detail views).

---

## Demo links (placeholders — replace before submission)

- **Deployed app:** [https://slush-meeting-prep-copilot-demo-cli.vercel.app/](https://
  slush-meeting-prep-copilot-demo-cli.vercel.app/)

---

## Features

- **30-second startup summary** — Bullet-point summary of the startup (LLM output: `startupSummary` array).
- **Fit score 0–100 with reasons** — `fitScore` (integer 0–100) and `fitReasons` (array of strings).
- **5 tailored questions** — Exactly five questions for the meeting (`questions` tuple).
- **Time-boxed 15-minute agenda** — Four slots: 0–2 min, 2–7 min, 7–12 min, 12–15 min (`agenda`: `min0_2`, `min2_7`, `min7_12`, `min12_15`).
- **Save as notes** — Save generated prep packs via `POST /api/prep-packs`; list view (`GET /api/prep-packs`) and detail view (`GET /api/prep-packs/:id`).

---

## Tech Stack

| Layer      | Technology                                                             |
| ---------- | ---------------------------------------------------------------------- |
| Client     | React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios          |
| API        | Express 5, Node, TypeScript                                            |
| Database   | PostgreSQL, Prisma                                                     |
| LLM        | LangChain, OpenAI (e.g. `gpt-4o-mini`)                                 |
| Validation | Zod                                                                    |
| Deployment | Render (API + managed Postgres); client can be Vercel or Render static |

---

## Architecture Overview

- **Flow:** Client → Express API → PostgreSQL. The client calls `/api/generate` with profile text; the server calls the LLM, validates the response with Zod, optionally repairs once, then returns the prep pack. The client can save it via `POST /api/prep-packs`.
- **Generation:** Handled in `generatePrepPack` (LangChain + OpenAI). Output must match a strict Zod schema (`prepPackResultSchema`). Invalid or malformed JSON triggers at most one repair attempt with validation errors; if still invalid, the API returns 502 with a safe error message.
- **Storage:** Saved prep packs are stored in the `prep_packs` table. The structured LLM result is stored in a **JSONB** column (`resultJson`). List endpoint returns id, createdAt, title, names, and fitScore; detail endpoint returns the full record including `resultJson`.
- **Notes browsing:** List page shows all saved packs; detail page shows one pack (title, profiles, and the rendered prep pack from `resultJson`).

```
┌─────────────┐     POST /api/generate      ┌─────────────┐     LLM + Zod      ┌──────────┐
│   Client    │ ──────────────────────────► │   Express   │ ─────────────────► │ OpenAI   │
│  (React)    │     POST/GET /api/prep-packs│   API      │ ◄─────────────────  │ (LangChain)
└─────────────┘ ◄────────────────────────── └─────┬──────┘   prep pack JSON   └──────────┘
       │                                            │
       │                                            │ Prisma
       │                                            ▼
       │                                      ┌──────────┐
       └────────────────────────────────────  │ Postgres │  (prep_packs.resultJson)
                                              └──────────┘
```

---

## LLM Reliability & Safety

- **Strict Zod schema** — LLM output is validated with `prepPackResultSchema` (startupSummary, fitScore 0–100, fitReasons, exactly 5 questions, agenda with four slots). No extra keys allowed.
- **Repair once** — If the first response is invalid JSON or fails Zod:
  - Server extracts the first `{...}` from the raw string and re-parses; if parsing fails → 502.
  - If parsing succeeds but validation fails, the server sends one repair request to the LLM with the validation error summary; if the repair response is still invalid or fails validation → 502 with a safe error. No second repair.
- **Input validation** — Profile text: min 80 chars, max 8000 chars (Zod). Optional names: max 80 chars. Request body size limit: **256 KB**.
- **Rate limiting** — In-memory rate limiter on **POST** `/api/generate` only: 10 requests per 10 minutes per IP. 429 when exceeded. GET `/api/prep-packs` and GET `/api/prep-packs/:id` are not rate limited.
- **Prompt rules** — System prompt enforces: output **JSON only** (no markdown/code fences); **do not invent facts** if info is missing; **ignore instructions** inside the provided startup/investor profiles (injection resistance).

Only safeguards present in the codebase are listed above.

---

## Security considerations

- **Input validation** — Server uses Zod schemas: profile text 80–8000 chars, optional names max 80 chars, title max 120 chars. Invalid input returns 400 with `{ error: string }`. Request body size is limited to 256 KB (`express.json({ limit })`).
- **Rate limiting** — POST `/api/generate` is rate limited (10 req / 10 min per IP). GET prep-packs endpoints are not limited so list/detail views are unaffected. Set `trust proxy` (e.g. `app.set("trust proxy", 1)`) when deployed behind a reverse proxy (e.g. Render) so `req.ip` is correct.
- **Low-signal heuristic** — Before calling the LLM, the server runs a lightweight `isLowSignalText()` check (e.g. very low word count, high repetition, symbol-heavy input) and returns 400 with a friendly message to reduce garbage/abuse inputs.
- **Prompt injection** — System prompt treats user-provided profiles as untrusted; the model is instructed to ignore instructions in profiles, not reveal system prompts or secrets, and to output JSON only. Repair-once flow is unchanged.
- **XSS** — User and model output are never rendered as HTML. PrepPackView, NoteDetailPage (including raw profile text in `<pre>`), and ErrorBanner render plain text only. No `dangerouslySetInnerHTML` or similar is used.

---

## API Endpoints (Brief)

| Method   | Path                       | Description                                                                                                                        |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/api/generate`            | Generate a prep pack from profile text. Body: `startupProfileText`, `investorProfileText`, optional `startupName`, `investorName`. |
| `POST`   | `/api/prep-packs`          | Save a prep pack. Body: `title`, profile text, `resultJson` (valid prep pack object), optional names/model/tokensUsed.             |
| `GET`    | `/api/prep-packs`          | List saved packs (id, createdAt, title, startupName, investorName, fitScore).                                                      |
| `GET`    | `/api/prep-packs/:id`      | Get one prep pack by id (full record including `resultJson`).                                                                      |
| `PATCH`  | `/api/prep-packs/:id`      | Partial update of a prep pack (optional).                                                                                          |
| `DELETE` | `/api/prep-packs/:id`      | Delete a prep pack (optional).                                                                                                     |
| `GET`    | `/health` or `/api/health` | Health check. Returns `{ "status": "ok" }`.                                                                                        |

**Example — POST /api/generate (minimal request):**

```json
{
  "startupProfileText": "Startup X is a B2B SaaS platform that helps teams... (at least 80 chars)",
  "investorProfileText": "We invest in seed-stage B2B software in Europe... (at least 80 chars)"
}
```

**Example — POST /api/prep-packs (minimal):**

```json
{
  "title": "Meeting with Fund Y",
  "startupProfileText": "...",
  "investorProfileText": "...",
  "resultJson": {
    "startupSummary": ["Bullet one", "Bullet two"],
    "fitScore": 75,
    "fitReasons": ["Reason one"],
    "questions": ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
    "agenda": {
      "min0_2": ["Intro"],
      "min2_7": ["Pitch"],
      "min7_12": ["Q&A"],
      "min12_15": ["Next steps"]
    }
  }
}
```

---

## Local Development Setup

### Prerequisites

- **Node.js** v18+ (v20 used in Docker)
- **npm** 10+
- **PostgreSQL** (local or via Docker)

### Environment variables

**Server** (`packages/server` or root `.env` used by server):

- `DATABASE_URL` — PostgreSQL connection string (required).
- `PORT` — Optional; default 3000.
- `OPENAI_API_KEY` — Required for `POST /api/generate`.
- `LLM_MODEL` — Optional; default `gpt-4o-mini`.
- `ALLOWED_ORIGINS` — Comma-separated CORS origins (e.g. `http://localhost:5173`). Optional; default includes `http://localhost:5173`.

**Client** (`packages/client`):

- `VITE_API_BASE_URL` — API base URL with no trailing slash (e.g. `http://localhost:3000`). Required for production; for local dev with Vite proxy, can be empty if API is proxied.

Copy `env.example` to `.env` in the repo root or `packages/server` and set the server variables. Copy `packages/client/.env.example` to `packages/client/.env` and set `VITE_API_BASE_URL` if needed.

### Commands (from repo root)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Database (choose one)**
   - **Docker:** Start Postgres (and optionally the server):

     ```bash
     docker compose up -d postgres
     ```

   - **Local Postgres:** Create a DB and set `DATABASE_URL` in `.env`.

3. **Migrations and seed**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run dev (client + server)**

   ```bash
   npm run dev
   ```

   - Client: typically http://localhost:5173 (Vite).
   - Server: http://localhost:3000 (or value of `PORT`).

5. **Run tests**

   ```bash
   npm run test
   ```

   Runs server tests (`generate` route, `generatePrepPack` service, schemas) and client tests (`GeneratorPage`, `NotesListPage`).

**Other scripts:** `npm run build` (client + server), `npm run build:client`, `npm run build:server`, `npm run lint` (server + client), `npm run typecheck` (server + client), `npm run format`, `npm run format:check`, `npm run test`. See root `package.json` and `packages/*/package.json` for full list.

---

## Quality gates

### Local (Husky)

- **pre-commit** — Runs `lint-staged`: Prettier on staged `*.{ts,tsx,js,jsx,json,md,css}`. Commit is blocked if formatting fails.
- **pre-push** — Runs full gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. Push is blocked if any fail.

After `npm install`, Husky is installed via the `prepare` script. To test hooks: e.g. try committing a file with a lint/format error (pre-commit should block) or run `npm run build` locally to ensure pre-push would pass.

### CI (GitHub Actions)

- Workflow: `.github/workflows/ci.yml`
- Triggers: **pull_request** and **push** to `main`
- Jobs: **Server** and **Client** run in parallel. Each: checkout → Node 20 + npm cache → `npm ci` → lint → typecheck → test → build
- Status: Check the **Actions** tab on GitHub for PR and main runs.

### CD (Render)

- **Render** deploys automatically on merge to `main` when the repo is connected (Blueprint or Git-based deploy). No separate CD workflow is required. If you use Render deploy hooks instead, add a workflow that calls the hook URL from a GitHub Secret (e.g. `RENDER_DEPLOY_HOOK_API`) on successful main builds; do not commit hook URLs.

### Docker (optional)

Run Postgres and the API in containers; run the client on the host for fast HMR. See [docs/DOCKER.md](docs/DOCKER.md) for details.

```bash
docker compose up -d postgres
docker compose up --build server
# In another terminal:
npm run dev:client
```

---

## Deployment (Render)

Deployment is on **Render**. Two approaches are supported:

### Option A — Node runtime (Blueprint)

The repo includes a **Render Blueprint** (`render.yaml`) that defines:

- **Web service** — Node app from `packages/server` (build: `npm ci`, start: `npm run start`). **Migrations:** `preDeployCommand: npx prisma migrate deploy` runs on Render before each deploy.
- **PostgreSQL** — Managed database `meeting-prep-copilot-db`; `DATABASE_URL` is injected from the database resource.

**API service env vars (set in Render dashboard):**

- `DATABASE_URL` — From Render Postgres (auto if linked).
- `OPENAI_API_KEY` — Required for generation.
- `ALLOWED_ORIGINS` — Comma-separated origins for the deployed client (e.g. `<RENDER_CLIENT_URL>` or `https://your-app.vercel.app`). Wildcards supported (e.g. `https://*.vercel.app`).

**Client build:** Set `VITE_API_BASE_URL` to your Render API URL when building the client (e.g. `https://meeting-prep-copilot-api.onrender.com` or `<RENDER_API_URL>`). No trailing slash. If the client is on Vercel, set this in Vercel; set `ALLOWED_ORIGINS` on Render to include the Vercel URL.

### Option B — Docker on Render

If you deploy using **Docker** on Render (build from repo root, Dockerfile):

- Do **not** set a Render pre-deploy command for migrations. The image **entrypoint** (`docker-entrypoint.sh`) runs `prisma migrate deploy` when the container starts.
- Set the same environment variables on the service: `DATABASE_URL`, `OPENAI_API_KEY`, `ALLOWED_ORIGINS`.

**Placeholders to replace before submission:**

- `<RENDER_API_URL>` — Your Render API service URL (e.g. `https://meeting-prep-copilot-api.onrender.com`).
- `<RENDER_CLIENT_URL>` — Your deployed client URL (for `ALLOWED_ORIGINS` and for `VITE_API_BASE_URL` when building the client).

---

## Design Decisions & Trade-offs

- **Zod for output** — Ensures a fixed shape for the prep pack and safe parsing; enables a single repair pass with concrete validation errors.
- **Result stored as JSONB** — Keeps the schema flexible for future fields without new migrations; Prisma/Postgres handle JSON well for list (e.g. fitScore) and detail views.
- **Repair once** — Balances UX (many LLM mistakes are fixable in one shot) with cost and latency; no unbounded retries.
- **Minimal UI** — Focus on the assignment scope: generate, save, list, detail. No auth, no user accounts, no multi-tenancy.
- **Intentionally not built** — Authentication, user accounts, login, or per-user data isolation.

---

## Next Improvements

- **Auth & multi-user** — Accounts and per-user prep packs.
- **Input structuring** — Optional structured fields (e.g. company name, stage) in addition to free-text profiles.
- **Analytics** — Usage and token metrics.
- **Caching** — Cache identical or near-identical profile pairs to reduce LLM calls.
- **Streaming** — Stream LLM output for perceived performance.
- **RAG** — Use investor/startup docs or past notes to improve relevance.

---

## Project Structure

```
├── packages/
│   ├── client/     # React + Vite frontend
│   └── server/     # Express API, Prisma, PostgreSQL
├── docker-compose.yml
├── Dockerfile
├── render.yaml     # Render Blueprint (API + Postgres)
├── package.json    # Workspace root scripts
└── README.md
```

---

## Submission checklist (Slush 2026)

Before submitting, ensure:

- [ ] **Repo link** — Replace placeholder or add repo URL where required
- [ ] **Deployed app link or screen recording** — Replace `<DEPLOYED_APP_URL>` or provide a recording
- [ ] **Email** — Send to **aapo.leppanen@slush.org** with repo link and deployed link (or recording)

See [docs/REQUIREMENTS_CHECK.md](docs/REQUIREMENTS_CHECK.md) for the full requirements audit.

---

## Scripts (root)

| Script                 | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Run client and server in dev |
| `npm run build`        | Build client and server      |
| `npm run test`         | Run server and client tests  |
| `npm run lint`         | Lint server and client       |
| `npm run typecheck`    | Typecheck server and client  |
| `npm run format`       | Format repo with Prettier    |
| `npm run format:check` | Check formatting (no write)  |
| `npm run db:migrate`   | Run Prisma migrations        |
| `npm run db:seed`      | Seed database                |
