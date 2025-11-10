
![](images/glances.png)

!!!info
    For now, I have retired glances from running as I have found I wasn't really using it - My homepage setup has changed and no longer utilises the data this provides

Glances is a cross-platform monitoring tool.  

I have used the data that Glances obtains and have fed this into my [Homepage](https://docs.xmsystems.co.uk/homepage/) dashboard where it shows animated graphing of some key metrics (CPU, RAM & Network)  

I have it installed on each server that I want to obtain metrics for (currently just TiTAN & Cuthbert)  
Below is the web view for TiTAN.

![](<images/glances webview.png>)

## docker-compose.yml  

=== "TiTAN"

    ``` yaml
    networks:
      default:
        name: proxy
        external: true

    services:

        glances:
            hostname: TiTAN
            container_name: glances
            image: nicolargo/glances:ubuntu-latest-full
            restart: always
            networks:
              default:
                ipv4_address: 172.19.0.200
            pid: host
            volumes:
                - /var/run/docker.sock:/var/run/docker.sock
            environment:
                - "GLANCES_OPT=-w"
            labels:
                - traefik.enable=true
                - traefik.http.routers.tstats.rule=Host(`sudomain.domain.co.uk`)
                - traefik.http.routers.tstats.entrypoints=websecure-int
                - traefik.http.routers.tstats.tls.certresolver=production
                - traefik.http.services.tstats.loadbalancer.server.port=61208
                - traefik.http.routers.tstats.tls.domains[0].main=domain.co.uk
                - traefik.http.routers.tstats.tls.domains[0].sans=*.domain.co.uk
    ```

=== "Cuthbert"

    ``` yaml
    networks:
      default:
        name: cuthbert-network
        external: true

    services:
      glances:
        hostname: cuthbert
        container_name: glances
        image: nicolargo/glances:ubuntu-latest-full
        networks:
          default:
            ipv4_address: "172.22.0.5"
        restart: always
        pid: host
        ports:
          - 61208:61208
          - 61209:61209
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock
        environment:
          - "GLANCES_OPT=-w"
    ```

#### Dynamic File

For Glances running on Cuthbert and NCC-1702, I have a dynamic file setup so its routed through Traefik and with SSL.

### Glances (Cuthbert)

``` yaml
http:
  routers:
    glances:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: glances

  services:
    glances:
      loadBalancer:
        servers:
          - url: "http://10.36.100.199:61208"
        passHostHeader: true
```

