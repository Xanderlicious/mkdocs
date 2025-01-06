![Orbital-Sync](images/._orbitalsync.jpeg)

orbital-sync is used to keep multiple pi-holes in sync.

I used to use "Gravity Sync" for this but changed to "orbital-sync" for a couple of reasons.  The main reason is that gravity sync has been deprecated and is no longer maintained, It also won't support PiHole V6 when that is eventually released.
Another reason is that this is incredibly easy to setup as its a simple docker container with an easy to configure docker-compose file.

The example from the github page is shown below (I have added "container_name" & "restart" options)

```yaml
services:
  orbital-sync:
    image: mattwebbio/orbital-sync:1
    container_name: orbital-sync
    environment:
      PRIMARY_HOST_BASE_URL: 'https://pihole1.example.com'
      PRIMARY_HOST_PASSWORD: 'your_password1'
      SECONDARY_HOSTS_1_BASE_URL: 'https://pihole2.example.com'
      SECONDARY_HOSTS_1_PASSWORD: 'your_password2'
      SECONDARY_HOSTS_2_BASE_URL: 'http://192.168.1.3'
      SECONDARY_HOSTS_2_PASSWORD: 'your_password3'
      SECONDARY_HOSTS_3_BASE_URL: 'http://server:8080'
      SECONDARY_HOSTS_3_PASSWORD: 'your_password4'
      SECONDARY_HOSTS_3_PATH: '/apps/pi-hole'
      INTERVAL_MINUTES: 60
    restart: unless-stopped
```
