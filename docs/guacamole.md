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
    entrypoint: ["/bin/sh", "-c"]
    command: ["fc-cache -f && exec /opt/guacamole/entrypoint.sh"]
    volumes:
      - /ssd/docker/appdata/guacd/fonts:/usr/share/fonts/truetype/nerd-fonts:ro
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

## Nerd Font in SSH terminals

`guacd` renders the SSH terminal server-side (glyphs are drawn to an image stream), so a font has to live inside the `guacd` container itself — installing one in the browser has no effect.

A Nerd Font ([JetBrainsMono Nerd Font](https://www.nerdfonts.com/font-downloads)) is bind-mounted into the container from `/ssd/docker/appdata/guacd/fonts` on Titan. Since the mount happens at runtime rather than image build time, the entrypoint is overridden to rebuild the fontconfig cache (`fc-cache -f`) before handing off to the image's normal startup script.

Only the fixed-width "Mono" variant is used, so glyph widths line up correctly in a monospace terminal grid.

With the font installed, each SSH connection still needs to be told to use it — set under the connection's edit page, **Display → Font name**:

```
JetBrainsMono Nerd Font Mono
```

There's no global default font in Guacamole; it's a per-connection parameter.
