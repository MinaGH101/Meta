#!/usr/bin/env sh
set -eu
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: ./scripts/restore.sh backups/meta_TIMESTAMP.dump [backups/media_TIMESTAMP.tar.gz]"
  exit 1
fi
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
cat "$1" | docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore \
  -U "${POSTGRES_USER:-meta}" -d "${POSTGRES_DB:-meta}" --clean --if-exists --no-owner
if [ "$#" -eq 2 ]; then
  docker compose -f "$COMPOSE_FILE" run --rm --no-deps \
    -v "$(pwd)/$(dirname "$2"):/host-backups:ro" backend \
    sh -c "rm -rf /app/media/* && tar -xzf /host-backups/$(basename "$2") -C /app/media"
fi
echo "Restore completed"
