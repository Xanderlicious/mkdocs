# Homelab Infrastructure

This page documents the overall infrastructure of the homelab. The single mega-diagram has been split into focused views — each section below drills into one concern.

## 1. High-level overview

The data path from the internet through to the three Docker hosts.

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':55,'rankSpacing':80,'curve':'basis','htmlLabels':true}}}%%
flowchart LR
    Internet([🌐 Internet]):::edge
    CGU[XAN-CGU<br/>UCG Ultra · 10.36.100.1]:::net
    SWU[USW Upstairs · .10]:::net
    SWD[USW Downstairs · .11]:::net

    subgraph HOSTS[Docker hosts]
        direction TB
        TITAN[TITAN<br/>10.36.100.150<br/>Traefik · Plex · arrs]:::host
        PHOBOS[PHOBOS<br/>10.36.100.151<br/>Portainer · Kuma · CF Tunnel]:::host
        TETHYS[TETHYS<br/>10.36.100.152<br/>Prometheus · Grafana · CheckMK]:::host
    end

    DNS[(Pi-Hole HA cluster<br/>NCC-1702 / 1703 / 1704)]:::dns

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

UCG Ultra → Unifi switches → APs, plus the VLAN and SSID layout.

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':45,'rankSpacing':60}}}%%
flowchart TB
    CGU[XAN-CGU · UCG Ultra<br/>10.36.100.1]:::net
    SWU[XAN-USW-UPSTAIRS<br/>USW Lite 16 PoE · .10]:::net
    SWD[XAN-USW-DOWNSTAIRS<br/>USW Lite 16 PoE · .11]:::net
    AP1[UAP-AC-LR · .253]:::net
    AP2[U6-Enterprise · .254]:::net

    CGU -- "Port 3 · 3+1 GbE" --> SWU
    CGU -- "Port 2 · 2+1 GbE" --> SWD
    SWU -- "Port 7" --> AP1
    SWD -- "Port 7" --> AP2

    subgraph VLANS[VLANs · DHCP via UCG]
        direction TB
        V1[VLAN 1 · XAN-Core<br/>10.36.100.0/24]
        V20[VLAN 20 · servers<br/>10.36.20.0/28]
        V101[VLAN 101 · Kids<br/>10.36.101.0/24]
        V102[VLAN 102 · Cameras<br/>10.36.102.0/24]
        V69[VLAN 69 · vpn<br/>10.69.69.0/24]
    end

    subgraph SSIDS[SSIDs]
        direction TB
        S1((XanderNET · WPA2/WPA3))
        S2((XanderKids · Kids VLAN))
        S3((XanderNET6 · WPA3 · 6 GHz))
    end

    CGU --- VLANS
    AP1 -.-> S1
    AP2 -.-> S1
    AP2 -.-> S2
    AP2 -.-> S3

    classDef net fill:#2a4a3a,stroke:#5fbf7f,color:#fff
```

### Port forwards on the UCG

| WAN port | Destination | Purpose |
|---|---|---|
| 80 | 10.36.100.150:81 | Traefik web-ext (HTTP → HTTPS redirect) |
| 443 | 10.36.100.150:444 | Traefik websecure-ext |
| 25565 | 10.36.100.150:25565 | Minecraft |
| 51822 | 10.36.100.2:51822 | PiVPN / Wireguard |

## 3. External access & ingress

How traffic gets in: WAN port forwards, Cloudflare Zero Trust tunnel for SSH, and Wireguard for remote LAN access.

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':50,'rankSpacing':70,'curve':'basis'}}}%%
flowchart LR
    WAN([🌐 WAN<br/>178.17.242.63]):::edge
    Admin([👤 Remote Admin]):::edge
    VPN([🛰️ Wireguard client]):::edge
    LAN([🏠 LAN client]):::edge

    CGU[UCG Ultra]:::net
    PIVPN[PiVPN<br/>NCC-1702 :51822]:::dns
    CFT[Cloudflare Tunnel<br/>cloudflared on PHOBOS<br/>SSH only]:::edge

    subgraph TRAEFIK[Traefik on TITAN]
        direction TB
        EXT[websecure-ext :444]:::ep
        WEXT[web-ext :81<br/>redirect → HTTPS]:::ep
        INT[websecure-int :443]:::ep
        MC[minecraft :25565]:::ep
    end

    WAN -- "443 → :444" --> EXT
    WAN -- "80 → :81" --> WEXT
    WEXT -. "redirect" .-> EXT
    WAN -- "25565" --> MC
    WAN -- "51822/UDP" --> PIVPN

    Admin -- "SSH only" --> CFT
    CFT -. "ssh" .-> TITAN([TITAN]):::host
    CFT -. "ssh" .-> PHOBOS([PHOBOS]):::host
    CFT -. "ssh" .-> TETHYS([TETHYS]):::host

    LAN -- "DNS" --> PIVPN
    LAN -- "HTTPS" --> INT
    VPN -. "via Wireguard" .-> LAN

    classDef edge fill:#1e3a5f,stroke:#4f9eff,color:#fff
    classDef net  fill:#2a4a3a,stroke:#5fbf7f,color:#fff
    classDef dns  fill:#4a2a2a,stroke:#c06060,color:#fff
    classDef ep   fill:#2a3a4a,stroke:#60a0c0,color:#fff
    classDef host fill:#3a2a4a,stroke:#a060c0,color:#fff
```

## 4. Traefik routing

Entry points and the services they front. Cross-host routes go via dynamic@file on websecure-int.

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':40,'rankSpacing':60}}}%%
flowchart LR
    EXT[websecure-ext :444]:::ep
    INT[websecure-int :443]:::ep
    METRICS[metrics :8088<br/>Prometheus scrape]:::ep

    subgraph EXTSVC[External · websecure-ext]
        direction TB
        E1[plex]
        E2[overseerr / seerr]
        E3[sonarr-calendar]
        E4[blog-xms · blog-lenny-sal · blog-stan-sal]
        E5[docs · mkdocs proxy]
    end

    subgraph INTSVC[Internal on TITAN · websecure-int]
        direction TB
        I1[arrs · sonarr · radarr · lidarr]
        I2[tautulli · navidrome · sabnzbd · podgrab]
        I3[home-assistant · homepage · ghost]
        I4[it-tools · phpmyadmin · workout · tf]
        I5[traefik-manager · fail2ban · slzb]
        I6[prometheus · grafana · uptime-kuma stack]
    end

    subgraph DYN[Cross-host · dynamic@file]
        direction TB
        D1[Pi-Hole NCC-1702 / 1703 / 1704]
        D2[motioneye · uptime-kuma on PHOBOS]
        D3[portainer on TITAN / PHOBOS / TETHYS]
        D4[checkmk on TETHYS · UCG UI]
    end

    EXT --> EXTSVC
    INT --> INTSVC
    INT -. "dynamic@file" .-> DYN

    classDef ep fill:#2a3a4a,stroke:#60a0c0,color:#fff
```

## 5. Hosts & containers

What runs where. Service groups are collapsed by purpose to keep things readable.

```mermaid
%%{init: {'theme':'dark','flowchart':{'nodeSpacing':40,'rankSpacing':55}}}%%
flowchart TB
    subgraph TITAN[🖥️ TITAN · 10.36.100.150 · 12 CPU / 64 GiB / ~43 TB]
        direction TB
        T_TR[traefik · 6 entrypoints]:::ep
        T_MEDIA[Plex · arrs · sabnzbd · tautulli<br/>navidrome · podgrab]
        T_WEB[ghost · blogs · docs<br/>homepage · it-tools · phpmyadmin]
        T_AUTO[home-assistant · slzb · workout · tf]
        T_OBS[prometheus · grafana · uptime-kuma stack]
        T_GAME[minecraft]
    end

    subgraph PHOBOS[🖥️ PHOBOS · 10.36.100.151 · 12 CPU / 32 GiB]
        direction TB
        P_MGMT[portainer · cloudflared]
        P_DNS[pihole NCC-1703 · nebula-sync]:::dns
        P_OBS[uptime-kuma · node-exporter<br/>cAdvisor · dozzle-agent]
        P_DOCS[mkdocs-material]
        P_CCTV[motioneye]
        P_NET[nginx · ph-intercept]
    end

    subgraph TETHYS[🖥️ TETHYS · 10.36.100.152 · 4 CPU / 16 GiB]
        direction TB
        TE_MGMT[portainer]
        TE_MON[checkmk · prometheus · grafana · unpoller<br/>node-exporter · cAdvisor<br/>pihole-exporter · dozzle-agent]
    end

    PI1[Pi-Hole NCC-1702<br/>10.36.100.2 · primary<br/>+ PiVPN/Wireguard]:::dns
    PI3[Pi-Hole NCC-1704<br/>10.36.100.151 · tertiary]:::dns

    P_DNS -. "nebula-sync" .-> PI1
    P_DNS -. "nebula-sync" .-> PI3
    TE_MON -. "scrapes" .-> TITAN
    TE_MON -. "scrapes" .-> PHOBOS
    TE_MGMT -. "checkmk agents" .-> TITAN
    TE_MGMT -. "checkmk agents" .-> PHOBOS

    classDef ep  fill:#2a3a4a,stroke:#60a0c0,color:#fff
    classDef dns fill:#4a2a2a,stroke:#c06060,color:#fff
```