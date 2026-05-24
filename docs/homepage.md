# Homepage

![homepage-logo](images/homepage.png)

Homepage is a highly customizable application dashboard with integrations for over 100 services.

This allows me to have an "at a glance" view of my services and their health.

The below screenshot shows a recent iteration but I'm always swapping and changing how it looks

![screenshot](<images/homepage dash.png>)

## docker-compose.yml

``` yaml
networks:
  default:
    name: phobos-network
    external: true

services:

  homepage:
    image:  ghcr.io/gethomepage/homepage:latest
    hostname: Phobos
    container_name: homepage
    networks:
      default:
        ipv4_address: 172.20.0.3
    environment:
      HOMEPAGE_ALLOWED_HOSTS: dash.xanderman.co.uk
    volumes:
      - /ssd/docker/appdata/homepage:/app/config
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /titan/megaraid:/megaraid:ro
      - /titan/ironwolf:/ironwolf:ro
      - /titan/ssd:/ssd:ro
      - /ssd/docker/appdata/homepage/icons:/app/public/icons
      - /ssd/docker/appdata/homepage/images:/app/public/images
    ports:
      - 3002:3000
    security_opt:
      - no-new-privileges=true
    restart: unless-stopped
```

!!! note
    Homepage connects to remote Docker hosts (Titan, Tethys, NCC-1702) via mTLS on port 2376. See the [Docker Daemon Security (mTLS)](mTLS.md) page for the certificate setup and `docker.yaml` configuration.
