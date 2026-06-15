#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/env-config.js

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_FILE" <<EOF
window.__PETITBOUT_CONFIG__ = {
  VITE_SUPABASE_URL: "$(json_escape "${VITE_SUPABASE_URL:-}")",
  VITE_SUPABASE_ANON_KEY: "$(json_escape "${VITE_SUPABASE_ANON_KEY:-}")",
  VITE_FEEDBACK_EMAIL: "$(json_escape "${VITE_FEEDBACK_EMAIL:-}")",
  VITE_PLAUSIBLE_DOMAIN: "$(json_escape "${VITE_PLAUSIBLE_DOMAIN:-}")",
  VITE_PLAUSIBLE_SCRIPT_URL: "$(json_escape "${VITE_PLAUSIBLE_SCRIPT_URL:-}")",
  VITE_PLAUSIBLE_API_URL: "$(json_escape "${VITE_PLAUSIBLE_API_URL:-}")",
  VITE_ADMIN_USERNAME: "$(json_escape "${VITE_ADMIN_USERNAME:-}")",
  VITE_ADMIN_PASSWORD: "$(json_escape "${VITE_ADMIN_PASSWORD:-}")"
};
EOF

exec /docker-entrypoint.sh "$@"
