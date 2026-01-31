# Docker in Meeting Prep Copilot

This document explains what Docker is, why we use it in this project, and how our Docker setup is implemented.

---

## What is Docker?

**Docker** is a platform for building, shipping, and running applications in **containers**. A container packages your application together with its runtime and dependencies (e.g. Node.js, system libraries) so it runs the same way on any machine that has Docker installed.

- **Image**: A read-only template (like a snapshot) that defines what goes inside the container—OS layer, runtime, your code, and dependencies.
- **Container**: A running instance of an image. You can start many containers from the same image.
- **Docker Compose**: A tool that defines and runs multiple containers (e.g. app + database) from a single configuration file.

Think of it as “run this app in a small, isolated environment that’s identical everywhere” instead of “install Node, Postgres, and hope versions match.”

---

## Why Docker is helpful for this project

### 1. Consistent development environment

Everyone gets the same **PostgreSQL version** (16) and the same **Node version** (20) for the server, without installing Postgres or matching Node on their machine. New contributors can run the API and database with:

```bash
docker compose up --build
```

No “it works on my machine” caused by different Postgres or Node versions.

### 2. Database without local install

The project depends on **PostgreSQL**. With Docker, Postgres runs in a container; you don’t have to install or configure it on Windows, macOS, or Linux. The same `docker-compose.yml` gives everyone an identical database (user, password, database name, port).

### 3. Production-like setup locally

The server runs in a container with migrations applied on startup, a non-root user, and `NODE_ENV=production`. That’s closer to how it would run in production, so you can catch environment-specific issues earlier.

### 4. Simple onboarding and CI

New team members (or CI) can start the stack with one command. The README’s “Docker” section and this doc explain the flow without requiring deep Docker knowledge.

### 5. Clear separation: API in Docker, client on host

We run only **Postgres** and the **server** in Docker. The **client** (Vite/React) runs on your machine with `npm run dev:client`. That keeps Vite’s fast hot-reload and avoids extra client-container complexity while still giving you a reliable API and database in containers.

---

## How we implement Docker in this project

### Overview

We use:

- **One Dockerfile** at the repo root to build the server image (monorepo-aware, multi-stage).
- **One docker-compose.yml** at the repo root that runs Postgres and the server.
- **An entrypoint script** in the server package that runs Prisma migrations before starting the API.

The client is not containerized; it runs on the host and proxies API requests to the server container.

```text
┌─────────────────────────────────────────────────────────────┐
│  Host                                                        │
│  ┌─────────────────────┐                                    │
│  │  Client (Vite)       │  npm run dev:client                │
│  │  localhost:5173      │  proxies /api, /health → :3000     │
│  └──────────┬──────────┘                                    │
│             │                                                │
└─────────────┼───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose                                              │
│  ┌─────────────────────┐     ┌─────────────────────────┐   │
│  │  server              │     │  postgres                │   │
│  │  Node + Express API  │────▶│  PostgreSQL 16           │   │
│  │  port 3000           │     │  port 5432               │   │
│  └─────────────────────┘     └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Dockerfile (server image)

**Location:** [Dockerfile](../Dockerfile) at the repo root.

**Purpose:** Build a single image that runs the API. The image is monorepo-aware (uses the root `package.json` and workspaces) but only includes what the server needs.

**Stages:**

- **Build stage (`build`):**
  - Base: `node:20-alpine`.
  - Copies root `package.json`, `package-lock.json`, `tsconfig.base.json`.
  - Copies the full `packages/server` (source, Prisma schema, migrations, config).
  - Copies only `packages/client/package.json` so `npm ci` at the root succeeds (workspaces expect both packages).
  - Runs `npm ci` at the root; the server’s `postinstall` runs `prisma generate`.

- **Production stage (`production`):**
  - Base: `node:20-alpine` again (small, clean image).
  - Copies from the build stage: root package files, `node_modules`, `packages/server`, and the minimal client `package.json`.
  - Creates a non-root user `nodejs` and runs the process as that user.
  - Sets `NODE_ENV=production` and exposes port `3000`.
  - **Entrypoint:** [packages/server/docker-entrypoint.sh](../packages/server/docker-entrypoint.sh) (see below).
  - **CMD:** `npm start` (runs the server’s start script from the server package directory).

The multi-stage build keeps the final image smaller and avoids dev-only tooling in production.

---

### 2. Docker Compose

**Location:** [docker-compose.yml](../docker-compose.yml) at the repo root.

**Purpose:** Run Postgres and the server together with one command, with the correct environment and startup order.

**Services:**

| Service   | Image / Build        | Role                                                                 |
|----------|----------------------|----------------------------------------------------------------------|
| **postgres** | `postgres:16-alpine` | PostgreSQL 16. User/database: `meeting_prep`. Port `5432`. Named volume `postgres_data` for persistence. Healthcheck with `pg_isready` so the server only starts after Postgres is ready. |
| **server**   | Build from root `Dockerfile` | Express API. Depends on Postgres with `condition: service_healthy`. Gets `DATABASE_URL` and `PORT` from the compose file. Exposes `3000`. |

**Important details:**

- The server’s `DATABASE_URL` uses the service name `postgres` as the host (e.g. `postgresql://meeting_prep:meeting_prep@postgres:5432/meeting_prep`). That’s how Docker’s internal DNS resolves the database container.
- The Postgres healthcheck ensures the server container doesn’t run migrations until the database is accepting connections.

---

### 3. Entrypoint script (migrations on startup)

**Location:** [packages/server/docker-entrypoint.sh](../packages/server/docker-entrypoint.sh).

**Purpose:** Before the API starts, run Prisma migrations so the database schema is up to date. Then start the main process (e.g. `npm start`).

**What it does:**

1. `cd /app/packages/server` (server package inside the image).
2. Run `npx prisma migrate deploy` (applies pending migrations).
3. `exec "$@"` runs the command passed to the container (e.g. `npm start`), replacing the shell so the Node process is PID 1 and receives signals correctly.

So every time the server container starts (e.g. after a deploy or `docker compose up`), migrations run first, then the API. No separate “migration job” is required for normal startup.

---

### 4. Environment and configuration

- **In Docker:** The server gets `DATABASE_URL` and `PORT` from [docker-compose.yml](../docker-compose.yml). No `.env` is required for the container.
- **On the host (client or local server):** For running the server or tooling outside Docker, we document copying [env.example](../env.example) to `.env` and setting `DATABASE_URL` and `PORT`. The README points to this for local (non-Docker) runs.

---

### 5. What we don’t containerize

- **Client (Vite/React):** Runs on the host with `npm run dev:client`. Vite’s dev server proxies `/api` and `/health` to `http://localhost:3000`, so the browser talks to the server container. We don’t put the client in Docker to keep hot-reload fast and the setup simple.
- **Seeding:** The database is not seeded automatically in the entrypoint. To seed once, run:  
  `docker compose exec server npm run db:seed`  
  (Documented in the README.)

---

## Quick reference: commands

| Goal                         | Command |
|-----------------------------|--------|
| Start Postgres + server     | `docker compose up --build` |
| Start in background         | `docker compose up -d --build` |
| Seed database (once)        | `docker compose exec server npm run db:seed` |
| Run client (on host)        | `npm run dev:client` |
| Stop and remove containers  | `docker compose down` |
| Check server health         | `curl http://localhost:3000/health` |

For more detail, see the [Docker section in the README](../README.md#docker).

---

## Build context and line endings

- **`.dockerignore`** (repo root): Excludes `node_modules/`, `.git/`, client source (except `packages/client/package.json`), `.env`, and other unneeded files from the Docker build context. That keeps builds faster and avoids sending secrets into the daemon.
- **`.gitattributes`**: Ensures [packages/server/docker-entrypoint.sh](../packages/server/docker-entrypoint.sh) is always checked out with LF line endings. That prevents "bad interpreter" or similar errors when running the script in a Linux container after developing on Windows. If the script was already committed with CRLF, run `git add --renormalize packages/server/docker-entrypoint.sh` once and commit.

---

## Summary

- **What:** Docker runs our API and PostgreSQL in containers so the environment is consistent and easy to spin up.
- **Why:** Same versions for everyone, no local Postgres install, production-like local setup, and simpler onboarding.
- **How:** A root Dockerfile builds the server image (multi-stage, monorepo-aware); docker-compose runs Postgres and the server; an entrypoint runs migrations then starts the API; the client runs on the host and proxies to the server.
