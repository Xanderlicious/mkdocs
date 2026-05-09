![](images/grafana.png) ![](images/prometheus.png)

I currently use (and will probably continue to use even after deploying CheckMK) Prometheus & Grafana (using node exporter and cadvisor alongside)

My main monitoring stack is located on Tethys, with compose files for exporters and collectors on each of the other 2 hosts.
## Monitoring - Tethys

### docker-compose.yml

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

### prometheus.yml

```yaml
global:
  scrape_interval:     15s
scrape_configs:

  # prometheus itself :)
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']

  # node_exporter - tethys
  - job_name: 'node-exporter-tethys'
    static_configs:
      - targets: ['node_exporter:9100']

  # cadvisor - tethys
  - job_name: 'cadvisor-tethys'
    static_configs:
      - targets: ['cadvisor:8080']

  # traefik
  - job_name: 'traefik_metrics'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['10.36.100.150:8088']

  # node_exporter - phobos
  - job_name: 'node-exporter-phobos'
    static_configs:
      - targets: ['10.36.100.151:9100']

  # cdvisor - phobos
  - job_name: 'cadvisor-phobos'
    static_configs:
      - targets: ['10.36.100.151:8087']

  # node_exporter - titan
  - job_name: 'node-exporter-titan'
    static_configs:
      - targets: ['10.36.100.150:9100']

  # cadvisor - titan
  - job_name: 'cadvisor-titan'
    static_configs:
      - targets: ['10.36.100.150:8087']

  # ppe
  - job_name: 'plex-exporter'
    static_configs:
      - targets: ['10.36.100.150:9000']

  # unpoller
  - job_name: 'unpoller'
    static_configs:
      - targets: ['unpoller:9130']
    scrape_interval: 30s
    scrape_timeout: 10s

  # pihole-exporter
  - job_name: 'pihole-exporter'
    static_configs:
      - targets: ['pihole-exporter:9617']

  # homers
  - job_name: 'homers'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['10.36.100.150:8083']
```

Grafana will essentially allow me to create some very pretty looking graphs.

As you can see from the prometheus.yml file detailed above, I have targets configured for "traefik", "node_exporter" & "cadvisor" (on both titan & phobos) There are targets configured for some plex collectors (homers & ppe) and I even have collectors for Pi-Hole & Unifi (unpoller / pihole-exporter)

## Monitoring - Phobos

As alluded to above, node_exporter & cadvisor have been installed onto Phobos & Titan which will allow prometheus on Tethys to collect metrics (config required (and detailed above) in prometheus.yml to collect/obtain) This will then allow me to reference these nodes in Grafana so graphs can be created.

This is very simply done with a docker compose stack as detailed below:

### Phobos

### docker-compose.yml

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

### Titan

```yaml
networks:
  default:
    name: monitoring
    external: true

services:

  node_exporter:
    image: quay.io/prometheus/node-exporter:latest
    container_name: node-exporter-titan
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
    container_name: cadvisor-titan
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

  plex-exporter:
    image: ghcr.io/timothystewart6/prometheus-plex-exporter
    container_name: plex-exporter
    networks:
      default:
        ipv4_address: "172.18.0.4"
    ports:
      - "9000:9000"
    environment:
      PLEX_SERVER: "https://subdomain.domain.co.uk"
      PLEX_TOKEN: "plex-token"
    restart: unless-stopped

  homers:
    image: mcth/homers
    container_name: homers
    networks:
      default:
        ipv4_address: "172.18.0.5"
    ports:
      - "8083:8000"
    volumes:
      - /ssd/docker/appdata/homers/config.toml:/app/config.toml
    restart: always

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
        ipv4_address: "172.18.0.6"
    environment:
      - DOZZLE_REMOTE_AGENT=10.36.100.151:7007,10.36.100.152:7007
      - DOZZLE_ENABLE_ACTIONS=true
      - DOZZLE_ENABLE_SHELL=true
      - DOZZLE_AUTH_PROVIDER=simple
      - DOZZLE_HOSTNAME=Titan
      - TZ=Europe/London
    restart: unless-stopped
```
I have created dynamic files for each of these [here](https://docs.xmsystems.co.uk/dynamic/#prometheus-tethys) & [here](https://docs.xmsystems.co.uk/dynamic/#grafana-tethys)

As you will have noticed, there are, on each hosts monitoring stack, there is a service entry for "dozzle".  More details on this service are located [here](https://docs.xmsystems.co.uk/dozzle)

