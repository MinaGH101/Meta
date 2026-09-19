#!/bin/sh
set -eu

media_root="${MEDIA_ROOT:-/app/media}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$media_root"
  chown -R appuser:appuser "$media_root"
  exec gosu appuser "$@"
fi

exec "$@"
