#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: ./scripts/restore-project.sh backups/daily/TIMESTAMP /path/to/empty/project-directory"
  exit 1
fi

snapshot="$(CDPATH= cd -- "$1" && pwd)"
target="$2"

if [ ! -f "$snapshot/project.tar.gz" ] || [ ! -f "$snapshot/SHA256SUMS" ]; then
  echo "Invalid snapshot: project archive or checksums are missing." >&2
  exit 1
fi
(
  cd "$snapshot"
  sha256sum -c SHA256SUMS
)

mkdir -p "$target"
if [ -n "$(find "$target" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  echo "Refusing to extract into a non-empty directory: $target" >&2
  exit 1
fi

tar -xzf "$snapshot/project.tar.gz" -C "$target"
echo "Project restored to $target"
