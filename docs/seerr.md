# Seerr

![Seerr-logo](images/overseerr.png)

Seerr is a 3rd party application that gives your plex users the ability to request content that you don't currently have listed.

This "request" can then be approved or declined by the server admin

## docker-compose.yml

```yaml
networks:
  proxy:
    external: true

services:
  seerr:
    image: ghcr.io/seerr-team/seerr:latest
    init: true
    container_name: seerr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    volumes:
      - /ssd/docker/appdata/seerr/config:/app/config
    restart: unless-stopped
    healthcheck:
      test: wget --no-verbose --tries=1 --spider http://localhost:5055/api/v1/status || exit 1
      start_period: 20s
      timeout: 3s
      interval: 15s
      retries: 3
    networks:
      proxy:
        ipv4_address: 172.19.0.109
    labels:
      - traefik.enable=true
      - traefik.http.services.overseerr.loadbalancer.server.port=5055
      - traefik.http.routers.overseerr.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.overseerr.entrypoints=websecure-ext
      - traefik.http.routers.overseerr.tls=true
      - traefik.http.routers.overseerr.tls.certresolver=production
      - traefik.http.routers.overseerr.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.overseerr.tls.domains[0].sans=*.domain.co.uk
```
