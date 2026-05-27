# Poker Tournament Dashboard

A self-hosted poker tournament dashboard served via nginx on Phobos. Protected by nginx Basic Auth. Real-time multi-device sync is provided by a Node.js WebSocket backend running as a separate Docker container.

## Stack

| Component | Technology |
| ----------- | --------------------------------------------------------------- |
| Frontend | Single-file HTML/CSS/JavaScript — no frameworks |
| Backend | Node.js WebSocket server (`ws` library) — holds tournament state in memory |
| Web server | nginx (Docker container on Phobos) |
| Auth | nginx Basic Auth — credentials stored in `.htpasswd` on the host |

## File Locations

| File | Path on Phobos |
| ------ | ---------------- |
| Dashboard HTML | `/ssd/docker/appdata/nginx/poker_dashboard.html` |
| nginx config | `/ssd/docker/appdata/nginx/default.conf` |
| htpasswd file | `/ssd/docker/appdata/nginx/.htpasswd` |
| Node.js server | `/ssd/docker/appdata/poker/server.js` |
| Dockerfile | `/ssd/docker/appdata/poker/Dockerfile` |
| package.json | `/ssd/docker/appdata/poker/package.json` |

## Docker Setup

Both containers are managed by the nginx `docker-compose.yml` and share `phobos-network`.

| Container | Image | IP |
| ----------- | ------- | --------------- |
| `nginx` | `nginx` (official) | `172.20.0.20` |
| `poker-server` | Local Dockerfile | `172.20.0.21` |

### docker-compose.yml

`/ssd/docker/docker-compose/nginx/docker-compose.yml`

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  nginx:
    image: nginx
    networks:
      default:
        ipv4_address: '172.20.0.20'
    ports:
      - 88:80
    volumes:
      - /ssd/docker/appdata/nginx/:/usr/share/nginx/html:ro
      - /ssd/docker/appdata/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /ssd/docker/appdata/nginx/.htpasswd:/etc/nginx/.htpasswd
    container_name: nginx
    restart: unless-stopped
    environment:
      - TZ=Europe/London
    depends_on:
      - poker-server

  poker-server:
    build: /ssd/docker/appdata/poker
    container_name: poker-server
    restart: unless-stopped
    networks:
      default:
        ipv4_address: '172.20.0.21'
    environment:
      - TZ=Europe/London
```

### Dockerfile

`/ssd/docker/appdata/poker/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .
EXPOSE 3003
CMD ["node", "server.js"]
```

### package.json

`/ssd/docker/appdata/poker/package.json`

```json
{
  "name": "poker-state-server",
  "version": "1.0.0",
  "description": "WebSocket state server for Kelly's Card Club",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

## nginx Config

The poker server block in `default.conf` has two `location` blocks:

- `/` — serves the static HTML dashboard
- `/ws` — proxies WebSocket connections to `poker-server` on port `3003`

Basic Auth is applied at the `server` block level, covering both locations.

```nginx
server {
    listen 80;
    server_name poker.[REDACTED];

    auth_basic "Kelly's Card Club";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # Serve the HTML dashboard
    location / {
        root  /usr/share/nginx/html;
        index poker_dashboard.html;
        try_files $uri $uri/ =404;
    }

    # Proxy WebSocket to poker-server container
    location /ws {
        proxy_pass http://poker-server:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

## Features

- Blind schedule with 8 levels (1/2 through 50/100)
- Configurable players, buy-in amount, and level duration
- Countdown timer with auto-start on level change
- Audible alerts — 1 minute warning beep, countdown clicks for last 5 seconds
- 20 minute break auto-triggered after configurable play time, with manual override
- Break end requires manual start
- Rebuy tracking — increases prize pool, locked after break
- Elimination tracking per player
- Prize pool auto-calculated and split 50/30/20 rounded to nearest £5
- Real-time sync across all connected devices via WebSocket
- Tournament setup panel collapses after applying
- Ace of spades favicon embedded as inline SVG

---

## Updating

From `/ssd/docker/docker-compose/nginx/`:

```bash
docker compose pull; docker compose build; docker compose up -d --force-recreate
```

- `pull` — updates the nginx image
- `build` — rebuilds the poker server from the local Dockerfile
- `--force-recreate` — restarts both containers

---

## Notes

- Poker server state is **in-memory only** — a container restart will reset the tournament state
- The `.htpasswd` file is bind-mounted from the host so it survives container recreations
- `apache2-utils` should be installed on Phobos directly so `htpasswd` can be run on the host without depending on the container:

```bash
sudo apt-get install apache2-utils
```
