![Orbital-Sync](images/orbitalsync.jpeg)

orbital-sync is used to keep multiple pi-holes in sync.

I used to use "Gravity Sync" for this but changed to "orbital-sync" for a couple of reasons.  The main reason is that gravity sync has been deprecated and is no longer maintained, It also won't support PiHole V6 when that is eventually released.
Another reason is that this is incredibly easy to setup as its a simple docker container with an easy to configure docker-compose file.

There is an example on the applications github page but my example is shown below.
(I have added "container_name" & "restart" options)

```yaml
services:
  orbital-sync:
    image: mattwebbio/orbital-sync:1
    container_name: orbital-sync
    network_mode: host
    environment:
      PRIMARY_HOST_BASE_URL: 'http://10.36.100.2'
      PRIMARY_HOST_PASSWORD: ''
      SECONDARY_HOSTS_1_BASE_URL: 'http://10.36.100.3'
      SECONDARY_HOSTS_1_PASSWORD: ''
      INTERVAL_MINUTES: 60
    restart: unless-stopped
```
