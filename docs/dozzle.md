# Dozzle

![dozzle-logo](images/dozzle.png)

Simple container monitoring and logging.

Dozzle allows you to view the logfiles for all of your containers in one place.

I have incorporated dozzle into the monitoring docker-compose stacks on each host but before I used to run dozzle in its own compose file (still connected to each hosts "monitoring" docker network) - these are detailed below

## Titan

```yaml
networks:
  monitoring:
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
      monitoring:
        ipv4_address: "172.18.0.7"
    environment:
      - DOZZLE_REMOTE_AGENT=10.36.100.151:7007,10.36.100.152:7007,10.36.100.2:7007
      - DOZZLE_ENABLE_ACTIONS=true
      - DOZZLE_ENABLE_SHELL=true
      - DOZZLE_AUTH_PROVIDER=simple
      - DOZZLE_HOSTNAME=Titan
    restart: always
```

## Phobos

```yaml
networks:
  monitoring:
    external: true

services:
  dozzle-agent:
    image: amir20/dozzle:latest
    container_name: dozzle-agent
    networks:
      monitoring:
        ipv4_address: "172.18.0.4"
    command: agent
    environment:
      - DOZZLE_HOSTNAME=Phobos
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - 7007:7007
    restart: always
```

## Tethys

```yaml
networks:
  monitoring:
    external: true

services:
  dozzle-agent:
    image: amir20/dozzle:latest
    container_name: dozzle-agent
    networks:
      monitoring:
        ipv4_address: "172.18.0.8"
    command: agent
    environment:
      - DOZZLE_HOSTNAME=Tethys
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - 7007:7007
    restart: always
```

## NCC-1702

```yaml
networks:
  monitoring:
    external: true

services:
  dozzle-agent:
    image: amir20/dozzle:latest
    container_name: dozzle-agent
    networks:
      monitoring:
        ipv4_address: "172.18.0.4"
    command: agent
    environment:
      - DOZZLE_HOSTNAME=NCC-1702
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - 7007:7007
    restart: always
```

## Dynamic File

For dozzle, I have selected to create a dynamic file rather than use Traefik labels despite it being installed on Titan

This Dynamic File can be found here [dozzle-titan](https://docs.xmsystems.co.uk/dynamic/#dozzle-titan)
