#!/bin/sh
# Production-like: Django without autoreload + Vite preview (no HMR).
# For split terminals use: devbox run backend-stable + devbox run frontend-stable
# (not backend + frontend — those use Django autoreload and Vite dev/HMR).
# POSIX sh (dash). Ports from repo-root .env (see .env.example).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/load-env.inc"
export VITE_DISABLE_HMR=1

cd "$ROOT/backend" && . .venv/bin/activate && python manage.py migrate --noinput
cd "$ROOT/frontend" && npm run build

(
  cd "$ROOT/backend" && . .venv/bin/activate && exec python manage.py runserver "0.0.0.0:${BACKEND_PORT}" --noreload
) &
be_pid=$!
(
  cd "$ROOT/frontend" && exec npm run preview -- --host 0.0.0.0 --port "${FRONTEND_PORT}" --strictPort
) &
fe_pid=$!

cleanup() {
  kill "$be_pid" "$fe_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT
wait
