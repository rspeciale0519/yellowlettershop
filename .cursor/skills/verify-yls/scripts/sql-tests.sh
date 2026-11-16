#!/usr/bin/env bash
# Run supabase/tests/*.sql against the LOCAL database only. Never --linked.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT="$(verify_yls_repo_root)"
cd "$ROOT"

ARTIFACTS="$ROOT/.verify-artifacts"
mkdir -p "$ARTIFACTS"
OUT="$ARTIFACTS/sql-tests.log"

if ! docker ps --format '{{.Names}}' | grep -q '^supabase_db_yls$'; then
  echo "verify-yls sql-tests: local supabase_db_yls is not running. Start with scripts/local-supabase.sh" >&2
  exit 1
fi

: >"$OUT"
{
  echo "verify-yls sql-tests $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "target: local docker supabase_db_yls (never --linked)"
  echo
} | tee -a "$OUT"

fail=0
shopt -s nullglob
files=(supabase/tests/*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "no files in supabase/tests/*.sql" | tee -a "$OUT"
  exit 1
fi

for f in "${files[@]}"; do
  echo "===== $f =====" | tee -a "$OUT"
  # --local is the default; pass it explicitly. Never --linked.
  if npx supabase db query --local --agent=no -o table -f "$f" >>"$OUT" 2>&1; then
    echo "PASS $f" | tee -a "$OUT"
  else
    echo "FAIL $f" | tee -a "$OUT"
    fail=1
  fi
  echo | tee -a "$OUT"
done

if [[ "$fail" -eq 1 ]]; then
  echo "verify-yls sql-tests: one or more files failed (see $OUT)" | tee -a "$OUT"
  exit 1
fi
echo "verify-yls sql-tests: all ${#files[@]} files passed" | tee -a "$OUT"

# Render the log as HTML and screenshot it (Chrome --screenshot hangs on dbus here).
HTML="$ARTIFACTS/sql-tests.html"
python3 - "$OUT" "$HTML" <<'PY'
import html, pathlib, sys
src, dest = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
body = html.escape(src.read_text(errors="replace"))
dest.write_text(
    "<!doctype html><meta charset=utf-8><title>verify-yls sql-tests</title>"
    "<body style='margin:0;background:#111;color:#f5f5f5'>"
    f"<pre style='font:13px/1.45 ui-monospace,Menlo,monospace;padding:20px;white-space:pre-wrap'>{body}</pre>"
    "</body>\n",
    encoding="utf-8",
)
PY
CHROME=""
for c in /usr/local/bin/google-chrome /usr/bin/google-chrome /usr/bin/chromium; do
  if [[ -x "$c" ]]; then CHROME="$c"; break; fi
done
if [[ -n "$CHROME" ]]; then
  PNG="$ARTIFACTS/sql-tests.png"
  timeout 25 "$CHROME" --headless --disable-gpu --no-sandbox --disable-dev-shm-usage \
    --hide-scrollbars --window-size=1280,1600 --screenshot="$PNG" "file://${HTML}" \
    >/dev/null 2>&1 || true
  if [[ -s "$PNG" ]]; then
    echo "verify-yls sql-tests: screenshot $PNG" | tee -a "$OUT"
  else
    echo "verify-yls sql-tests: screenshot missing (Chrome did not write $PNG)" | tee -a "$OUT"
  fi
fi
