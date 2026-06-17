# XMS Games

XMS Games is a self-hosted party game platform running on Phobos, accessible at [games.xmsystems.co.uk](https://games.xmsystems.co.uk). It provides a collection of multiplayer games designed to be played in-person on a shared screen, with players joining from their own phones.

---

## The Games Hub

**URL:** [games.xmsystems.co.uk](https://games.xmsystems.co.uk)  
**File:** `/ssd/docker/appdata/nginx/games.html`

The hub is a static HTML page served by nginx. It displays a tile grid — one tile per game — styled as an arcade game select screen. Clicking a tile opens a game info subpage with instructions and launch links rather than jumping straight into the game.

### Game Info Subpages

Each game (except the Poker Clock) has a dedicated info page on the hub domain:

| Path | Game | File |
| ---- | ---- | ---- |
| `/blockbusters` | Blockbusters | `game-info-blockbusters.html` |
| `/millionaire` | Who Wants to Be a Millionaire | `game-info-millionaire.html` |
| `/trivial` | Trivial Pursuit | `game-info-trivial.html` |
| `/cah` | Cards Against Humanity | `game-info-cah.html` |

Each info page shows how to play the game and provides launch buttons for the game display, host panel, and player views where applicable. The Poker Clock tile links directly to the game since it needs no instructions.

### nginx Server Block

```nginx
server {
    listen 80;
    server_name games.xmsystems.co.uk;

    location = /blockbusters {
        root /usr/share/nginx/html;
        try_files /game-info-blockbusters.html =404;
    }

    location = /millionaire {
        root /usr/share/nginx/html;
        try_files /game-info-millionaire.html =404;
    }

    location = /trivial {
        root /usr/share/nginx/html;
        try_files /game-info-trivial.html =404;
    }

    location = /cah {
        root /usr/share/nginx/html;
        try_files /game-info-cah.html =404;
    }

    location / {
        root  /usr/share/nginx/html;
        index games.html;
        try_files $uri /games.html;
    }
}
```

---

## Architecture

All games follow the same general pattern:

```
Browser / Phone
    └── Traefik (Titan)
            └── nginx (Phobos :88)
                    ├── Static HTML frontend
                    └── WebSocket proxy → Game backend container (Phobos)
```

The **frontend** for each game is a single self-contained HTML file with all CSS and JavaScript inline — no build step, no framework. Real-time game state is synchronised across all connected devices via **Socket.IO WebSockets**.

The **backend** for each game is a lightweight Node.js server (Express + Socket.IO) built from a local Dockerfile and run as a Docker container on Phobos. All game state is held in memory — a container restart resets the game.

| Container | IP | Game |
| --------- | -- | ---- |
| `blockbusters-server` | `172.20.0.22` | Blockbusters |
| `millionaire-server` | `172.20.0.23` | Who Wants to Be a Millionaire |
| `trivial-server` | `172.20.0.24` | Trivial Pursuit |
| `cah` | `172.20.0.25` | Cards Against Humanity |
| `poker-server` | `172.20.0.21` | Poker Clock |

All containers sit on `phobos-network`. nginx proxies WebSocket traffic from each game subdomain through to the appropriate backend container.

!!! note
    All game state is held **in memory only**. Restarting a backend container resets the current game.

---

## Games Summary

| Game | URL | Host Panel | Player/Audience |
| ---- | --- | ---------- | --------------- |
| [Blockbusters](blockbusters.md) | [blockbusters.xmsystems.co.uk](https://blockbusters.xmsystems.co.uk) | `/host` | `/player` (buzzer) |
| [Who Wants to Be a Millionaire](millionaire.md) | [millionaire.xmsystems.co.uk](https://millionaire.xmsystems.co.uk) | `/host` | `/vote` (audience voting) |
| [Trivial Pursuit](trivial.md) | [trivial.xmsystems.co.uk](https://trivial.xmsystems.co.uk) | `/host` | `/player` |
| [Cards Against Humanity](cah.md) | [cah.xmsystems.co.uk](https://cah.xmsystems.co.uk) | In-game | In-game |
| [Poker Clock](poker.md) | [poker.xmsystems.co.uk](https://poker.xmsystems.co.uk) | — | — |
