# Podgrab

![podgrab-logo](images/podgrab.png)

Podgrab is a self-hosted podcast manager that automatically downloads podcast episodes as soon as they become available.

It provides a simple web interface for managing podcast subscriptions and browsing downloaded episodes, and can be configured to check for new episodes on a schedule.

## docker-compose.yml

```yaml
networks:
  proxy:
    external: true

services:

  podgrab:
    image: akhilrex/podgrab
    container_name: podgrab
    environment:
      - CHECK_FREQUENCY=240
    volumes:
      - /ssd/docker/appdata/podgrab/config:/config
      - /ironwolf/music/Podcasts:/assets
    labels:
      - traefik.enable=true
      - traefik.http.services.podgrab.loadbalancer.server.port=8080
      - traefik.http.routers.podgrab.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.podgrab.entrypoints=websecure-int
      - traefik.http.routers.podgrab.tls=true
      - traefik.http.routers.podgrab.tls.certresolver=production
      - traefik.http.routers.podgrab.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.podgrab.tls.domains[0].sans=*.domain.co.uk
    networks:
      proxy:
        ipv4_address: 172.19.0.106
    restart: unless-stopped
```

!!! info
    `CHECK_FREQUENCY` is specified in minutes. 240 means Podgrab will check for new episodes every 4 hours.
