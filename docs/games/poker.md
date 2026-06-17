# Poker Clock

A self-hosted poker tournament dashboard with real-time multi-device sync. Manages blind levels, timers, rebuys, eliminations, and prize pool calculations across all connected devices simultaneously. Protected by nginx Basic Auth.

**URL:** [poker.xmsystems.co.uk](https://poker.xmsystems.co.uk)

!!! note
    The Poker Clock is a timer and tournament management tool — not a card game. There is no how-to-play page on the games hub; the tile links directly to the dashboard.

---

## Features

- Blind schedule with 8 levels (1/2 through 50/100)
- Configurable players, buy-in amount, and level duration
- Countdown timer with auto-advance on level change
- Audible alerts — 1 minute warning beep, countdown clicks for the last 5 seconds
- 20 minute break auto-triggered after configurable play time, with manual override
- Rebuy tracking — increases the prize pool, locked after the break
- Elimination tracking per player
- Prize pool auto-calculated and split 50/30/20 rounded to nearest £5
- Real-time sync across all connected devices via WebSocket

---

## Pages

The Poker Clock is a single-page dashboard — there are no separate host, player, or vote pages. All connected devices see the same live view.

| URL | Purpose |
| --- | ------- |
| `/` | Tournament dashboard — setup, timer, blinds, and tracking |

The tournament setup panel collapses after applying settings. All subsequent state (timer, level, rebuys, eliminations) is broadcast live to every connected device.

---

## Authentication

The entire site is protected by **nginx Basic Auth**. Credentials are stored in `/ssd/docker/appdata/nginx/.htpasswd`.

To add or update a user (requires `apache2-utils` on Phobos):

```bash
htpasswd /ssd/docker/appdata/nginx/.htpasswd username
```

---

## nginx Config

```nginx
server {
    listen 80;
    server_name poker.xmsystems.co.uk;

    auth_basic "Kelly's Card Club";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        root  /usr/share/nginx/html;
        index poker_dashboard.html;
        try_files $uri $uri/ =404;
    }

    location /ws {
        proxy_pass http://poker-server:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

---

## Backend

The poker server is managed in the same compose file as nginx itself.

**Docker Compose:** `/ssd/docker/docker-compose/nginx/docker-compose.yml`

```yaml
  poker-server:
    build: /ssd/docker/appdata/poker
    container_name: poker-server
    restart: unless-stopped
    networks:
      phobos-network:
        ipv4_address: '172.20.0.21'
    environment:
      - TZ=Europe/London
```

**Dockerfile:** `/ssd/docker/appdata/poker/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .
EXPOSE 3003
CMD ["node", "server.js"]
```

**Dependencies:** `ws` (WebSocket library)

!!! warning
    Tournament state is **in-memory only**. Restarting the `poker-server` container resets the current tournament. The `.htpasswd` file is bind-mounted from the host and survives restarts.

### Rebuilding

The poker server is rebuilt as part of the nginx compose stack:

```bash
cd /ssd/docker/docker-compose/nginx
docker compose build
docker compose up -d --force-recreate
```

---

## File Locations

| File | Path |
| ---- | ---- |
| Dashboard HTML | `/ssd/docker/appdata/nginx/poker_dashboard.html` |
| nginx config | `/ssd/docker/appdata/nginx/default.conf` |
| htpasswd file | `/ssd/docker/appdata/nginx/.htpasswd` |
| Node.js server | `/ssd/docker/appdata/poker/server.js` |
| Dockerfile | `/ssd/docker/appdata/poker/Dockerfile` |
| Docker Compose | `/ssd/docker/docker-compose/nginx/docker-compose.yml` |
| Traefik config | `poker.yml` on Titan |
