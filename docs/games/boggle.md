# Boggle

A self-hosted multiplayer word game. Players join a shared room from their own devices and race to find as many words as possible on a randomised letter grid before time runs out. Supports both 4×4 and 5×5 board sizes.

**URL:** [boggle.xmsystems.co.uk](https://boggle.xmsystems.co.uk)

---

## How to Play

1. Open [boggle.xmsystems.co.uk/play](https://boggle.xmsystems.co.uk/play) on each player's device and join or create a room.
2. When the host starts the round, a randomised letter grid is revealed.
3. Find as many words as you can before time runs out by connecting adjacent letters (horizontally, vertically, or diagonally) — you cannot reuse the same tile in a single word.
4. Words must be at least 3 letters long. Submit each word as you find it.
5. At the end of the round, any word found by more than one player is cancelled — only **unique** words score.
6. Longer words score more points. The player with the highest score wins.

---

## Pages

| URL | Purpose |
| --- | ------- |
| `/` | Main entry point |
| `/play` | Join/create a room and play — open on each player's device |

The how-to-play guide is also accessible via [games.xmsystems.co.uk/boggle](https://games.xmsystems.co.uk/boggle).

---

## nginx Config

```nginx
server {
    listen 80;
    server_name boggle.xmsystems.co.uk;

    location / {
        proxy_pass http://10.36.100.151:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

All traffic (including WebSocket upgrades) is proxied directly to the `boggle` container at `10.36.100.151:3003`.

---

## Backend

**Docker Compose:** `/ssd/docker/docker-compose/boggle/docker-compose.yml`

```yaml
networks:
  phobos-network:
    external: true

services:
  boggle:
    image: node:22-alpine
    container_name: boggle
    working_dir: /app
    command: node server.js
    volumes:
      - /ssd/docker/appdata/boggle:/app
    environment:
      - PORT=3002
      - NODE_ENV=production
    networks:
      phobos-network:
        ipv4_address: 172.20.0.205
    ports:
      - "3003:3002"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3002/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

The container runs the appdata directory directly as a volume using the stock `node:22-alpine` image — no custom build step needed. To apply code changes, restart the container:

```bash
cd /ssd/docker/docker-compose/boggle
docker compose up -d --force-recreate
```

**Dependencies:** Express + ws (WebSockets)

---

## File Locations

| File | Path |
| ---- | ---- |
| Main entry page | `/ssd/docker/appdata/boggle/public/index.html` |
| Player game page | `/ssd/docker/appdata/boggle/public/play.html` |
| Node.js server | `/ssd/docker/appdata/boggle/server.js` |
| Word list | `/ssd/docker/appdata/boggle/server/words.txt` |
| Hub info page | `/ssd/docker/appdata/nginx/boggle.html` |
| Hub tile image | `/ssd/docker/appdata/nginx/boggle.jpg` |
| Docker Compose | `/ssd/docker/docker-compose/boggle/docker-compose.yml` |
