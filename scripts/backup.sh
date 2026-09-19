#!/usr/bin/env sh
set -eu

project_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$project_root"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

docker compose -f "$COMPOSE_FILE" up -d --wait postgres
docker compose -f "$COMPOSE_FILE" build backup
docker compose -f "$COMPOSE_FILE" run --rm --no-deps backup once "${1:-manual}"
