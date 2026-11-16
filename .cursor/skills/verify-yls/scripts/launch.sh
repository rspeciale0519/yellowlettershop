#!/usr/bin/env bash
# Start Next.js on port 3010 for verify-yls. Records PID. Waits until homepage is usable.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="$(verify_yls_repo_root)"
cd "$ROOT"

ARTIFACTS="$ROOT/.verify-artifacts"
mkdir -p "$ARTIFACTS"

PID_FILE="$ARTIFACTS/dev.pid"
LOG_FILE="$ARTIFACTS/dev.log"
META_FILE="$ARTIFACTS/launch.json"

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" || true)"
  if [[ -n "${old_pid}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "verify-yls launch: already running pid=$old_pid (see $PID_FILE)" >&2
    exit 1
  fi
  rm -f "$PID_FILE"
fi

port_busy=0
if command -v netstat >/dev/null 2>&1; then
  if netstat -ltn 2>/dev/null | awk -v p=":${VERIFY_PORT}" '$4 ~ p {found=1} END {exit !found}'; then
    port_busy=1
  fi
elif command -v lsof >/dev/null 2>&1; then
  if lsof -nP -iTCP:"${VERIFY_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    port_busy=1
  fi
fi
if [[ "$port_busy" -eq 1 ]]; then
  echo "verify-yls launch: port ${VERIFY_PORT} is already in use by a process this run did not start." >&2
  echo "Stop that process yourself, or use a worktree + npx next dev -p 3011. Do not pkill by name." >&2
  exit 1
fi

if [[ ! -f "$ROOT/.env.local" && ! -f "$ROOT/.env" ]]; then
  echo "verify-yls launch: no .env.local or .env found." >&2
  echo "Copy .env.example to .env.local, set NEXT_PUBLIC_APP_URL=http://localhost:3010," >&2
  echo "and point Supabase at supabase/config.toml ports (API 62440, db 62441)." >&2
  echo "Stripe values must be sk_test_ / pk_test_ only. Never use live keys." >&2
  echo "If Docker is unavailable, placeholder local URL/anon values still boot the UI;" >&2
  echo "sign-in, dashboard, and APIs stay unverified." >&2
  exit 1
fi

# New session so cleanup can kill the whole group by PGID == PID.
setsid npm run dev >"$LOG_FILE" 2>&1 < /dev/null &
dev_pid=$!
echo "$dev_pid" >"$PID_FILE"

cat >"$META_FILE" <<EOF
{
  "pid": $dev_pid,
  "port": $VERIFY_PORT,
  "baseUrl": "$VERIFY_BASE_URL",
  "log": "$LOG_FILE",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "command": "npm run dev"
}
EOF

echo "verify-yls launch: started pid=$dev_pid, logging to $LOG_FILE"

ready=0
for _ in $(seq 1 90); do
  if ! kill -0 "$dev_pid" 2>/dev/null; then
    echo "verify-yls launch: dev process exited. Last log lines:" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    exit 1
  fi
  if "$SCRIPT_DIR/doctor.sh" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "verify-yls launch: timed out waiting for a usable homepage on $VERIFY_BASE_URL" >&2
  tail -n 40 "$LOG_FILE" >&2 || true
  exit 1
fi

echo "verify-yls launch: ready on $VERIFY_BASE_URL (pid=$dev_pid)"
"$SCRIPT_DIR/doctor.sh"
