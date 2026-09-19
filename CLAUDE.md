# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FamilyOS: a private family identity and memory platform. Not a social network, chat app, or AI assistant.

## Guardrails (read first)

**Founder Rule** — apply to every feature decision: does this help verify family identity, build the family hierarchy, or help the family create/store/relive a memory together? If no, do not build it.

**Never build (even if asked):**
- In-app chat
- AI features / AI assistant (needs an explicit scope update first)
- Family tree / graph discovery / open search
- Medical records, travel planner, billing UI

**Open question — do NOT resolve unilaterally:** after a TreeLink is approved between Tree A and Tree B (in-laws), do Tree A members see anything of Tree B (events/members/media)? Get an explicit answer from the user before writing any cross-tree read logic. Today TreeLink is write-side only and never returns Tree B data to Tree A.

**Data invariants:**
- Relationship labels (uncle, cousin, ...) are **never stored** — computed at read time by the BFS engine (`modules/relationship/relationship.engine.ts`) from three primitive edges only: `PARENT`, `SPOUSE`, `SIBLING`.
- Every query filters by `treeId`. No cross-tree queries without a TreeLink check.
- `FamilyTree` has BigInt fields (`storageUsedBytes`, `storageLimitBytes`) — always query it with `select`, never `include`, or JSON serialisation throws. Never return BigInt in a response.
- BigInt math is integer-only: never `BigInt(float * 1024)`.
- Media bytes go straight to Cloudflare R2 via presigned URLs — never proxy uploads through the API.
- Never read `process.env.X` outside `apps/api/src/lib/env.ts` (ESLint `no-restricted-properties` enforces this).

**Schema field names that trip people up:**
- Auth uses `User.mobileNumber` — there is no email field.
- `Media.type` is `PHOTO | VIDEO` (not `IMAGE`); `Media.r2Key` (not `key`/`url`) — URL is `${R2_PUBLIC_URL}/${r2Key}`.
- `Comment.userId` (not `authorId`).
- `Like` is polymorphic (`targetType` + `targetId`, no FK) — integrity enforced in app code.

## Commands

```bash
# Repo root
./scripts/local-dev.sh up      # infra + API + worker + Expo web, health-polled (/local-dev)
./scripts/local-dev.sh down [--purge]   # stop all; --purge wipes volumes (/local-dev-down)
./scripts/local-dev.sh status|logs <svc>|restart <svc>   # svc: api|worker|expo|infra|all
docker compose up -d           # infra only: postgres:5442, redis:6379, minio:9010 (console :9011)
./scripts/start.sh [--reset-db]  # legacy bootstrap (npm install + api + expo, no worker)
npm run type-check             # tsc: packages/shared + apps/api
npm run type-check:mobile
npm run lint                   # eslint apps/api/src --max-warnings 0
npm run format:check           # prettier (api, mobile, shared)
npm test                       # api Vitest suite
npm run build                  # tsc apps/api

# apps/api
npm run dev                    # API on :3000 (tsx watch, loads .env)
npm run worker                 # BullMQ worker process (separate from API)
npm run db:seed                # reseed Khan family demo
npx prisma db push             # sync schema — NOT `migrate dev` (needs interactive TTY)
npx vitest run src/modules/story/story.service.test.ts   # single file
npx vitest run -t "Grandfather"                          # by test name

# apps/mobile
npx expo start                 # Metro on :8081 (press w for web)
```

- Tests need `apps/api/.env` to exist: `vitest.config.ts` calls `process.loadEnvFile('.env')`, and `lib/env.ts` Zod-validates env at import time even though db/redis are mocked.
- CI (`.github/workflows/ci.yml`) runs: prisma generate → db push → type-check → lint → format:check → test → build. Mobile is type-check only.
- ESLint covers `apps/api/src` only; `apps/mobile` is excluded. Mobile has no test suite (`test:mobile` is a no-op).
- Docker image must be built from the repo root: `docker build -f apps/api/Dockerfile .` — `ROLE=api|worker` selects the process.

## Architecture

npm workspaces monorepo (Node >= 20): `apps/api` (Fastify 5, Prisma 6, Postgres 16, Redis 7, BullMQ, Argon2 + JWT), `apps/mobile` (Expo SDK 52 managed, runs primarily as web via react-native-web), `packages/shared` (Zod schemas + `AppError` hierarchy in `errors.ts`).

API and mobile architecture rules live in `.claude/rules/api.md` and `.claude/rules/mobile.md` (path-scoped: they load when Claude touches files under `apps/api/**` / `apps/mobile/**`).

### Known debt
- `packages/shared/package.json` points `main` at raw `src/index.ts`: works under tsx, but a bare `tsc && node dist/index.js` of the API crashes on that import. Use tsx or Docker.
- `docs/SMELLS.md` is the debt catalogue — update it when you add or fix a smell.
- `docs/adr/` holds 10 ADRs, all **PROPOSED**, not decided. Don't treat them as rules.

## Agent system

Project skills, agents, and rules live in `.claude/`. Each skill must be `.claude/skills/<name>/SKILL.md` — a flat `.claude/skills/<name>.md` is silently ignored. Slash commands are skills with `disable-model-invocation: true` (user-typed only); there is no `.claude/commands/`. Personal, uncommitted notes go in `CLAUDE.local.md`; personal permission overrides in `.claude/settings.local.json` (both gitignored).

- `/build <feature>` — full pipeline: CTO → Devil's Advocate → specialists → Monitor. Default entry point for features.
- `/design`, `/design-audit` — screen design / UI audit before coding.
- `/debate`, `/review`, `/discover`, `/product`, `/phase-status`
- `/test-user`, `/health`, `/test-engine`, `/improve-agents`
- `/local-dev`, `/local-dev-down [--purge]`, `/local-dev-status`, `/local-dev-logs <svc>`, `/local-dev-restart <svc>` — local stack control, all backed by `scripts/local-dev.sh`
- `/dev` (alias of `/local-dev`), `/api-start` (API-only restart + login smoke test), `/db-reset`
