# Who Wants to Be a Millionaire

A digital recreation of the classic TV game show. One contestant answers 15 questions of increasing difficulty worth up to £1,000,000. The host controls all game flow from a separate panel, while the audience can vote on answers from their phones.

**URL:** [millionaire.xmsystems.co.uk](https://millionaire.xmsystems.co.uk)

---

## How to Play

1. One **contestant** sits in the hot seat and answers 15 questions, worth up to **£1,000,000**.
2. Each question has four options — **A, B, C, D**. Only one is correct.
3. The contestant tells the host their answer; the host selects it on the Host Panel.
4. **Safe havens** at £1,000 (Q5) and £32,000 (Q10) — getting a question wrong below these amounts wins nothing; above them the contestant keeps the floor amount.
5. The contestant can **walk away** at any time and keep the prize they've already won.
6. Three **lifelines**, each usable once:
    - **50:50** — removes two wrong answers, leaving one correct and one wrong
    - **Phone a Friend** — 30-second timer for the contestant to consult someone
    - **Ask the Audience** — audience members vote on their phones at `/vote`; results shown as a live bar chart

---

## Pages

| URL | File | Purpose |
| --- | ---- | ------- |
| `/` | `millionaire.html` | Game display — contestant and audience screen |
| `/host` | `millionaire-host.html` | Host panel — controls all game flow |
| `/vote` | `millionaire-vote.html` | Audience voting — one per phone during Ask the Audience |

### Game Display (`/`)

The main player-facing screen shown on the TV or shared display. Shows the current question, answer options with visual states (selected → revealing → correct/wrong), the money ladder, and active lifeline results (audience chart, phone timer). Updates in real time from the host panel.

### Host Panel (`/host`)

The host drives the entire game from this panel:

- Load questions, select the contestant's chosen answer
- Trigger lifelines — 50:50 removes answers on both the host and display; Ask the Audience opens voting and displays the chart when closed
- Mark answers correct or wrong
- Walk away / continue decisions
- Reset for a new game

### Audience Vote (`/vote`)

Players open this on their phones during the **Ask the Audience** lifeline. Shows the current question and four answer buttons. Each person votes once; the host closes voting from the Host Panel which then reveals the results on the game display.

---

## nginx Config

```nginx
server {
    listen 80;
    server_name millionaire.xmsystems.co.uk;

    location = / {
        root  /usr/share/nginx/html;
        try_files /millionaire.html =404;
    }

    location = /host {
        root  /usr/share/nginx/html;
        try_files /millionaire-host.html =404;
    }

    location = /vote {
        root  /usr/share/nginx/html;
        try_files /millionaire-vote.html =404;
    }

    location / {
        root  /usr/share/nginx/html;
        try_files $uri /millionaire.html;
    }

    location /mm-ws/ {
        proxy_pass http://millionaire-server:3011/;
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

WebSocket connections from all three pages connect via `/mm-ws/` and are proxied to the `millionaire-server` container.

---

## Backend

**Docker Compose:** `/ssd/docker/docker-compose/millionaire/docker-compose.yml`

```yaml
networks:
  phobos-network:
    external: true

services:
  millionaire-server:
    build: /ssd/docker/appdata/millionaire/
    container_name: millionaire-server
    restart: unless-stopped
    networks:
      phobos-network:
        ipv4_address: 172.20.0.23
```

**Dockerfile:** `/ssd/docker/appdata/millionaire/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .
EXPOSE 3011
CMD ["node", "server.js"]
```

**Dependencies:** Express + Socket.IO

### Rebuilding

```bash
cd /ssd/docker/docker-compose/millionaire
docker compose build
docker compose up -d --force-recreate
```

---

## File Locations

| File | Path |
| ---- | ---- |
| Game display | `/ssd/docker/appdata/nginx/millionaire.html` |
| Host panel | `/ssd/docker/appdata/nginx/millionaire-host.html` |
| Audience vote | `/ssd/docker/appdata/nginx/millionaire-vote.html` |
| Hub info page | `/ssd/docker/appdata/nginx/game-info-millionaire.html` |
| nginx config | `/ssd/docker/appdata/nginx/default.conf` |
| Node.js server | `/ssd/docker/appdata/millionaire/server.js` |
| Dockerfile | `/ssd/docker/appdata/millionaire/Dockerfile` |
| Docker Compose | `/ssd/docker/docker-compose/millionaire/docker-compose.yml` |
