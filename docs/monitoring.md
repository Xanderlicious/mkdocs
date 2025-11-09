[Uptime-Kuma](https://docs.xmsystems.co.uk/kuma/) is good for quickly understanding if a service or application is up or down and while it can also provide you with an excellent array of notification options, it doesn't really do anything else in terms of monitoring your homelab estate.

This is where a proper monitoring solution comes into play and there are many, many options.

## CheckMK

![](images/checkmk.png)

In my honest opinion, one of the best, if not THE best here is CheckMK.  This is quite an advanced monitoring tool with many features but it needs to be implemented properly and ideally have dedicated hardware.

CheckMK will allow me to not only monitor the health and status of many different aspects of each of my devices (servers and desktops) but will also allow me to monitor the health and status of my router and access points via SNMP.

![Sample Screenshot](<images/checkmk dash.png>)

## Grafana / Prometheus

![](images/grafana.png) ![](images/prometheus.png)

I currently use (and will probably continue to use even after deploying CheckMK) Prometheus & Grafana (using node exporter and cadvisor alongside)

#docker-compose.yml

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

#prometheus.yml

```yaml
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.
  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  # external_labels:
  #  monitor: 'codelab-monitor'
# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'
    # Override the global default and scrape targets from this job every 5 seconds.
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

Grafana and Prometheus, despite being installed on Titan (where traefik is installed) I decided not to use traefik labels and instead I have created dynamic files for each of these [here](https://docs.xmsystems.co.uk/dynamic/#Prometheus) & [here](https://docs.xmsystems.co.uk/dynamic/#Grafana)




