![](images/checkmk.png)

In my honest opinion, one of the best, if not THE best here is CheckMK.  This is quite an advanced monitoring tool with many features but it needs to be implemented properly and ideally have dedicated hardware.

CheckMK will allow me to not only monitor the health and status of many different aspects of each of my devices (servers and desktops) but will also allow me to monitor the health and status of my router and access points via SNMP.

![Sample Screenshot](<images/checkmk dash.png>)

Above is a sample screenshot taken from somewhere on the internet

I currently run CheckMK in a docker container as the .deb package to install directly isn't avaialble for Debian 13 just yet

### docker-compose.yml

```yaml
networks:
  default:
    name: tethys-network
    external: true

services:
  check-mk-raw:
    stdin_open: true
    tty: true
    environment:
      - CMK_PASSWORD=${CMK_PASSWORD}
      - TZ=Europe/London
      - CMK_SITE_ID=cmkxms
    networks:
      default:
        ipv4_address: "172.21.0.4"
    ports:
      - 80:5000
      - 8000:8000
    tmpfs:
      - /opt/omd/sites/cmk/tmp:uid=1000,gid=1000
    volumes:
      - checkmk:/omd/sites
      - /etc/localtime:/etc/localtime:ro
    container_name: checkmk
    restart: always
    image: checkmk/check-mk-raw:2.4.0p14

volumes:
  checkmk:
```

To allow a connection to its dashboard via my domain (and using SSL) I have created a dynamic file for traefik [here](https://docs.xmsystems.co.uk/dynamic/#checkmk-tethys)