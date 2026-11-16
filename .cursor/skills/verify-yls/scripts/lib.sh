#!/usr/bin/env bash
# Shared paths for verify-yls helpers. Sourced, not executed.

verify_yls_repo_root() {
  local dir
  dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "verify-yls: could not find repo root from ${BASH_SOURCE[0]}" >&2
    exit 1
  fi
  printf '%s\n' "$dir"
}

VERIFY_PORT="${VERIFY_PORT:-3010}"
VERIFY_BASE_URL="${VERIFY_BASE_URL:-http://127.0.0.1:${VERIFY_PORT}}"
VERIFY_HOME_HEADING="Streamline Your Direct Mail Campaigns"
VERIFY_LOGO_ALT="Yellow Letter Shop Logo"
