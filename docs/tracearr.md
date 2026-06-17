# Tracearr

Tracearr is a modern, self-hosted monitoring platform for media servers.

It provides real-time session tracking across Plex, Jellyfin, and Emby from a single unified dashboard. Key features include geolocation intelligence, bandwidth analytics, stream heatmaps, automation rules for stream limits and geo-restrictions, and a companion mobile app for iOS and Android.

[GitHub - Tracearr](https://github.com/ConnorGallopo/tracearr)

## docker-compose.yml

The stack is made up of three containers: the Tracearr application itself, a TimescaleDB (PostgreSQL) database, and Redis for caching.

Secrets are managed via a `.env` file in the same directory as the compose file.

```yaml
networks:
  proxy:
    external: true

services:

  tracearr:
    image: ghcr.io/connorgallopo/tracearr:latest
    container_name: tracearr
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
      - TZ=${TZ:-Europe/London}
      - DATABASE_URL=postgres://tracearr:${DB_PASSWORD}@timescale:5432/tracearr
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN:-*}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    depends_on:
      timescale:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - /ssd/docker/appdata/tracearr/backups:/data/backup
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: 172.19.0.30

  timescale:
    image: timescale/timescaledb-ha:pg18.1-ts2.25.0
    container_name: tracearr-db
    user: "1000:1000"
    shm_size: 512mb
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    command: postgres -c timescaledb.license=timescale -c timescaledb.max_tuples_decompressed_per_dml_transaction=0 -c max_locks_per_transaction=4096 -c timescaledb.telemetry_level=off
    environment:
      - POSTGRES_USER=tracearr
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=tracearr
    volumes:
      - /ssd/docker/appdata/tracearr/db:/home/postgres/pgdata/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tracearr"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: 172.19.0.31

  redis:
    image: redis:8-alpine
    container_name: tracearr-redis
    command: redis-server --appendonly yes
    volumes:
      - /ssd/docker/appdata/tracearr/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: 172.19.0.32
```

This runs via Traefik using a dynamic file rather than container labels. See the dynamic file below.

- [Tracearr Dynamic File](dynamic.md#tracearr-titan)
