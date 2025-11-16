
The Dynamic Files for Traefik allow you to configure **Routers**, **Services**, **Middlewares** & **Certificate Options** all while Traefik is running and without the need for any restarts.

It compliments your existing static configuration.

![](<images/traefik dynamic configuration.png>)

I use Dynamic files mainly to route services that run on different hosts (different to the host where traefik is installed) through traefik and assign valid SSL certificates.

I also have a dynamic "config.yml" file where I can specify middlewares that can then be called/referenced in other dynamic files which are individually created per service/application.

!!! info
    You can create just one dynamic file but I prefer to keep them seperate for ease of maintenance & manageabillity

### config.yml

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

    pihole3-redirect:
      redirectRegex
        permanent: true
        regex: "^https://pihole3.domain.com/?$"
        replacement: "pihole3.domain.com/admin"

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

TLS options are also specified in its own dynamic file.

### tls.yml

```yaml
tls:
  options:
    default:
      minVersion: VersionTLS12
      cipherSuites:
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
      curvePreferences:
        - CurveP521
        - CurveP384
      sniStrict: true
```

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

### 2nd Alternate Pi-Hole (NCC-1704)  

``` yaml
http:
  routers:
    pihole3:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      middlewares:
        - pihole3-redirect
      tls:
        certResolver: production
      service: pihole3

  services:
    pihole3:
      loadBalancer:
        servers:
          - url: "https://10.36.100.151"
        passHostHeader: true
```

The Pi-Hole's dynamic config file has a "redirectRegex" middleware to replace the URL specified with one that adds /admin onto the end of the URL which the Pi-Hole web interface requires.  This middleware is referenced in each of the pi-hole's dynamic files and the middleware config itself is outlined within the main config dynamic file along with the headers.

### Dozzle (Titan)

```yaml
http:
  routers:
    dozzle:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: dozzle

  services:
    dozzle:
      loadBalancer:
        servers:
          - url: "http://10.36.100.150:8585"
        passHostHeader: true
```

### Prometheus (Titan)

```yaml
http:
  routers:
    prom:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: prom

  services:
    prom:
      loadBalancer:
        servers:
          - url: "http://10.36.100.150:9090"
        passHostHeader: true
```
### Grafana (Titan)

```yaml
http:
  routers:
    graphs:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: graphs

  services:
    graphs:
      loadBalancer:
        servers:
          - url: "http://10.36.100.150:3000"
        passHostHeader: true
```

### phpMyAdmin (Titan)

```yaml
http:
  routers:
    phpmyadmin:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: phpmyadmin

  services:
    phpmyadmin:
      loadBalancer:
        servers:
          - url: "http://10.36.100.150:84"
        passHostHeader: true
```

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
          - url: "http://10.36.100.151:8765"
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
          - url: "http://10.36.100.151:3001"
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
          - url: "https://10.36.100.151:9443"
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

### CheckMK (Tethys)

```yaml
http:
  routers:
    cmk:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: cmk

  services:
    cmk:
      loadBalancer:
        servers:
          - url: "http://10.36.100.152:80"
        passHostHeader: true
```

### Portainer (Tethys)

``` yaml
http:
  routers:
    portainer-tethys:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: portainer-tethys

  services:
    portainer-tethys:
      loadBalancer:
        servers:
          - url: "https://10.36.100.152:9443"
        passHostHeader: true
```