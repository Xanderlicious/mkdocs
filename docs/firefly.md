# Firefly III

![firefly III logo](images/firefly_logo.png)

Firefly III is a free and open source finance manager

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

  firefly:
    image: fireflyiii/core:latest
    container_name: firefly
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: "172.19.0.201"
    volumes:
      - /ssd/docker/appdata/firefly/upload:/var/www/html/storage/upload
    env_file: .env
    labels:
      - traefik.enable=true
      - traefik.http.routers.firefly.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.firefly.entrypoints=websecure-int
      - traefik.http.routers.firefly.tls=true
      - traefik.http.routers.firefly.tls.certresolver=production
      - traefik.http.services.firefly.loadbalancer.server.port=8080

  firefly-cron:
    image: alpine
    container_name: firefly-cron
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: "172.19.0.202"
    env_file: .env
    command: >
      sh -c "apk add tzdata &&
             (ln -s /usr/share/zoneinfo/$$TZ /etc/localtime || true) &&
             echo \"0 3 * * * wget -qO- http://firefly:8080/api/v1/cron/$$STATIC_CRON_TOKEN;echo\" | crontab - &&
             crond -f -L /dev/stdout"
    depends_on:
      - firefly
```
