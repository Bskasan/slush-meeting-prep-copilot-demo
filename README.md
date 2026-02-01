# Meeting Prep Copilot

A monorepo application for preparing meeting materials. The client is a React app; the server is an Express API with Prisma and PostgreSQL, managing **Prep Packs** (meeting prep data for startups and investors).

## Tech Stack

- **Client:** React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios
- **Server:** Express 5, TypeScript, Prisma, PostgreSQL

## Prerequisites

- Node.js (v18+)
- npm 10+
- PostgreSQL

## Getting Started

### Install dependencies

```bash
npm install
```

### Database setup

From the repo root:

```bash
npm run db:migrate
npm run db:seed
```

Ensure a PostgreSQL database is configured (e.g. via `.env` in `packages/server` for Prisma).

### Run development

Start both client and server:

```bash
npm run dev
```

- Client: typically http://localhost:5173 (Vite)
- Server: check `packages/server` for the configured port

### Build

```bash
npm run build
```

Build client only: `npm run build:client`  
Build server only: `npm run build:server`

### Docker

Run Postgres and the API in containers; run the client on the host for fast HMR. For more detail on what Docker is, why we use it, and how it’s implemented, see [docs/DOCKER.md](docs/DOCKER.md).

1. Start Postgres and the server:

   ```bash
   docker compose up -d postgres
   docker compose up --build server
   ```

   Or start both at once: `docker compose up --build`

2. On the host, start the client (Vite proxies `/api` and `/health` to the server at `localhost:3000`):

   ```bash
   npm run dev:client
   ```

3. (Optional) Seed the database once:

   ```bash
   docker compose exec server npm run db:seed
   ```

The server runs migrations on startup. Environment variables for the server container (e.g. `DATABASE_URL`) are set in `docker-compose.yml`. For local (non-Docker) runs, copy `env.example` to `.env` in the repo root or `packages/server` and set `DATABASE_URL` and `PORT`.

### Deploy on Render (Docker)

When you deploy using **Docker** on Render (Environment: Docker, build from repo root):

- **Do not set a pre-deploy command.** The Docker image’s entrypoint already runs `prisma migrate deploy` when the container starts. If you add a pre-deploy step (e.g. `npx prisma migrate deploy`), Render runs it on the build host where Prisma is not installed, so the deploy fails with “prisma: not found”.
- Set `DATABASE_URL` (via a Render PostgreSQL resource) and, if needed, `OPENAI_API_KEY` and `ALLOWED_ORIGINS` in the service environment.

### Deploy client on Vercel

1. **Connect the repo** and create a project. Set **Root Directory** to `packages/client` (monorepo).
2. **Environment variable (required):** Add `VITE_API_BASE_URL` and set it to your Render API URL with no trailing slash, e.g. `https://meeting-prep-copilot-api.onrender.com`. The client uses this to call the API; without it, production requests would go to the same origin and fail.
3. **On Render:** Set `ALLOWED_ORIGINS` on the API service to include your Vercel URL (e.g. `https://your-app.vercel.app`) so CORS allows requests from the deployed client.
4. Build and output are set in `packages/client/vercel.json` (build: `npm run build`, output: `dist`, SPA rewrites). Override in the dashboard only if needed.

## Project structure

```
├── packages/
│   ├── client/     # React + Vite frontend
│   └── server/     # Express API, Prisma, PostgreSQL
├── package.json    # Workspace root scripts
└── README.md
```

## Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev` | Run client and server in dev   |
| `npm run build` | Build client and server     |
| `npm run db:migrate` | Run Prisma migrations   |
| `npm run db:seed` | Seed database              |
| `npm run lint` | Lint client                   |
