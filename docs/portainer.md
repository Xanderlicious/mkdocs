
![](images/Portainer.png)

To quote Portainer themselves:

!!! quote
    *Portainer is the most versatile container management software that simplifies your secure adoption of containers with remarkable speed.*

I use portainer (with portainer agent) to give me a quick and easy cursory overview of all of my containers and their status.

I install portainer on both servers where there are many containers running and also on my primary pi-hole where this very site runs.

![](<images/Portainer Envs.png>)

My main Portainer instance is installed on my primary server, [TiTAN](https://docs.xanderman.co.uk/titan), as part of a stack with [Traefik](https://docs.xanderman.co.uk/traefik/)


##Portainer & Portainer Agent

I install portainer on other servers using the below compose file which installs both Portainer and Portainer Agent:

###Cuthbert

```yaml
networks:
  default:
    name: cuthbert-network
    external: true

services:
  portainer-ee:
    ports:
      - 8000:8000
      - 9443:9443
    container_name: portainer
    networks:
      default:
        ipv4_address: "172.22.0.2"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    image: portainer/portainer-ee:2.19.5
  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.22.0.3"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:2.19.5

volumes:
  portainer_data:
    external: true
    name: portainer_data
```

###NCC-1702

```yaml
networks:
  default:
    name: cuthbert-network
    external: true

services:
  portainer-ee:
    ports:
      - 8000:8000
      - 9443:9443
    container_name: portainer
    networks:
      default:
        ipv4_address: "172.22.0.2"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    image: portainer/portainer-ee:2.19.5
  agent:
    ports:
      - 9001:9001
    container_name: portainer_agent
    networks:
      default:
        ipv4_address: "172.22.0.3"
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    image: portainer/agent:2.19.5

volumes:
  portainer_data:
    external: true
    name: portainer_data
```

##Dynamic Files

Even though I can reach the portainer environments for Cuthbert and NCC-1702 through TiTAN, I have still setup domain names for each of them individually.

This requires the setup of dynamic files which are detailed [here](https://docs.xanderman.co.uk/dynamic/#portainer-cuthbert) and [here](https://docs.xanderman.co.uk/dynamic/#portainer-ncc-1702)
