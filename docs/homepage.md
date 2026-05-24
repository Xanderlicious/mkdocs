
![](images/homepage.png)

Homepage is a highly customizable application dashboard with integrations for over 100 services.

This allows me to have an "at a glance" view of my services and their health.

The below screenshot shows a recent iteration but I'm always swapping and changing how it looks

![](<images/homepage dash.png>)

### docker-compose.yml

``` yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    hostname: Phobos
    container_name: homepage
    volumes:
      - /ssd/docker/appdata/homepage:/app/config
      - /var/run/docker.sock:/var/run/docker.sock
      - /ssd/docker/appdata/homepage/icons:/app/public/icons
      - /ssd/docker/appdata/homepage/images:/app/public/images
    labels:
      - traefik.enable=true
      - traefik.http.services.dash.loadbalancer.server.port=3000
      - traefik.http.routers.dash.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.dash.entrypoints=websecure-int
      - traefik.http.routers.dash.tls=true
      - traefik.http.routers.dash.tls.certresolver=production
      - traefik.http.routers.dash.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.dash.tls.domains[0].sans=*.domain.co.uk
    security_opt:
      - no-new-privileges=true
    restart: unless-stopped
```

!!! note
    Homepage connects to remote Docker hosts (Titan, Tethys, NCC-1702) via mTLS on port 2376. See the [Docker Daemon Security (mTLS)](mTLS.md) page for the certificate setup and `docker.yaml` configuration.

