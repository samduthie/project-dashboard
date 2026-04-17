#!/bin/sh
# Source after ROOT is set to the repository root. Loads optional .env and exports ports.
# shellcheck disable=SC1090,SC2154
if [ -f "$ROOT/.env" ]; then
  set -a
  . "$ROOT/.env"
  set +a
fi
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
export BACKEND_PORT FRONTEND_PORT
