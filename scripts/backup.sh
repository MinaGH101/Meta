#!/usr/bin/env sh
set -eu
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-meta}" -d "${POSTGRES_DB:-meta}" --format=custom > "backups/meta_${stamp}.dump"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps \
  -v "$(pwd)/backups:/host-backups" backend \
  sh -c "tar -czf /host-backups/media_${stamp}.tar.gz -C /app/media ."
echo "Database and media backups written to ./backups"
