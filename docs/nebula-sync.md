# Nebula-Sync

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
  phobos-network:
    external: true

services:
  nebula-sync:
    image: ghcr.io/lovelaze/nebula-sync:latest
    container_name: nebula-sync
    networks:
      phobos-network:
        ipv4_address: "172.20.0.13"
    restart: unless-stopped
    environment:
      - TZ=Europe/London
      - CLIENT_RETRY_DELAY_SECONDS=20
      - PRIMARY=https://pi-hole1.domain.com|${PRIMARY_PASSWORD}
      - REPLICAS=https://pi-hole2.domain.com|${REPLICA1_PASSWORD},https://pi-hole3.domain.com|${REPLICA2_PASSWORD}
      - FULL_SYNC=false
      - SYNC_CONFIG_DNS=true
      - SYNC_CONFIG_DNS_EXCLUDE=upstreams
      - SYNC_CONFIG_DHCP=true
      - SYNC_CONFIG_NTP=true
      - SYNC_CONFIG_RESOLVER=true
      - SYNC_CONFIG_DATABASE=true
      - SYNC_CONFIG_MISC=true
      - SYNC_CONFIG_DEBUG=true
      - SYNC_GRAVITY_DHCP_LEASES=true
      - SYNC_GRAVITY_GROUP=true
      - SYNC_GRAVITY_AD_LIST=true
      - SYNC_GRAVITY_AD_LIST_BY_GROUP=true
      - SYNC_GRAVITY_DOMAIN_LIST=true
      - SYNC_GRAVITY_DOMAIN_LIST_BY_GROUP=true
      - SYNC_GRAVITY_CLIENT=true
      - SYNC_GRAVITY_CLIENT_BY_GROUP=true
      - RUN_GRAVITY=true
      - CRON=0 * * * *
```

I have also created a ".env" file within the same location/directory as the compose file which contains the passwords for both pi-holes.  This is then called/referenced with the corresponding variable.

`FULL_SYNC` is left `false` and `SYNC_CONFIG_DNS_EXCLUDE=upstreams` so each replica can keep its own upstream DNS server (Unbound running locally on each Pi) rather than blindly copying the primary's upstream config — everything else (DNS config, DHCP, NTP, resolver, database, gravity lists, groups, clients) syncs on the granular per-category flags instead of one blanket switch.
