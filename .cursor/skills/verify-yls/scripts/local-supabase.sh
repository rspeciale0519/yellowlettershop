#!/usr/bin/env bash
# Start LOCAL Supabase only. Never --linked, never a hosted project.
#
# Nested Docker on this VM: iptables-legacy FORWARD POLICY DROP plus
# net.bridge.bridge-nf-call-iptables=1 blocks container-to-container traffic
# (GoTrue/storage/realtime time out reaching Postgres). Host port publish still
# works. Disable bridge netfilter, then `npx supabase start`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
ROOT="$(verify_yls_repo_root)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "verify-yls: docker is not installed. Install docker.io / Docker Engine, then retry." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "verify-yls: docker is installed but dockerd is not usable from this user." >&2
  echo "Start dockerd (this VM has no systemd: sudo dockerd --host=unix:///var/run/docker.sock)." >&2
  exit 1
fi

if [[ -w /proc/sys/net/bridge/bridge-nf-call-iptables ]] || sudo -n true 2>/dev/null; then
  echo 0 | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables >/dev/null
  echo 0 | sudo tee /proc/sys/net/bridge/bridge-nf-call-ip6tables >/dev/null || true
  sudo iptables-legacy -P FORWARD ACCEPT 2>/dev/null || true
else
  echo "verify-yls: cannot write bridge-nf sysctl; container-to-container DB traffic may time out." >&2
fi

npx supabase start
npx supabase status
