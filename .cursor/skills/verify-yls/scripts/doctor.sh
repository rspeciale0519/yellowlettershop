#!/usr/bin/env bash
# Read-only check: our PID (if recorded), our port, YLS homepage actually rendered.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="$(verify_yls_repo_root)"
ARTIFACTS="$ROOT/.verify-artifacts"
PID_FILE="$ARTIFACTS/dev.pid"
OUT="${ARTIFACTS}/doctor.log"
mkdir -p "$ARTIFACTS"

fail() {
  echo "verify-yls doctor FAIL: $*" | tee -a "$OUT" >&2
  exit 1
}

pass() {
  echo "verify-yls doctor: $*" | tee -a "$OUT"
}

: >"$OUT"
pass "checking $VERIFY_BASE_URL"

dev_pid=""
if [[ -f "$PID_FILE" ]]; then
  dev_pid="$(tr -d '[:space:]' <"$PID_FILE" || true)"
  if [[ -z "$dev_pid" ]]; then
    fail "pid file $PID_FILE is empty"
  fi
  if ! kill -0 "$dev_pid" 2>/dev/null; then
    fail "pid $dev_pid from $PID_FILE is not running"
  fi
  pass "process $dev_pid is alive"
else
  pass "no pid file (manual launch); will still check port and homepage"
fi

listener=""
if command -v netstat >/dev/null 2>&1; then
  listener="$(netstat -ltnp 2>/dev/null | awk -v p=":${VERIFY_PORT}" '$4 ~ p {print $7; exit}')" || true
  listener="${listener%%/*}"
fi
if [[ -z "$listener" ]] && command -v lsof >/dev/null 2>&1; then
  listener="$(lsof -nP -iTCP:"${VERIFY_PORT}" -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $2; exit}')" || true
fi

if [[ -z "$listener" ]]; then
  # Some environments hide PIDs (lsof empty, netstat without -p). HTTP check still proves the port.
  pass "could not resolve listener PID for port ${VERIFY_PORT}; will rely on GET /"
else
  pass "port ${VERIFY_PORT} is listening (pid $listener)"
  if [[ -n "$dev_pid" ]]; then
    walk="$listener"
    owned=0
    for _ in $(seq 1 8); do
      if [[ "$walk" == "$dev_pid" ]]; then
        owned=1
        break
      fi
      walk="$(ps -o ppid= -p "$walk" 2>/dev/null | tr -d ' ' || true)"
      if [[ -z "$walk" || "$walk" == "0" || "$walk" == "1" ]]; then
        break
      fi
    done
    if [[ "$owned" -eq 1 ]]; then
      pass "listener pid $listener is in the launch pid $dev_pid tree"
    else
      fail "port ${VERIFY_PORT} is pid $listener, not under launch pid $dev_pid. Wrong build/instance."
    fi
  fi
fi

tmp_html="$(mktemp)"
trap 'rm -f "$tmp_html"' EXIT

http_code="$(curl -sS -m 20 -o "$tmp_html" -w "%{http_code}" "$VERIFY_BASE_URL/" || true)"
if [[ "$http_code" != "200" ]]; then
  fail "GET / returned HTTP ${http_code:-none} (need 200)"
fi
pass "GET / HTTP 200"

if ! grep -q "$VERIFY_HOME_HEADING" "$tmp_html"; then
  fail "homepage HTML missing heading: $VERIFY_HOME_HEADING (not YLS, or still compiling)"
fi
pass "homepage heading present"

if ! grep -q "$VERIFY_LOGO_ALT" "$tmp_html"; then
  fail "homepage HTML missing logo alt: $VERIFY_LOGO_ALT"
fi
pass "logo alt present"

pass "OK — instance is worth driving"
