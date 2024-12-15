![](images/ghost.png)

Ghost is an open source blog & newsletter platform

I have set this up so there are 2 instances (and 2 separate databases)

## docker-compose file location

```sh
├─ ssd/
│  └─ docker-compose/
│     └─ ghost
```

## Appdata

```sh
├─ ssd/
│  └─ appdata/
│     └─ db/
|     └─ xms/
|     └─ sal/
```

## docker-compose.yml

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
        ipv4_address: "172.19.0.98"
    ports:
      - 9889:2368
    environment:
      database__client: mysql
      database__connection__host: db-xms
      database__connection__user: ${user}
      database__connection__password: ${database__connection__password}
      database__connection__database: ghost1
      url: https://subdomain.domain.co.uk
    volumes:
      - /ssd/appdata/ghost/xms:/var/lib/ghost/content

  ghost2:
    image: ghost
    container_name: ghost-sal
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.97"
    ports:
      - 9890:2368
    environment:
      database__client: mysql
      database__connection__host: db-sal
      database__connection__user: ${user}
      database__connection__password: ${database__connection__password}
      database__connection__database: ghost2
      url: https://subdomain.domain.co.uk
      #NODE_ENV: development
    volumes:
      - /ssd/appdata/ghost/sal:/var/lib/ghost/content

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
      - /ssd/appdata/ghost/db/db-xms:/var/lib/mysql

  db-sal:
    image: mysql:8.0
    container_name: ghost-db-sal
    networks:
      default:
        ipv4_address: "172.19.0.95"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - /ssd/appdata/ghost/db/db-sal:/var/lib/mysql
```

