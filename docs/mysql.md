# MySQL Database

![mysql-logo](images/mysql.png)

MySQL is used as the database of choice and is setup on three hosts:

## Titan

- Ghost
- Guacamole
- Firefly III

## Phobos

- IPAM
- Uptime-Kuma

## Tethys

- Grafana

### docker-compose.yml

=== "Titan"

    ```yaml
    networks:
        proxy:
        external: true

    services:
      titan-mysql-db:
        image: mysql:8.0
        container_name: titan-mysql-db
        restart: unless-stopped
        environment:
          MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
        volumes:
          - /ssd/docker/appdata/titan-mysql-db:/var/lib/mysql
        networks:
          proxy:
            ipv4_address: "172.19.0.200"
    ```

=== "Phobos"

    ```yaml
    networks:
      phobos-network:
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
          phobos-network:
            ipv4_address: "172.20.0.200"
    ```

=== "Tethys"

    ```yaml
    networks:
      tethys-network:
        external: true

    services:
      tethys-mysql-db:
        image: mysql:8.0
        container_name: tethys-mysql-db
        restart: unless-stopped
        environment:
          MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
        volumes:
          - /ssd/docker/appdata/phobos-mysql-db:/var/lib/mysql
        networks:
          tethys-network:
            ipv4_address: "172.21.0.200"
    ```
