#!/bin/sh
# Frontend (Vite HMR) + backend (Django autoreload) with hot reloading.
# POSIX sh (dash). Ports from repo-root .env (see .env.example).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/load-env.inc"

cd "$ROOT/backend" && . .venv/bin/activate && python manage.py migrate --noinput

(
  cd "$ROOT/backend" && . .venv/bin/activate && exec python manage.py runserver "0.0.0.0:${BACKEND_PORT}"
) &
be_pid=$!
(
  cd "$ROOT/frontend" && exec npm run dev
) &
fe_pid=$!

cleanup() {
  kill "$be_pid" "$fe_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT
wait
