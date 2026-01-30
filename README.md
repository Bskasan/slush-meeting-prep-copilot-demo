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
