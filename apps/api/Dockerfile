# Build from the REPO ROOT, not apps/api — this is an npm-workspaces monorepo, so
# the build needs the root lockfile and packages/shared, both outside apps/api/'s
# own directory. Docker can't COPY paths outside its build context, so:
#
#   docker build -f apps/api/Dockerfile -t familyos-api .   (run from repo root)
#
# `docker build -t familyos-api .` run from inside apps/api/ will NOT work — there's
# no way to reach packages/shared from that context.

FROM node:20-alpine AS builder
WORKDIR /app

# Install across the whole workspace first (better layer caching — this only
# re-runs when a package.json/lockfile changes, not on every source edit).
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api

# packages/shared's package.json points main/types at raw src/index.ts — correct
# for tsx's dev-mode direct-TS resolution, but plain `node` can't execute .ts.
# Build it to real JS here, then patch a COPY of its package.json (never the
# repo's own file) so the compiled runtime image resolves @familyos/shared to
# dist/, not src/.
RUN npm run typecheck --workspace=packages/shared && npx tsc -p packages/shared
RUN node -e "\
  const fs = require('fs'); \
  const p = 'packages/shared/package.json'; \
  const j = JSON.parse(fs.readFileSync(p)); \
  j.main = 'dist/index.js'; j.types = 'dist/index.d.ts'; \
  fs.writeFileSync(p, JSON.stringify(j, null, 2));"

# Generate the Prisma client natively inside this (musl/Alpine) image — generating
# on the host and copying it over would ship the wrong engine binary. Must run
# before `tsc`: apps/api imports Prisma's generated enum/model types directly,
# and `npm ci` couldn't auto-generate them earlier since the schema wasn't in
# the build context yet at that point.
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

RUN npm run build --workspace=apps/api

RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

# Role selected by env var at boot — one image, two processes.
# ROLE=worker → node dist/worker.js   |   anything else → node dist/index.js
CMD ["sh", "-c", "if [ \"$ROLE\" = \"worker\" ]; then node dist/worker.js; else node dist/index.js; fi"]
