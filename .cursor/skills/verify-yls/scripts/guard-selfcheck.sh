#!/usr/bin/env bash
# Prove launch/drive/local-supabase refuse hosted URLs, live Stripe, non-loopback
# base URLs, and ICC without VERIFY_YLS_NESTED_VM=1. Never print secret values.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
ROOT="$(verify_yls_repo_root)"
cd "$ROOT"

ART="$ROOT/.verify-artifacts"
mkdir -p "$ART"
OUT="$ART/guard-selfcheck.log"
: >"$OUT"

pass() { echo "PASS: $*" | tee -a "$OUT"; }
fail() { echo "FAIL: $*" | tee -a "$OUT" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "verify-yls guard-selfcheck $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$OUT"

# (i) hosted-looking NEXT_PUBLIC_SUPABASE_URL is refused
cat >"$TMP/hosted.env" <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon
STRIPE_SECRET_KEY=sk_test_placeholder
EOF
set +e
VERIFY_ENV_FILE="$TMP/hosted.env" "$SCRIPT_DIR/launch.sh" >"$TMP/hosted.out" 2>"$TMP/hosted.err"
hosted_rc=$?
set -e
if grep -E 'sk_live_|rk_live_|eyJ|placeholder-anon' "$TMP/hosted.out" "$TMP/hosted.err" >/dev/null 2>&1; then
  fail "(i) env values leaked in launch output"
fi
if [[ "$hosted_rc" -eq 0 ]]; then
  fail "(i) launch accepted hosted NEXT_PUBLIC_SUPABASE_URL"
fi
if ! grep -q "refusing NEXT_PUBLIC_SUPABASE_URL" "$TMP/hosted.err"; then
  fail "(i) launch did not mention refusing NEXT_PUBLIC_SUPABASE_URL"
fi
if ! grep -q "host=abcdefghijklmnop.supabase.co" "$TMP/hosted.out" "$TMP/hosted.err"; then
  fail "(i) launch did not report the hosted host name"
fi
pass "(i) hosted NEXT_PUBLIC_SUPABASE_URL refused (host=abcdefghijklmnop.supabase.co, rc=$hosted_rc)"

# (ii) sk_live_ key is refused
cat >"$TMP/live.env" <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:62440
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon
STRIPE_SECRET_KEY=sk_live_THIS_IS_NOT_A_REAL_KEY
EOF
set +e
VERIFY_ENV_FILE="$TMP/live.env" "$SCRIPT_DIR/launch.sh" >"$TMP/live.out" 2>"$TMP/live.err"
live_rc=$?
set -e
if grep -F 'sk_live_THIS' "$TMP/live.out" "$TMP/live.err" >/dev/null 2>&1; then
  fail "(ii) live key material leaked in launch output"
fi
if [[ "$live_rc" -eq 0 ]]; then
  fail "(ii) launch accepted sk_live_ key"
fi
if ! grep -q "refusing live key STRIPE_SECRET_KEY" "$TMP/live.err"; then
  fail "(ii) launch did not refuse STRIPE_SECRET_KEY"
fi
if ! grep -q "sk_live_" "$TMP/live.err"; then
  fail "(ii) launch did not mention sk_live_ prefix"
fi
pass "(ii) sk_live_ key refused (rc=$live_rc)"

# (iii) non-loopback --base-url is refused
set +e
node "$SCRIPT_DIR/drive.mjs" --feature home --base-url "https://example.com" >"$TMP/drive.out" 2>"$TMP/drive.err"
drive_rc=$?
set -e
if [[ "$drive_rc" -eq 0 ]]; then
  fail "(iii) drive accepted non-loopback --base-url"
fi
if ! grep -Eqi "loopback|example.com" "$TMP/drive.out" "$TMP/drive.err"; then
  fail "(iii) drive error did not mention loopback/example.com"
fi
pass "(iii) non-loopback --base-url refused (rc=$drive_rc)"

# (iv) local-supabase.sh refuses without VERIFY_YLS_NESTED_VM=1
set +e
env -u VERIFY_YLS_NESTED_VM "$SCRIPT_DIR/local-supabase.sh" >"$TMP/icc.out" 2>"$TMP/icc.err"
icc_rc=$?
set -e
if [[ "$icc_rc" -eq 0 ]]; then
  fail "(iv) local-supabase.sh ran without VERIFY_YLS_NESTED_VM=1"
fi
if ! grep -q "VERIFY_YLS_NESTED_VM=1" "$TMP/icc.err"; then
  fail "(iv) refuse message missing VERIFY_YLS_NESTED_VM=1"
fi
pass "(iv) local-supabase.sh refused without VERIFY_YLS_NESTED_VM=1 (rc=$icc_rc)"

echo "verify-yls guard-selfcheck: all 4 refusals passed" | tee -a "$OUT"
cat "$TMP/hosted.err" "$TMP/live.err" "$TMP/drive.err" "$TMP/icc.err" >>"$OUT"
