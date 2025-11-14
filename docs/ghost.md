![](images/ghost.png)

Ghost is an open source blog & newsletter platform

I have set this up so there are 3 instances (and 3 separate databases)  One of which is a work in progress

### docker-compose.yml

```yaml
networks:
  default:
    name: proxy
    external: true

services:

  ghost1:
    image: ghost
    container_name: ghost-xms
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.93"
    ports:
      - 9889:2368
    environment:
      database__client: mysql
      database__connection__host: db-xms
      database__connection__user: root
      database__connection__password: ${database__connection__password}
      database__connection__database: ghost1
      url: https://blog.xmsystems.co.uk
      mail__transport: SMTP
      mail__options__service: SMTP
      mail__from: mail@server.com
      mail__options__host: mail.server.com
      mail__options__port: 587
      mail__options__auth__user: ${USERNAME}
      mail__options__auth__pass: ${PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/xms:/var/lib/ghost/content

  ghost2:
    image: ghost
    container_name: ghost-stan-sal
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.94"
    ports:
      - 9890:2368
    environment:
      database__client: mysql
      database__connection__host: db-stan-sal
      database__connection__user: root
      database__connection__password: ${database__connection__password}
      database__connection__database: ghost2
      url: https://cars.stansphotography.co.uk
      mail__transport: SMTP
      mail__options__service: SMTP
      mail__from: mail@server.com
      mail__options__host: mail.server.com
      mail__options__port: 587
      mail__options__auth__user: ${USERNAME}
      mail__options__auth__pass: ${PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/stan-sal:/var/lib/ghost/content

  ghost3:
    image: ghost
    container_name: ghost-lenny-sal
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.95"
    ports:
      - 9891:2368
    environment:
      database__client: mysql
      database__connection__host: db-lenny-sal
      database__connection__user: root
      database__connection__password: ${database__connection__password}
      database__connection__database: ghost3
      url: https://WIP.domain.com
    volumes:
      - /ssd/docker/appdata/ghost/lenny-sal:/var/lib/ghost/content

  db-xms:
    image: mysql:8.0
    container_name: ghost-db-xms
    networks:
      default:
        ipv4_address: "172.19.0.96"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/db/db-xms:/var/lib/mysql

  db-stan-sal:
    image: mysql:8.0
    container_name: ghost-db-stan-sal
    networks:
      default:
        ipv4_address: "172.19.0.97"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/db/db-stan-sal:/var/lib/mysql

  db-lenny-sal:
    image: mysql:8.0
    container_name: ghost-db-lenny-sal
    networks:
      default:
        ipv4_address: "172.19.0.98"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/db/db-lenny-sal:/var/lib/mysql
```

