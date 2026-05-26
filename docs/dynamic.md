# Traefik - Dynamic Files

The Dynamic Files for Traefik allow you to configure **Routers**, **Services**, **Middlewares** & **Certificate Options** all while Traefik is running and without the need for any restarts.

It compliments your existing static configuration.

![traefik-dynamic-files-image](<images/traefik dynamic configuration.png>)

I use Dynamic files mainly to route services that run on different hosts (different to the host where traefik is installed) through traefik and assign valid SSL certificates.

I also have a dynamic "config.yml" file where I can specify middlewares that can then be called/referenced in other dynamic files which are individually created per service/application.

!!! info
    You can create just one dynamic file but I prefer to keep them separate for ease of maintenance & manageability

## config.yml

``` yaml
http:

  middlewares:

    global-default-headers:
      headers:
        sslProxyHeaders:
          X-Forwarded-Proto: "https"
        hostsProxyHeaders:
          - "X-Forwarded-Host"
        referrerPolicy: "same-origin"
        frameDeny: true                 # X-Frame-Options: DENY (stricter than SAMEORIGIN)
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        permissionsPolicy: "geolocation=(self), camera=(), microphone=()"
        customRequestHeaders:
          X-Forwarded-Proto: "https"
        customResponseHeaders:
          X-Robots-Tag: "none,noarchive,nosnippet,notranslate,noimageindex"
          X-XSS-Protection: "0"
          server: ""

    pihole1-redirect:
      redirectRegex:
        permanent: true
        regex: "^https://ncc-1702.xanderman.co.uk/?$"
        replacement: "https://ncc-1702.xanderman.co.uk/admin"

    pihole2-redirect:
      redirectRegex:
        permanent: true
        regex: "^https://ncc-1703.xanderman.co.uk/?$"
        replacement: "https://ncc-1703.xanderman.co.uk/admin"

    pihole3-redirect:
      redirectRegex:
        permanent: true
        regex: "^https://ncc-1704.xanderman.co.uk/?$"
        replacement: "https://ncc-1704.xanderman.co.uk/admin"

    plex-headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"
        sslProxyHeaders:
          X-Forwarded-Proto: "https"

    xms-csp-headers:
      headers:
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          font-src 'self' https://fonts.gstatic.com;
          img-src 'self' data: https://img.buymeacoffee.com;
          connect-src 'self';
          frame-src https://infrastructure.xmsystems.co.uk;
          frame-ancestors 'none';
          base-uri 'self';
          form-action 'self' https://www.buymeacoffee.com;
          upgrade-insecure-requests;

    xms-infrastructure-csp-headers:
      headers:
        customResponseHeaders:
          X-Frame-Options: ""
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self';
          frame-ancestors https://docs.xmsystems.co.uk;
          base-uri 'self';
          form-action 'none';
          upgrade-insecure-requests;

    xms-poker-csp-headers:
      headers:
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self' wss://poker.xmsystems.co.uk ws://172.20.0.12:3003;
          media-src 'self';
          frame-ancestors 'none';
          base-uri 'self';
          form-action 'none';
          upgrade-insecure-requests;

    xms-ipam-csp-headers:
      headers:
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self';
          frame-ancestors 'none';
          base-uri 'self';
          form-action 'none';
          upgrade-insecure-requests;

    xms-blog-csp-headers:
      headers:
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https://images.unsplash.com;
          font-src 'self';
          connect-src 'self';
          frame-src 'self';
          frame-ancestors 'none';
          base-uri 'self';
          form-action 'self';
          upgrade-insecure-requests;

    stan-csp-headers:
      headers:
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data:;
          font-src 'self';
          connect-src 'self';
          frame-src 'self';
          frame-ancestors 'none';
          base-uri 'self';
          form-action 'self';
          upgrade-insecure-requests;

    calendar-redirect:
      redirectScheme:
        scheme: https
        permanent: true
```

!!!info
    This "global-default-headers" middleware is applied directly at each entrypoint within the traefik.yml file.  Therefore, they are applied immediately to any and all routes & services and as a result, they are not required to be referenced in any of the below dynamic files for each of my applications

TLS options are also specified in its own dynamic file.

## tls.yml

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
          - url: "http://10.36.100.2:80"
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
          - url: "http://10.36.100.3:80"
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
          - url: "http://10.36.100.151:80"
        passHostHeader: true
```

The Pi-Hole's dynamic config file has a "redirectRegex" middleware to replace the URL specified with one that adds /admin onto the end of the URL which the Pi-Hole web interface requires.  This middleware is referenced in each of the pi-hole's dynamic files and the middleware config itself is outlined within the main config dynamic file along with the headers.

Also, to allow traefik to handle the secure connection and not have pi-hole re-direct from 80 to 443, I have amended the following lines in the `pihole.toml` file located in `/etc/pihole` on each Pi:

``` toml linenums="898"
[webserver]
  # On which domain is the web interface served?
  #
  # Allowed values are:
  #     A valid domain
  domain = "subdomain.domain.co.uk" ### CHANGED, default = "pi.hole"
```

``` toml linenums="964"
#     A comma-separated list of <[ip_address:]port>
  port = "80" ### CHANGED, default = "80o,443os,[::]:80o,[::]:443os"
```

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

### Prometheus (Tethys)

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
          - url: "http://10.36.100.152:9090"
        passHostHeader: true
```

### Grafana (Tethys)

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
          - url: "http://10.36.100.152:3000"
        passHostHeader: true
```

### phpMyAdmin (Titan)

```yaml
http:
  routers:
    phpmyadmin-titan:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: phpmyadmin-titan

  services:
    phpmyadmin-titan:
      loadBalancer:
        servers:
          - url: "http://172.19.0.105:80"
        passHostHeader: true
```

### phpMyAdmin (Phobos)

``` yaml
http:
  routers:
    phpmyadmin-phobos:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: phpmyadmin-phobos

  services:
    phpmyadmin-phobos:
      loadBalancer:
        servers:
          - url: "http://10.36.100.151:81"
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

### PH-Intercept (Phobos)

``` yaml
http:
  routers:
    ph-intercept:
      entryPoints:
        - websecure-int
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: ph-intercept

  services:
    ph-intercept:
      loadBalancer:
        servers:
          - url: "http://10.36.100.151:4653"
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

### XMS-Blog (Titan)

```yaml
http:
  routers:
    blog-xms:
      entryPoints:
        - websecure-ext
      rule: "Host(`blog.xmsystems.co.uk`)"
      middlewares:
        xms-blog-csp-headers
      tls:
        certResolver: production
      service: blog-xms

  services:
    blog-xms:
      loadBalancer:
        servers:
          - url: "http://ghost-xms:2368"
        passHostHeader: true
```

### Stans Photography (Titan)

```yaml
http:
  routers:
    blog-stan-sal:
      entryPoints:
        - websecure-ext
      rule: "Host(`cars.stansphotography.co.uk`)"
      middlewares:
        stan-csp-headers
      tls:
        certResolver: production
      service: blog-stan-sal

  services:
    blog-stan-sal:
      loadBalancer:
        servers:
          - url: "http://ghost-stan-sal:2368"
        passHostHeader: true
```
