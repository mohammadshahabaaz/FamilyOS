# AGENTS.md

## Project overview

FamilyOS MVP is a private family memory platform with a thin monorepo for mobile and backend.
The repo is currently empty, but the intended stack is:
- Mobile: React Native + Expo + TypeScript
- Backend: Node.js + TypeScript + Fastify
- Database: PostgreSQL with Prisma
- Storage: Cloudflare R2 via S3-compatible SDK
- Background jobs: Redis + BullMQ
- Validation: Zod shared between mobile and API
- Testing: Vitest for backend services

## Important constraints

- Build only the MVP scope: auth, family membership/invite, events, media albums, timeline, memory recall notifications, comments, and storage limits.
- Do not build chat, AI features, family tree graph, medical records, travel planner, billing/payment, or any non-memory features.
- Do not substitute the stack without asking first.
- Keep the backend as a thin monolith: routes → services → repositories, no framework DI.
- Do not proxy file uploads through the API; use presigned R2 upload URLs.
- Use Argon2 + JWT for auth, no Auth0/Firebase/Clerk.
- No secrets in code; rely on `.env` and `.env.example`.

## Repo state

- Empty repository.
- No source files exist yet, so AI should ask for project purpose and scaffolding details before writing app code.

## When this repo gains files

- Prefer `AGENTS.md` for AI guidance over `.github/copilot-instructions.md` unless a more specific workflow is needed.
- Document build/test commands once the monorepo structure exists.
- Keep instructions minimal and link to actual docs once they are added.

## Developer guidance for AI agents

- Before coding a phase, restate phase scope in 2-3 lines and flag ambiguities.
- After each phase, report what remains undone.
- Validate all API input with Zod before DB access.
- Enforce family role checks server-side on every membership mutation.
- Presigned upload URLs must be single-object and short-lived.
- Use Prisma migrations for schema changes; never edit the DB by hand.
- If a requested feature resembles a cut category, stop and ask.
