# SABnzbd

![sabnzbd-logo](images/sabnzbd.png)

The free and easy binary newsreader  

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

  sabnzbd:
    image: linuxserver/sabnzbd
    container_name: sabnzbd
    hostname: titan
    volumes:
      - /ssd/docker/appdata/SABnzbd:/config
      - /downloads:/downloads
      - /downloads/Incomplete:/Incomplete
    networks:
      proxy:
        ipv4_address: 172.19.0.101
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    labels:
      - traefik.enable=true
      - traefik.http.services.sabnzbd.loadbalancer.server.port=8080
      - traefik.http.routers.sabnzbd.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.sabnzbd.entrypoints=websecure-int
      - traefik.http.routers.sabnzbd.tls=true
      - traefik.http.routers.sabnzbd.tls.certresolver=production
      - traefik.http.routers.sabnzbd.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.sabnzbd.tls.domains[0].sans=*.domain.co.uk
```
