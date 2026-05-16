# Ghost

![ghost-logo](images/ghost.png)

Ghost is an open source blog & newsletter platform

I currently have my blog site and my son has his car photography site.  There is a 3rd instance but this is a WIP.
Each ghost instance has its own database which is setup in MySQL. 

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
    ports:
      - 9889:2368
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
      mail__options__auth__user: admin@xmsystems.co.uk
      mail__options__auth__pass: ${XMS_MAIL_PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/xms:/var/lib/ghost/content

  ghost2:
    image: ghost
    container_name: ghost-stan-sal
    restart: unless-stopped
    networks:
      default:
        ipv4_address: "172.19.0.94"
    ports:
      - 9890:2368
    environment:
      database__client: mysql
      database__connection__host: titan-mysql-db
      database__connection__user: ghost_stan
      database__connection__password: ${DB_PASS_STAN}
      database__connection__database: ghost2
      url: https://subdomain.domain.co.uk
      mail__from: <E-MAIL_ADDRESS>
      mail__transport: SMTP
      mail__options__service: SMTP
      mail__options__host: smtp.gmail.com
      mail__options__port: 587
      mail__options__auth__user: <E-MAIL_ADDRESS>
      mail__options__auth__pass: ${STAN_EMAIL_PASSWORD}
    volumes:
      - /ssd/docker/appdata/ghost/stan-sal:/var/lib/ghost/content

  ghost3:
    image: ghost
    container_name: ghost-lenny-sal
    restart: unless-stopped
    networks:
      default:
        ipv4_address: "172.19.0.95"
    ports:
      - 9891:2368
    environment:
      database__client: mysql
      database__connection__host: titan-mysql-db
      database__connection__user: ghost_lenny
      database__connection__password: ${DB_PASS_LENNY}
      database__connection__database: ghost3
      url: https://subdomain.domain.co.uk
    volumes:
      - /ssd/docker/appdata/ghost/lenny-sal:/var/lib/ghost/content
```
