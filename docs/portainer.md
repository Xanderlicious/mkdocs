# Portainer

![portainer-logo](images/portainer_new_logo.jpg)

To quote Portainer themselves:

!!! quote
    *Portainer is the most versatile container management software that simplifies your secure adoption of containers with remarkable speed.*

I use portainer (and portainer agent) to give me a quick and easy cursory overview of all of my containers and their status.

![portainer-screenshot](<images/Portainer Envs.png>)

My main Portainer instance is installed on my primary server, [Titan](https://docs.xmsystems.co.uk/titan), as part of a stack with [Traefik](https://docs.xmsystems.co.uk/traefik/)

I install portainer agent on my other server that are running docker and connect them using the main portainer instance on titan.

## docker-compose

=== "phobos"

``` yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.20.0.2"
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:lts
```

=== "tethys"

```yaml
networks:
  default:
    name: tethys-network
    external: true

services:
  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.21.0.2"
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:lts
```

=== "ncc-1702"

```yaml
networks:
  default:
    name: pihole1-network
    external: true

services:
  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.22.0.2"
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:lts
```
