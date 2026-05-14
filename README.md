# XMSystems Documentation Site

This repository contains the source for the **XMSystems** documentation sites, built with [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme, and deployed via **Docker**.

The published sites are referenced from within the documentation itself and are available at:

- 📘 **Main docs:** <https://docs.xmsystems.co.uk>
- 🖥️ **Infrastructure:** <https://infrastructure.xmsystems.co.uk>

The documentation walks through the Xanderlicious homelab — the hardware and devices used, how they fit together, and the `docker-compose` definitions that run the various applications hosted in the lab.

## What's in this repo

| Path | Purpose |
| --- | --- |
| `mkdocs.yml` | MkDocs site configuration — navigation, theme, plugins, markdown extensions. |
| `docs/` | All Markdown pages that make up the documentation site. |
| `docs/assets/` | Custom CSS used by the site. |
| `docs/images/` | Images, logos and screenshots referenced throughout the docs. |

### Content areas

The site is organised into the following top-level sections (see `mkdocs.yml` for the full nav tree):

- **Network** — Unifi Cloud Gateway Ultra, USW-Lite-16-PoE switch, Access Points.
- **Servers & Devices** — Titan, Phobos, Tethys, NCC-1702, NCC-1703, Docker host info.
- **Applications** — Traefik, Portainer, Plex, Navidrome, Overseerr, Tautulli, the *Arrs, SABnzbd, Homepage, Home Assistant, Motioneye, Ghost, phpMyAdmin, Pi-hole (NCC-1704), Nebula-Sync, PH-Intercept.
- **Monitoring, Alerting & Logging** — Grafana / Prometheus, CheckMK, Uptime-Kuma, Dozzle.
- **Archive** — Retired devices and applications kept for reference (USG, Duplicati, Glances, Vaultwarden, Cuthbert).

## Theme & features

The site uses the Material theme with the following highlights (configured in `mkdocs.yml`):

- `slate` colour scheme with a purple primary / green accent palette.
- Roboto typography.
- Instant navigation, prefetching, navigation tracking and path display.
- Search suggestions and highlighting.
- Code block copy, annotations and selection.
- Linked content tabs.
- Cookie consent banner.

### Markdown extensions enabled

`attr_list`, `md_in_html`, `admonition`, `pymdownx.details`, `pymdownx.caret`, `pymdownx.mark`, `pymdownx.tilde`, `pymdownx.inlinehilite`, `pymdownx.snippets`, `pymdownx.tabbed`, `pymdownx.highlight`, and `pymdownx.superfences`.

## Running locally with Docker

The site is built and served using the official [`squidfunk/mkdocs-material`](https://hub.docker.com/r/squidfunk/mkdocs-material) image, which ships with MkDocs, the Material theme and all of the `pymdown-extensions` referenced in `mkdocs.yml`.

### Live preview (with auto-reload)

From the root of the repo:

```bash
docker run --rm -it \
  -p 8000:8000 \
  -v "${PWD}:/docs" \
  squidfunk/mkdocs-material
```

Then browse to <http://localhost:8000>. Edits to files under `docs/` will hot-reload in your browser.

### Building a static site

To generate the static site into `./site`:

```bash
docker run --rm -it \
  -v "${PWD}:/docs" \
  squidfunk/mkdocs-material build
```

### docker-compose (optional)

A minimal `docker-compose.yml` for local development:

```yaml
services:
  docs:
    image: squidfunk/mkdocs-material
    container_name: xms-docs
    ports:
      - "8000:8000"
    volumes:
      - ./:/docs
    restart: unless-stopped
```

Then:

```bash
docker compose up -d
```

## Deployment

Both <https://docs.xmsystems.co.uk> and <https://infrastructure.xmsystems.co.uk> are served from Docker containers running in the homelab, fronted by Traefik (see the **Traefik** pages in the documentation for entry-point and dynamic-file configuration).

## Contributing / making changes

1. Create a branch for your change.
2. Edit or add Markdown files under `docs/`.
3. If you've added a new page, register it in the `nav:` section of `mkdocs.yml`.
4. Bring the container up with `docker compose up` (or the `docker run` command above) and verify the page renders correctly.
5. Open a pull request against `main`.

## Related sites

These domains are referenced from the documentation and are part of the same homelab estate:

- <https://docs.xmsystems.co.uk> — this MkDocs site.
- <https://infrastructure.xmsystems.co.uk> — infrastructure overview / diagrams.

## License

No license is currently specified. All content © Xanderlicious unless stated otherwise.
