# Homelab Infrastructure

This diagram shows the overall infrastructure of the homelab.

```mermaid
flowchart TB
    %% =======================
    %% External / Edge
    %% =======================
    Internet([🌐 Internet<br/>WAN: 178.17.242.63])
    Admin([👤 Remote Admin / SSH])
    CFT["Cloudflare Zero Trust Tunnel<br/>cloudflared on PHOBOS<br/>SSH access only"]
    LAN_Client([🏠 LAN / VPN client])
    VPN_Client([🛰️ Remote VPN client])

    Admin --> CFT

    %% =======================
    %% Network Infrastructure
    %% =======================
    subgraph NET[" 🛡️ Network Infrastructure "]
        direction TB
        CGU["XAN-CGU · UCG Ultra · 10.36.100.1<br/><br/>Port Forwards:<br/>WAN 80 → 10.36.100.150:81 (web-ext)<br/>WAN 443 → 10.36.100.150:444 (websecure-ext)<br/>WAN 25565 → 10.36.100.150:25565 (Minecraft)<br/>WAN 51822 → 10.36.100.2:51822 (PiVPN/Wireguard)"]
        SW_UP["XAN-USW-UPSTAIRS · USW Lite 16 PoE · .10"]
        SW_DN["XAN-USW-DOWNSTAIRS · USW Lite 16 PoE · .11"]
        AP1["UAP-AC-LR · .253"]
        AP2["U6-Enterprise · .254"]

        CGU -- "Port 3 · 3+1 GbE" --> SW_UP
        CGU -- "Port 2 · 2+1 GbE" --> SW_DN
        SW_UP -- "Port 7" --> AP1
        SW_DN -- "Port 7" --> AP2
    end
    Internet --> CGU

    %% =======================
    %% VLANs / SSIDs
    %% =======================
    subgraph VLANS[" 🔀 VLANs (DHCP via UCG) & SSIDs "]
        direction TB
        V1["VLAN 1 · XAN-Core · 10.36.100.0/24"]
        V20["VLAN 20 · servers · 10.36.20.0/28"]
        V101["VLAN 101 · Kids · 10.36.101.0/24"]
        V102["VLAN 102 · Cameras · 10.36.102.0/24"]
        V69["VLAN 69 · vpn · 10.69.69.0/24"]
        SSID1((XanderNET · WPA2/WPA3))
        SSID2((XanderKids · WPA2 · Kids VLAN))
        SSID3((XanderNET6 · WPA3 · 6GHz))
    end
    CGU --- V1 & V20 & V101 & V102 & V69
    AP1 -.-> SSID1
    AP2 -.-> SSID1 & SSID2 & SSID3

    %% =======================
    %% Local DNS  (Pi-Hole NCC-1702 also hosts PiVPN)
    %% =======================
    subgraph DNS[" 🧱 Local DNS / Ad-blocking (3-node Pi-Hole HA, synced via nebula-sync) "]
        direction LR
        PI1["Pi-Hole NCC-1702<br/>10.36.100.2 · Primary<br/>+ PiVPN/Wireguard :51822"]
        PI2["Pi-Hole NCC-1703<br/>10.36.100.3 (on PHOBOS)"]
        PI3["Pi-Hole NCC-1704<br/>10.36.100.151 (Tertiary)"]
    end
    CGU -- "DHCP DNS" --> DNS
    VPN_Client -. "Wireguard 51822/UDP via UCG" .-> PI1
    PI1 -. "tunnel" .-> LAN_Client

    %% =======================
    %% TITAN  (10.36.100.150) — Traefik host
    %% =======================
    subgraph TITAN[" 🖥️ TITAN — 10.36.100.150 (12 CPU · 64 GiB · ~43 TB) "]
        direction TB

        subgraph TRAEFIK_BOX["traefik · 6 entrypoints · 43 routers / 41 services / 10 middlewares"]
            direction TB
            EP_WEB_EXT["web-ext :81 → redirect → websecure-ext"]
            EP_WS_EXT["websecure-ext :444"]
            EP_WEB_INT["web-int :80 → redirect → websecure-int"]
            EP_WS_INT["websecure-int :443"]
            EP_MC["minecraft :25565 (TCP)"]
            EP_METRICS["metrics :8088 (Prometheus scrape)"]
        end

        %% External-exposed services (websecure-ext)
        subgraph EXT_SVCS["External (websecure-ext)"]
            T_PLEX[plex]
            T_SEERR["seerr (overseerr)"]
            T_SONARR_CAL["sonarr-calendar"]
            T_BLOG_XMS["blog-xms"]
            T_BLOG_LENNY["blog-lenny-sal"]
            T_BLOG_STAN["blog-stan-sal"]
            T_DOCS[docs (mkdocs proxy)]
        end

        %% Internal-only services (websecure-int)
        subgraph INT_SVCS["Internal (websecure-int)"]
            T_ARRS["arrs<br/>Sonarr · Radarr · Lidarr"]
            T_TAUTULLI[tautulli]
            T_NAVIDROME[navidrome (music)]
            T_SAB[sabnzbd]
            T_PODGRAB[podgrab]
            T_HA[home-assistant]
            T_HP[homepage (dash)]
            T_GHOST[ghost (blog backend)]
            T_IT[it-tools]
            T_PMA[phpmyadmin]
            T_TMGR[traefik-manager]
            T_F2B[fail2ban]
            T_WORKOUT[workout]
            T_TF[tf · terraform]
            T_SLZB[slzb]
        end

        %% Minecraft passthrough
        T_MC_SVC["minecraft (game server)"]

        %% On-host but routed via dynamic file (websecure-int)
        T_PROM[prometheus]
        T_GRAF[grafana]
        T_KUMA_DASH[uptime-kuma stack]
    end

    %% =======================
    %% PHOBOS  (10.36.100.151)
    %% =======================
    subgraph PHOBOS[" 🖥️ PHOBOS — 10.36.100.151 (12 CPU · 32 GiB) "]
        direction TB
        PH_PORT["portainer (UI :9443) + agent"]
        PH_CF["cloudflared (SSH tunnel)"]
        PH_KUMA["uptime-kuma :3001"]
        PH_MK["mkdocs-material :8585"]
        PH_MON["monitoring<br/>node-exporter · cAdvisor · dozzle-agent"]
        PH_MOTION["motioneye :8765 (CCTV)"]
        PH_NEB["nebula-sync (Pi-Hole sync)"]
        PH_NGX["nginx :88"]
        PH_PHI["ph-intercept :4653"]
        PH_PI3["pihole NCC-1703"]
    end

    %% =======================
    %% TETHYS  (10.36.100.152)
    %% =======================
    subgraph TETHYS[" 🖥️ TETHYS — 10.36.100.152 (4 CPU · 16 GiB) "]
        direction TB
        TE_PORT["portainer (UI :9443) + agent"]
        TE_CMK["checkmk :8000/:80"]
        TE_MON["monitoring<br/>Prometheus · Grafana · unpoller<br/>node-exporter · cAdvisor<br/>pihole-exporter · dozzle-agent"]
    end

    %% =======================
    %% Switch -> Hosts
    %% =======================
    SW_UP --> TITAN
    SW_DN --> PHOBOS
    SW_DN --> TETHYS
    SW_UP --> PI1

    %% =======================
    %% INGRESS PATHS
    %% =======================
    %% External web traffic
    CGU == "WAN 443 → :444" ==> EP_WS_EXT
    CGU == "WAN 80 → :81" ==> EP_WEB_EXT
    EP_WEB_EXT -. "redirect → HTTPS" .-> EP_WS_EXT

    %% Minecraft
    CGU == "WAN 25565" ==> EP_MC
    EP_MC --> T_MC_SVC

    %% Internal LAN/VPN access (DNS via Pi-Holes -> Traefik)
    LAN_Client -- "DNS lookup" --> DNS
    LAN_Client == "HTTPS :443" ==> EP_WS_INT
    LAN_Client -. "HTTP :80 (redirect)" .-> EP_WEB_INT
    EP_WEB_INT -. "redirect → HTTPS" .-> EP_WS_INT

    %% Cloudflare Tunnel (SSH only)
    CFT -. "SSH only" .-> PH_CF
    PH_CF -. "ssh" .-> TITAN & PHOBOS & TETHYS

    %% =======================
    %% Traefik -> Backend services
    %% =======================
    EP_WS_EXT --> T_PLEX & T_SEERR & T_SONARR_CAL & T_BLOG_XMS & T_BLOG_LENNY & T_BLOG_STAN & T_DOCS
    EP_WS_INT --> T_ARRS & T_TAUTULLI & T_NAVIDROME & T_SAB & T_PODGRAB & T_HA & T_HP & T_GHOST & T_IT & T_PMA & T_TMGR & T_F2B & T_WORKOUT & T_TF & T_SLZB & T_PROM & T_GRAF

    %% Cross-host routes via dynamic files (all websecure-int)
    EP_WS_INT -. "dynamic@file" .-> PI1
    EP_WS_INT -. "dynamic@file" .-> PH_PI3
    EP_WS_INT -. "dynamic@file" .-> PI3
    EP_WS_INT -. "dynamic@file" .-> PH_MOTION
    EP_WS_INT -. "dynamic@file" .-> PH_KUMA
    EP_WS_INT -. "dynamic@file" .-> PH_PORT
    EP_WS_INT -. "dynamic@file" .-> TE_CMK
    EP_WS_INT -. "dynamic@file" .-> TE_PORT
    EP_WS_INT -. "dynamic@file" .-> CGU

    %% =======================
    %% Pi-Hole sync + cross-host monitoring
    %% =======================
    PH_PI3 === PI2
    PH_NEB -. syncs .-> PI1 & PI2 & PI3
    EP_METRICS -. "scraped by" .-> T_PROM
    T_PROM -. "scrapes" .-> PH_MON & TE_MON
    TE_CMK -. "agents" .-> TITAN & PHOBOS

    %% =======================
    %% Styling
    %% =======================
    classDef edge fill:#1e3a5f,stroke:#4f9eff,color:#fff
    classDef net  fill:#2a4a3a,stroke:#5fbf7f,color:#fff
    classDef host fill:#3a2a4a,stroke:#a060c0,color:#fff
    classDef svc  fill:#4a3a2a,stroke:#c08040,color:#fff
    classDef dns  fill:#4a2a2a,stroke:#c06060,color:#fff
    classDef ep   fill:#2a3a4a,stroke:#60a0c0,color:#fff

    class Internet,CFT,Admin,LAN_Client,VPN_Client edge
    class CGU,SW_UP,SW_DN,AP1,AP2 net
    class TITAN,PHOBOS,TETHYS host
    class EP_WEB_EXT,EP_WS_EXT,EP_WEB_INT,EP_WS_INT,EP_MC,EP_METRICS ep
    class T_PLEX,T_SEERR,T_SONARR_CAL,T_BLOG_XMS,T_BLOG_LENNY,T_BLOG_STAN,T_DOCS,T_ARRS,T_TAUTULLI,T_NAVIDROME,T_SAB,T_PODGRAB,T_HA,T_HP,T_GHOST,T_IT,T_PMA,T_TMGR,T_F2B,T_WORKOUT,T_TF,T_SLZB,T_PROM,T_GRAF,T_KUMA_DASH,T_MC_SVC,PH_PORT,PH_CF,PH_KUMA,PH_MK,PH_MON,PH_MOTION,PH_NEB,PH_NGX,PH_PHI,PH_PI3,TE_PORT,TE_CMK,TE_MON svc
    class PI1,PI2,PI3 dns
```