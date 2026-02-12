# EACS Laravel Backend
## Setup
- Install PHP 8.2+ and Composer
- composer install
- cp .env.example .env
- php artisan key:generate
- Configure DB_* in .env (Neon or local)
- php artisan migrate
- composer require laravel/sanctum
- php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"
- Add Sanctum middleware in api and kernel if not present
- php artisan serve
## Endpoints
- POST /api/auth/login
- POST /api/auth/register
- POST /api/admin/register-asset
- GET /api/admin/assets
- GET /api/admin/students
- GET /api/admin/statistics
- POST /api/gate/exit/scan-student
- POST /api/gate/exit/scan-asset
- POST /api/gate/exit/exit-without-asset
- GET /api/gate/exit/logs
## Deploy
- Render/Railway: set .env, run migrations, expose HTTPS URL
- Netlify frontend: set VITE_API_URL to backend URL, build and deploy
