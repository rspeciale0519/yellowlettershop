#!/usr/bin/env bash
# Shared paths and hard guards for verify-yls helpers. Sourced, not executed.
# Never print secret values — key names and hosts only.

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
VERIFY_STRIPE_STUB="sk_test_verify_yls_stub"
VERIFY_ICC_COMMENT="verify-yls-icc"

verify_yls_is_loopback_host() {
  case "$1" in
    127.0.0.1|localhost|::1) return 0 ;;
    *) return 1 ;;
  esac
}

# Host only. Never print the rest of the URL.
verify_yls_url_host() {
  local url="$1"
  url="${url#\'}"; url="${url%\'}"
  url="${url#\"}"; url="${url%\"}"
  local rest="${url#*://}"
  rest="${rest%%/*}"
  rest="${rest##*@}"
  if [[ "$rest" == \[* ]]; then
    rest="${rest#\[}"
    rest="${rest%%]*}"
    printf '%s\n' "$rest"
    return
  fi
  printf '%s\n' "${rest%%:*}"
}

verify_yls_env_file() {
  local root="${1:-}"
  if [[ -n "${VERIFY_ENV_FILE:-}" ]]; then
    printf '%s\n' "$VERIFY_ENV_FILE"
    return
  fi
  if [[ -f "$root/.env.local" ]]; then
    printf '%s\n' "$root/.env.local"
    return
  fi
  if [[ -f "$root/.env" ]]; then
    printf '%s\n' "$root/.env"
    return
  fi
  return 1
}

# Scan an env file: refuse live Stripe keys and non-loopback Supabase/DB hosts.
# Prints key names and hosts only.
verify_yls_scan_env_file() {
  local file="$1"
  local line key val host prefix
  local supabase_host=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" != *=* ]] && continue
    key="${line%%=*}"
    key="${key%"${key##*[![:space:]]}"}"
    key="${key#"${key%%[![:space:]]*}"}"
    val="${line#*=}"
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    val="${val#\'}"; val="${val%\'}"
    val="${val#\"}"; val="${val%\"}"
    prefix="${val:0:8}"
    case "$val" in
      sk_live_*|rk_live_*|pk_live_*)
        echo "verify-yls: refusing live key ${key} (prefix ${prefix})" >&2
        return 1
        ;;
    esac
    case "$key" in
      NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL)
        host="$(verify_yls_url_host "$val")"
        echo "verify-yls: ${key} host=${host}"
        if ! verify_yls_is_loopback_host "$host"; then
          echo "verify-yls: refusing ${key} — host ${host} is not loopback" >&2
          return 1
        fi
        if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]]; then
          supabase_host="$host"
        fi
        ;;
      DATABASE_URL|SHADOW_DATABASE_URL)
        host="$(verify_yls_url_host "$val")"
        echo "verify-yls: ${key} host=${host}"
        if [[ -n "$host" ]] && ! verify_yls_is_loopback_host "$host"; then
          echo "verify-yls: refusing ${key} — host ${host} is not loopback" >&2
          return 1
        fi
        ;;
    esac
  done < "$file"
  if [[ -z "$supabase_host" ]]; then
    echo "verify-yls: refusing — NEXT_PUBLIC_SUPABASE_URL missing from env file" >&2
    return 1
  fi
}

verify_yls_export_outbound_blanks() {
  local key
  for key in \
    STRIPE_WEBHOOK_SECRET \
    RESEND_API_KEY \
    SENDGRID_API_KEY \
    POSTMARK_API_TOKEN \
    MAILGUN_API_KEY \
    ACCUZIP_API_KEY \
    ACCUZIP_USER \
    ACCUZIP_PASSWORD \
    TWILIO_AUTH_TOKEN \
    SMTP_PASSWORD \
    OPENAI_API_KEY \
    ANTHROPIC_API_KEY
  do
    export "${key}="
  done
  export STRIPE_SECRET_KEY="$VERIFY_STRIPE_STUB"
}

# Load env file after scan. Then blank outbound keys and stub Stripe.
verify_yls_load_guarded_env() {
  local file="$1"
  verify_yls_scan_env_file "$file"
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
  verify_yls_export_outbound_blanks
}

verify_yls_icc_state_file() {
  local root="$1"
  printf '%s\n' "$root/.verify-artifacts/icc-state.env"
}

verify_yls_supabase_subnet() {
  docker network inspect supabase_network_yls --format '{{(index .IPAM.Config 0).Subnet}}' 2>/dev/null || true
}

verify_yls_snapshot_icc() {
  local root="$1"
  local state
  state="$(verify_yls_icc_state_file "$root")"
  mkdir -p "$(dirname "$state")"
  if [[ -f "$state" ]]; then
    echo "verify-yls: ICC snapshot already at $state"
    return 0
  fi
  local nf nf6 policy
  nf="$(cat /proc/sys/net/bridge/bridge-nf-call-iptables 2>/dev/null || echo unset)"
  nf6="$(cat /proc/sys/net/bridge/bridge-nf-call-ip6tables 2>/dev/null || echo unset)"
  policy="$(sudo -n iptables-legacy -S FORWARD 2>/dev/null | awk '/^-P FORWARD/{print $3; exit}')"
  policy="${policy:-unknown}"
  cat >"$state" <<EOF
bridge_nf_call_iptables=${nf}
bridge_nf_call_ip6tables=${nf6}
forward_policy=${policy}
subnet=
rule_added=0
EOF
  echo "verify-yls: ICC snapshot written (sysctl nf=${nf} nf6=${nf6} FORWARD=${policy})"
}

verify_yls_apply_icc() {
  local root="$1"
  local state subnet
  state="$(verify_yls_icc_state_file "$root")"
  verify_yls_snapshot_icc "$root"
  subnet="$(verify_yls_supabase_subnet)"
  if [[ -z "$subnet" ]]; then
    subnet="172.18.0.0/16"
    echo "verify-yls: supabase_network_yls not up yet; using ${subnet} for ICC rule"
  else
    echo "verify-yls: supabase docker subnet ${subnet}"
  fi
  if [[ -w /proc/sys/net/bridge/bridge-nf-call-iptables ]] || sudo -n true 2>/dev/null; then
    echo 0 | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables >/dev/null
    echo 0 | sudo tee /proc/sys/net/bridge/bridge-nf-call-ip6tables >/dev/null || true
    if ! sudo -n iptables-legacy -C FORWARD -s "$subnet" -d "$subnet" -j ACCEPT -m comment --comment "$VERIFY_ICC_COMMENT" 2>/dev/null; then
      sudo -n iptables-legacy -I FORWARD 1 -s "$subnet" -d "$subnet" -j ACCEPT -m comment --comment "$VERIFY_ICC_COMMENT"
    fi
    local computed="$subnet"
    local nf nf6 policy
    # shellcheck disable=SC1090
    source "$state"
    nf="${bridge_nf_call_iptables}"
    nf6="${bridge_nf_call_ip6tables}"
    policy="${forward_policy}"
    cat >"$state" <<EOF
bridge_nf_call_iptables=${nf}
bridge_nf_call_ip6tables=${nf6}
forward_policy=${policy}
subnet=${computed}
rule_added=1
EOF
  else
    echo "verify-yls: cannot write bridge-nf sysctl or iptables; container-to-container DB traffic may time out." >&2
  fi
}

verify_yls_restore_icc() {
  local root="$1"
  local state
  state="$(verify_yls_icc_state_file "$root")"
  if [[ ! -f "$state" ]]; then
    echo "verify-yls cleanup: no ICC snapshot — nothing to restore"
    return 0
  fi
  # shellcheck disable=SC1090
  source "$state"
  if [[ "${rule_added:-0}" == "1" && -n "${subnet:-}" ]]; then
    sudo -n iptables-legacy -D FORWARD -s "$subnet" -d "$subnet" -j ACCEPT -m comment --comment "$VERIFY_ICC_COMMENT" 2>/dev/null || true
    echo "verify-yls cleanup: deleted FORWARD ICC rule for ${subnet}"
  fi
  if [[ "${bridge_nf_call_iptables:-}" =~ ^[0-9]+$ ]]; then
    echo "$bridge_nf_call_iptables" | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables >/dev/null 2>/dev/null || true
  fi
  if [[ "${bridge_nf_call_ip6tables:-}" =~ ^[0-9]+$ ]]; then
    echo "$bridge_nf_call_ip6tables" | sudo tee /proc/sys/net/bridge/bridge-nf-call-ip6tables >/dev/null 2>/dev/null || true
  fi
  if [[ "${forward_policy:-}" == "ACCEPT" || "${forward_policy:-}" == "DROP" || "${forward_policy:-}" == "REJECT" ]]; then
    sudo -n iptables-legacy -P FORWARD "$forward_policy" 2>/dev/null || true
    echo "verify-yls cleanup: restored FORWARD policy ${forward_policy}"
  fi
  rm -f "$state"
  echo "verify-yls cleanup: ICC snapshot restored and removed"
}
