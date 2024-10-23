
![](images/Plex.png)

Having access to all of my Films, TV Shows & Music wherever I am and on whatever device I'm using is really what started my journey down this rabbit hole 

Installation of Plex is done as part of a docker-compose stack with Overseerr

## docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

    plex:
        image: lscr.io/linuxserver/plex:latest
        container_name: plex
        hostname: TiTAN
        volumes:
            - /ssd/appdata/Plex:/config
            - /megaraid/mediastore/Movies:/movies:ro
            - /megaraid/mediastore/StandUp:/standup:ro
            - /megaraid/mediastore/TV:/tv:ro
            - /ironwolf/music/MusicCollection:/music:ro
        networks:
          default:
            ipv4_address: 172.19.0.100
        restart: always
        devices:
            - /dev/dri:/dev/dri
        environment:
            - PGID=1000
            - PUID=1000
            - TZ=Europe/London
            - VERSION=latest
            - ADVERTISE_IP=https://sudomain.domain.co.uk:443
        ports:
            - 32400:32400/tcp
            - 32469:32469/tcp
            - 1900:1900/udp
            - 32410:32410/udp
            - 32412:32412/udp
            - 32413:32413/udp
            - 32414:32414/udp
        labels:
            - traefik.enable=true
            - traefik.http.services.plex.loadbalancer.server.port=32400
            - traefik.http.routers.plex.rule=Host(`sudomain.domain.co.uk`)
            - traefik.http.routers.plex.entrypoints=websecure-ext
            - traefik.http.routers.plex.tls=true
            - traefik.http.routers.plex.tls.certresolver=production
            - traefik.http.routers.plex.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.plex.tls.domains[0].sans=*.domain.co.uk

    overseerr:
        image: lscr.io/linuxserver/overseerr:latest
        container_name: overseerr
        environment:
          - PUID=1000
          - PGID=1000
          - TZ=Europe/London
        volumes:
          - /ssd/appdata/overseerr/config:/config
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

## Overseerr

![](images/overseerr.svg)

Overseerr is a 3rd party application that gives your plex users the abillity to request content that you don't currently have listed.

This "request" can then be approved or declined by the server admin (you!)
