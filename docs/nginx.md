# Nginx Web Server

![nginx-logo](images/nginx.png)

nginx runs as a Docker container on Phobos on port 88, acting as the primary web server for several internal applications. It handles static file serving, Basic Auth, and WebSocket proxying. Where a service needs to be reachable from outside the LAN, Traefik routes to nginx on port 88.

## Hosted Services

| Service | URL | Description |
| ------- | --- | ----------- |
| XMSystems Homepage | [xmsystems.co.uk](https://xmsystems.co.uk) | Fleet-wide launcher — quick links to every internal dashboard and self-hosted app |
| Infrastructure Overview | [infrastructure.xmsystems.co.uk](https://infrastructure.xmsystems.co.uk) | Interactive network and infrastructure diagram — embedded on the [Overview](overview.md) page |
| IPAM | [ipam.xmsystems.co.uk](https://ipam.xmsystems.co.uk) | Custom-built IP Address Management tool — see [IPAM](ipam.md) |
| Server Health | [health.xmsystems.co.uk](https://health.xmsystems.co.uk) | Cross-fleet health dashboard — see [Server Health](moon-fleet.md) |
| Pi-hole Status | [piholes.xmsystems.co.uk](https://piholes.xmsystems.co.uk) | DNS fleet status board — see [Pi-hole Status](piholes.md) |
| Update Status | [updates.xmsystems.co.uk](https://updates.xmsystems.co.uk) | Unattended-upgrades status per host — see [Unattended Upgrades](unattended-upgrades.md) |
| Container Updates | [containers.xmsystems.co.uk](https://containers.xmsystems.co.uk) | Weekly Docker Compose update results per host — see [Automatic Container Updates](container-updates.md) |
| Storage Monitor | [storage.xmsystems.co.uk](https://storage.xmsystems.co.uk) | Live storage/disk health dashboard — see [Storage Monitor](storage.md) |
| Downloads | [downloads.xmsystems.co.uk](https://downloads.xmsystems.co.uk) | Shared downloads folder browser with an on-demand zip-download API |
| XMS Games Hub | [games.xmsystems.co.uk](https://games.xmsystems.co.uk) | Party game platform — see [Games](games/games-overview.md) |
| Poker Clock | [poker.xmsystems.co.uk](https://poker.xmsystems.co.uk) | Tournament dashboard with real-time multi-device sync — see [Poker Clock](games/poker.md) |
| Workout Timer | `workout.[internal]` | Timer and workout reference page |
| Terraform Guide | `tf.[internal]` | Personal static Terraform learning/reference page |

---

## Docker Setup

**File:** `/ssd/docker/docker-compose/nginx/docker-compose.yml`

```yaml
networks:
  phobos-network:
    external: true

services:
  nginx:
    image: nginx
    networks:
      phobos-network:
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
```

### Updating

From `/ssd/docker/docker-compose/nginx/`:

```bash
docker compose pull; docker compose up -d --force-recreate
```

---

## nginx Configuration

All server blocks live in `/ssd/docker/appdata/nginx/default.conf`. The nginx container bind-mounts `/ssd/docker/appdata/nginx/` to `/usr/share/nginx/html` inside the container, so static file changes take effect immediately without a reload.

### Infrastructure Overview

Serves the static infrastructure diagram page that is embedded as an iframe in the [Overview](overview.md) documentation page.

```nginx
server {
    listen 80;
    server_name infrastructure.xmsystems.co.uk;

    location / {
        root /usr/share/nginx/html;
        index infra-index.html;
        try_files $uri $uri/ /infra-index.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/infra-index.html`

---

### IPAM

Routes `/` to the static frontend and `/api/` to the backend container. See [IPAM](ipam.md).

```nginx
server {
    listen 80;
    server_name ipam.xmsystems.co.uk;

    location / {
        root /usr/share/nginx/html/ipam;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://172.20.0.201:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

**Frontend file:** `/ssd/docker/appdata/nginx/ipam/index.html`

---

### Poker Clock

Serves the tournament dashboard and proxies WebSocket connections to the `poker-server` container. Basic Auth covers both locations at the server block level. See [Poker Clock](games/poker.md).

```nginx
server {
    listen 80;
    server_name poker.[REDACTED];

    auth_basic "XMS Poker";
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
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

**Dashboard file:** `/ssd/docker/appdata/nginx/poker_dashboard.html`

---

### Workout Timer

Serves the static workout page.

```nginx
server {
    listen 80;
    server_name workout.[internal];

    location = /bellyfat {
        root  /usr/share/nginx/html;
        try_files /workout-bellyfat.html =404;
    }

    location = /total {
        root  /usr/share/nginx/html;
        try_files /workout-total.html =404;
    }

    location / {
        root   /usr/share/nginx/html;
        index  workout-index.html;
        try_files $uri $uri/ /workout-index.html;
    }
}
```

**Files:** `workout-index.html`, `workout-bellyfat.html`, `workout-total.html`, `workout-gifs/`

See [Workout Timer](workout.md).

---

### XMSystems Homepage

```nginx
server {
    listen       80;
    server_name  xmsystems.co.uk;

    location / {
        root   /usr/share/nginx/html;
        index  fleet-control.html;
        try_files $uri $uri/ /fleet-control.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/fleet-control.html`

---

### Server Health

See [Server Health](moon-fleet.md) for what the page shows and how it's generated.

```nginx
server {
    listen 80;
    server_name health.xmsystems.co.uk;

    location / {
        root   /usr/share/nginx/html;
        index  serverstatus.html;
        try_files $uri $uri/ /serverstatus.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/serverstatus.html`, regenerated every 4 hours by `/home/xander/scripts/healthchecks/generate-serverstatus.sh`.

---

### Pi-hole Status

See [Pi-hole Status](piholes.md) for what the page shows and how it's generated.

```nginx
server {
    listen 80;
    server_name piholes.xmsystems.co.uk;

    location / {
        root      /usr/share/nginx/html;
        index     piholestatus.html;
        try_files $uri $uri/ /piholestatus.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/piholestatus.html`

---

### Update Status

See [Unattended Upgrades](unattended-upgrades.md) for what the page shows and the backend behind it. Proxies one `/api/updates/<host>/` location per host to that host's own `update-status-api` (port 9879); the block below repeats identically for phobos, tethys, ncc-1702 and ncc-1703.

```nginx
server {
    listen 80;
    server_name updates.xmsystems.co.uk;

    location /api/updates/titan/ {
        proxy_pass            http://10.36.100.150:9879/;
        proxy_set_header      Host $host;
        proxy_set_header      X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout    10s;
    }
    # ...one identical location block per remaining host

    location / {
        root      /usr/share/nginx/html;
        index     updates.html;
        try_files $uri $uri/ /updates.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/updates.html`

---

### Container Updates

See [Automatic Container Updates](container-updates.md) for what the page shows and the backend behind it. Proxies one `/api/containers/<host>/` location per host to that host's `container-status-api` (port 9881); the block below repeats identically for phobos, tethys and ncc-1702.

```nginx
server {
    listen 80;
    server_name containers.xmsystems.co.uk;

    location /api/containers/titan/ {
        proxy_pass            http://10.36.100.150:9881/;
        proxy_set_header      Host $host;
        proxy_set_header      X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout    10s;
    }
    # ...one identical location block per remaining host

    location / {
        root      /usr/share/nginx/html;
        index     containers.html;
        try_files $uri $uri/ /containers.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/containers.html`

---

### Storage Monitor

See [Storage Monitor](storage.md) for what the page shows and the backend behind it. Proxies `/api/` to `megaraid-api` (titan, port 9877) and one `/api/disks/<host>/` location per host to that host's `disk-smart-api` (port 9878).

```nginx
server {
    listen 80;
    server_name storage.xmsystems.co.uk;

    location /api/ {
        proxy_pass            http://10.36.100.150:9877/;
        proxy_set_header      Host $host;
        proxy_set_header      X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout    10s;
    }

    location /api/disks/titan/ {
        proxy_pass            http://10.36.100.150:9878/;
        proxy_set_header      Host $host;
        proxy_set_header      X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout    10s;
    }
    # ...one identical /api/disks/<host>/ block per remaining host (phobos, tethys)

    location / {
        root      /usr/share/nginx/html;
        index     storage.html;
        try_files $uri $uri/ /storage.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/storage.html`

---

### Downloads

```nginx
server {
    listen 80;
    server_name downloads.xmsystems.co.uk;

    location /files/ {
        alias /usr/share/nginx/html/downloads-files/;
        autoindex on;
        autoindex_format json;
    }

    location /api/zip/ {
        proxy_pass            http://10.36.100.151:9880/zip/;
        proxy_set_header      Host $host;
        proxy_set_header      X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout    600s;
        proxy_buffering       off;
    }

    location / {
        root      /usr/share/nginx/html;
        index     downloads.html;
        try_files $uri $uri/ /downloads.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/downloads.html`, browsable files under `/ssd/docker/appdata/nginx/downloads-files/`. Backend: `downloads-zip-api` (systemd service, port 9880).

---

### Terraform Guide

```nginx
server {
    listen 80;
    server_name tf.[internal];

    location / {
        root   /usr/share/nginx/html;
        index  tf-index.html;
        try_files $uri $uri/ /tf-index.html;
    }
}
```

**File:** `/ssd/docker/appdata/nginx/tf-index.html`

---

## Infrastructure Diagram

The infrastructure diagram is a self-contained static HTML page served directly by nginx. It is embedded as a full-width iframe on the [Overview](overview.md) documentation page and is available full-screen at [infrastructure.xmsystems.co.uk](https://infrastructure.xmsystems.co.uk).

