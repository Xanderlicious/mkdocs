# Plex

![plex-logo](images/Plex.png)

Having access to all of my Films, TV Shows & Music wherever I am and on whatever device I'm using is really what started my journey down this rabbit hole.

## docker-compose.yml

``` yaml
networks:
  proxy:
    external: true

services:

  plex:
    image: plexinc/pms-docker
    container_name: plex
    hostname: Titan
    runtime: nvidia
    volumes:
      - /ssd/docker/appdata/Plex:/config
      - /megaraid/mediastore/Movies:/movies:ro
      - /megaraid/mediastore/StandUp:/standup:ro
      - /megaraid/mediastore/TV:/tv:ro
    networks:
      proxy:
        ipv4_address: 172.19.0.100
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu, video, compute, utility]
    restart: unless-stopped
    environment:
      - PGID=1000
      - PUID=1000
      - TZ=Europe/London
      - VERSION=docker
      - ADVERTISE_IP=https://plex.xanderman.co.uk
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
      - LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/nvidia/current
    ports:
      - 1900:1900/udp
      - 32410:32410/udp
      - 32412:32412/udp
      - 32413:32413/udp
      - 32414:32414/udp
    labels:
      - traefik.enable=true
      - traefik.http.services.plex.loadbalancer.server.port=32400
      - traefik.http.services.plex.loadbalancer.server.scheme=https
      - traefik.http.routers.plex.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.plex.entrypoints=websecure-ext,websecure-int
      - traefik.http.routers.plex.tls=true
      - traefik.http.routers.plex.tls.certresolver=production
      - traefik.http.routers.plex.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.plex.tls.domains[0].sans=*.domain.co.uk
      - traefik.http.routers.plex.middlewares=plex-headers@file
      - traefik.http.routers.plex.service=plex
```

## Plex Hardware Transcoding — Titan Setup Notes

### Prerequisites

NVIDIA drivers already installed on host
Plex Pass subscription (Lifetime or active) — required, hardware transcoding is locked without it

Install nvidia-container-toolkit:

``` bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Docker Compose configuration:

``` yaml
plex:
  runtime: nvidia
  environment:
    - NVIDIA_VISIBLE_DEVICES=all
    - NVIDIA_DRIVER_CAPABILITIES=all
    - LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/nvidia/current
```

The LD_LIBRARY_PATH is the critical one — Plex's bundled FFmpeg uses dlopen to load CUDA at runtime and doesn't look in the nvidia library path by default. Without this, you'll get Cannot load libcuda.so.1 errors even though the library exists on the filesystem.

Plex Settings:

In Plex web UI → Settings → Transcoder:

Enable "Use hardware acceleration when available"
Enable "Use hardware-accelerated video encoding"
Set Hardware transcoding device to your GPU

Verify:

``` bash
# Check GPU is visible inside container
docker exec plex nvidia-smi

# Watch GPU usage during a transcode
watch -n 2 nvidia-smi

# Check Plex logs for confirmation
docker exec plex grep -i "hardware" "/config/Library/Application Support/Plex Media Server/Logs/Plex Media Server.log" | tail -10
```

Success indicators:

Plex dashboard shows (hw) next to the transcode quality
nvidia-smi shows Plex Transcoder as an active process with VRAM usage

Notes:

Manual `devices:` mappings in compose are not needed — the nvidia runtime handles device passthrough automatically
Do not mount `/usr/lib/x86_64-linux-gnu/nvidia` as a volume — this conflicts with the nvidia runtime's own injection mechanism and causes container startup failures
The `LD_LIBRARY_PATH` environment variable persists across container recreations as it's in the compose file

---

## Plex Secure Connections via Traefik — Titan Setup Notes

### Problem

Plex was showing insecure connections for viewers because it was falling back to plain HTTP, bypassing Traefik's SSL termination.

### Root Causes

Traefik's config.yml middleware (global-default-headers) wasn't loading due to a file watcher race condition at startup, causing all routers referencing it to be disabled
Plex was only trusting 10.36.100.0/24 (home LAN) and rejecting connections from Traefik's Docker network (172.19.0.0/24)
Traefik was connecting to Plex over HTTP, which Plex rejects when secureConnections is set to Required
Real client IPs weren't being forwarded through Traefik to Plex

### Changes Made

- config.yml (Traefik dynamic config)

Added plex-headers middleware with X-Forwarded-Proto: https and sslProxyHeaders

- traefik.yml (Traefik static config)

Added forwardedHeaders.trustedIPs to both websecure-ext and websecure-int entrypoints, trusting 172.19.0.0/24 and 10.36.100.0/24

- Plex docker-compose.yml

Changed loadbalancer.server.scheme from http to https so Traefik connects to Plex over TLS
Added traefik.http.routers.plex.middlewares=plex-headers@file
Added websecure-int to the entrypoints label alongside websecure-ext

- Pi-hole

Added a local DNS record pointing at Titan's local IP, enabling split-horizon DNS so internal clients route directly to Titan rather than hairpinning through the router

- Plex Preferences.xml

Added allowedNetworks="172.19.0.0/24,10.36.100.0/24" to trust Traefik's Docker network
Updated LanNetworksBandwidth to include 172.19.0.0/24
Added trustedProxies="172.19.0.0/24" so Plex reads forwarded IP headers from Traefik
Set secureConnections="0" (Required)

### End Result

All connections to Plex are now secure (HTTPS required)
Internal and external clients both route correctly through Traefik
Real client IPs are visible in Plex/Tautulli rather than Traefik's internal Docker IP
