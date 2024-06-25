
![](images/traefik.png)

Traefik is the beating heart of my homelab.  Every connection comes into traefik which then routes the traffic to the application being requested/served

I have a domain with Cloudflare and have created subdomains for all of my services.  
It also uses Lets Encrypt and provides a valid SSL certificate  

![alt text](<images/cloudflare + letsencrypt.png>)

With Traefik, I also have the abillity to specify multiple entry points (2 internal and 2 external)  This allows me to keep my internal services internal and only have my external services showing to the world.  
The section [Traefik Entry Points](https://docs.xanderman.co.uk/entrypoints/) will explain more about these.


directory location:

```
/ssd/appdata/traefik/
├── data
│   ├── acme.json
│   └── traefik.yml
├── docker-compose.yml
└── dynamic
    ├── app-cctv.yml
    ├── app-cuthbert-dupe.yml
    ├── app-docs.yml
    ├── app-glances.yml
    ├── app-graphs.yml
    ├── app-kuma.yml
    ├── app-ncc-1702-dupe.yml
    ├── app-piglances.yml
    ├── app-pihole1.yml
    ├── app-pihole2.yml
    ├── app-portainer-cuthbert.yml
    ├── app-portainer-ncc-1702.yml
    ├── app-prom.yml
    ├── app-ubuntu.yml
    ├── app-vaultwarden.yml
    ├── app-xbvr.yml
    └── config.yml

2 directories, 21 files
```

##docker-compose.yml

Below is the Docker Compose file (you will notice this also includes [Portainer](https://docs.xanderman.co.uk/portainer/))

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

  traefik:
    image: traefik:3.0.1
    container_name: traefik
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.2"
    ports:
      - 443:443
      - 444:444
    environment:
      - CF_API_EMAIL=<e-mail address>
      - CF_DNS_API_TOKEN=<cloudflare DNS API token>
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /ssd/appdata/traefik/data/traefik.yml:/traefik.yml:ro
      - /ssd/appdata/traefik/data/acme.json:/acme.json
      - /ssd/appdata/traefik/dynamic:/ssd/appdata/traefik/dynamic
      - traefik-logs:/var/log/traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.traefik_https.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.traefik_https.entrypoints=websecure-int
      - traefik.http.routers.traefik_https.tls=true
      - traefik.http.routers.traefik_https.tls.certresolver=production
      - traefik.http.routers.traefik.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.traefik.tls.domains[0].sans=*.domain.co.uk
      - traefik.http.routers.traefik_https.service=api@internal

  portainer:
    image: portainer/portainer-ee:2.19.5
    container_name: portainer
    networks:
      default:
        ipv4_address: "172.19.0.3"
    command: -H unix:///var/run/docker.sock
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    labels:
      - traefik.enable=true
      - traefik.http.services.portainer.loadbalancer.server.port=9000
      - traefik.http.routers.portainer.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.portainer.entrypoints=websecure-int
      - traefik.http.routers.portainer.tls=true
      - traefik.http.routers.portainer.tls.certresolver=production
      - traefik.http.routers.portainer.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.portainer.tls.domains[0].sans=*.domain.co.uk

volumes:
  portainer_data:
  traefik-logs:
```

##traefik.yml

The traefik.yml file lives inside the "data" directory and is used to: 

enable/disable the dashboard, define entry points, assign middleware at a global level (rather than at an application level), specify your certificate resolver details, detail your docker provider and the docker socket address aswell as dynamic files/directory location.  Finally you can also optionally provide the location of log files.


``` yaml
global:
  checkNewVersion: true
  sendAnonymousUsage: false

# --- Enable API and Dashboard ---
api:
  dashboard: true
  debug: true

# --- EntryPoints ---
entryPoints:
  websecure-int:
    address: :443
    http:
      middlewares:
        - default-headers@file

  websecure-ext:
    address: :444
    http:
      middlewares:
        - default-headers@file

# -- CertificateResolver ---
certificatesResolvers:
  production:
    acme:
      email: <e-mail address>
      storage: acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "1.0.0.1:53"

# -- Disable TLS Cert verification check (Optional) ---
serversTransport:
  insecureSkipVerify: true

# --- specify providers here (docker socket & dynamic files directory location) ---
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    directory: /ssd/appdata/traefik/dynamic/
    watch: true

# --- logs ---
log:
  level: "INFO"
  filePath: "/var/log/traefik/traefik.log"
accessLog:
  filePath: "/var/log/traefik/access.log"
```

##Dynamic Files Directory

Dynamic files can be very useful for services that are running on other hosts and are/aren't running in docker

As its "dynamic" you can make changes to these files and they will instantly take effect without needing to restart traefik

The section [Traefik Dynamic Files](https://docs.xanderman.co.uk/dynamic/) goes into more detail about these files and shows examples.
