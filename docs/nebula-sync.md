![Nebula-Sync](images/nebula-sync.png)

*credit to [TechnoTim](https://technotim.live/) for the image*


Nebula-Sync is used to keep multiple pi-holes in sync.

I used to use "Gravity Sync" and "Orbital-Sync"  

Gravity Sync wasn't going to support Pi-Hole V6 so switched to Orbital-Sync
This was incredibly easy to setup as its a simple docker container with an easy to configure docker-compose file.  This did eventually support Pi-Hole V6 but the developer didn't release its final form and announced that he was moving away from this project as there was already "nebula-sync"

I therefore changed to this and it is working very well.

There is an example on the applications github page but my example is shown below.
(I have added the container to the "phobos-network" docker network and assigned it an IP Address.  Specified "restart" option and added my timezone)

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  nebula-sync:
    image: ghcr.io/lovelaze/nebula-sync:latest
    container_name: nebula-sync
    networks:
      default:
        ipv4_address: "172.20.0.13"
    restart: always
    environment:
    - TZ=Europe/London
    - PRIMARY=https://pi-hole1.domain.com|${PRIMARY_PASSWORD}
    - REPLICAS=https://pi-hole2.domain.com|${REPLICA1_PASSWORD},https://pi-hole3.domain.com|${REPLICA2_PASSWORD}
    - FULL_SYNC=true
    - RUN_GRAVITY=true
    - CRON=0 * * * *
```

I have also created a ".env" file within the same location/directory as the compose file which contains the passwords for both pi-holes.  This is then called/referenced with the corresponding variable.
