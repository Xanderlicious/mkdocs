# Apache Guacamole

![apache-guacamole-logo](images/Apache_Guacamole_logo.png)

Guacamole allows me to connect to my various different devices using RDP, VNC or even SSH.

What sets this apart from other tools that can do a similar (or better) job is that this is able to be done from within a browser.

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

  guacd:
    image: guacamole/guacd
    container_name: guacd
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: "172.19.0.112"
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "4822"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  guacamole:
    image: guacamole/guacamole
    container_name: guacamole
    restart: unless-stopped
    depends_on:
      - guacd
    environment:
      GUACD_HOSTNAME: guacd
      MYSQL_HOSTNAME: titan-mysql-db
      MYSQL_DATABASE: guacamole
      MYSQL_USER: guacamole
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TOTP_ENABLED: "true"
    networks:
      proxy:
        ipv4_address: "172.19.0.113"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/guacamole/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    labels:
      - traefik.enable=true
      - traefik.http.routers.guacamole.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.guacamole.entrypoints=websecure-int
      - traefik.http.routers.guacamole.tls=true
      - traefik.http.routers.guacamole.tls.certresolver=production
      - traefik.http.routers.guacamole.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.guacamole.tls.domains[0].sans=*.domain.co.uk
      - traefik.http.services.guacamole.loadbalancer.server.port=8080
```
