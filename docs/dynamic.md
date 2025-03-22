
The Dynamic Files for Traefik allow you to configure **Routers**, **Services**, **Middlewares** & **Certificate Options** all while Traefik is running and without the need for any restarts.

It compliments your existing static configuration.

![](<images/traefik dynamic configuration.png>)

I use Dynamic files mainly to route services that run in docker on a different host to where traefik is hosted through traefik and assign valid SSL certificates.

I also have a dynamic "config.yml" file where I can specify middlewares that can then be called/referenced in other dynamic files which are individually created per service/application.

!!! info
    You can create just one dynamic file but I prefer to keep them seperate for ease of maintenance & manageabillity

## config.yml

``` yaml
http:

  middlewares:
    
    pihole1-redirect:
      redirectRegex
        permanent: true
        regex: "^https://pihole1.domain.com/?$"
        replacement: "pihole1.domain.com/admin"

    pihole2-redirect:
      redirectRegex
        permanent: true
        regex: "^https://pihole2.domain.com/?$"
        replacement: "pihole2.domain.com/admin"

    default-headers:
      headers:
        sslProxyHeaders:
          X-Forwarded-Proto: "https"
        referrerPolicy: "same-origin"
        hostsProxyHeaders:
          - "X-Forwarded-Host"
        frameDeny: true
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 2592000
        customFrameOptionsValue: ALLOW-FROM-SAMEDOMAIN
        customResponseHeaders:
          X-Robots-Tag: "none,noarchive,nosnippet,notranslate,noimageindex"
          X-Forwarded-Proto: "https"
          server: ""
        customRequestHeaders:
          X-Forwarded-Proto: https
        PermissionsPolicy: "geolocation=(self), camera=(), microphone=(),"
```

This "default-headers" middleware is applied directly at each entrypoint within the traefik.yml file.  Therefore, they are applied immediately to any and all routes & services and as a result, they are not required to be referenced in any of the below dynamic files for each of my applications

## Application Specific Dynamic Files

### Primary Pi-Hole (NCC-1702)

``` yaml
http:
  routers:
    pihole1:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      middlewares:
        - pihole1-redirect
      tls:
        certResolver: production
      service: pihole1

  services:
    pihole1:
      loadBalancer:
        servers:
          - url: "https://10.36.100.2"
        passHostHeader: true
```  

### Alternate Pi-Hole (NCC-1703)  

``` yaml
http:
  routers:
    pihole2:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      middlewares:
        - pihole2-redirect
      tls:
        certResolver: production
      service: pihole2

  services:
    pihole2:
      loadBalancer:
        servers:
          - url: "https://10.36.100.3"
        passHostHeader: true
```
The Pi-Hole's dynamic config file has a "redirectRegex" middleware to replace the URL specified with one that adds /admin onto the end of the URL which the Pi-Hole web interface requires.  This middleware is referenced in each of the pi-hole's dynamic files and the middleware config itself is outlined within the main config dynamic file along with the headers.


### MotionEye (Phobos)

``` yaml
http:
  routers:
    cctv:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: cctv

  services:
    cctv:
      loadBalancer:
        servers:
          - url: "http://10.36.100.4:8765"
        passHostHeader: true
```

### Uptime-Kuma (Phobos)

``` yaml
http:
  routers:
    kuma:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: kuma

  services:
    kuma:
      loadBalancer:
        servers:
          - url: "http://10.36.100.4:3001"
        passHostHeader: true
```

### Portainer (Phobos)

``` yaml
http:
  routers:
    portainer-phobos:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: portainer-phobos

  services:
    portainer-phobos:
      loadBalancer:
        servers:
          - url: "https://10.36.100.4:9443"
        passHostHeader: true
```

### Unifi (UCG)

``` yaml
http:
  routers:
    unifi:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: unifi

  services:
    unifi:
      loadBalancer:
        servers:
          - url: "https://10.36.100.1:443"
        passHostHeader: true
```
!!!note
    Unifi's Web UI listens on 443 so the URL needs to be HTTPS