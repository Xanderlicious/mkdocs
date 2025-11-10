![](images/overseerr.png)

Overseerr is a 3rd party application that gives your plex users the abillity to request content that you don't currently have listed.

This "request" can then be approved or declined by the server admin

### docker-compose.yml

```yaml
networks:
  default:
    name: proxy
    external: true

services:
  overseerr:
    image: linuxserver/overseerr
    container_name: overseerr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    volumes:
      - /ssd/docker/appdata/overseerr/config:/config
    ports:
      - 5055:5055
    restart: unless-stopped
    networks:
      default:
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