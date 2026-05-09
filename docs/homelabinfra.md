``` d2
# =====================================================================
# Homelab Infrastructure
# Render with: d2 --layout=elk --theme=200 homelab.d2 homelab.svg
# (theme 200 = "Dark Mauve"; pick another with `d2 themes`)
# =====================================================================

vars: {
  d2-config: {
    layout-engine: elk
  }
}

# ---------- Reusable styling classes ----------
classes: {
  edge_node: {
    style: {
      fill: "#1e3a5f"
      stroke: "#4f9eff"
      font-color: "#ffffff"
    }
  }
  net_node: {
    style: {
      fill: "#2a4a3a"
      stroke: "#5fbf7f"
      font-color: "#ffffff"
    }
  }
  host_node: {
    style: {
      fill: "#3a2a4a"
      stroke: "#a060c0"
      font-color: "#ffffff"
    }
  }
  svc_node: {
    style: {
      fill: "#4a3a2a"
      stroke: "#c08040"
      font-color: "#ffffff"
    }
  }
  dns_node: {
    style: {
      fill: "#4a2a2a"
      stroke: "#c06060"
      font-color: "#ffffff"
    }
  }
  ep_node: {
    style: {
      fill: "#2a3a4a"
      stroke: "#60a0c0"
      font-color: "#ffffff"
    }
  }
}

# =====================================================================
# External / Edge
# =====================================================================
Internet: "🌐 Internet\nWAN: 178.17.242.63" { class: edge_node; shape: cloud }
Admin: "👤 Remote Admin / SSH" { class: edge_node; shape: person }
CFT: "Cloudflare Zero Trust Tunnel\ncloudflared on PHOBOS\nSSH access only" { class: edge_node }
LAN_Client: "🏠 LAN / VPN client" { class: edge_node; shape: person }
VPN_Client: "🛰️ Remote VPN client" { class: edge_node; shape: person }

Admin -> CFT

# =====================================================================
# Network Infrastructure
# =====================================================================
NET: "🛡️  Network Infrastructure" {
  CGU: "XAN-CGU · UCG Ultra · 10.36.100.1\n\nPort Forwards:\nWAN 80 → 10.36.100.150:81 (web-ext)\nWAN 443 → 10.36.100.150:444 (websecure-ext)\nWAN 25565 → 10.36.100.150:25565 (Minecraft)\nWAN 51822 → 10.36.100.2:51822 (PiVPN/Wireguard)" { class: net_node }
  SW_UP: "XAN-USW-UPSTAIRS · USW Lite 16 PoE · .10" { class: net_node }
  SW_DN: "XAN-USW-DOWNSTAIRS · USW Lite 16 PoE · .11" { class: net_node }
  AP1: "UAP-AC-LR · .253" { class: net_node }
  AP2: "U6-Enterprise · .254" { class: net_node }

  CGU -> SW_UP: "Port 3 · 3+1 GbE"
  CGU -> SW_DN: "Port 2 · 2+1 GbE"
  SW_UP -> AP1: "Port 7"
  SW_DN -> AP2: "Port 7"
}
Internet -> NET.CGU

# =====================================================================
# VLANs / SSIDs
# =====================================================================
VLANS: "🔀 VLANs (DHCP via UCG) & SSIDs" {
  V1: "VLAN 1 · XAN-Core · 10.36.100.0/24" { class: net_node }
  V20: "VLAN 20 · servers · 10.36.20.0/28" { class: net_node }
  V101: "VLAN 101 · Kids · 10.36.101.0/24" { class: net_node }
  V102: "VLAN 102 · Cameras · 10.36.102.0/24" { class: net_node }
  V69: "VLAN 69 · vpn · 10.69.69.0/24" { class: net_node }
  SSID1: "XanderNET · WPA2/WPA3" { class: net_node; shape: circle }
  SSID2: "XanderKids · WPA2 · Kids VLAN" { class: net_node; shape: circle }
  SSID3: "XanderNET6 · WPA3 · 6GHz" { class: net_node; shape: circle }
}
NET.CGU -- VLANS.V1
NET.CGU -- VLANS.V20
NET.CGU -- VLANS.V101
NET.CGU -- VLANS.V102
NET.CGU -- VLANS.V69
NET.AP1 -> VLANS.SSID1: { style.stroke-dash: 4 }
NET.AP2 -> VLANS.SSID1: { style.stroke-dash: 4 }
NET.AP2 -> VLANS.SSID2: { style.stroke-dash: 4 }
NET.AP2 -> VLANS.SSID3: { style.stroke-dash: 4 }

# =====================================================================
# Local DNS — three independent Pi-Holes, kept in sync (NOT clustered)
# PI1 = standalone Pi on SW_DN (downstairs)
# PI2 = standalone Pi on SW_UP (upstairs)
# PI3 = pihole3 Docker container declared inside PHOBOS
# =====================================================================
PI1: "Pi-Hole NCC-1702\n10.36.100.2 · Primary\n+ PiVPN/Wireguard :51822" { class: dns_node }
PI2: "Pi-Hole NCC-1703\n10.36.100.3 · Secondary" { class: dns_node }

NET.CGU -> PI1: "DHCP advertises\nPI1 / PI2 / PI3 as DNS"
NET.CGU -> PI2: "DHCP advertises\nPI1 / PI2 / PI3 as DNS"
VPN_Client -> PI1: "Wireguard 51822/UDP via UCG" { style.stroke-dash: 4 }
PI1 -> LAN_Client: "tunnel" { style.stroke-dash: 4 }

# =====================================================================
# TITAN (10.36.100.150) — Traefik host
# =====================================================================
TITAN: "🖥️  TITAN — 10.36.100.150 (12 CPU · 64 GiB · ~43 TB)" {
  class: host_node

  TRAEFIK_BOX: "traefik · 6 entrypoints · 43 routers / 41 services / 10 middlewares" {
    EP_WEB_EXT: "web-ext :81 → redirect → websecure-ext" { class: ep_node }
    EP_WS_EXT: "websecure-ext :444" { class: ep_node }
    EP_WEB_INT: "web-int :80 → redirect → websecure-int" { class: ep_node }
    EP_WS_INT: "websecure-int :443" { class: ep_node }
    EP_MC: "minecraft :25565 (TCP)" { class: ep_node }
    EP_METRICS: "metrics :8088 (Prometheus scrape)" { class: ep_node }
  }

  EXT_SVCS: "External (websecure-ext)" {
    T_PLEX: "plex" { class: svc_node }
    T_SEERR: "seerr (overseerr)" { class: svc_node }
    T_SONARR_CAL: "sonarr-calendar" { class: svc_node }
    T_BLOG_XMS: "blog-xms" { class: svc_node }
    T_BLOG_LENNY: "blog-lenny-sal" { class: svc_node }
    T_BLOG_STAN: "blog-stan-sal" { class: svc_node }
    T_DOCS: "docs (mkdocs proxy)" { class: svc_node }
  }

  INT_SVCS: "Internal (websecure-int)" {
    T_ARRS: "arrs\nSonarr · Radarr · Lidarr" { class: svc_node }
    T_TAUTULLI: "tautulli" { class: svc_node }
    T_NAVIDROME: "navidrome (music)" { class: svc_node }
    T_SAB: "sabnzbd" { class: svc_node }
    T_PODGRAB: "podgrab" { class: svc_node }
    T_HA: "home-assistant" { class: svc_node }
    T_HP: "homepage (dash)" { class: svc_node }
    T_GHOST: "ghost (blog backend)" { class: svc_node }
    T_IT: "it-tools" { class: svc_node }
    T_PMA: "phpmyadmin" { class: svc_node }
    T_TMGR: "traefik-manager" { class: svc_node }
    T_F2B: "fail2ban" { class: svc_node }
    T_WORKOUT: "workout" { class: svc_node }
    T_TF: "tf · terraform" { class: svc_node }
    T_SLZB: "slzb" { class: svc_node }
  }

  T_MC_SVC: "minecraft (game server)" { class: svc_node }
  T_PROM: "prometheus" { class: svc_node }
  T_GRAF: "grafana" { class: svc_node }
  T_KUMA_DASH: "uptime-kuma stack" { class: svc_node }
}

# =====================================================================
# PHOBOS (10.36.100.151)
# PI3 = pihole3 Docker container running here
# =====================================================================
PHOBOS: "🖥️  PHOBOS — 10.36.100.151 (12 CPU · 32 GiB)" {
  class: host_node

  PH_PORT: "portainer (UI :9443) + agent" { class: svc_node }
  PH_CF: "cloudflared (SSH tunnel)" { class: svc_node }
  PH_KUMA: "uptime-kuma :3001" { class: svc_node }
  PH_MK: "mkdocs-material :8585" { class: svc_node }
  PH_MON: "monitoring\nnode-exporter · cAdvisor · dozzle-agent" { class: svc_node }
  PH_MOTION: "motioneye :8765 (CCTV)" { class: svc_node }
  PH_NEB: "nebula-sync\n(one-way config push)" { class: svc_node }
  PH_NGX: "nginx :88" { class: svc_node }
  PH_PHI: "ph-intercept :4653" { class: svc_node }
  PI3: "pihole3 container\nPi-Hole NCC-1704 · Tertiary" { class: dns_node }
}

# =====================================================================
# TETHYS (10.36.100.152)
# =====================================================================
TETHYS: "🖥️  TETHYS — 10.36.100.152 (4 CPU · 16 GiB)" {
  class: host_node

  TE_PORT: "portainer (UI :9443) + agent" { class: svc_node }
  TE_CMK: "checkmk :8000/:80" { class: svc_node }
  TE_MON: "monitoring\nPrometheus · Grafana · unpoller\nnode-exporter · cAdvisor\npihole-exporter · dozzle-agent" { class: svc_node }
}

# DHCP advert for the in-PHOBOS Pi-Hole (PI3)
NET.CGU -> PHOBOS.PI3: "DHCP advertises\nPI1 / PI2 / PI3 as DNS"

# =====================================================================
# Switch -> Hosts
# All three servers hang off the downstairs switch.
# Pi-Holes: PI1 on SW_DN, PI2 on SW_UP.
# =====================================================================
NET.SW_DN -> TITAN
NET.SW_DN -> PHOBOS
NET.SW_DN -> TETHYS
NET.SW_DN -> PI1
NET.SW_UP -> PI2

# =====================================================================
# INGRESS PATHS
# =====================================================================
# External web traffic
NET.CGU -> TITAN.TRAEFIK_BOX.EP_WS_EXT: "WAN 443 → :444" { style: { stroke-width: 4 } }
NET.CGU -> TITAN.TRAEFIK_BOX.EP_WEB_EXT: "WAN 80 → :81" { style: { stroke-width: 4 } }
TITAN.TRAEFIK_BOX.EP_WEB_EXT -> TITAN.TRAEFIK_BOX.EP_WS_EXT: "redirect → HTTPS" { style.stroke-dash: 4 }

# Minecraft
NET.CGU -> TITAN.TRAEFIK_BOX.EP_MC: "WAN 25565" { style: { stroke-width: 4 } }
TITAN.TRAEFIK_BOX.EP_MC -> TITAN.T_MC_SVC

# Internal LAN/VPN access
LAN_Client -> PI1: "DNS lookup"
LAN_Client -> TITAN.TRAEFIK_BOX.EP_WS_INT: "HTTPS :443" { style: { stroke-width: 4 } }
LAN_Client -> TITAN.TRAEFIK_BOX.EP_WEB_INT: "HTTP :80 (redirect)" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WEB_INT -> TITAN.TRAEFIK_BOX.EP_WS_INT: "redirect → HTTPS" { style.stroke-dash: 4 }

# Cloudflare Tunnel (SSH only)
CFT -> PHOBOS.PH_CF: "SSH only" { style.stroke-dash: 4 }
PHOBOS.PH_CF -> TITAN: "ssh" { style.stroke-dash: 4 }
PHOBOS.PH_CF -> PHOBOS: "ssh" { style.stroke-dash: 4 }
PHOBOS.PH_CF -> TETHYS: "ssh" { style.stroke-dash: 4 }

# =====================================================================
# Traefik -> Backend services
# =====================================================================
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_PLEX
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_SEERR
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_SONARR_CAL
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_BLOG_XMS
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_BLOG_LENNY
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_BLOG_STAN
TITAN.TRAEFIK_BOX.EP_WS_EXT -> TITAN.EXT_SVCS.T_DOCS

TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_ARRS
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_TAUTULLI
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_NAVIDROME
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_SAB
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_PODGRAB
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_HA
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_HP
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_GHOST
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_IT
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_PMA
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_TMGR
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_F2B
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_WORKOUT
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_TF
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.INT_SVCS.T_SLZB
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.T_PROM
TITAN.TRAEFIK_BOX.EP_WS_INT -> TITAN.T_GRAF

# Cross-host routes via dynamic files (all websecure-int)
TITAN.TRAEFIK_BOX.EP_WS_INT -> PI1: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> PI2: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> PHOBOS.PI3: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> PHOBOS.PH_MOTION: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> PHOBOS.PH_KUMA: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> PHOBOS.PH_PORT: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> TETHYS.TE_CMK: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> TETHYS.TE_PORT: "dynamic@file" { style.stroke-dash: 4 }
TITAN.TRAEFIK_BOX.EP_WS_INT -> NET.CGU: "dynamic@file" { style.stroke-dash: 4 }

# =====================================================================
# nebula-sync — config push, NOT a cluster
# Each Pi-Hole resolves DNS independently; only blocklists/whitelists/
# regex/groups/etc. are kept in sync.
# =====================================================================
PHOBOS.PH_NEB -> PI1: "config push" { style.stroke-dash: 4 }
PHOBOS.PH_NEB -> PI2: "config push" { style.stroke-dash: 4 }
PHOBOS.PH_NEB -> PHOBOS.PI3: "config push" { style.stroke-dash: 4 }

# =====================================================================
# Cross-host monitoring
# =====================================================================
TITAN.TRAEFIK_BOX.EP_METRICS -> TITAN.T_PROM: "scraped by" { style.stroke-dash: 4 }
TITAN.T_PROM -> PHOBOS.PH_MON: "scrapes" { style.stroke-dash: 4 }
TITAN.T_PROM -> TETHYS.TE_MON: "scrapes" { style.stroke-dash: 4 }
TETHYS.TE_CMK -> TITAN: "agents" { style.stroke-dash: 4 }
TETHYS.TE_CMK -> PHOBOS: "agents" { style.stroke-dash: 4 }
```
