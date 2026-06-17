# Cards Against Humanity

![Cards Against Humanity logo](../images/cah-logo.png){ width="200" }

A self-hosted, multi-device party card game. Players join a room from their phones; one rotating Card Czar picks the winning answer each round. Uses the official deck (71 packs, 4,655 white cards and 1,037 black cards) bundled under CC BY-NC-SA 2.0 — this is a non-commercial private build.

**URL:** [cah.xmsystems.co.uk](https://cah.xmsystems.co.uk)

!!! warning
    This game contains adult humour and offensive content. Suitable for players 18+.

---

## How to Play

1. One player creates a **room** and shares the 4-letter room code with everyone else.
2. All players join via the room code on their phones — minimum 3 players to start.
3. The host configures packs, hand size, and the points target in the lobby, then deals.
4. One player is the **Card Czar** each round. The Czar plays a **black card** — either a question or fill-in-the-blank.
5. All other players secretly choose the **funniest white card(s)** from their hand to answer it.
6. The Czar reads all answers aloud anonymously and picks their favourite. The winner scores an **Awesome Point**.
7. Everyone draws back up to a full hand. The **Czar role passes left** each round.
8. First player to reach the configured points target wins.

!!! note
    `Pick 2` and `Pick 3` black cards are fully supported — players submit multiple white cards in order.

---

## Pages

Cards Against Humanity handles host and player views **within the same single-page application** — there are no separate `/host` or `/player` URLs. All interaction happens on the main game page, with the interface adapting based on whether you are the current Card Czar or a regular player.

| URL | Purpose |
| --- | ------- |
| `/` | Full game — lobby, gameplay, and results all in one |

Players join from their own phones using the same URL and the 4-letter room code. The game experience on each device adapts to the player's current role.

---

## Architecture

Cards Against Humanity has a more structured layout than the other games, with the frontend and backend separated into their own directories:

```
/ssd/docker/appdata/cah/
    server/
        server.js       Express app — static files, /healthz, /api/packs, WebSocket layer (/ws)
        game.js         Room class — full game state machine
        deck.js         Loads deck, builds shuffled draw piles from selected packs
    public/
        index.html      Single-page client
        styles.css
        app.js
    data/
        official-deck.json   71 official packs
    Dockerfile
    package.json
```

Unlike the other games which proxy WebSockets via nginx, CAH is accessed **directly via Traefik** on Titan — nginx is not involved in routing for this game.

---

## nginx Config

There is **no nginx server block** for Cards Against Humanity. Traefik on Titan routes `cah.xmsystems.co.uk` directly to the `cah` container at `172.20.0.25:3010` (mapped from internal port 3000).

---

## Backend

**Docker Compose:** `/ssd/docker/docker-compose/cah/docker-compose.yml`

```yaml
networks:
  phobos-network:
    external: true

services:
  cah:
    build: /ssd/docker/appdata/cah
    image: cah:local
    container_name: cah
    restart: unless-stopped
    environment:
      - PORT=3000
    ports:
      - "3010:3000"
    networks:
      phobos-network:
        ipv4_address: "172.20.0.25"
```

**Dockerfile:** `/ssd/docker/appdata/cah/Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-fund --no-audit

COPY server ./server
COPY public ./public
COPY data ./data

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=4s --start-period=8s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "server/server.js"]
```

### Rebuilding

```bash
cd /ssd/docker/docker-compose/cah
docker compose build
docker compose up -d --force-recreate
```

---

## Game Settings

| Setting | Range | Default |
| ------- | ----- | ------- |
| Points to win | 1–20 | 8 |
| Hand size | 5–14 | 10 |
| Packs | Any of 71 official packs | Base Set |

Room codes use an unambiguous alphabet (no 0/O/1/I) and rooms are reaped after 30 minutes idle.

---

## File Locations

| File | Path |
| ---- | ---- |
| Hub info page | `/ssd/docker/appdata/nginx/game-info-cah.html` |
| Node.js server | `/ssd/docker/appdata/cah/server/server.js` |
| Game state machine | `/ssd/docker/appdata/cah/server/game.js` |
| Deck loader | `/ssd/docker/appdata/cah/server/deck.js` |
| Client frontend | `/ssd/docker/appdata/cah/public/` |
| Card data | `/ssd/docker/appdata/cah/data/official-deck.json` |
| Dockerfile | `/ssd/docker/appdata/cah/Dockerfile` |
| Docker Compose | `/ssd/docker/docker-compose/cah/docker-compose.yml` |
| Traefik config | `cah.yml` on Titan |
