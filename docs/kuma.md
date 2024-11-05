
![](images/kuma.png)

Uptime-Kuma is a monitoring tool for HTTP(s) / TCP / HTTP(s) Keyword / HTTP(s) Json Query / Ping / DNS Record / Push / Steam Game Server / Docker Containers

It is able to display a "Status" webpage which tell you if your services are up or down.
It also provides the abillity to provide notifications via Telegram, Discord, Gotify, Slack, Pushover, Email (SMTP), and many, many more.

I have created 2 status pages - One to report on the status of all my docker containers and another to report on the status of the internal or external site.  There may be occassions where the docker container is reflected as "up" but the site is "down"

![](<images/kuma screenshot.png>)

If a site or a container (or both) are down, there is a warning notice displayed at the top of the page.  You can also (if externally facing) write and place your own messages to indicate an incident or warning notification.

The sites status page also displays details about when the SSL/TLS certificate expires.  Traefik and Lets Encrypt will automatically take care of renewing these automatically but should this fail for whatever reason, this can alert you to that fact.

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

