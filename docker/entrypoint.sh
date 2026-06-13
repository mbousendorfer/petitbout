#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/petitbout/env-config.js

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_FILE" <<EOF
window.__PETITBOUT_CONFIG__ = {
  VITE_SUPABASE_URL: "$(json_escape "${VITE_SUPABASE_URL:-}")",
  VITE_SUPABASE_ANON_KEY: "$(json_escape "${VITE_SUPABASE_ANON_KEY:-}")"
};
EOF

exec /docker-entrypoint.sh "$@"
