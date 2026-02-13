#!/usr/bin/env bash
set -e
DIR="$(pwd)"
SKELETON="$DIR/.laravel"
if [ ! -d "$SKELETON" ]; then
  composer create-project laravel/laravel "$SKELETON"
fi
cp -r "$DIR/app/Http/Controllers" "$SKELETON/app/Http/" || true
cp -r "$DIR/app/Models" "$SKELETON/app/" || true
mkdir -p "$SKELETON/app/Services"
cp -r "$DIR/app/Services/" "$SKELETON/app/Services/" || true
cp -f "$DIR/routes/api.php" "$SKELETON/routes/api.php" || true
cp -f "$DIR/routes/web.php" "$SKELETON/routes/web.php" || true
cp -f "$DIR/config/cors.php" "$SKELETON/config/cors.php" || true
mkdir -p "$SKELETON/database/migrations"
cp -r "$DIR/database/migrations/" "$SKELETON/database/migrations/" || true
cd "$SKELETON"
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --force
php artisan migrate --force
