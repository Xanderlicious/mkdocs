
![](images/glances.png)

Glances is a cross-platform monitoring tool.  

I have used the data that Glances obtains and have fed this into my [Homepage](https://docs.xanderman.co.uk/homepage/) dashboard where it shows animated graphing of some key metrics (CPU, RAM & Network)  

I have it installed on each server that I want to obtain metrics for (currently just TiTAN & Cuthbert)  
Below is the web view for TiTAN.

![](<images/glances webview.png>)

##Compose File Locations

=== "TiTAN"

    ``` bash
    ├─ ssd/
    │  └─ docker-compose/
    │     └─ glances/
    ```

=== "Cuthbert"

    ``` bash
    docker-compose/
    ├── glances
    │   └── docker-compose.yml
    ```

=== "NCC-1702"

    ``` bash
    docker-compose/
    ├── glances
    │   └── docker-compose.yml
    ```

##docker-compose.yml  

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

=== "NCC-1702"

    ``` yaml
    networks:
      default:
        name: pi-network
        external: true

    services:
      glances:
        hostname: ncc-1702
        container_name: glances
        image: nicolargo/glances:ubuntu-latest-full
        networks:
          default:
            ipv4_address: "172.16.0.102"
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

####Dynamic File

For Glances running on Cuthbert and NCC-1702, I have a dynamic file setup so its routed through Traefik and with SSL.  These files are located [here](https://docs.xanderman.co.uk/dynamic/#glances-cuthbert) & [here](https://docs.xanderman.co.uk/dynamic/#glances-ncc-1702)

