#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: ./scripts/restore.sh backups/daily/TIMESTAMP"
  exit 1
fi

project_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$project_root"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
snapshot="$(CDPATH= cd -- "$1" && pwd)"

for required_file in database.dump media.tar.gz project.tar.gz metadata.txt SHA256SUMS; do
  if [ ! -f "$snapshot/$required_file" ]; then
    echo "Invalid snapshot: missing $required_file" >&2
    exit 1
  fi
done
(
  cd "$snapshot"
  sha256sum -c SHA256SUMS
)

if [ "${RESTORE_CONFIRM:-}" != "yes" ]; then
  printf 'This replaces the production database and all uploaded media. Type RESTORE to continue: '
  read -r confirmation
  if [ "$confirmation" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 1
  fi
fi

docker compose -f "$COMPOSE_FILE" up -d --wait postgres
docker compose -f "$COMPOSE_FILE" stop backup backend migrate 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T postgres sh -eu -c '
  dropdb --if-exists --force -U "$POSTGRES_USER" "$POSTGRES_DB"
  createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
'
docker compose -f "$COMPOSE_FILE" exec -T postgres sh -eu -c \
  'pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < "$snapshot/database.dump"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps -T backend sh -eu -c \
  'find /app/media -mindepth 1 -delete; tar -xzf - -C /app/media' \
  < "$snapshot/media.tar.gz"
docker compose -f "$COMPOSE_FILE" run --rm migrate
docker compose -f "$COMPOSE_FILE" up -d backend frontend backup
echo "Database and media restored from $snapshot"
echo "The project source archive is $snapshot/project.tar.gz"
