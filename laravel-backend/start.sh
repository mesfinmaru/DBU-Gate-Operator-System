#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Ensure Laravel skeleton exists (built by .railway-build.sh)
if [ ! -d ".laravel" ]; then
  echo "Laravel skeleton not found. Run: bash ./.railway-build.sh"
  exit 1
fi
cd ".laravel"
# Run migrations once service starts
php artisan migrate --force || true
# Start PHP built-in server using Laravel router
php -S 0.0.0.0:${PORT:-8080} -t public server.php
