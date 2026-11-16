#!/usr/bin/env bash
# Start Next.js bound to 127.0.0.1:3010 for verify-yls. Records PID.
# Hard-refuses hosted Supabase URLs and live Stripe keys. Never prints secrets.
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
STAMP_FILE="$ARTIFACTS/verify-build.json"

env_file="$(verify_yls_env_file "$ROOT" || true)"
if [[ -z "${env_file}" || ! -f "$env_file" ]]; then
  echo "verify-yls launch: no .env.local or .env found (or VERIFY_ENV_FILE missing)." >&2
  echo "Copy .env.example to .env.local with NEXT_PUBLIC_SUPABASE_URL on loopback :62440." >&2
  echo "Stripe values must be sk_test_ / pk_test_ only. Never use live keys." >&2
  exit 1
fi
echo "verify-yls launch: reading env file names/hosts from $(basename "$env_file")"
verify_yls_load_guarded_env "$env_file"

supabase_host="$(verify_yls_url_host "${NEXT_PUBLIC_SUPABASE_URL:-}")"
echo "verify-yls launch: NEXT_PUBLIC_SUPABASE_URL host=${supabase_host} (STRIPE_SECRET_KEY stubbed, outbound keys blanked)"

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
  echo "Stop that process yourself, or use a worktree + npx next dev -H 127.0.0.1 -p 3011. Do not pkill by name." >&2
  exit 1
fi

# NEXT_PUBLIC_* is baked in at build time. Reuse .next/BUILD_ID only if this
# skill stamped it for the same loopback Supabase host.
need_build=1
if [[ -f "$ROOT/.next/BUILD_ID" && -f "$STAMP_FILE" ]]; then
  actual_id="$(tr -d '[:space:]' <"$ROOT/.next/BUILD_ID")"
  stamped_id="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("buildId",""))' "$STAMP_FILE")"
  stamped_host="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("supabaseHost",""))' "$STAMP_FILE")"
  if [[ -n "$actual_id" && "$actual_id" == "$stamped_id" ]] && verify_yls_is_loopback_host "$stamped_host" && [[ "$stamped_host" == "$supabase_host" ]]; then
    need_build=0
    echo "verify-yls launch: reusing skill-stamped BUILD_ID for host ${stamped_host}"
  else
    echo "verify-yls launch: refusing to reuse .next/BUILD_ID (stamp mismatch or host ${stamped_host:-none})"
    need_build=1
  fi
elif [[ -f "$ROOT/.next/BUILD_ID" ]]; then
  echo "verify-yls launch: refusing to reuse unstamped .next/BUILD_ID; rebuilding"
fi

# Chrome 157 on this VM throws `SyntaxError: Invalid or unexpected token` while
# evaluating webpack `eval` client chunks from `next dev`, so the auth modal
# never hydrates. Production `next start -H 127.0.0.1 -p 3010` serves real files.
# Set VERIFY_NEXT_DEV=1 to force the compile server (SSR-only checks).
if [[ "${VERIFY_NEXT_DEV:-0}" == "1" ]]; then
  launch_cmd="npx next dev -H 127.0.0.1 -p ${VERIFY_PORT}"
else
  if [[ "$need_build" -eq 1 ]]; then
    echo "verify-yls launch: npm run build (NEXT_PUBLIC_* baked from guarded env)"
    npm run build >"$ARTIFACTS/build.log" 2>&1
    if [[ ! -f "$ROOT/.next/BUILD_ID" ]]; then
      echo "verify-yls launch: build did not write .next/BUILD_ID" >&2
      exit 1
    fi
    python3 - "$STAMP_FILE" "$ROOT/.next/BUILD_ID" "$supabase_host" <<'PY'
import json, pathlib, sys, datetime
stamp, bid, host = sys.argv[1], pathlib.Path(sys.argv[2]).read_text().strip(), sys.argv[3]
pathlib.Path(stamp).write_text(json.dumps({
    "buildId": bid,
    "supabaseHost": host,
    "createdAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
}, indent=2) + "\n")
PY
  fi
  launch_cmd="npx next start -H 127.0.0.1 -p ${VERIFY_PORT}"
fi

# New session so cleanup can kill the whole group by PGID == PID.
# shellcheck disable=SC2086
setsid $launch_cmd >"$LOG_FILE" 2>&1 < /dev/null &
dev_pid=$!
echo "$dev_pid" >"$PID_FILE"

cat >"$META_FILE" <<EOF
{
  "pid": $dev_pid,
  "port": $VERIFY_PORT,
  "host": "127.0.0.1",
  "baseUrl": "$VERIFY_BASE_URL",
  "log": "$LOG_FILE",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "command": "$launch_cmd",
  "supabaseHost": "${supabase_host}"
}
EOF

echo "verify-yls launch: started pid=$dev_pid, logging to $LOG_FILE"

ready=0
for _ in $(seq 1 90); do
  if ! kill -0 "$dev_pid" 2>/dev/null; then
    echo "verify-yls launch: process exited. Last log lines:" >&2
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
