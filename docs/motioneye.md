# MotionEye

![motioneye-logo](images/motioneye.png)

Motioneye is a video surveillance program that offers motion detection.

I have this setup in constant record where data is recorded and stored for upto a month

## Migration to motioneye-project fork

The original `ccrisan/motioneye` image had been unmaintained since 2020. In August 2026 I migrated to the actively maintained community fork, [motioneye-project/motioneye](https://github.com/motioneye-project/motioneye), which picked development back up and has since shipped fixes including CVE-2026-46488.

At the same time I:

- Dropped `privileged: true` from the container — both cameras connect over RTSP, not as local devices, so it was never actually needed.
- Moved `/var/lib/motioneye` from an anonymous Docker volume to an explicit bind mount, so all container state lives under `/ssd/docker/appdata/motioneye/`.

The existing camera and motion-detection config carried over cleanly with no changes needed. The only casualty was a stale browser/app session on a phone that had the old live-view page open — the new version's auth scheme is HMAC-based rather than the old signed-username scheme, so any old session just needs a fresh login.

## docker-compose.yml

``` yaml
networks:
  phobos-network:
    external: true

services:
  motioneye:
    image: ghcr.io/motioneye-project/motioneye:0.44.0
    container_name: motioneye
    hostname: XMS-Cameras
    networks:
      phobos-network:
        ipv4_address: "172.20.0.15"
    restart: unless-stopped
    ports:
      - "8765:8765"
      - "8081:8081"
      - "8082:8082"
    environment:
      TZ: Europe/London
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /ssd/docker/appdata/motioneye/shared:/shared
      - /ssd/docker/appdata/motioneye/etc:/etc/motioneye
      - /ssd/docker/appdata/motioneye/var-lib:/var/lib/motioneye
      - /disk1/cctv/recordings/xan-cam/:/recordings
```

### Dynamic File

As this is hosted on a different host to where Traefik is running, a dynamic file is required for it to be routed through Traefik and with SSL.

- [motioneye dynamic file configuration](https://docs.xmsystems.co.uk/dynamic/#motioneye-phobos)

### Cameras

![dahua camera](images/dahua.png)

Connected to MotionEye currently is a Dahua camera which overlooks the front of my house and my cars.

I also have a Reolink wifi camera which is being used internally as kind of a pet and toddler camera.

### Future Plans

I do like Motioneye and have been using it for quite some time.  
My future plans unfortunately don't include Motioneye.  I will be getting more cameras (mainly external) and I plan on using BlueIris.

I have also been looking into Frigate with the use of a Coral TPU for object detection.
