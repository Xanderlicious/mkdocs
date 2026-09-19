# Jellyfin

Open-source media server — a free alternative running alongside Plex on Titan, sharing the same NVIDIA GPU for hardware transcoding and the same read-only media library mounts.

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    runtime: nvidia
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
      - LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/nvidia/current
    volumes:
      - /ssd/docker/appdata/jellyfin/config:/config
      - /ssd/docker/appdata/jellyfin/cache:/cache
      - /megaraid/mediastore/Movies:/movies:ro
      - /megaraid/mediastore/StandUp:/standup:ro
      - /megaraid/mediastore/TV:/tv:ro
    networks:
      proxy:
        ipv4_address: 172.19.0.250
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.http.routers.jellyfin.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.jellyfin.entrypoints=websecure-int
      - traefik.http.routers.jellyfin.tls.certresolver=production
      - traefik.http.routers.jellyfin.tls.domains[0].main=*.domain.co.uk
      - traefik.http.services.jellyfin.loadbalancer.server.port=8096
```

Unlike Plex, Jellyfin is only routed on `websecure-int` — it's reachable on the internal network and over VPN, but not exposed externally.

Hardware transcoding is configured the same way as [Plex](plex.md) (`runtime: nvidia` plus the same `NVIDIA_VISIBLE_DEVICES` / `NVIDIA_DRIVER_CAPABILITIES` / `LD_LIBRARY_PATH` environment variables) — see that page's "Plex Hardware Transcoding" notes, which apply identically here.
