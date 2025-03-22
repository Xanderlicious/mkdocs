
![](images/tautulli.png)

Tautulli is a Plex Monitoring application.

It provides you with very detailed information about your Plex Media Server and the users that watch content.

![](<images/tautulli graph.png>)


## docker-compose file location

```bash
├─ ssd/
│  └─ docker-compose/
│     └─ tautulli/
```

## Appdata files location

```bash
├─ ssd/
│  └─ appdata/
│     └─ tautulli/
```  

## docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

    tautulli:
        image: lscr.io/linuxserver/tautulli:latest
        container_name: tautulli
        hostname: TiTAN
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        volumes:
            - /ssd/appdata/Tautulli:/config
        labels:
            - traefik.enable=true
            - traefik.http.services.tautulli.loadbalancer.server.port=8181
            - traefik.http.routers.tautulli.rule=Host(`sudomain.domain.co.uk`)
            - traefik.http.routers.tautulli.entrypoints=websecure-int
            - traefik.http.routers.tautulli.tls=true
            - traefik.http.routers.tautulli.tls.certresolver=production
            - traefik.http.routers.tautulli.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.tautulli.tls.domains[0].sans=*.domain.co.uk
        networks:
          default:
            ipv4_address: 172.19.0.107
        ports:
            - 8181:8181
        restart: unless-stopped
```
