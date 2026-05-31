# Docker Health Checks

Docker health checks allow the daemon to actively probe whether a container is working correctly, not just whether the process is running. A container whose process hasn't crashed but is silently failing (e.g. unable to respond to requests) will be marked `unhealthy` rather than incorrectly appearing as `Up`.

This page documents the health checks configured across the homelab stack, the reasoning behind each, and why certain containers deliberately have no health check defined.

---

## How Health Checks Work

Each check runs a command **inside the container** on a repeating interval. Docker tracks the result and marks the container as one of:

| Status | Meaning |
| -------- | --------- |
| `starting` | Within the `start_period` grace window — failures don't count yet |
| `healthy` | Last check passed |
| `unhealthy` | Failed `retries` consecutive checks |

Docker does **not** automatically restart unhealthy containers — that is handled by an autoheal container or orchestrator. However, `unhealthy` status is visible in `docker ps`, Dozzle, Portainer, and Uptime Kuma, making it a useful early-warning signal.

!!! important "Healthchecks run inside the container"
    The check command executes inside the container's filesystem and network namespace. Always use the **internal** port, not the host-mapped port. A container listening on port `3000` internally but mapped to `8080` on the host must use `localhost:3000` in its health check.

---

## Standard Parameters

All health checks across the stack follow these defaults unless noted otherwise:

```yaml
healthcheck:
  interval: 30s      # How often to run the check
  timeout: 10s       # How long before a single check is considered failed
  retries: 3         # Consecutive failures before marking unhealthy
  start_period: 30s  # Grace period after container start before failures count
```

`start_period` is particularly important for services that have slow startup times (databases, Grafana, Ghost) — failures during this window are ignored.

---

## Health Checks in Use

### Prometheus

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO /dev/null http://localhost:9090/-/healthy || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Why `wget` and not `curl`?** The `prom/prometheus` image is minimal and does not include `curl`. This was confirmed during initial setup when a `curl`-based check caused the container to immediately show as `unhealthy` despite Prometheus starting correctly. `wget` is available and achieves the same result.

**Why `/-/healthy`?** Prometheus exposes a dedicated health endpoint at `/-/healthy` which returns HTTP 200 once the server is ready to serve queries. This is preferred over hitting `/metrics` directly.

---

### Grafana

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

`curl` is available in the Grafana image. The `/api/health` endpoint is Grafana's official health check endpoint, returning a JSON response with database connectivity status — more meaningful than a simple process check.

---

### cAdvisor

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/healthz"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

cAdvisor exposes a dedicated `/healthz` endpoint specifically intended for health checking. This is preferred over `/metrics` as it doesn't trigger a full metrics collection pass. The `start_period` of 15s reflects the time cAdvisor takes to enumerate running containers on startup.

---

### node_exporter

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9100/metrics"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 5s
```

node_exporter starts almost instantly with no external dependencies, hence the shorter `start_period`. Hitting `/metrics` directly confirms the exporter is both running and actively serving data.

---

### MySQL (application databases)

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "--password=$$MYSQL_ROOT_PASSWORD"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

`mysqladmin ping` is the standard MySQL liveness check — it verifies the daemon is accepting connections, not just that the process is running. The `$$` double-dollar sign is required in Compose files to escape the variable so it isn't consumed by Compose before Docker evaluates it.

---

### Ghost (CMS)

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:2368 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

Ghost can take a significant amount of time to start (theme compilation, database migrations), so `start_period` is extended to 60s. Port `2368` is Ghost's internal default — the external port mapping is irrelevant here.

---

### Pi-hole

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/api/info/login"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

The `/api/info/login` endpoint is used rather than `/admin/` because the admin redirect can produce a 301 that `curl -f` may not follow consistently across versions. The API endpoint returns a clean 200 and confirms the web interface is functional.

---

## Containers Without Health Checks

The following containers have **no health check defined**. This is a deliberate decision in each case, not an oversight.

### UnPoller

UnPoller uses a **scratch-based image** — it contains only the compiled Go binary with no shell, no `wget`, no `curl`, and no `nc`. There is no mechanism to execute a health check command inside the container.

```bash
# Confirmed on Tethys:
docker exec unpoller which wget  # → OCI runtime exec failed: "which" not found
docker exec unpoller which curl  # → OCI runtime exec failed: "which" not found
docker exec unpoller ls /bin     # → OCI runtime exec failed: "ls" not found
```

**Effective alternative:** If UnPoller stops exporting metrics, Prometheus scrape failures will immediately surface in Grafana. The Prometheus scrape target itself acts as a functional health check.

---

### pihole-exporter

Same situation as UnPoller — scratch-based image with no available tooling:

```bash
# Confirmed on Tethys:
docker exec pihole-exporter wget ...  # → OCI runtime exec failed: "wget" not found
```

**Effective alternative:** Prometheus scrape failure detection covers this, as with UnPoller.

---

!!! tip "General rule for exporter images"
    Prometheus exporter images (pihole-exporter, unpoller, blackbox-exporter, etc.) are commonly built on scratch or distroless base images to minimise attack surface and image size. Assume no shell tooling is available unless confirmed otherwise. If an exporter stops working, Prometheus will report it as a scrape failure before Docker's own health check would catch it anyway.

---

## Checking Health Status

```bash
# View health status for all containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Inspect the last health check result for a specific container
docker inspect <container_name> --format='{{json .State.Health}}' | jq

# View health check history
docker inspect <container_name> | jq '.[0].State.Health.Log'
```
