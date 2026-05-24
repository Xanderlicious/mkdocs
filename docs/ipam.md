# IPAM

A self-hosted IP Address Management tool for tracking networks, hosts, containers and DNS records across my entire infrastructure.

Built as a custom solution consisting of a Node.js REST API backend, a static HTML/JS frontend served by the existing nginx container on Phobos.  
It also has a dedicated database on the shared `phobos-mysql-db` instance.

**URL:** [ipam.xmsystems.co.uk](https://ipam.xmsystems.co.uk)  
**Host:** Phobos  

---

## Architecture

```sh
Traefik (Titan)
    └── ipam.xmsystems.co.uk
            └── nginx (Phobos :88)
                    ├── /ipam/          → static frontend (bind mount)
                    └── /api/           → proxy → ipam-backend (172.20.0.201:3001)

ipam-mysql    → phobos-mysql-db (172.20.0.200)
ipam-backend  → 172.20.0.201:3001
```

---

## MySQL Database

The IPAM uses the shared `phobos-mysql-db` MySQL instance. The database and user are created manually rather than being defined in the compose file.

### Creating the database and user

```bash
# Create the database
docker exec -it phobos-mysql-db mysql -uroot -p -e "CREATE DATABASE ipam;"

# Create the user and grant access
docker exec -it phobos-mysql-db mysql -uroot -p -e "
  CREATE USER 'ipam'@'%' IDENTIFIED BY 'yourpassword';
  GRANT ALL PRIVILEGES ON ipam.* TO 'ipam'@'%';
  FLUSH PRIVILEGES;
"
```

### Loading the schema

```bash
docker exec -i phobos-mysql-db mysql -uipam -p'yourpassword' ipam < /ssd/docker/appdata/mysql/init-scripts/ipam-schema.sql
```

!!! note
    The schema file lives at `/ssd/docker/appdata/mysql/init-scripts/ipam-schema.sql` alongside other database init scripts.

---

## Backend

### docker-compose.yml

Sensitive values are stored in a `.env` file in the same directory.

```yaml
networks:
  phobos-network:
    external: true

services:
  ipam-backend:
    build: .
    container_name: ipam-backend
    restart: unless-stopped
    environment:
      DB_HOST: phobos-mysql-db
      DB_PORT: 3306
      DB_USER: ipam
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: ipam
    networks:
      phobos-network:
        ipv4_address: 172.20.0.201
```

### .env

```sh
MYSQL_PASSWORD=yourpassword
```

### Updating the backend

After any changes to `server.js`:

```bash
cd /ssd/docker/docker-compose/ipam-backend
docker compose build
docker compose up -d --force-recreate
```

---

## Frontend

The frontend is a single `index.html` file served directly by the existing nginx container via a bind mount. There is no build step.

### File location

```sh
/ssd/docker/appdata/nginx/ipam/index.html
```

### nginx server block

Added to `/ssd/docker/appdata/nginx/default.conf`:

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

Updating frontend files is live immediately — no nginx reload required.

---

## Traefik Dynamic File

```yaml
http:
  routers:
    ipam:
      entryPoints:
        - websecure-int
      rule: "Host(`ipam.xmsystems.co.uk`)"
      tls:
        certResolver: production
      service: ipam

  services:
    ipam:
      loadBalancer:
        servers:
          - url: "http://10.36.100.151:88"
        passHostHeader: true
```

---

## Data Import Scripts

A set of Python scripts live on Phobos at `/ssd/docker/appdata/ipam/scripts/` for populating the IPAM from existing infrastructure.

### Docker scraper

Connects to Phobos (local socket), Titan, Tethys and NCC-1702 (TLS) and imports all Docker networks and container IPs.

```bash
python3 docker-ipam-scraper.py
```

Uses TLS certs from `/etc/docker/certs/` for remote hosts. Safe to re-run — skips anything already in the IPAM.

### UniFi scraper

Pulls all networks and DHCP clients from the UniFi gateway at `10.36.100.1`. Also imports DHCP ranges for each network.

```bash
python3 unifi-ipam-scraper.py
```

Only creates a network in the IPAM if at least one host is present. Sets online/offline status based on current connection state.

### Pi-hole scraper

Pulls local DNS records from Pi-hole v6 on NCC-1702 via the API at `http://10.36.100.2/api/config/dns/hosts`. Automatically links records to existing hosts where the IP matches.

```bash
python3 pihole-ipam-scraper.py
```

### PiVPN / WireGuard scraper

SSHes to NCC-1702 using the `ncc-1702` SSH config entry and reads WireGuard peer config from `/etc/wireguard/wg0.conf`. Prompts for SSH key passphrase if required.

```bash
python3 pivpn-ipam-scraper.py
```

Imports the WireGuard network, gateway host, and all peers with their VPN IPs and names. Checks live handshake status via `wg show` to set online/offline.

---

## Features

- **Networks** — Physical, VLAN, Docker, WireGuard with parent/child relationships
- **Hosts** — IP, MAC, hostname, status, role flags (gateway, DHCP, DNS), Docker container details
- **IP map** — Visual grid per network showing free (green), taken (red), DHCP range (orange) and reserved (purple) addresses
- **DNS records** — A, AAAA, CNAME, PTR, MX, TXT linked to hosts
- **Global search** — Search across IP, hostname, MAC, container name
- **Audit log** — All creates and updates recorded
- **Utilisation** — Per-network address usage with free range listing

---

## Database Schema Changes

The init SQL only runs on a fresh data directory. For subsequent schema changes, exec into MySQL directly:

```bash
docker exec -it phobos-mysql-db mysql -uipam -p'yourpassword' ipam
```

Example — adding a column:

```sql
ALTER TABLE networks ADD COLUMN dhcp_start VARCHAR(45) NULL, ADD COLUMN dhcp_end VARCHAR(45) NULL;
```
