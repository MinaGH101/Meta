#!/usr/bin/env sh
set -eu

project_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$project_root"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "Preparing the backup service..."
docker compose -f "$COMPOSE_FILE" build backup
docker compose -f "$COMPOSE_FILE" up -d --wait postgres

echo "Creating the required pre-deploy backup..."
docker compose -f "$COMPOSE_FILE" run --rm --no-deps backup once pre-deploy

echo "Building and deploying the application..."
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
docker compose -f "$COMPOSE_FILE" ps
