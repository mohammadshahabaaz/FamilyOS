#!/usr/bin/env bash
# FamilyOS — full dev environment startup
# Usage: ./start.sh [--reset-db]

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}  $*"; }
info() { echo -e "${CYAN}[..]${NC}  $*"; }
warn() { echo -e "${YELLOW}[!!]${NC}  $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        FamilyOS Dev Environment      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Step 0: Pre-flight checks ──────────────────────────────────────────────────
info "Checking prerequisites..."

command -v node  >/dev/null 2>&1 || fail "Node.js not found. Install Node >= 20."
command -v npm   >/dev/null 2>&1 || fail "npm not found."
command -v docker>/dev/null 2>&1 || warn "Docker not found — make sure Postgres+Redis are running manually."

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[ "$NODE_VER" -lt 20 ] && fail "Node 20+ required (found $NODE_VER)"
ok "Node v$(node -v | tr -d v)"

# ── Step 1: Install dependencies ───────────────────────────────────────────────
info "Installing workspace dependencies..."
cd "$ROOT"
npm install --silent
ok "Dependencies ready"

# ── Step 2: Start Docker services (Postgres + Redis) ──────────────────────────
if command -v docker >/dev/null 2>&1; then
  info "Starting Docker services (postgres:5432, redis:6379)..."
  docker compose up -d 2>/dev/null || warn "docker compose failed — services may already be running"
  # Wait for Postgres to be ready
  for i in {1..10}; do
    docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1 && break
    sleep 1
  done
  ok "Docker services running"
fi

# ── Step 3: Push Prisma schema ─────────────────────────────────────────────────
info "Syncing Prisma schema to database..."
cd "$ROOT/apps/api"
npx prisma db push --accept-data-loss >/dev/null 2>&1 || fail "Prisma db push failed. Is Postgres running?"
ok "Schema in sync"

# ── Step 4: Seed database (optional reset) ─────────────────────────────────────
if [[ "$1" == "--reset-db" ]]; then
  info "Seeding database (Khan family demo)..."
  npm run db:seed >/dev/null 2>&1 && ok "Database seeded" || warn "Seed failed — database may already have data"
fi

# ── Step 5: Kill any stale processes ──────────────────────────────────────────
info "Clearing ports 3000 and 8081..."
pkill -f "tsx.*src/index" 2>/dev/null || true
pkill -f "expo start"     2>/dev/null || true
sleep 1
ok "Ports cleared"

# ── Step 6: Start API ──────────────────────────────────────────────────────────
info "Starting API server (port 3000)..."
cd "$ROOT/apps/api"
npx tsx --env-file=.env src/index.ts > /tmp/familyos-api.log 2>&1 &
API_PID=$!

# Wait up to 8 seconds for API health
for i in {1..8}; do
  sleep 1
  HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || true)
  if echo "$HEALTH" | grep -q '"ok"'; then
    ok "API running  → http://localhost:3000  (PID $API_PID)"
    break
  fi
  if [ "$i" -eq 8 ]; then
    fail "API failed to start. Last 30 lines of /tmp/familyos-api.log:\n$(tail -30 /tmp/familyos-api.log)"
  fi
done

# ── Step 7: Start Expo (mobile web) ───────────────────────────────────────────
info "Starting Expo web (port 8081)..."
cd "$ROOT/apps/mobile"
npx expo start --web > /tmp/familyos-expo.log 2>&1 &
EXPO_PID=$!

# Wait up to 15 seconds for Expo
for i in {1..15}; do
  sleep 1
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    ok "Mobile running → http://localhost:8081  (PID $EXPO_PID)"
    break
  fi
  if [ "$i" -eq 15 ]; then
    warn "Expo slow to start — check /tmp/familyos-expo.log"
  fi
done

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            FamilyOS is running           ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  API    → http://localhost:3000           ║${NC}"
echo -e "${GREEN}║  Mobile → http://localhost:8081           ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Test login:  9581469690  /  123456       ║${NC}"
echo -e "${GREEN}║  Demo login:  +923001234567 / demo1234    ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Logs:  /tmp/familyos-api.log             ║${NC}"
echo -e "${GREEN}║         /tmp/familyos-expo.log            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  To stop:    pkill -f 'tsx.*src/index'; pkill -f 'expo start'"
echo "  To re-seed: ./start.sh --reset-db"
echo "  API logs:   tail -f /tmp/familyos-api.log"
echo ""
