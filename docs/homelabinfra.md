# Homelab Infrastructure

This diagram shows the overall infrastructure of the homelab.

```mermaid
# Homelab Infrastructure

High-level overview of the homelab — network edge, three Docker hosts, and the Traefik-fronted services. Each section below drills into one area.

## 1. High-level overview

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':55,'rankSpacing':80,'curve':'basis','htmlLabels':true}}}%%
flowchart LR
    Internet([🌐 Internet]):::edge
    CGU[XAN-CGU<br/>UCG Ultra · 10.36.100.1]:::net
    SWU[USW Upstairs<br/>.10]:::net
    SWD[USW Downstairs<br/>.11]:::net

    subgraph HOSTS[Docker hosts]
        direction TB
        TITAN[TITAN<br/>10.36.100.150<br/>Traefik · Plex · *arrs]:::host
        PHOBOS[PHOBOS<br/>10.36.100.151<br/>Portainer · Kuma · CF Tunnel]:::host
        TETHYS[TETHYS<br/>10.36.100.152<br/>Prometheus · Grafana · CheckMK]:::host
    end

    DNS[(Pi-Hole HA cluster<br/>NCC-1702/1703/1704)]:::dns

    Internet --> CGU
    CGU --> SWU --> TITAN
    CGU --> SWD --> PHOBOS
    SWD --> TETHYS
    SWU --> DNS
    HOSTS -. "DNS" .-> DNS

    classDef edge fill:#1e3a5f,stroke:#4f9eff,color:#fff
    classDef net  fill:#2a4a3a,stroke:#5fbf7f,color:#fff
    classDef host fill:#3a2a4a,stroke:#a060c0,color:#fff
    classDef dns  fill:#4a2a2a,stroke:#c06060,color:#fff
```

## 2. Network, VLANs & Wi-Fi

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':45,'rankSpacing':60}}}%%
flowchart TB
    CGU[XAN-CGU · UCG Ultra<br/>10.36.100.1]:::net
    SWU[USW Upstairs · .10]:::net
    SWD[USW Downstairs · .11]:::net
    AP1[UAP-AC-LR · .253]:::net
    AP2[U6-Enterprise · .254]:::net

    CGU -- "Port 3 · 3+1 GbE" --> SWU
    CGU -- "Port 2 · 2+1 GbE" --> SWD
    SWU -- "Port 7" --> AP1
    SWD -- "Port 7" --> AP2

    subgraph VLANS[VLANs]
        direction TB
        V1[VLAN 1 · Core<br/>10.36.100.0/24]
        V20[VLAN 20 · Servers<br/>10.36.20.0/28]
        V101[VLAN 101 · Kids<br/>10.36.101.0/24]
        V102[VLAN 102 · Cameras<br/>10.36.102.0/24]
        V69[VLAN 69 · VPN<br/>10.69.69.0/24]
    end

    subgraph SSIDS[SSIDs]
        direction TB
        S1((XanderNET · WPA2/3))
        S2((XanderKids · Kids VLAN))
        S3((XanderNET6 · WPA3 6 GHz))
    end

    CGU --- VLANS
    AP1 -.-> S1
    AP2 -.-> S1 & S2 & S3

    classDef net fill:#2a4a3a,stroke:#5fbf7f,color:#fff
```

## 3. External access & ingress

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':50,'rankSpacing':70}}}%%
flowchart LR
    WAN([🌐 WAN<br/>178.17.242.63]):::edge
    Admin([👤 Remote Admin]):::edge
    VPN([🛰️ Wireguard client]):::edge
    LAN([🏠 LAN client]):::edge

    CGU[UCG Ultra]:::net
    PIVPN[PiVPN<br/>NCC-1702 :51822]:::dns
    CFT[Cloudflare Tunnel<br/>cloudflared on PHOBOS]:::edge

    subgraph TRAEFIK[Traefik on TITAN]
        direction TB
        EXT[websecure-ext :444]:::ep
        INT[websecure-int :443]:::ep
        MC[minecraft :25565]:::ep
    end

    WAN -- "443 → :444" --> EXT
    WAN -- "80 → :81 → 443" --> EXT
    WAN -- "25565" --> MC
    WAN -- "51822/UDP" --> PIVPN
    Admin -- "SSH only" --> CFT --> TRAEFIK

    LAN -- "DNS" --> PIVPN
    LAN -- "HTTPS" --> INT
    VPN -. "via Wireguard" .-> LAN

    classDef edge fill:#1e3a5f,stroke:#4f9eff,color:#fff
    classDef net  fill:#2a4a3a,stroke:#5fbf7f,color:#fff
    classDef dns  fill:#4a2a2a,stroke:#c06060,color:#fff
    classDef ep   fill:#2a3a4a,stroke:#60a0c0,color:#fff
```

## 4. Traefik routing

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':40,'rankSpacing':60}}}%%
flowchart LR
    EXT[websecure-ext :444]:::ep
    INT[websecure-int :443]:::ep

    subgraph EXTSVC[External services]
        direction TB
        E1[plex]
        E2[overseerr]
        E3[sonarr-calendar]
        E4[blog-xms / lenny / stan]
        E5[docs]
    end

    subgraph INTSVC[Internal services on TITAN]
        direction TB
        I1[*arrs · sonarr · radarr · lidarr]
        I2[tautulli · navidrome · sabnzbd · podgrab]
        I3[home-assistant · homepage · ghost]
        I4[it-tools · phpmyadmin · workout · tf]
        I5[traefik-manager · fail2ban · slzb]
        I6[prometheus · grafana]
    end

    subgraph DYN[Cross-host · dynamic@file]
        direction TB
        D1[Pi-Hole NCC-1702/1703/1704]
        D2[motioneye · uptime-kuma]
        D3[portainer TITAN/PHOBOS/TETHYS]
        D4[checkmk · UCG UI]
    end

    EXT --> EXTSVC
    INT --> INTSVC
    INT -. "dynamic@file" .-> DYN

    classDef ep fill:#2a3a4a,stroke:#60a0c0,color:#fff
```

## 5. Hosts & containers

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':40,'rankSpacing':55}}}%%
flowchart TB
    subgraph TITAN[🖥️ TITAN · 10.36.100.150 · 12 CPU / 64 GiB / ~43 TB]
        direction TB
        T_TR[traefik]:::ep
        T_MEDIA[Plex · *arrs · sabnzbd · tautulli · navidrome · podgrab]
        T_WEB[ghost · blogs · docs · homepage · it-tools · phpmyadmin]
        T_AUTO[home-assistant · slzb · workout · tf]
        T_OBS[prometheus · grafana · uptime-kuma stack]
        T_GAME[minecraft]
    end

    subgraph PHOBOS[🖥️ PHOBOS · 10.36.100.151 · 12 CPU / 32 GiB]
        direction TB
        P_MGMT[portainer · cloudflared]
        P_DNS[pihole NCC-1703 · nebula-sync]
        P_OBS[uptime-kuma · node-exporter · cAdvisor · dozzle-agent]
        P_DOCS[mkdocs-material]
        P_CCTV[motioneye]
        P_NET[nginx · ph-intercept]
    end

    subgraph TETHYS[🖥️ TETHYS · 10.36.100.152 · 4 CPU / 16 GiB]
        direction TB
        TE_MGMT[portainer]
        TE_MON[checkmk · prometheus · grafana · unpoller<br/>node-exporter · cAdvisor · pihole-exporter · dozzle-agent]
    end

    P_DNS === PI2[Pi-Hole NCC-1702 on Pi]:::dns
    P_DNS -. "nebula-sync" .-> PI2
    TE_MON -. "scrapes" .-> TITAN & PHOBOS
    TE_MGMT -. "checkmk agents" .-> TITAN & PHOBOS

    classDef ep  fill:#2a3a4a,stroke:#60a0c0,color:#fff
    classDef dns fill:#4a2a2a,stroke:#c06060,color:#fff
```
```
