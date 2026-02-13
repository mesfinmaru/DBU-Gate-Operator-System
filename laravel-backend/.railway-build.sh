#!/usr/bin/env bash
set -e
composer create-project laravel/laravel .
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --force
php artisan migrate --force
