#!/usr/bin/env bash
# Stop only the verify-yls launch PID/process group. Restore ICC snapshot.
# Keep evidence. Never pkill by name.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="$(verify_yls_repo_root)"
ARTIFACTS="$ROOT/.verify-artifacts"
PID_FILE="$ARTIFACTS/dev.pid"

verify_yls_restore_icc "$ROOT"

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

if [[ ! -r "/proc/${dev_pid}/cmdline" ]]; then
  echo "verify-yls cleanup: refuse — cannot read /proc/${dev_pid}/cmdline" >&2
  exit 1
fi
cmdline="$(tr '\0' ' ' <"/proc/${dev_pid}/cmdline")"
echo "verify-yls cleanup: pid ${dev_pid} cmdline=${cmdline}"
if ! grep -Eiq '(^|[[:space:]/])(next|npm|node)([[:space:]]|$)' <<<"$cmdline"; then
  echo "verify-yls cleanup: refuse — pid ${dev_pid} cmdline does not match next/npm/node" >&2
  exit 1
fi

pgid="$(ps -o pgid= -p "$dev_pid" 2>/dev/null | tr -d ' ')"
echo "verify-yls cleanup: pid=${dev_pid} pgid=${pgid:-none}"

echo "verify-yls cleanup: stopping pid $dev_pid"

if [[ -n "$pgid" && "$pgid" == "$dev_pid" ]]; then
  if kill -TERM -- "-$dev_pid" 2>/dev/null; then
    :
  else
    kill -TERM "$dev_pid" 2>/dev/null || true
  fi
else
  echo "verify-yls cleanup: refuse process-group kill (pgid ${pgid:-unset} != pid ${dev_pid}); sending TERM to pid only"
  kill -TERM "$dev_pid" 2>/dev/null || true
fi

for _ in $(seq 1 20); do
  if ! kill -0 "$dev_pid" 2>/dev/null; then
    break
  fi
  sleep 0.25
done

if kill -0 "$dev_pid" 2>/dev/null; then
  echo "verify-yls cleanup: pid $dev_pid still alive, sending KILL"
  if [[ -n "$pgid" && "$pgid" == "$dev_pid" ]]; then
    kill -KILL -- "-$dev_pid" 2>/dev/null || kill -KILL "$dev_pid" 2>/dev/null || true
  else
    kill -KILL "$dev_pid" 2>/dev/null || true
  fi
fi

rm -f "$PID_FILE"
echo "verify-yls cleanup: stopped. Evidence remains in $ARTIFACTS"
ls -la "$ARTIFACTS"
