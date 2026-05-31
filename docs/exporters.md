# Exporters & Scrapers

This page documents all the exporters and scrapers configured within my Prometheus setup, which feed data into Grafana dashboards.

Prometheus runs on **Tethys** and scrapes targets across Titan, Phobos, Tethys itself, and NCC-1702.

## Overview

|Exporter|Titan|Phobos|Tethys|NCC-1702|Port|
|---|---|---|---|---|---|
|Node Exporter|✅|✅|✅|✅|9100|
|cAdvisor|✅|✅|✅|✅|8080 / 8087|
|Traefik Metrics|✅||||8088|
|Plex Exporter|✅||||9000|
|Homers|✅||||8083|
|Unpoller|||✅||9130|
|Pi-Hole Exporter|||✅||9617|
|Wireguard Exporter||||✅|9586|
|Dozzle|✅|✅|✅|✅|8080 / 7007|

---

## Compose Stacks

The monitoring exporters are deployed via Docker Compose on each host. The full `prometheus.yml` scrape config (defining all targets) is documented on the [Grafana & Prometheus](grafana & prometheus.md) page.

=== "Tethys"

    Tethys hosts the core monitoring stack (Prometheus, Grafana) alongside the exporters for its own host metrics and the remote scrapers for UniFi and Pi-Hole.

    ```yaml
    networks:
      default:
        name: monitoring
        external: true

    services:
      prometheus:
        image: prom/prometheus:latest
        container_name: prometheus
        networks:
          default:
            ipv4_address: "172.18.0.2"
        ports:
          - 9090:9090
        volumes:
          - /ssd/docker/appdata/monitoring/prometheus/config:/etc/prometheus
          - /ssd/docker/appdata/monitoring/prometheus/data:/prometheus
        user: "1000"
        restart: unless-stopped
        command:
          - --config.file=/etc/prometheus/prometheus.yml

      grafana:
        image: grafana/grafana:latest
        container_name: grafana
        networks:
          default:
            ipv4_address: "172.18.0.3"
        ports:
          - 3000:3000
        volumes:
          - /ssd/docker/appdata/monitoring/grafana/data:/var/lib/grafana
          - /ssd/docker/appdata/monitoring/grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards
        user: "1000"
        restart: unless-stopped
        depends_on:
          - prometheus

      unpoller:
        image: ghcr.io/unpoller/unpoller:latest
        networks:
          default:
            ipv4_address: "172.18.0.4"
        restart: unless-stopped
        container_name: unpoller
        env_file:
          - /ssd/docker/appdata/monitoring/unpoller/.env
        ports:
          - 9130:9130

      node_exporter:
        image: quay.io/prometheus/node-exporter:latest
        container_name: node-exporter-tethys
        networks:
          default:
            ipv4_address: "172.18.0.5"
        command:
          - --path.rootfs=/host
        pid: host
        ports:
          - 9100:9100
        restart: unless-stopped
        volumes:
          - /:/host:ro,rslave

      cadvisor:
        image: gcr.io/cadvisor/cadvisor
        container_name: cadvisor-tethys
        networks:
          default:
            ipv4_address: "172.18.0.6"
        volumes:
          - /:/rootfs:ro
          - /var/run:/var/run:ro
          - /sys:/sys:ro
          - /var/lib/docker/:/var/lib/docker:ro
          - /dev/disk/:/dev/disk:ro
        devices:
          - /dev/kmsg
        restart: unless-stopped
        privileged: true

      pihole-exporter:
        image: 'ekofr/pihole-exporter:latest'
        container_name: pihole-exporter
        networks:
          default:
            ipv4_address: "172.18.0.7"
        ports:
          - '9617:9617'
        env_file:
        - /ssd/docker/appdata/monitoring/pihole-exporter/.env
        restart: unless-stopped

      dozzle-agent:
        image: amir20/dozzle:latest
        container_name: dozzle-agent
        networks:
          default:
            ipv4_address: "172.18.0.8"
        command: agent
        environment:
          - DOZZLE_HOSTNAME=Tethys
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock:ro
        ports:
          - 7007:7007
        restart: unless-stopped
    ```

=== "Titan"

    Titan runs node_exporter, cAdvisor, Plex Exporter, and Homers alongside the primary Dozzle instance.

    ```yaml
    networks:
      monitoring:
        external: true

    services:

      node_exporter:
        image: quay.io/prometheus/node-exporter:latest
        container_name: node-exporter-titan
        command:
          - '--path.rootfs=/host'
        networks:
          monitoring:
            ipv4_address: "172.18.0.3"
        pid: host
        ports:
          - "9100:9100"
        restart: unless-stopped
        volumes:
          - '/:/host:ro,rslave'

      cadvisor:
        image: gcr.io/cadvisor/cadvisor
        container_name: cadvisor-titan
        networks:
          monitoring:
            ipv4_address: "172.18.0.4"
        ports:
          - "8087:8080"
        volumes:
          - /:/rootfs:ro
          - /var/run:/var/run:ro
          - /sys:/sys:ro
          - /var/lib/docker/:/var/lib/docker:ro
          - /dev/disk/:/dev/disk:ro
        devices:
          - /dev/kmsg
        restart: unless-stopped
        privileged: true

      plex-exporter:
        image: ghcr.io/timothystewart6/prometheus-plex-exporter
        container_name: plex-exporter
        networks:
          monitoring:
            ipv4_address: "172.18.0.5"
        ports:
          - "9000:9000"
        environment:
          PLEX_SERVER: "https://plex.xanderman.co.uk"
          PLEX_TOKEN: "Jq1eEGzU-k8bXJzhxyxN"
        restart: unless-stopped

      homers:
        image: mcth/homers
        container_name: homers
        restart: unless-stopped
        networks:
          monitoring:
            ipv4_address: "172.18.0.6"
        ports:
          - "8083:8000"
        environment:
          - PUID=1000
          - PGID=1000
        volumes:
          - /ssd/docker/appdata/homers/config.toml:/app/config.toml
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:8000"]
          interval: 60s
          timeout: 10s
          retries: 3

      dozzle:
        image: amir20/dozzle:latest
        container_name: dozzle
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock
          - /ssd/docker/appdata/dozzle/data:/data
        networks:
          monitoring:
            ipv4_address: "172.18.0.7"
        environment:
          - DOZZLE_REMOTE_AGENT=10.36.100.151:7007,10.36.100.152:7007,10.36.100.2:7007
          - DOZZLE_ENABLE_ACTIONS=true
          - DOZZLE_ENABLE_SHELL=true
          - DOZZLE_AUTH_PROVIDER=simple
          - DOZZLE_HOSTNAME=Titan
          - TZ=Europe/London
        restart: unless-stopped
    ```

=== "Phobos"

    Phobos runs node_exporter and cAdvisor for host and container metrics, plus a Dozzle agent.

    ```yaml
    networks:
      default:
        name: monitoring
        external: true

    services:
      node_exporter:
        image: quay.io/prometheus/node-exporter:latest
        container_name: node-exporter-phobos
        command:
          - '--path.rootfs=/host'
        networks:
          default:
            ipv4_address: "172.18.0.2"
        pid: host
        ports:
          - 9100:9100
        restart: unless-stopped
        volumes:
          - '/:/host:ro,rslave'

      cadvisor:
        image: gcr.io/cadvisor/cadvisor
        container_name: cadvisor-phobos
        networks:
          default:
            ipv4_address: "172.18.0.3"
        ports:
          - "8087:8080"
        volumes:
          - /:/rootfs:ro
          - /var/run:/var/run:ro
          - /sys:/sys:ro
          - /var/lib/docker/:/var/lib/docker:ro
          - /dev/disk/:/dev/disk:ro
        devices:
          - /dev/kmsg
        restart: unless-stopped
        privileged: true

      dozzle-agent:
        image: amir20/dozzle:latest
        container_name: dozzle-agent
        networks:
          default:
            ipv4_address: "172.18.0.4"
        command: agent
        environment:
          - DOZZLE_HOSTNAME=Phobos
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock:ro
        ports:
          - 7007:7007
        restart: unless-stopped
    ```

=== "NCC-1702"

    NCC-1702 runs node_exporter and cAdvisor for host and container metrics, plus a Dozzle agent. 
    It also runs the Wireguard Exporter, exposing VPN peer metrics to Prometheus on port `9586`.

    ```yaml
    networks:
      monitoring:
        external: true

    services:

      node_exporter:
        image: quay.io/prometheus/node-exporter:latest
        container_name: node-exporter-ncc-1702
        command:
          - '--path.rootfs=/host'
        networks:
          monitoring:
            ipv4_address: "172.18.0.2"
        pid: host
        ports:
          - 9100:9100
        healthcheck:
          test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9100/metrics"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 5s
        restart: unless-stopped
        volumes:
          - '/:/host:ro,rslave'

      cadvisor:
        image: gcr.io/cadvisor/cadvisor
        container_name: cadvisor-ncc-1702
        networks:
          monitoring:
            ipv4_address: "172.18.0.3"
        ports:
          - "8087:8080"
        healthcheck:
          test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/healthz"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 15s
        volumes:
          - /:/rootfs:ro
          - /var/run:/var/run:ro
          - /sys:/sys:ro
          - /var/lib/docker/:/var/lib/docker:ro
          - /dev/disk/:/dev/disk:ro
        devices:
          - /dev/kmsg
        restart: unless-stopped
        privileged: true

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
        restart: unless-stopped

      wireguard-exporter:
        image: mindflavor/prometheus-wireguard-exporter:latest
        container_name: wireguard-exporter
        restart: unless-stopped
        network_mode: host
        cap_add:
          - NET_ADMIN
        user: root
        volumes:
          - /etc/wireguard:/etc/wireguard:ro
        environment:
          - TZ=Europe/London
        command: -v true -s true -a true -n /etc/wireguard/wg0.conf -i wg0
    ```

---

## Node Exporter

**Image:** `quay.io/prometheus/node-exporter`  
**Hosts:** Titan, Phobos, Tethys, NCC-1702
**Port:** `9100`

Node Exporter is the standard Prometheus exporter for hardware and OS-level metrics. It exposes a wide range of system statistics by reading from the host's `/proc` and `/sys` filesystems (mounted as `/host` inside the container).

**Metrics collected:**

- CPU usage (per-core and aggregate)
- Memory and swap utilisation
- Disk I/O and filesystem usage
- Network interface statistics (bytes in/out, errors, drops)
- System load averages
- Temperature sensors (where available)

**Grafana usage:** Node Exporter Full dashboard — provides a comprehensive per-host view of system health. All three hosts (Titan, Phobos, Tethys) are selectable via a dashboard variable.

---

## cAdvisor

**Image:** `gcr.io/cadvisor/cadvisor`  
**Hosts:** Titan, Phobos, Tethys, NCC-1702  
**Ports:** `8080` (Tethys, on the monitoring Docker network), `8087` (Titan, Phobos & NCC-1702, mapped to host)

cAdvisor (Container Advisor) collects resource usage and performance metrics for every running Docker container. It runs in privileged mode with access to the host cgroup filesystem.

**Metrics collected:**

- Per-container CPU usage
- Per-container memory usage and limits
- Per-container network I/O
- Per-container filesystem read/write
- Container uptime and restart counts

**Grafana usage:** Docker / cAdvisor dashboards showing container-level resource consumption, making it easy to spot which containers are consuming disproportionate CPU or memory.

---

## Traefik Metrics

**Built-in to Traefik** (no separate container)  
**Host:** Titan  
**Port:** `8088`  
**Metrics path:** `/metrics`

Traefik exposes a native Prometheus metrics endpoint. This requires enabling the `prometheus` provider in the Traefik static configuration. No separate exporter container is needed.

**Metrics collected:**

- HTTP request counts and durations (per router, per service)
- HTTP response codes (2xx, 4xx, 5xx)
- Open connections
- TLS certificate expiry
- Entrypoint traffic

**Grafana usage:** Traefik dashboard showing request rates, error rates, and latency across all proxied services.

---

## Plex Exporter

**Image:** `ghcr.io/timothystewart6/prometheus-plex-exporter`  
**Host:** Titan  
**Port:** `9000`  
**Prometheus job name:** `plex-exporter`

Scrapes the Plex Media Server API to expose playback and library statistics to Prometheus.

**Metrics collected:**

- Active stream count (direct play vs. transcode)
- Transcoding session details
- Library size (movies, TV episodes, music tracks)
- Plex server availability

**Grafana usage:** Plex dashboard showing active sessions, transcode load, and library statistics over time.

---

## Homers

**Image:** `mcth/homers`  
**Host:** Titan  
**Port:** `8083`  
**Metrics path:** `/metrics`

Homers is a media server statistics aggregator that pulls data from multiple *arr applications and other media services, then exposes them as Prometheus metrics.

**Metrics collected:**

- Sonarr / Radarr queue lengths and missing media counts
- Download client statistics
- Media library counts per service

**Grafana usage:** Media stack dashboard tracking the state of the download pipeline and library growth.

---

## Unpoller

**Image:** `ghcr.io/unpoller/unpoller`  
**Host:** Tethys  
**Port:** `9130`  
**Scrape interval:** `30s`

Unpoller connects to the UniFi controller and periodically polls the API to export network device metrics into Prometheus. Configuration (controller URL and credentials) is provided via an `.env` file.

**Devices scraped:**

- UniFi Cloud Gateway Ultra (UCG)
- UniFi USW-Lite-16-PoE switch
- UniFi 6 Pro and U6 Lite Access Points

**Metrics collected:**

- Per-device CPU and memory usage
- Per-port traffic (bytes in/out, errors)
- Wireless client counts and signal strength
- WAN throughput and latency
- DPI (Deep Packet Inspection) application traffic breakdown

**Grafana usage:** UniFi Poller dashboards — site overview, client details, USW switch port statistics, and UAP wireless performance.

---

## Pi-Hole Exporter

**Image:** `ekofr/pihole-exporter`  
**Host:** Tethys (exporter container)  
**Scrapes:** NCC-1702, NCC-1703, NCC-1704  
**Port:** `9617`

The Pi-Hole exporter queries the Pi-Hole API on all three Pi-Hole instances and translates the statistics into Prometheus metrics. Credentials are provided via an `.env` file.

**Metrics collected:**

- Total DNS queries (over time)
- Blocked query count and percentage
- Unique domains queried
- Unique clients seen
- Top permitted and blocked domains
- Query types (A, AAAA, CNAME, etc.)

**Grafana usage:** Pi-Hole dashboard showing DNS traffic trends, block rates, and top clients — useful for spotting unusual DNS behaviour or confirming ad blocking is working.

---

## Wireguard Exporter

**Image:** `mindflavor/prometheus-wireguard-exporter`  
**Host:** NCC-1702  
**Port:** `9586`

A Prometheus exporter that reads WireGuard peer statistics directly from the kernel interface on NCC-1702 (which runs PiVPN/WireGuard). It runs with `network_mode: host` and `NET_ADMIN` capability so it can access the `wg0` interface directly.

**Metrics collected:**

- Per-peer last handshake timestamp
- Per-peer bytes sent and received
- Allowed IP ranges per peer
- Interface-level statistics

**Grafana usage:** WireGuard dashboard showing which VPN peers are active, their last connection time, and data transferred per peer.
