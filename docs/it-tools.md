# IT Tools

A self-hosted collection of browser-based utilities for developers and IT professionals. IT Tools consolidates over 80 commonly needed tools into a single, clean web interface — eliminating the need to hunt down and bookmark individual online utilities.

**Host:** Titan

---

## Why Self-Host?

The official public instance at [it-tools.tech](https://it-tools.tech) is freely available, but self-hosting makes sense here for a few reasons:

- **Privacy** — some tools handle sensitive values (tokens, private keys, passwords, encryption keys). Running locally means that data never leaves the network.
- **Always available** — no dependency on an external site's uptime.
- **Speed** — serving from Phobos over LAN is noticeably faster than hitting an external server.
- **Offline access** — works even without internet connectivity.

---

## What's Included

Tools are organised into 10 categories. A full-text search bar and per-category sidebar make finding the right tool quick. Frequently used tools can be favourited and will appear pinned at the top of the list.

### Crypto (11 tools)

Token Generator, Hash Text, Bcrypt, UUID Generator, ULID Generator, Encryption/Decryption, BIP39 Passphrase Generator, HMAC Generator, RSA Key Pair Generator, Password Strength Analyser, PDF Signature Checker.

### Converter (20 tools)

Date-Time Converter, Integer Base Converter, Roman Numeral Converter, Base64 String Encoder/Decoder, Base64 File Encoder/Decoder, Color Converter, Case Converter, Text to NATO Alphabet, Text to Binary, Text to Unicode, YAML ↔ JSON ↔ TOML conversions, List Converter, XML ↔ JSON, Markdown to HTML.

### Web (16 tools)

URL Encoder/Decoder, HTML Entities, URL Parser, Device Information, Basic Auth Generator, Meta Tag Generator, OTP Code Generator, MIME Types reference, JWT Parser, Keycode Info, Slugify String, HTML WYSIWYG Editor, User Agent Parser, HTTP Status Codes reference, JSON Diff, Safelink Decoder.

### Development (14 tools)

Git Memo, Random Port Generator, Crontab Generator, JSON Viewer/Minifier/to CSV, SQL Prettify, Chmod Calculator, **Docker Run → Docker Compose Converter**, XML Formatter, YAML Viewer, Email Normaliser, Regex Tester, Regex Memo.

!!! tip
    The Docker Run → Compose converter is particularly useful — paste any `docker run` command and get a clean `compose.yml` back instantly.

### Network (6 tools)

IPv4 Subnet Calculator, IPv4 Address Converter, IPv4 Range Expander, MAC Address Lookup, MAC Address Generator, IPv6 ULA Generator.

### Images & Videos (4 tools)

QR Code Generator, WiFi QR Code Generator, SVG Placeholder Generator, Camera Recorder.

### Math (3 tools)

Math Evaluator, ETA Calculator, Percentage Calculator.

### Measurement (3 tools)

Chronometer, Temperature Converter, Benchmark Builder.

### Text (7 tools)

Lorem Ipsum Generator, Text Statistics, Emoji Picker, String Obfuscator, Text Diff, Numeronym Generator, ASCII Text Drawer.

### Data (2 tools)

Phone Parser and Formatter, IBAN Validator and Parser.

---

## Technical Notes

IT Tools is entirely client-side — there is no backend, no database, and no data transmitted anywhere. All processing happens in the browser. User preferences (favourites, settings) are stored in the browser's local storage.

The Docker image is approximately 20 MB and requires no volumes or environment variables for standard use.

---

## docker-compose.yml

```yaml
networks:
  proxy:
    external: true

services:
  it-tools:
    image: corentinth/it-tools:latest
    container_name: it-tools
    restart: unless-stopped
    networks:
      proxy:
        ipv4_address: "172.19.0.4"
    labels:
      - traefik.enable=true
      - traefik.http.services.it-tools.loadbalancer.server.port=80
      - traefik.http.routers.it-tools.entrypoints=websecure-int
      - traefik.http.routers.it-tools.rule=Host(`subdomain.domain.co.uk`)
      - traefik.http.routers.it-tools.tls=true
      - traefik.http.routers.it-tools.tls.certresolver=production
      - traefik.http.routers.it-tools.tls.domains[0].main=domain.co.uk
      - traefik.http.routers.it-tools.tls.domains[0].sans=*.domain.co.uk
```

The container joins the external `proxy` network on Titan, with a static IP of `172.19.0.4`. Traefik handles TLS termination and routing via the `websecure-int` entrypoint — no port mapping is required.

---

## Updating

```bash
docker compose pull
docker compose up -d --force-recreate
```

---

## Credits

IT Tools is an open-source project created and maintained by **Corentin Thomasset** ([@CorentinTh](https://github.com/CorentinTh)).

- GitHub: [github.com/CorentinTh/it-tools](https://github.com/CorentinTh/it-tools)
- Official demo: [it-tools.tech](https://it-tools.tech)
- Docker Hub: [hub.docker.com/r/corentinth/it-tools](https://hub.docker.com/r/corentinth/it-tools)
