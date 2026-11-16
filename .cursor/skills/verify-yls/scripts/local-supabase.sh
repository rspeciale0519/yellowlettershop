#!/usr/bin/env bash
# Start LOCAL Supabase only. Never --linked, never a hosted project.
#
# Nested-Docker ICC: bridge-nf plus a scoped FORWARD accept for the supabase
# compose subnet. Requires VERIFY_YLS_NESTED_VM=1. For nested or throwaway VMs
# only — never WSL, a shared box, or a VPS. cleanup.sh restores the snapshot.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
ROOT="$(verify_yls_repo_root)"
cd "$ROOT"

if [[ "${VERIFY_YLS_NESTED_VM:-}" != "1" ]]; then
  echo "verify-yls: local-supabase.sh refuses to change firewall/sysctl unless VERIFY_YLS_NESTED_VM=1." >&2
  echo "That flag is for nested or throwaway VMs only. Never set it on WSL, a shared box, or a VPS." >&2
  echo "On a normal machine run: npx supabase start" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "verify-yls: docker is not installed. Install docker.io / Docker Engine, then retry." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "verify-yls: docker is installed but dockerd is not usable from this user." >&2
  echo "Start dockerd (this VM has no systemd: sudo dockerd --host=unix:///var/run/docker.sock)." >&2
  exit 1
fi

verify_yls_apply_icc "$ROOT"

npx supabase start
# Network exists now — ensure the rule matches the real subnet.
verify_yls_apply_icc "$ROOT"
npx supabase status
