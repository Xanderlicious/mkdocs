# Fail2Ban

Fail2Ban is an intrusion prevention framework that monitors log files and temporarily bans IP addresses that show signs of malicious activity, such as repeated failed authentication attempts.

It works by scanning log files for patterns that match known attack signatures and then updating firewall rules to reject connections from those IP addresses for a configurable period of time.

I run Fail2Ban on Titan to protect my externally facing services from brute force attacks and other automated abuse.

## docker-compose.yml

```yaml
networks:
  default:
    name: proxy
    external: true

services:
  fail2ban:
    image: lscr.io/linuxserver/fail2ban:latest
    container_name: fail2ban
    cap_add:
      - NET_ADMIN
      - NET_RAW
    network_mode: host
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    volumes:
      - /ssd/docker/appdata/fail2ban:/config
      - /var/log:/var/log:ro
      - /ssd/appdata/traefik/data/logs:/remotelogs/traefik:ro
    restart: unless-stopped
```

!!! info
    Fail2Ban requires `NET_ADMIN` and `NET_RAW` capabilities to manage iptables rules, and uses `network_mode: host` so it can interact directly with the host's network stack.

## Jails

Jails define what Fail2Ban monitors and how it responds. Each jail specifies a log file to watch, a filter (regex pattern to match failures), and the ban action to take.

Custom jail configuration files are placed in `/config/fail2ban/jail.d/` within the container's config volume.

### Traefik

To protect services behind Traefik, Fail2Ban can be configured to watch the Traefik access log.

```ini
[traefik-auth]
enabled  = true
port     = http,https
filter   = traefik-auth
logpath  = /remotelogs/traefik/access.log
maxretry = 5
bantime  = 1h
findtime = 10m
```
