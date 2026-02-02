# Meeting Prep Copilot

**Meeting Prep Copilot** is a PERN-stack app for the Slush Software Developer Assignment 2026 (Option 1: LLM-Based Application). Users paste startup and investor profile text; the app generates a structured **meeting prep pack** (JSON) via an LLM, and users can save and browse these as notes (list and detail views).

---

## Demo

- **Deployed app:** [https://slush-meeting-prep-copilot-demo-cli.vercel.app/](https://slush-meeting-prep-copilot-demo-cli.vercel.app/)

---

## Features

- **30-second startup summary** — Bullet-point summary of the startup (LLM output: `startupSummary` array).
- **Fit score 0–100 with reasons** — `fitScore` (integer 0–100) and `fitReasons` (array of strings).
- **5 tailored questions** — Exactly five questions for the meeting (`questions` tuple).
- **Time-boxed 15-minute agenda** — Four slots: 0–2 min, 2–7 min, 7–12 min, 12–15 min (`agenda`: `min0_2`, `min2_7`, `min7_12`, `min12_15`).
- **Save as notes** — Save generated prep packs via `POST /api/prep-packs`; list view (`GET /api/prep-packs`) and detail view (`GET /api/prep-packs/:id`).

---

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Client     | React 19, Vite, TypeScript, Tailwind CSS, React Router        |
| API        | Express 5, Node, TypeScript                                   |
| Database   | PostgreSQL, Prisma                                            |
| LLM        | LangChain, OpenAI (e.g. `gpt-4o-mini`)                        |
| Validation | Zod                                                           |
| Deployment | Render (API + managed Postgres) and Vercel(Client)            |

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

## Security (summary)

Input validation, rate limiting, and prompt rules are covered in **LLM Reliability & Safety** above. Additionally: low-signal input is rejected via `isLowSignalText()` before calling the LLM; set `trust proxy` when behind a reverse proxy (e.g. Render) so rate limiting uses the correct IP; all user and model output is rendered as plain text (no `dangerouslySetInnerHTML`).

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

## Quality & Docker

**CI:** `.github/workflows/ci.yml` runs on PR and push to `main` (lint, typecheck, test, build for server and client). **Local:** Husky pre-commit (Prettier on staged files) and pre-push (full lint, typecheck, test, build). **Docker (optional):** Postgres and API in containers. Quick start: `docker compose up -d postgres` then `docker compose up --build server`; run `npm run dev:client` on the host for HMR.

---

## Deployment (Render)

Deployment is on **Render**. **Render** is handling our *PostgreSQL Database* and *Server*

---

## Design Decisions & Trade-offs

- **Zod for output** — Ensures a fixed shape for the prep pack and safe parsing; enables a single repair pass with concrete validation errors.
- **Result stored as JSONB** — Keeps the schema flexible for future fields without new migrations; Prisma/Postgres handle JSON well for list (e.g. fitScore) and detail views.
- **Repair once** — Balances UX (many LLM mistakes are fixable in one shot) with cost and latency; no unbounded retries.
- **Minimal UI** — Focus on the assignment scope: generate, save, list, detail. No auth, no user accounts, no multi-tenancy.
- **Intentionally not built** — Authentication, user accounts, login, or per-user data isolation.

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
