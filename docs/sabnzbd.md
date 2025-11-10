
![](images/sabnzbd.png)

The free and easy binary newsreader

### docker-compose file location

``` bash
├─ ssd/
│  └─ docker-compose/
│     └─ sabnzbd/
```

### Appdata

``` bash
├─ ssd/
│  └─ appdata/
│     └─ sabnzbd/
```  

### docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

    sabnzbd:
        image: lscr.io/linuxserver/sabnzbd:latest
        container_name: sabnzbd
        hostname: TiTAN
        volumes:
            - /ssd/appdata/SABnzbd:/config
            - /downloads:/downloads
            - /downloads/Incomplete:/Incomplete
        networks:
          default:
            ipv4_address: 172.19.0.101
        restart: always
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Europe/London
        labels:
            - traefik.enable=true
            - traefik.http.services.sabnzbd.loadbalancer.server.port=8080
            - traefik.http.routers.sabnzbd.rule=Host(`sudomain.domain.co.uk`)
            - traefik.http.routers.sabnzbd.entrypoints=websecure-int
            - traefik.http.routers.sabnzbd.tls=true
            - traefik.http.routers.sabnzbd.tls.certresolver=production
            - traefik.http.routers.sabnzbd.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.sabnzbd.tls.domains[0].sans=*.domain.co.uk
        ports:
            - 82:8080
```
