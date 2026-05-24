# MySQL Database

![mysql-logo](images/mysql.png)

MySQL is used as the database of choice for IPAM (will soon be used by Uptime-Kuma)

## docker-compose.yml

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  titan-mysql-db:
    image: mysql:8.0
    container_name: phobos-mysql-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - /ssd/docker/appdata/phobos-mysql-db:/var/lib/mysql
    networks:
      default:
        ipv4_address: "172.20.0.200"
```
