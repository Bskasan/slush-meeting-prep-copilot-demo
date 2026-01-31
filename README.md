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
