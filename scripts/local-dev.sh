#!/usr/bin/env bash
# FamilyOS local dev stack controller.
#
#   scripts/local-dev.sh up                      infra + api + worker + expo
#   scripts/local-dev.sh down [--purge]          stop app processes + infra (--purge also wipes volumes)
#   scripts/local-dev.sh status                  table of every service
#   scripts/local-dev.sh logs <svc> [lines]      svc: api|worker|expo|postgres|redis|minio
#   scripts/local-dev.sh restart <svc|all>       svc: api|worker|expo|infra
#
# App processes log to /tmp/familyos/<svc>.log and record pids in /tmp/familyos/<svc>.pid.
# Written for macOS /bin/bash 3.2 — no associative arrays.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="/tmp/familyos"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")
API_PORT=3000
EXPO_PORT=8081
MINIO_PORT=9010

mkdir -p "$RUN_DIR"

log()  { printf '[local-dev] %s\n' "$*"; }
fail() { printf '[local-dev] ERROR: %s\n' "$*" >&2; exit 1; }

# ---------- process helpers ----------

pid_alive() { [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null; }

read_pid() { [ -f "$RUN_DIR/$1.pid" ] && cat "$RUN_DIR/$1.pid" || true; }

port_pid() { lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null | head -1; }

kill_tree() {
  local pid=$1 child
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}

# svc -> pattern used as a fallback when the pid file is stale or missing
svc_pattern() {
  case $1 in
    api)    echo "tsx.*src/index.ts" ;;
    worker) echo "tsx.*src/worker.ts" ;;
    expo)   echo "expo start" ;;
  esac
}

svc_port() {
  case $1 in
    api)  echo $API_PORT ;;
    expo) echo $EXPO_PORT ;;
    *)    echo "" ;;
  esac
}

stop_app() {
  local svc=$1 pid port p i
  pid=$(read_pid "$svc")
  if pid_alive "$pid"; then kill_tree "$pid"; fi
  pkill -f "$(svc_pattern "$svc")" 2>/dev/null || true
  port=$(svc_port "$svc")
  if [ -n "$port" ]; then
    for i in 1 2 3 4 5 6 7 8 9 10; do
      p=$(port_pid "$port"); [ -z "$p" ] && break
      [ "$i" -ge 5 ] && kill -9 "$p" 2>/dev/null
      sleep 0.5
    done
  fi
  rm -f "$RUN_DIR/$svc.pid"
  log "stopped $svc"
}

# wait_until <timeout-seconds> <cmd...>
wait_until() {
  local timeout=$1; shift
  local i=0
  until "$@" >/dev/null 2>&1; do
    i=$((i + 1)); [ "$i" -ge "$timeout" ] && return 1
    sleep 1
  done
}

api_healthy()  { curl -sf "http://localhost:$API_PORT/health" | grep -q '"ok"'; }
expo_healthy() { curl -sf -o /dev/null "http://localhost:$EXPO_PORT"; }

start_app() {
  local svc=$1 dir cmd
  case $svc in
    api)    dir="$ROOT/apps/api";    cmd="npx tsx watch --env-file=.env src/index.ts" ;;
    worker) dir="$ROOT/apps/api";    cmd="npx tsx watch --env-file=.env src/worker.ts" ;;
    expo)   dir="$ROOT/apps/mobile"; cmd="npx expo start --web --port $EXPO_PORT" ;;
  esac
  stop_app "$svc" >/dev/null
  : > "$RUN_DIR/$svc.log"
  # Background only the simple command (not a `cd && …` list): a backgrounded list runs in a
  # subshell that keeps the caller's stdout open, which hangs anyone piping this script.
  pushd "$dir" >/dev/null
  BROWSER=none nohup $cmd >"$RUN_DIR/$svc.log" 2>&1 </dev/null &
  echo $! >"$RUN_DIR/$svc.pid"
  popd >/dev/null
  log "started $svc (pid $(read_pid "$svc")), log: $RUN_DIR/$svc.log"

  case $svc in
    api)
      wait_until 45 api_healthy || { tail -30 "$RUN_DIR/api.log"; fail "api did not become healthy on :$API_PORT"; } ;;
    expo)
      wait_until 90 expo_healthy || { tail -30 "$RUN_DIR/expo.log"; fail "expo did not respond on :$EXPO_PORT"; } ;;
    worker)
      sleep 4
      pid_alive "$(read_pid worker)" || { tail -30 "$RUN_DIR/worker.log"; fail "worker exited on startup"; } ;;
  esac
  log "$svc ready"
}

# ---------- infra ----------

ensure_docker() {
  docker info >/dev/null 2>&1 && return 0
  log "Docker daemon not running — launching Docker Desktop"
  open -a Docker 2>/dev/null || fail "could not launch Docker Desktop; start it manually"
  wait_until 120 docker info || fail "Docker daemon did not come up within 120s"
  log "Docker daemon up"
}

infra_healthy() {
  local s
  for s in postgres redis minio; do
    "${COMPOSE[@]}" ps --format '{{.Service}} {{.Health}}' 2>/dev/null | grep -q "^$s healthy$" || return 1
  done
}

infra_up() {
  ensure_docker
  log "starting postgres, redis, minio"
  "${COMPOSE[@]}" up -d >/dev/null 2>&1 || { "${COMPOSE[@]}" up -d; fail "docker compose up failed"; }
  wait_until 90 infra_healthy || { "${COMPOSE[@]}" ps; fail "infra containers not healthy after 90s"; }
  log "infra healthy"
}

psql_q() { "${COMPOSE[@]}" exec -T postgres psql -U familyos -d familyos -tAc "$1" 2>/dev/null | tr -d '[:space:]'; }

ensure_schema() {
  local n
  n=$(psql_q "select count(*) from information_schema.tables where table_schema='public'")
  if [ "${n:-0}" = "0" ]; then
    log "database is empty — pushing schema and seeding Khan family demo"
    (cd "$ROOT/apps/api" && npx prisma db push --skip-generate) || fail "prisma db push failed"
    (cd "$ROOT/apps/api" && npm run db:seed) || fail "seed failed"
  else
    log "database has $n tables — skipping push/seed (run /db-reset to wipe)"
  fi
}

# ---------- commands ----------

cmd_up() {
  [ -f "$ROOT/apps/api/.env" ] || fail "apps/api/.env missing — copy apps/api/.env.example"
  infra_up
  ensure_schema
  start_app api
  start_app worker
  start_app expo
  echo
  cmd_status
  echo
  echo "Test login: 9581469690 / 123456"
}

cmd_down() {
  local purge=${1:-}
  stop_app expo
  stop_app worker
  stop_app api
  if docker info >/dev/null 2>&1; then
    if [ "$purge" = "--purge" ]; then
      "${COMPOSE[@]}" down -v && log "infra removed and volumes wiped"
    else
      "${COMPOSE[@]}" stop >/dev/null 2>&1 && log "infra stopped (data volumes kept)"
    fi
  else
    log "Docker daemon not running — infra already down"
  fi
}

row() { printf '%-10s %-9s %-7s %s\n' "$1" "$2" "$3" "$4"; }

cmd_status() {
  local svc pid state h
  row SERVICE STATE PORT DETAIL
  if docker info >/dev/null 2>&1; then
    for svc in postgres:5442 redis:6379 minio:$MINIO_PORT; do
      h=$("${COMPOSE[@]}" ps --format '{{.Service}} {{.Health}}' 2>/dev/null | awk -v s="${svc%%:*}" '$1==s{print $2}')
      if [ "$h" = "healthy" ]; then state=up; else state=down; fi
      row "${svc%%:*}" "$state" "${svc##*:}" "${h:-not running}"
    done
  else
    for svc in postgres:5442 redis:6379 minio:$MINIO_PORT; do row "${svc%%:*}" down "${svc##*:}" "docker daemon not running"; done
  fi

  if api_healthy; then row api up $API_PORT "http://localhost:$API_PORT/health ok"
  else row api down $API_PORT "$([ -n "$(port_pid $API_PORT)" ] && echo 'port bound, /health failing' || echo 'not running')"; fi

  pid=$(read_pid worker)
  if pid_alive "$pid"; then row worker up - "pid $pid"
  elif pgrep -f "$(svc_pattern worker)" >/dev/null; then row worker up - "running (untracked pid)"
  else row worker down - "not running"; fi

  if expo_healthy; then row expo up $EXPO_PORT "http://localhost:$EXPO_PORT"
  else row expo down $EXPO_PORT "not running"; fi
}

cmd_logs() {
  local svc=${1:-} n=${2:-50}
  case $svc in
    api|worker|expo)
      [ -f "$RUN_DIR/$svc.log" ] || fail "no log at $RUN_DIR/$svc.log — has $svc been started via this script?"
      tail -n "$n" "$RUN_DIR/$svc.log" ;;
    postgres|redis|minio)
      "${COMPOSE[@]}" logs --tail "$n" "$svc" ;;
    *) fail "usage: logs <api|worker|expo|postgres|redis|minio> [lines]" ;;
  esac
}

cmd_restart() {
  case ${1:-} in
    api|worker|expo) start_app "$1" ;;
    infra) ensure_docker; "${COMPOSE[@]}" restart >/dev/null 2>&1; wait_until 90 infra_healthy || fail "infra not healthy"; log "infra restarted" ;;
    all)   cmd_down; cmd_up ;;
    *)     fail "usage: restart <api|worker|expo|infra|all>" ;;
  esac
}

case ${1:-} in
  up)      cmd_up ;;
  down)    cmd_down "${2:-}" ;;
  status)  cmd_status ;;
  logs)    cmd_logs "${2:-}" "${3:-50}" ;;
  restart) cmd_restart "${2:-}" ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
