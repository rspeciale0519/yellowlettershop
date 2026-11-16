#!/usr/bin/env bash
# Stop only the verify-yls launch PID/process group. Keep evidence.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="$(verify_yls_repo_root)"
ARTIFACTS="$ROOT/.verify-artifacts"
PID_FILE="$ARTIFACTS/dev.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "verify-yls cleanup: no pid file at $PID_FILE — nothing this run started. Evidence kept."
  ls -la "$ARTIFACTS" 2>/dev/null || true
  exit 0
fi

dev_pid="$(tr -d '[:space:]' <"$PID_FILE" || true)"
if [[ -z "$dev_pid" ]]; then
  echo "verify-yls cleanup: empty pid file. Evidence kept."
  exit 0
fi

if ! kill -0 "$dev_pid" 2>/dev/null; then
  echo "verify-yls cleanup: pid $dev_pid already stopped. Evidence kept."
  rm -f "$PID_FILE"
  ls -la "$ARTIFACTS"
  exit 0
fi

echo "verify-yls cleanup: stopping pid $dev_pid (process group if setsid)"

# Launch used setsid, so PGID == PID. Fall back to the single PID.
if kill -TERM -- "-$dev_pid" 2>/dev/null; then
  :
else
  kill -TERM "$dev_pid" 2>/dev/null || true
  # Children of npm (the actual next-server) if group kill failed.
  children="$(ps -o pid= --ppid "$dev_pid" 2>/dev/null || true)"
  for child in $children; do
    kill -TERM "$child" 2>/dev/null || true
  done
fi

for _ in $(seq 1 20); do
  if ! kill -0 "$dev_pid" 2>/dev/null; then
    break
  fi
  sleep 0.25
done

if kill -0 "$dev_pid" 2>/dev/null; then
  echo "verify-yls cleanup: pid $dev_pid still alive, sending KILL"
  kill -KILL -- "-$dev_pid" 2>/dev/null || kill -KILL "$dev_pid" 2>/dev/null || true
fi

rm -f "$PID_FILE"
echo "verify-yls cleanup: stopped. Evidence remains in $ARTIFACTS"
ls -la "$ARTIFACTS"
