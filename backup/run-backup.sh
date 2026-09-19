#!/usr/bin/env sh
set -eu

BACKUP_ROOT="${BACKUP_ROOT:-/backups}"
DAILY_RETENTION_DAYS="${DAILY_RETENTION_DAYS:-14}"
WEEKLY_RETENTION_WEEKS="${WEEKLY_RETENTION_WEEKS:-8}"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
BACKUP_WEEKLY_DAY="${BACKUP_WEEKLY_DAY:-0}"
BACKUP_LOCK_STALE_SECONDS="${BACKUP_LOCK_STALE_SECONDS:-7200}"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

cleanup() {
  if [ -n "${temporary_dir:-}" ] && [ -d "$temporary_dir" ]; then
    rm -rf "$temporary_dir"
  fi
  if [ -n "${lock_dir:-}" ] && [ -d "$lock_dir" ]; then
    rm -rf "$lock_dir"
  fi
}

create_backup() {
  reason="${1:-scheduled}"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  lock_dir="$BACKUP_ROOT/.backup.lock"
  temporary_dir="$BACKUP_ROOT/.${stamp}.tmp"

  mkdir -p "$BACKUP_ROOT/daily" "$BACKUP_ROOT/weekly"
  if ! mkdir "$lock_dir" 2>/dev/null; then
    lock_started_at="$(cat "$lock_dir/started_at" 2>/dev/null || true)"
    case "$lock_started_at" in
      ''|*[!0-9]*) lock_started_at=0 ;;
    esac
    lock_age=$(( $(date +%s) - lock_started_at ))
    if [ "$lock_age" -gt "$BACKUP_LOCK_STALE_SECONDS" ]; then
      log "Removing a stale backup lock ($lock_age seconds old)."
      rm -rf "$lock_dir"
      mkdir "$lock_dir"
    else
      log "Another backup is already running; skipping this run."
      return 0
    fi
  fi
  date +%s > "$lock_dir/started_at"
  trap cleanup EXIT HUP INT TERM
  mkdir "$temporary_dir"

  log "Creating backup $stamp ($reason)"
  until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
    log "Waiting for PostgreSQL..."
    sleep 2
  done

  pg_dump --format=custom --file="$temporary_dir/database.dump"
  pg_restore --list "$temporary_dir/database.dump" >/dev/null
  tar -czf "$temporary_dir/media.tar.gz" -C /media .
  tar -czf "$temporary_dir/project.tar.gz" \
    --exclude='./backups' \
    --exclude='./.git' \
    --exclude='./backend/.venv' \
    --exclude='./backend/media' \
    --exclude='./frontend/node_modules' \
    --exclude='./frontend/dist' \
    --exclude='./frontend1/node_modules' \
    --exclude='./frontend1/dist' \
    --exclude='*/__pycache__' \
    --exclude='*/.pytest_cache' \
    -C /project .

  cat > "$temporary_dir/metadata.txt" <<EOF
format_version=1
created_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
reason=$reason
database=$PGDATABASE
project=meta-holding
EOF
  (
    cd "$temporary_dir"
    sha256sum database.dump media.tar.gz project.tar.gz metadata.txt > SHA256SUMS
  )
  chmod 600 "$temporary_dir"/*
  mv "$temporary_dir" "$BACKUP_ROOT/daily/$stamp"
  temporary_dir=""
  ln -sfn "$stamp" "$BACKUP_ROOT/daily/latest"

  current_weekday="$(date -u +%w)"
  if [ "$reason" = "weekly" ] || [ "$current_weekday" = "$BACKUP_WEEKLY_DAY" ]; then
    weekly_tmp="$BACKUP_ROOT/weekly/.${stamp}.tmp"
    cp -a "$BACKUP_ROOT/daily/$stamp" "$weekly_tmp"
    mv "$weekly_tmp" "$BACKUP_ROOT/weekly/$stamp"
    ln -sfn "$stamp" "$BACKUP_ROOT/weekly/latest"
    log "Promoted $stamp to weekly retention."
  fi

  find "$BACKUP_ROOT/daily" -mindepth 1 -maxdepth 1 -type d \
    -mtime "+$DAILY_RETENTION_DAYS" -exec rm -rf {} +
  weekly_days=$((WEEKLY_RETENTION_WEEKS * 7))
  find "$BACKUP_ROOT/weekly" -mindepth 1 -maxdepth 1 -type d \
    -mtime "+$weekly_days" -exec rm -rf {} +

  rm -rf "$lock_dir"
  lock_dir=""
  trap - EXIT HUP INT TERM
  log "Backup completed: $BACKUP_ROOT/daily/$stamp"
}

case "${1:-daemon}" in
  daemon)
    while true; do
      create_backup scheduled
      sleep "$BACKUP_INTERVAL_SECONDS"
    done
    ;;
  once)
    create_backup "${2:-manual}"
    ;;
  *)
    echo "Usage: run-backup [daemon|once [reason]]" >&2
    exit 2
    ;;
esac
