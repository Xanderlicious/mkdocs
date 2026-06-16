# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

XMS Docs — a [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) site documenting a homelab (hardware, networking, self-hosted services). Published at <https://docs.xmsystems.co.uk>.

## Local development

Live preview with hot-reload (browse to <http://localhost:8000>):

```bash
docker run --rm -it -p 8000:8000 -v "${PWD}:/docs" squidfunk/mkdocs-material
```

Static build into `./site`:

```bash
docker run --rm -it -v "${PWD}:/docs" squidfunk/mkdocs-material build
```

No pip install or Python environment needed — the Docker image includes MkDocs, the Material theme, and all pymdownx extensions.

## Architecture

- **`mkdocs.yml`** — single source of truth for site config: nav tree, theme settings, markdown extensions, analytics.
- **`docs/`** — all Markdown pages. Every page must be registered in the `nav:` section of `mkdocs.yml` to appear in navigation.
- **`docs/images/`** — images referenced by pages.

### Nav structure

The site has six top-level sections: Network, Servers & Devices, Docker, Applications, Monitoring/Alerting/Logging, Archive. When adding a new page: create the `.md` file in `docs/`, then add it to the correct section in `mkdocs.yml` under `nav:`.

### Markdown features available

The pymdownx suite is loaded: `admonition`, `details`, `superfences`, `tabbed` (alternate style), `highlight` (with line numbers), `caret`/`mark`/`tilde`, `inlinehilite`, `snippets`, `emoji`, `attr_list`, `md_in_html`. Use these freely — no extra config needed.
