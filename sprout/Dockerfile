# Sprout: one container with Laravel served by FrankenPHP.
# Build: docker build -t sprout .   Run: docker run -p 8080:8080 --env-file .env sprout

# ---- Build: PHP deps + frontend (Wayfinder needs PHP during the Vite build) ----
FROM dunglas/frankenphp:1-php8.3-bookworm AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:24-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && npm run build \
    && rm -rf node_modules

# ---- Runtime ----
FROM dunglas/frankenphp:1-php8.3-bookworm

WORKDIR /app
COPY --from=build /app /app
RUN sed -i 's/\r$//' docker/start.sh \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    PORT=8080

EXPOSE 8080
CMD ["sh", "/app/docker/start.sh"]
