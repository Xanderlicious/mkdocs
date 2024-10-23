
![](images/kuma.png)

Uptime-Kuma is a monitoring tool for HTTP(s) / TCP / HTTP(s) Keyword / HTTP(s) Json Query / Ping / DNS Record / Push / Steam Game Server / Docker Containers

It is able to display a "Status" webpage which tell you if your services are up or down.
It also provides the abillity to provide notifications via Telegram, Discord, Gotify, Slack, Pushover, Email (SMTP), and many, many more.

![](<images/kuma screenshot.png>)

## docker-compose file location

```sh
├─ ~/
│  └─ docker-compose/
│     └─ kuma/
```

## appdata 

``` sh
├─ ~/appdata
│  └─ Kuma/
└──── docker-compose.yml
```

## docker-compose.yml

``` yaml
networks:
  default:
    name: cuthbert-network
    external: true

services:

    uptime-kuma:
        image: louislam/uptime-kuma:1
        container_name: uptime-kuma
        networks:
          default:
            ipv4_address: "172.22.0.8"
        ports:
            - 3001:3001
        environment:
            - TZ=Europe/London
        restart: always
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock:ro
            - /home/xander/appdata/Kuma:/app/data
```

###Dynamic File

Uptime-Kuma is running on a different host to where Traefik is running so I have a dynamic file setup to ensure its routed through Traefik and with SSL.  

This file is located [here](https://docs.xmsystems.co.uk/dynamic/#uptime-kuma-cuthbert)

