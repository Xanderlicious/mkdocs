# Docker Daemon Security (mTLS)

By default the Docker daemon exposes its TCP API without authentication. This page documents how I have secured remote Docker API access using mutual TLS (mTLS), ensuring only authorised clients can communicate with docker daemon endpoints on Titan, Tethys, and NCC-1702.

**Applies to:** Titan · Tethys · NCC-1702  
**Clients:** Kuma (Phobos) · Homepage (Phobos)

---

## Overview

Each Docker host listens on port **2376** (TLS) bound to its LAN IP only. Unauthenticated port 2375 is disabled on all hosts. A single private CA lives on Titan and signs all server and client certificates.

```sh
Phobos (Kuma / Homepage)
    └── mTLS :2376 ──→ Titan    (10.36.100.150)
    └── mTLS :2376 ──→ Tethys   (10.36.100.152)
    └── mTLS :2376 ──→ NCC-1702 (10.36.100.2)
```

---

## Certificate Authority

The CA lives on **Titan** at `/etc/docker/certs/`. It signs all server and client certificates for each host. The CA key is passphrase-protected and never leaves Titan.

| File | Purpose |
| --- | --- |
| `ca.pem` | CA certificate (distributed to all hosts) |
| `ca-key.pem` | CA private key (Titan only — never copied) |

### Generating the CA

Run once on Titan:

```bash
sudo mkdir -p /etc/docker/certs
cd /etc/docker/certs

sudo openssl genrsa -aes256 -out ca-key.pem 4096
sudo openssl req -new -x509 -days 3650 -key ca-key.pem -sha256 -out ca.pem \
  -subj "/CN=docker-ca/O=Titan Docker CA"
```

---

## Server Certificates

Each Docker host needs a server certificate signed by the CA. The certificate's SAN must include the host's LAN IP.

### Adding a new host

**1. On the new host — generate key and CSR:**

```bash
sudo mkdir -p /etc/docker/certs
cd /etc/docker/certs
sudo openssl genrsa -out server-key.pem 4096
sudo openssl req -new -sha256 -key server-key.pem -out server.csr \
  -subj "/CN=<hostname>-docker-server"
echo "subjectAltName = IP:<host-ip>,IP:127.0.0.1" | sudo tee extfile.cnf
```

**2. Copy the CSR to Titan:**

```bash
sudo cp /etc/docker/certs/server.csr /tmp/<hostname>-server.csr
sudo chown xander /tmp/<hostname>-server.csr
scp /tmp/<hostname>-server.csr titan:/tmp/
```

**3. On Titan — sign with the CA:**

```bash
echo "subjectAltName = IP:<host-ip>,IP:127.0.0.1" | sudo tee /tmp/extfile-<hostname>.cnf

sudo openssl x509 -req -days 3650 -sha256 \
  -in /tmp/<hostname>-server.csr \
  -CA /etc/docker/certs/ca.pem \
  -CAkey /etc/docker/certs/ca-key.pem \
  -CAserial /etc/docker/certs/ca.srl \
  -out /tmp/<hostname>-server-cert.pem \
  -extfile /tmp/extfile-<hostname>.cnf
```

!!! note
    Use `-CAserial` (not `-CAcreateserial`) for all certs after the first to avoid serial number clashes.

**4. Copy signed cert and CA back to the host:**

```bash
scp /tmp/<hostname>-server-cert.pem <hostname>:/tmp/
scp /etc/docker/certs/ca.pem <hostname>:/tmp/
```

**5. On the new host — move into place:**

```bash
sudo mv /tmp/<hostname>-server-cert.pem /etc/docker/certs/server-cert.pem
sudo mv /tmp/ca.pem /etc/docker/certs/ca.pem
sudo chmod 0444 /etc/docker/certs/ca.pem /etc/docker/certs/server-cert.pem
sudo chmod 0400 /etc/docker/certs/server-key.pem
```

---

## Client Certificate

A single client certificate is used by Phobos to authenticate against all Docker hosts. It lives at `/etc/docker/certs/` on Phobos and is also distributed into the Kuma and Homepage appdata directories.

### Generating the client cert

Run on Titan:

```bash
sudo openssl genrsa -out client-key.pem 4096
sudo openssl req -new -sha256 -key client-key.pem -out client.csr \
  -subj "/CN=phobos-kuma-client"
echo "extendedKeyUsage = clientAuth" | sudo tee extfile-client.cnf

sudo openssl x509 -req -days 3650 -sha256 \
  -in client.csr \
  -CA ca.pem -CAkey ca-key.pem -CAcreateserial \
  -out client-cert.pem \
  -extfile extfile-client.cnf
```

Copy to Phobos:

```bash
sudo cp /etc/docker/certs/ca.pem \
        /etc/docker/certs/client-cert.pem \
        /etc/docker/certs/client-key.pem /tmp/
sudo chown xander /tmp/ca.pem /tmp/client-cert.pem /tmp/client-key.pem
scp /tmp/ca.pem /tmp/client-cert.pem /tmp/client-key.pem phobos:/tmp/
```

On Phobos:

```bash
sudo mkdir -p /etc/docker/certs
sudo mv /tmp/ca.pem /tmp/client-cert.pem /tmp/client-key.pem /etc/docker/certs/
sudo chmod 0444 /etc/docker/certs/ca.pem /etc/docker/certs/client-cert.pem
sudo chmod 0400 /etc/docker/certs/client-key.pem
```

---

## Docker Daemon Configuration

Apply to each Docker host (Titan, Tethys, NCC-1702).

### /etc/docker/daemon.json

```json
{
  "tls": true,
  "tlsverify": true,
  "tlscacert": "/etc/docker/certs/ca.pem",
  "tlscert": "/etc/docker/certs/server-cert.pem",
  "tlskey": "/etc/docker/certs/server-key.pem",
  "ipv6": false
}
```

### /etc/systemd/system/docker.service.d/override.conf

Bind to the host's LAN IP only — not `0.0.0.0`:

```ini
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://<host-ip>:2376
```

!!! note
    NCC-1702 (Raspberry Pi) has dockerd at `/usr/sbin/dockerd` rather than `/usr/bin/dockerd`.

Reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

Verify 2376 is listening and 2375 is gone:

```bash
ss -tlnp | grep 2376
ss -tlnp | grep 2375
```

---

## Testing

Test the mTLS connection from Phobos before configuring any clients:

```bash
docker --tlsverify \
  --tlscacert=/etc/docker/certs/ca.pem \
  --tlscert=/etc/docker/certs/client-cert.pem \
  --tlskey=/etc/docker/certs/client-key.pem \
  -H tcp://<host-ip>:2376 \
  info
```

A successful response shows the remote host's Docker info with no deprecation warnings.

---

## Kuma Configuration

Kuma looks up TLS certificates based on the Docker host IP. Certs must be placed in a directory named after the host IP inside the Kuma data directory.

### Cert directories on Phobos

```sh
/ssd/docker/appdata/kumav2/docker-tls/
    10.36.100.150/    ← Titan
        ca.pem
        cert.pem
        key.pem
    10.36.100.152/    ← Tethys
        ca.pem
        cert.pem
        key.pem
    10.36.100.2/      ← NCC-1702
        ca.pem
        cert.pem
        key.pem
```

Note the filenames — Kuma expects `cert.pem` and `key.pem`, not `client-cert.pem` / `client-key.pem`.

### Adding a new host to Kuma

```bash
sudo mkdir -p "/ssd/docker/appdata/kumav2/docker-tls/<host-ip>"
sudo cp /ssd/docker/appdata/kumav2/docker-tls/10.36.100.150/ca.pem \
        "/ssd/docker/appdata/kumav2/docker-tls/<host-ip>/ca.pem"
sudo cp /ssd/docker/appdata/kumav2/docker-tls/10.36.100.150/cert.pem \
        "/ssd/docker/appdata/kumav2/docker-tls/<host-ip>/cert.pem"
sudo cp /ssd/docker/appdata/kumav2/docker-tls/10.36.100.150/key.pem \
        "/ssd/docker/appdata/kumav2/docker-tls/<host-ip>/key.pem"
```

### Kuma docker-compose.yml

The `NODE_EXTRA_CA_CERTS` environment variable is required so Node.js trusts the private CA:

```yaml
networks:
  default:
    name: phobos-network
    external: true

services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    container_name: uptime-kuma
    networks:
      default:
        ipv4_address: "172.20.0.5"
    ports:
      - 3001:3001
    environment:
      - TZ=Europe/London
      - NODE_EXTRA_CA_CERTS=/app/data/docker-tls/10.36.100.150/ca.pem
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /ssd/docker/appdata/kumav2:/app/data
```

### Adding a Docker Host in the Kuma UI

1. **Settings → Docker Hosts → Add**
2. Set Connection Type to `TCP / HTTP`
3. Set Docker Daemon to `https://<host-ip>:2376`
4. Click **Test** — should show `Connected Successfully`
5. Click **Save**

---

## Homepage Configuration

Homepage resolves TLS certs from a `tls/` directory relative to its config directory.

### Cert location on Phobos

```sh
/ssd/docker/appdata/homepage/tls/
    ca.pem
    cert.pem
    key.pem
```

### docker.yaml

```yaml
titan:
  host: 10.36.100.150
  port: 2376
  tls:
    keyFile: tls/key.pem
    caFile: tls/ca.pem
    certFile: tls/cert.pem

tethys:
  host: 10.36.100.152
  port: 2376
  tls:
    keyFile: tls/key.pem
    caFile: tls/ca.pem
    certFile: tls/cert.pem

ncc-1702:
  host: 10.36.100.2
  port: 2376
  tls:
    keyFile: tls/key.pem
    caFile: tls/ca.pem
    certFile: tls/cert.pem
```

---

## Certificate Locations Reference

| File | Location | Purpose |
| --- | --- | --- |
| `ca.pem` | Titan `/etc/docker/certs/` | CA cert — root of trust |
| `ca-key.pem` | Titan `/etc/docker/certs/` | CA private key — never leave Titan |
| `server-cert.pem` | Each host `/etc/docker/certs/` | Host identity |
| `server-key.pem` | Each host `/etc/docker/certs/` | Host private key |
| `ca.pem` | Phobos `/etc/docker/certs/` | CA cert for client verification |
| `client-cert.pem` | Phobos `/etc/docker/certs/` | Phobos client identity |
| `client-key.pem` | Phobos `/etc/docker/certs/` | Phobos client private key |
| `ca.pem`, `cert.pem`, `key.pem` | Phobos `/ssd/docker/appdata/kumav2/docker-tls/<ip>/` | Kuma per-host cert lookup |
| `ca.pem`, `cert.pem`, `key.pem` | Phobos `/ssd/docker/appdata/homepage/tls/` | Homepage TLS config |

---

## Certificate Renewal

Certs are valid for 3650 days (10 years). To renew a server cert before expiry, repeat the CSR signing process for that host and restart Docker. The client cert renewal follows the same process as initial generation.

Check expiry dates:

```bash
# On any host
sudo openssl x509 -in /etc/docker/certs/server-cert.pem -noout -dates

# Client cert on Phobos
sudo openssl x509 -in /etc/docker/certs/client-cert.pem -noout -dates

# CA cert on Titan
sudo openssl x509 -in /etc/docker/certs/ca.pem -noout -dates
```
