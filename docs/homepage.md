
![](images/homepage.png)

Homepage is a highly customizable application dashboard with integrations for over 100 services.

This allows me to have an "at a glance" view of my services and their health.

The below screenshot shows a recent iteration but I'm always swapping and changing how it looks

![](<images/homepage dash.png>)


### docker-compose file location

``` sh
├─ ssd/
│  └─ docker-compose/
│     └─ homepage/
```

### Appdata

``` sh
├─ ssd/
│  └─ appdata/
│     └─ homepage/
```

### docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

    homepage:
        image:  ghcr.io/gethomepage/homepage:latest
        hostname: TiTAN
        container_name: homepage
        networks:
          default:
            ipv4_address: 172.19.0.108
        volumes:
            - /ssd/appdata/homepage:/app/config
            - /var/run/docker.sock:/var/run/docker.sock
            - /megaraid:/megaraid
            - /ironwolf:/ironwolf
            - /ssd:/ssd
            - /ssd/appdata/homepage/icons:/app/public/icons
            - /ssd/appdata/homepage/images:/app/public/images
        labels:
            - traefik.enable=true
            - traefik.http.services.dash.loadbalancer.server.port=3000
            - traefik.http.routers.dash.rule=Host(`sudomain.domain.co.uk`)
            - traefik.http.routers.dash.entrypoints=websecure-int
            - traefik.http.routers.dash.tls=true
            - traefik.http.routers.dash.tls.certresolver=production
            - traefik.http.routers.dash.tls.domains[0].main=domain.co.uk
            - traefik.http.routers.dash.tls.domains[0].sans=*.domain.co.uk
        security_opt:
            - no-new-privileges=true
        restart: always
```

