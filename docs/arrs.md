
# Sonarr - Radarr - Lidarr

![sonarr-logo](images/Sonarr.png)
*Sonarr = TV Shows*

![radarr-logo](images/radarr.png)
*Radarr = Films*

![lidarr-logo](images/lidarr.png)
*Lidarr = Music*

They allow easy organisation of all of your media.  It has the ability to rename everything appropriately according to a naming convention you specify.

It also has the ability to link in with a newsreader (I use [SABnzbd](https://docs.xmsystems.co.uk/sabnzbd/))

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

    sonarr:
        image: linuxserver/sonarr
        container_name: sonarr
        hostname: TiTAN
        volumes:
            - /ssd/docker/appdata/Sonarr:/config
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
            - /megaraid/mediastore/TV:/tv
        networks:
          proxy:
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
        restart: unless-stopped

    radarr:
        image: linuxserver/radarr
        container_name: radarr
        hostname: TiTAN
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        volumes:
            - /ssd/docker/appdata/Radarr:/config
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
          proxy:
            ipv4_address: 172.19.0.103
        restart: unless-stopped

    lidarr:
        image: linuxserver/lidarr
        container_name: lidarr
        hostname: TiTAN
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        volumes:
            - /ssd/docker/appdata/Lidarr:/config
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
          proxy:
            ipv4_address: 172.19.0.104
        restart: unless-stopped
```
