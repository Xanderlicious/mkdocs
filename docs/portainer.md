
![](images/portainer_new_logo.jpg)

To quote Portainer themselves:

!!! quote
    *Portainer is the most versatile container management software that simplifies your secure adoption of containers with remarkable speed.*

I use portainer (with portainer agent) to give me a quick and easy cursory overview of all of my containers and their status.

Portainer is installed and running on all servers where there are many containers running.

![](<images/Portainer Envs.png>)

My main Portainer instance is installed on my primary server, [Titan](https://docs.xmsystems.co.uk/titan), as part of a stack with [Traefik](https://docs.xmsystems.co.uk/traefik/)

I install portainer on my other server using the below compose file which installs both Portainer and Portainer Agent

### Portainer & Portainer Agent
### Phobos

``` yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  portainer-ee:
    ports:
      - 8000:8000
      - 9443:9443
    container_name: portainer
    networks:
      default:
        ipv4_address: "172.20.0.2"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /ssd/docker/appdata/portainer_data:/data
    image: portainer/portainer-ee:2.33.3

  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.20.0.3"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:2.33.3
```

### Tethys

```yaml
networks:
  default:
    name: tethys-network
    external: true

services:
  portainer-ee:
    ports:
      - 9443:9443
    container_name: portainer_CMK
    networks:
      default:
        ipv4_address: "172.21.0.2"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /home/xander/docker/appdata/portainer_data:/data
    image: portainer/portainer-ee:2.33.3

  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.21.0.3"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:2.33.3
```

### Dynamic File

Even though I can reach the portainer environment for Phobos and Tethys through Titan, I have still setup their own individual domain names.

This requires the setup of a dynamic file which is detailed [here](https://docs.xmsystems.co.uk/dynamic/#portainer-phobos) for Phobos and [here](https://docs.xmsystems.co.uk/dynamic/#portainer-tethys) for Tethys
