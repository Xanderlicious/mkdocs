# Ghost

![ghost-logo](images/ghost.png)

Ghost is an open source blog & newsletter platform

I currently have my blog site and my son has his car photography site.

- [https://blog.xmsystems.co.uk](https://blog.xmsystems.co.uk`)
- [https://cars.stansphotography.co.uk](https://cars.stansphotography.co.uk)

Each ghost instance has its own database which is setup in MySQL. [titan-mysql-db](https://docs.xmsystems.co.uk/mysql-titan/)

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
    restart: unless-stopped
    networks:
      default:
        ipv4_address: "172.19.0.93"
    environment:
      database__client: mysql
      database__connection__host: titan-mysql-db
      database__connection__user: ghost_xms
      database__connection__password: ${DB_PASS_XMS}
      database__connection__database: ghost1
      url: https://blog.xmsystems.co.uk
      mail__from: admin@xmsystems.co.uk
      mail__transport: SMTP
      mail__options__secureConnection: false
      mail__options__requireTLS: true
      mail__options__tls__ciphers: "SSLv3"
      mail__options__tls__rejectUnauthorized: "false"
      mail__options__host: smtp.office365.com
      mail__options__port: 587
      mail__options__auth__user: name@e-mail.co.uk
      mail__options__auth__pass: <password>
    volumes:
      - /ssd/docker/appdata/ghost/xms:/var/lib/ghost/content

  ghost2:
    image: ghost
    container_name: ghost-stan-sal
    restart: unless-stopped
    networks:
      default:
        ipv4_address: "172.19.0.94"
    environment:
      database__client: mysql
      database__connection__host: titan-mysql-db
      database__connection__user: ghost_stan
      database__connection__password: ${DB_PASS_STAN}
      database__connection__database: ghost2
      url: https://cars.stansphotography.co.uk
      mail__from: name@e-mail.com
      mail__transport: SMTP
      mail__options__service: SMTP
      mail__options__host: smtp.gmail.com
      mail__options__port: 587
      mail__options__auth__user: name@email.com
      mail__options__auth__pass: <password>
    volumes:
      - /ssd/docker/appdata/ghost/stan-sal:/var/lib/ghost/content
```

Each of these have their own dynamic file to ensure they pass through traefik and are using a valid SSL cert

- [XMS-Blog Dynamic File](https://docs.xmsystems.co.uk/dynamic/#xms-blog-titan)
- [Stans Photography Dynamic File](https://docs.xmsystems.co.uk/dynamic/#stans-photography-titan)
