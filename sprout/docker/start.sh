#!/bin/sh
# Container start: set up the database, cache config, serve on $PORT.
set -e
cd /app

# Railway and Render provide the public URL; other hosts can set APP_URL themselves.
if [ -z "$APP_URL" ] && [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export APP_URL="https://${RAILWAY_PUBLIC_DOMAIN}"
fi
export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:${PORT}}}"

if [ -z "$APP_KEY" ]; then
    export APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
    echo "APP_KEY is not set: using a temporary key (logins reset on restart)."
fi

# A fresh container has no database: create it with the demo family.
# On hosts with a persistent disk, later starts only run new migrations.
# Point DB_DATABASE at a mounted volume (e.g. /data/database.sqlite) to keep data.
DB="${DB_DATABASE:-database/database.sqlite}"
export DB_DATABASE="$DB"
if [ ! -f "$DB" ]; then
    mkdir -p "$(dirname "$DB")"
    touch "$DB"
    php artisan migrate --seed --force
else
    php artisan migrate --force
fi

php artisan optimize

exec frankenphp php-server --listen ":${PORT}" --root public/
