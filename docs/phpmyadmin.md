# phpMyAdmin

![phpMyAdmin-logo](images/phpmyadmin-resized.png)

phpMyAdmin is a web-based administration tool for MySQL databases. It allows you to manage databases, run queries, create and modify tables, manage user accounts and permissions — all from a browser GUI.

I run two separate instances of phpMyAdmin, one on each host that has a MySQL database:

- **Titan** — administers `titan-mysql-db`, which serves [Ghost](https://docs.xmsystems.co.uk/ghost/), [Guacamole](https://docs.xmsystems.co.uk/guacamole/) and [Firefly III](https://docs.xmsystems.co.uk/firefly/)
- **Phobos** — administers `phobos-mysql-db`, which currently serves [IPAM](https://docs.xmsystems.co.uk/ipam/) and will soon serve Uptime-Kuma

## docker-compose

### Titan

``` yaml
networks:
  default:
    name: proxy
    external: "true"

services:
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: phpmyadmin
    environment:
      - PMA_HOSTS=titan-mysql-db
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.105"
    ports:
      - 84:80
    volumes:
      - /ssd/docker/appdata/phpmyadmin/sessions
      - /ssd/docker/appdata/phpmyadmin/config.user.inc.php:/etc/phpmyadmin/config.user.inc.php
      - /ssd/docker/appdata/phpmyadmin/custom/phpmyadmin/theme/:/www/themes/theme/
```

Even though this is hosted on Titan, I have opted to use a dynamic file rather than labels.

This file is located here [phpmyadmin-titan](https://docs.xmsystems.co.uk/dynamic/#phpmyadmin-titan)

---

### Phobos

``` yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  phpmyadmin-phobos:
    image: phpmyadmin:latest
    container_name: phpmyadmin-phobos
    environment:
      - PMA_HOSTS=phobos-mysql-db
    restart: always
    networks:
      default:
        ipv4_address: "172.20.0.6"
    ports:
      - 84:80
    volumes:
      - /ssd/docker/appdata/phpmyadmin-phobos/sessions
      - /ssd/docker/appdata/phpmyadmin-phobos/config.user.inc.php:/etc/phpmyadmin/config.user.inc.php
```

As this runs on a different host to Traefik, a dynamic file is used to route it through Traefik with SSL.

This file is located here [phpmyadmin-phobos](https://docs.xmsystems.co.uk/dynamic/#phpmyadmin-phobos)
