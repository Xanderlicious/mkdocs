# Unbound

Unbound is a recursive DNS resolver installed on [NCC-1702](NCC-1702.md), [NCC-1703](NCC-1703.md), and [NCC-1704](NCC-1704.md) to handle upstream DNS resolution for Pi-hole.

## Why Unbound instead of a forwarding resolver?

Most DNS setups forward queries to a public resolver (Cloudflare `1.1.1.1`, Google `8.8.8.8`, etc.). This works, but it means that resolver can see every domain you query.

Unbound removes that dependency. Instead of handing queries off to a third party, it resolves them recursively — starting at the DNS root and working down the hierarchy itself:

1. "Who handles `.com`?" → asks a root nameserver
2. "Who handles `example.com`?" → asks the `.com` TLD nameserver
3. "What is `www.example.com`?" → asks Example's authoritative nameserver

No single upstream provider sees your full query traffic. Pi-hole still handles ad and tracker blocking; Unbound handles the resolution.

## Root hints file

To start the recursive resolution process, Unbound needs to know the IP addresses of the DNS root nameservers. These are provided via a **root hints file** (`root.hints`), published by IANA.

Without it, Unbound falls back to a compiled-in list that can go stale as root server addresses change over time. Keeping a current root hints file ensures Unbound always knows the right starting points.

To update the root hints file on a bare-metal install:

```bash
wget -O /var/lib/unbound/root.hints https://www.internic.net/domain/named.root
sudo systemctl restart unbound
```

This should be done periodically (a few times a year is sufficient — the root hints change rarely but do change).

## Bare-metal configuration (NCC-1702 & NCC-1703)

On the Raspberry Pi devices, Unbound is installed directly via apt and listens on port `5335` to avoid conflicting with any system resolver on port 53.

```bash
sudo apt install unbound
```

Config at `/etc/unbound/unbound.conf.d/pi-hole.conf`:

```text
server:
    verbosity: 0
    interface: 127.0.0.1
    port: 5335
    do-ip4: yes
    do-udp: yes
    do-tcp: yes
    do-ip6: no

    root-hints: /var/lib/unbound/root.hints

    harden-glue: yes
    harden-dnssec-stripped: yes
    use-caps-for-id: yes

    edns-buffer-size: 1472
    prefetch: yes
    num-threads: 1

    private-address: 192.168.0.0/16
    private-address: 169.254.0.0/16
    private-address: 172.16.0.0/12
    private-address: 10.0.0.0/8
```

Pi-hole (v6) on these devices is then configured to use `127.0.0.1#5335` as its upstream DNS server. This is set either via the web UI under **Settings → DNS → Custom upstream**, or directly in `/etc/pihole/pihole.toml`:

```toml
[dns]
  upstreams = [ "127.0.0.1#5335" ]
```

## Docker configuration (NCC-1704)

On NCC-1704, Unbound runs as a sidecar container (`mvance/unbound`) on the same Docker network as Pi-hole, with a static IP of `172.20.0.4`. Pi-hole is configured to send upstream queries to `unbound#53` (resolved internally by Docker to `172.20.0.4`).

See the [NCC-1704](NCC-1704.md) page for the full compose configuration.
