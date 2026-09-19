# FamilyOS

A private family identity and memory platform. A family builds its hierarchy, verifies who is who, and creates, stores, and relives memories together.

FamilyOS is deliberately **not** a social network, chat app, or AI assistant. There is no in-app chat, no open search or discovery across families, and every piece of data is scoped to a single family tree.

## Features

- **Family tree and identity** — members, persons, and profile-linking requests ("I am this person") approved by a family admin.
- **Computed relationships** — only three primitive edges are stored (`PARENT`, `SPOUSE`, `SIBLING`). Labels such as uncle or cousin are computed at read time by a BFS engine, never stored.
- **Events and memories** — events with photos and videos, comments, and likes.
- **Stories** — short-lived posts that expire automatically.
- **"On this day" recall** — resurfaces past memories in the feed.
- **In Memoriam** — tribute pages for family members who have passed away.
- **Tree links** — invite and approve connections between two family trees (for example, in-laws).
- **Notifications** — in-app and push (Expo) notifications, fanned out by background jobs.

## Tech stack

| Layer | Technology |
|---|---|
| API | Fastify 5, Prisma 6, PostgreSQL 16, Zod, Argon2 + JWT |
| Background jobs | BullMQ on Redis 7 (thumbnails, memory recall, notification fan-out, story expiry) |
| Media storage | Cloudflare R2 via presigned URLs (MinIO locally) — uploads never pass through the API |
| Mobile / web | Expo SDK 52 (React Native, runs on web via react-native-web) |
| Shared | Zod schemas and error types in `packages/shared` |
| Tooling | npm workspaces, TypeScript, Vitest, ESLint, Prettier, GitHub Actions |

## Repository layout

```
apps/
  api/        Fastify API + BullMQ worker (src/modules/<domain>/{routes,service,repository})
  mobile/     Expo app (screens in src/screens)
packages/
  shared/     Zod schemas and AppError hierarchy shared by api and mobile
scripts/      local-dev.sh — one command to run the full local stack
docs/         Architecture decision records (docs/adr) and the tech-debt catalogue (SMELLS.md)
.claude/      Claude Code agents, skills, and rules used to develop this project
```

## Getting started

### Prerequisites

- Node.js 20 or later
- Docker (for PostgreSQL, Redis, and MinIO)

### Setup

```bash
git clone git@github.com:mohammadshahabaaz/FamilyOS.git
cd FamilyOS
npm install

cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

The example values work as-is for local development. Change `JWT_SECRET` and `JWT_REFRESH_SECRET` for anything beyond your own machine.

### Run everything

```bash
./scripts/local-dev.sh up
```

This starts PostgreSQL, Redis, and MinIO in Docker, creates and seeds the database on first run, then starts the API, the worker, and the Expo web app. It prints a demo login when it finishes.

| Service | URL |
|---|---|
| API | http://localhost:3000 (health: `/health`) |
| Web app | http://localhost:8081 |
| MinIO console | http://localhost:9011 |

Other commands:

```bash
./scripts/local-dev.sh status             # state of every service
./scripts/local-dev.sh logs <svc>         # api | worker | expo | infra
./scripts/local-dev.sh restart <svc>
./scripts/local-dev.sh down [--purge]     # --purge also deletes the database volumes
```

### Run services individually

```bash
docker compose up -d                      # infra only: postgres :5442, redis :6379, minio :9010
cd apps/api && npx prisma db push         # sync schema
cd apps/api && npm run db:seed            # seed demo family
cd apps/api && npm run dev                # API on :3000
cd apps/api && npm run worker             # background worker
cd apps/mobile && npx expo start          # Metro on :8081 (press w for web)
```

## Testing and checks

```bash
npm test                  # API unit tests (Vitest)
npm run type-check        # shared + api
npm run type-check:mobile
npm run lint
npm run format:check
npm run build
```

Tests require `apps/api/.env` to exist, because environment variables are validated at import time even though the database and Redis are mocked.

CI runs all of the above on every push and pull request (`.github/workflows/ci.yml`).

## Docker

Build from the repository root. The `ROLE` variable selects the process:

```bash
docker build -f apps/api/Dockerfile .
# run with ROLE=api or ROLE=worker
```

## Design principles

- Every query is scoped by `treeId`. Nothing reads across trees without an approved tree link.
- Relationship labels are always derived, never stored.
- Media bytes go directly from the client to object storage using presigned URLs.
- Environment variables are read in one place only (`apps/api/src/lib/env.ts`), validated with Zod.

## Project status

In active development. The API and web app run end to end locally. Known technical debt is tracked in [docs/SMELLS.md](docs/SMELLS.md), and open architecture questions are in [docs/adr](docs/adr/README.md) (all currently proposed, not decided).
