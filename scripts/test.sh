#!/usr/bin/env sh
set -eu
docker compose config --quiet
docker compose --env-file .env.production.example -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production.example -f docker-compose.prod.yml build backup
docker compose build backend frontend
docker compose run --rm --no-deps \
  -e DATABASE_URL=sqlite+pysqlite:///:memory: \
  -e MEDIA_ROOT=/tmp/meta-test-media \
  -e SEED_INITIAL_DATA=false backend python -m pytest -q
docker compose run --rm --no-deps frontend npm run build
