# Trivial Pursuit

A digital Trivial Pursuit board game for 2–6 players. Players move tokens around a circular board, answer category questions, and collect wedges. The host manages game flow from a separate panel; players can follow along or interact from their own phones.

**URL:** [trivial.xmsystems.co.uk](https://trivial.xmsystems.co.uk)

---

## How to Play

1. 2–6 players join and enter their names via the **Player View** on their phones. The host starts the game from the **Host Panel**.
2. Players take turns rolling the dice — the category you land on determines the question colour.
3. The host reads the question; answer **correctly** to stay and roll again, answer **wrong** and your turn ends.
4. Land on a **HQ square** (the wider arc tiles at each category hub) and answer correctly to earn a **wedge** for that category. Collect all 6!
5. Landing on a **★ Roll Again** square gives you another roll without a question.
6. Once you have all 6 wedges, navigate to the **hub** in the centre. Opponents pick a category; answer that final question correctly to **win**.

### Categories

| Colour | Category |
| ------ | -------- |
| 🔵 Blue | Geography |
| 🟡 Yellow | History |
| 🟠 Orange | Sports & Leisure |
| 🟢 Green | Science & Nature |
| 🩷 Pink | Entertainment |
| 🟤 Brown | Art & Literature |

---

## Pages

| URL | File | Purpose |
| --- | ---- | ------- |
| `/` | `trivial.html` | Game board — the main SVG board display |
| `/host` | `trivial-host.html` | Host panel — roll dice, read questions, advance turns |
| `/player` | `trivial-player.html` | Player view — join game, see turn info, move token |

### Game Board (`/`)

A fully rendered SVG board shown on the main screen or TV. Displays all player tokens with their wedge progress, animates valid move squares, and updates in real time as the game progresses.

### Host Panel (`/host`)

The host manages game flow:

- Add players and start the game
- Roll the dice for the current player
- Select which square the player moves to (valid moves animate on the board)
- Mark questions correct or incorrect
- Progress through turns automatically

### Player View (`/player`)

Players open this on their phones. Used to join the game by entering a name, and to see whose turn it is, the dice roll, and the current category. On their own turn, players can tap their valid move destination directly from their phone.

---

## nginx Config

```nginx
server {
    listen 80;
    server_name trivial.xmsystems.co.uk;

    location = / {
        root  /usr/share/nginx/html;
        try_files /trivial.html =404;
    }

    location = /host {
        root  /usr/share/nginx/html;
        try_files /trivial-host.html =404;
    }

    location = /player {
        root  /usr/share/nginx/html;
        try_files /trivial-player.html =404;
    }

    location / {
        root  /usr/share/nginx/html;
        try_files $uri /trivial.html;
    }

    location /tp-ws/ {
        proxy_pass http://trivial-server:3012/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

WebSocket connections connect via `/tp-ws/` and are proxied to the `trivial-server` container.

---

## Backend

**Docker Compose:** `/ssd/docker/docker-compose/trivial/docker-compose.yml`

```yaml
networks:
  phobos-network:
    external: true

services:
  trivial-server:
    build: /ssd/docker/appdata/trivial/
    container_name: trivial-server
    restart: unless-stopped
    networks:
      phobos-network:
        ipv4_address: 172.20.0.24
```

**Dockerfile:** `/ssd/docker/appdata/trivial/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .
EXPOSE 3012
CMD ["node", "server.js"]
```

**Dependencies:** Express + Socket.IO

### Rebuilding

```bash
cd /ssd/docker/docker-compose/trivial
docker compose build
docker compose up -d --force-recreate
```

---

## File Locations

| File | Path |
| ---- | ---- |
| Game board | `/ssd/docker/appdata/nginx/trivial.html` |
| Host panel | `/ssd/docker/appdata/nginx/trivial-host.html` |
| Player view | `/ssd/docker/appdata/nginx/trivial-player.html` |
| Hub info page | `/ssd/docker/appdata/nginx/game-info-trivial.html` |
| nginx config | `/ssd/docker/appdata/nginx/default.conf` |
| Node.js server | `/ssd/docker/appdata/trivial/server.js` |
| Dockerfile | `/ssd/docker/appdata/trivial/Dockerfile` |
| Docker Compose | `/ssd/docker/docker-compose/trivial/docker-compose.yml` |
