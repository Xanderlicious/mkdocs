![](images/grafana.png) ![](images/prometheus.png)

I currently use (and will probably continue to use even after deploying CheckMK) Prometheus & Grafana (using node exporter and cadvisor alongside)

## Monitoring - Titan

### docker-compose.yml

```yaml
networks:
  default:
    name: monitoring
    external: true

volumes:
  prometheus-data:
    driver: local
  grafana-data:
    driver: local

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    networks:
      default:
        ipv4_address: "172.18.0.151"
    ports:
      - 9090:9090
    volumes:
      - /ssd/docker/appdata/monitoring/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    restart: unless-stopped
    command:
      - --config.file=/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    networks:
      default:
        ipv4_address: "172.18.0.152"
    ports:
      - 3000:3000
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped

  node_exporter:
    image: quay.io/prometheus/node-exporter:latest
    container_name: node_exporter_T
    networks:
      default:
        ipv4_address: "172.18.0.153"
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
    container_name: cadvisor_T
    networks:
      default:
        ipv4_address: "172.18.0.154"
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

  # node_exporter - titan
  - job_name: 'ne-t'
    static_configs:
      - targets: ['node_exporter:9100']

  # cadvisor - titan
  - job_name: 'cadvisor-t'
    static_configs:
      - targets: ['cadvisor:8080']

  # traefik
  - job_name: 'traefik_metrics'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['10.36.100.150:8088']

  # node_exporter - phobos
  - job_name: 'ne-p'
    static_configs:
      - targets: ['10.36.100.151:9100']

  # cdvisor - phobos
  - job_name: 'cadvisor-p'
    static_configs:
      - targets: ['10.36.100.151:8087']

  # homers
  - job_name: 'homers'
    static_configs:
      - targets: ['10.36.100.150:83']

  # ppe
  - job_name: 'plex-exporter'
    static_configs:
      - targets: ['10.36.100.150:9000']
```

Grafana will essentially allow me to create some very pretty looking graphs.

As you can see from the prometheus.yml file detailed above, I have targets configured for "traefik", "node_exporter" & "cadvisor" (on both titan & phobos) and I have also installed and configured targets for some plex collectors (homers & ppe)

## Monitoring - Phobos

As alluded to above, node_exporter & cadvisor have been installed onto Phobos which will allow prometheus on Titan to collect metrics (config required (and detailed above) in prometheus.yml to collect/obtain) This will then allow me to reference these nodes in Grafana so graphs can be created.

This is very simply done with a docker compose stack as detailed below:

### docker-compose.yml

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  
  node_exporter:
    image: quay.io/prometheus/node-exporter:latest
    container_name: node_exporter_P
    command:
      - '--path.rootfs=/host'
    networks:
      default:
        ipv4_address: "172.20.0.8"
    pid: host
    ports:
      - 9100:9100
    restart: unless-stopped
    volumes:
      - '/:/host:ro,rslave'
  
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    container_name: cadvisor_P
    networks:
      default:
        ipv4_address: "172.20.0.9"
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
```

Grafana and Prometheus, despite being installed on Titan (where traefik is installed) I decided not to use traefik labels and instead I have created dynamic files for each of these [here](https://docs.xmsystems.co.uk/dynamic/#prometheus-titan) & [here](https://docs.xmsystems.co.uk/dynamic/#grafana-titan)

