![](images/dozzle.png)

Simple container monitoring and logging.

Dozzle allows you to view the logfiles for all of your containers in one place.

### Titan

```yaml
networks:
  default:
    name: proxy
    external: true

services:
  dozzle:
    image: amir20/dozzle:latest
    container_name: dozzle
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /ssd/docker/appdata/dozzle/data:/data
    ports:
      - 8585:8080
    networks:
      default:
        ipv4_address: "172.19.0.5"
    environment:
      - DOZZLE_REMOTE_AGENT=10.36.100.151:7007,10.36.100.152:7007
      - DOZZLE_ENABLE_ACTIONS=true
      - DOZZLE_ENABLE_SHELL=true
      - DOZZLE_AUTH_PROVIDER=simple
      - DOZZLE_HOSTNAME=Titan
    restart: always
```
### Phobos

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  dozzle-agent:
    image: amir20/dozzle:latest
    container_name: dozzle-agent
    networks:
      default:
        ipv4_address: "172.20.0.12"
    command: agent
    environment:
      - DOZZLE_HOSTNAME=Phobos
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - 7007:7007
    restart: always
```

### Tethys

```yaml
networks:
  default:
    name: tethys-network
    external: true

services:
  dozzle-agent:
    image: amir20/dozzle:latest
    container_name: dozzle-agent
    networks:
      default:
        ipv4_address: "172.21.0.5"
    command: agent
    environment:
      - DOZZLE_HOSTNAME=Tethys
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - 7007:7007
    restart: always
```

## Dynamic File

For dozzle, I have selected to create a dynamic file rather than use Traefik labels despite it being installed on Titan

This Dynamic File can be found [here](https://docs.xmsystems.co.uk/dynamic/#dozzle-titan)