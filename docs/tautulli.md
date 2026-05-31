# Tautulli

![tautulli-logo](images/tautulli.png)

Tautulli is a Plex Monitoring application.

It provides you with very detailed information about your Plex Media Server and the users that watch content.

![tautulli-screenshot](<images/tautulli graph.png>)

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

  tautulli:
    image: linuxserver/tautulli
    container_name: tautulli
    hostname: titan
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    volumes:
      - /ssd/docker/appdata/Tautulli:/config
    labels:
      - traefik.enable=true
      - traefik.http.services.tautulli.loadbalancer.server.port=8181
      - traefik.http.services.tautulli.loadbalancer.server.scheme=http
      - traefik.http.routers.tautulli.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.tautulli.entrypoints=websecure-int
      - traefik.http.routers.tautulli.tls=true
      - traefik.http.routers.tautulli.tls.certresolver=production
      - traefik.http.routers.tautulli.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.tautulli.tls.domains[0].sans=*.domain.co.uk
    networks:
      proxy:
        ipv4_address: 172.19.0.107
    restart: unless-stopped
```
