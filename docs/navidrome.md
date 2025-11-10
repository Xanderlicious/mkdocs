
![](images/navidrome.png)

Navidrome is a self-hosted, open source music player and streamer. It gives you freedom to listen to your music collection from any browser or mobile device.

### docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

    navidrome:
        image: deluan/navidrome:latest
        container_name: navidrome
        networks:
          default:
            ipv4_address: "172.19.0.99"
        ports:
            - 4533:4533
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
            - ND_SPOTIFY_ID=<random string>
            - ND_SPOTIFY_SECRET=<random string>
        restart: unless-stopped
        volumes:
            - /ssd/appdata/Navidrome:/data
            - /ironwolf/music/MusicCollection:/music:ro
        labels:
            - traefik.enable=true
            - traefik.http.services.navidrome.loadbalancer.server.port=4533
            - traefik.http.routers.navidrome.entrypoints=websecure-int
            - traefik.http.routers.navidrome.rule=Host(`sudomain.domain.co.uk`)
            - traefik.http.routers.navidrome.tls=true
            - traefik.http.routers.navidrome.tls.certresolver=production
            - traefik.http.routers.navidrome.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.navidrome.tls.domains[0].sans=*.domain.co.uk
```
