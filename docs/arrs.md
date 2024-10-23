
# Sonarr - Radarr - Lidarr - Readarr

![](images/Arrs.png)


*Sonarr = TV Shows*
*Radarr = Films*
*Lidarr = Music*
*Readarr = Books*

They allow easy organisation of all of your media.  It has the abillity to rename everything appropriately according to a naming convention you specify.

It also has the abillity to link in with a newsreader (I use [SABnzbd](https://www.xmsystems.co.uk/sabnzbd/))


## docker-compose file location

```sh
├─ ssd/
│  └─ docker-compose/
│     └─ arrs/
```

Appdata

```sh
├─ ssd/
│  └─ appdata/
│     └─ sonarr/
|     └─ radarr/
|     └─ lidarr/
|     └─ readarr/
```

## docker-compose.yml

``` YAML
networks:
  default:
    name: proxy
    external: true

services:

    sonarr:
        image: lscr.io/linuxserver/sonarr:latest
        container_name: sonarr
        hostname: TiTAN
        volumes:
            - /ssd/appdata/Sonarr:/config
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
            - /megaraid/mediastore/TV:/tv
        networks:
          default:
            ipv4_address: 172.19.0.102
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        labels:
            - traefik.enable=true
            - traefik.http.services.sonarr.loadbalancer.server.port=8989
            - traefik.http.routers.sonarr.rule=Host(`subdomain.domain.co.uk`)
            - traefik.http.routers.sonarr.entrypoints=websecure-int
            - traefik.http.routers.sonarr.tls=true
            - traefik.http.routers.sonarr.tls.certresolver=production
            - traefik.http.routers.sonarr.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.sonarr.tls.domains[0].sans=*.domain.co.uk
        ports:
            - 8989:8989
        restart: unless-stopped

    radarr:
        image: lscr.io/linuxserver/radarr:latest
        container_name: radarr
        hostname: TiTAN
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        volumes:
            - /ssd/appdata/Radarr:/config
            - /megaraid/mediastore/Movies:/movies
            - /megaraid/mediastore/StandUp:/StandUp
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
        labels:
            - traefik.enable=true
            - traefik.http.services.radarr.loadbalancer.server.port=7878
            - traefik.http.routers.radarr.rule=Host(`subdomain.domain.co.uk`)
            - traefik.http.routers.radarr.entrypoints=websecure-int
            - traefik.http.routers.radarr.tls=true
            - traefik.http.routers.radarr.tls.certresolver=production
            - traefik.http.routers.radarr.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.radarr.tls.domains[0].sans=*.domain.co.uk
        networks:
          default:
            ipv4_address: 172.19.0.103
        ports:
            - 7878:7878
        restart: unless-stopped

    lidarr:
        image: lscr.io/linuxserver/lidarr:latest
        container_name: lidarr
        hostname: TiTAN
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        volumes:
            - /ssd/appdata/Lidarr:/config
            - /ironwolf/music/MusicCollection:/music
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
        labels:
            - traefik.enable=true
            - traefik.http.services.lidarr.loadbalancer.server.port=8686
            - traefik.http.routers.lidarr.rule=Host(`subdomain.domain.co.uk`)
            - traefik.http.routers.lidarr.entrypoints=websecure-int
            - traefik.http.routers.lidarr.tls=true
            - traefik.http.routers.lidarr.tls.certresolver=production
            - traefik.http.routers.lidarr.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.lidarr.tls.domains[0].sans=*.domain.co.uk
        networks:
          default:
            ipv4_address: 172.19.0.104
        ports:
            - 8686:8686
        restart: unless-stopped

    readarr:
        image: lscr.io/linuxserver/readarr:develop
        hostname: TiTAN
        container_name: readarr
        volumes:
            - /ssd/appdata/Readarr:/config
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
            - /megaraid/mediastore/Books:/books
        networks:
          default:
            ipv4_address: 172.19.0.105
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        labels:
            - traefik.enable=true
            - traefik.http.services.readarr.loadbalancer.server.port=8787
            - traefik.http.routers.readarr.rule=Host(`subdomain.domain.co.uk`)
            - traefik.http.routers.readarr.entrypoints=websecure-int
            - traefik.http.routers.readarr.tls=true
            - traefik.http.routers.readarr.tls.certresolver=production
            - traefik.http.routers.readarr.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.readarr.tls.domains[0].sans=*.domain.co.uk
        ports:
            - 8787:8787
        restart: unless-stopped
```