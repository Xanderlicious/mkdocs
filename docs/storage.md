# Storage Monitor

`storage.xmsystems.co.uk` — live storage health dashboard covering all three
hosts with local drives: Titan (LSI MegaRAID SAS 9260-8i array + local
drives), Phobos (bulk storage array), and Tethys.

![storage-screenshot](images/storage-screenshot.png)

## Layout

The landing page (`/`) shows one clickable card per host, full width, side
by side, over a full-page circuit-board/HDD background image (a
`🚀 BACKGROUND` toggle in the header hides it and falls back to plain opaque
cards, persisted via `localStorage`). Each card is richer than a bare
summary — it includes a live preview of every drive on that host, not just
headline numbers:

- Overall status — **HEALTHY** / **WATCH** / **ATTENTION** / **UNREACHABLE**
- Drive count, hottest drive temperature, total capacity, and used %
- A drive-preview list — one slim row per drive (Titan's RAID array counts
  as a single rolled-up row here, not its 6 individual members), each row's
  background tinted to show how full it is at a glance, with temperature and
  used-% shown as two **independently colour-coded** figures (a drive that's
  nearly full but running cool shows an orange usage figure next to a green
  temperature figure, not one colour bleeding into the other)
- A one-line flag naming the worst issue(s) found, or "All drives healthy"

Each card's header (host name, subtitle, status pill) sits directly on the
card body with no separate background box behind it — a single-tone card
matching the style used on Server Health and Pi-hole Status.

Clicking a card (or navigating directly to `/titan`, `/phobos`, or `/tethys`)
opens that host's full detail view — everything the old single-page layout
used to show, but scoped to one host at a time, and laid out as wide,
full-width pills (one per drive) rather than a grid of boxy cards:

### Titan detail (`/titan`)

- **Controller** — model, serial, firmware/package version, memory error
  counts, BBU status, alarm state
- **Array (Virtual Drive)** — RAID level, capacity, access mode, cache
  policy, filesystem usage (used/free/total, mount, fstype, device)
- **RAID Array Drives** — one wide pill per disk in the array: slot ID,
  model/serial/logo, a row of chips (capacity, interface, link speed, row
  position, firmware, power-on hours, temperature, S.M.A.R.T./error
  counters), and an online/rebuilding/offline badge. Since a RAID member has
  no filesystem of its own, its pill's background gauge tracks **temperature**
  instead of capacity.
- **Other Drives** — Titan's non-RAID drives (`/ironwolf`, `/ssd`,
  `/downloads`, root), same wide-pill treatment, gauge tracks **capacity used**

### Phobos / Tethys detail (`/phobos`, `/tethys`)

Just the **Drives** section — the same wide pills as Titan's "Other Drives",
sorted by mount point. Phobos covers `/disk0`–`/disk4`, `/ssd`, `/ssd2` and
root; Tethys covers root and `/ssd`.

Per drive pill:

- Model, serial, capacity, mount point and underlying `/dev` path, drive
  type (NVMe/SSD/Mechanical) as a chip
- S.M.A.R.T. overall pass/fail
- Temperature (colour-coded independently of usage — see **Status colours**
  below)
- Power-on hours
- Filesystem usage (used % / free, colour-coded) — this is also what drives
  the pill's background fill gauge
- Error counters, shown as chips only when non-zero (a healthy drive just
  shows a single green "S.M.A.R.T OK" chip rather than five zeroes):
    - **ATA (SSD/mechanical):** reallocated sectors, pending sectors, uncorrectable sectors
    - **NVMe:** critical warning flag, media errors, percentage used (wear), available spare vs. threshold

Any pill with a flagged error gets a highlighted red border, same as before.

## Routing

The frontend is still a single static file (`storage.html`), but it now
does its own client-side routing via the History API rather than always
rendering everything on one page. `/`, `/titan`, `/phobos`, and `/tethys`
all serve the same file (nginx's `try_files … /storage.html` fallback
already covers any path that isn't a real static file), and a small router
in the page's JS reads `location.pathname` on load and on `popstate` to
decide whether to show the overview or a host's detail view. Clicking a
host card calls `history.pushState` instead of doing a full navigation, so
the 30-second polling loop and countdown timer keep running uninterrupted
across navigation.

## How it works

```bash
Browser
  ├─▶ storage.xmsystems.co.uk/api/
  │     └─▶ nginx (Phobos, Docker)
  │           └─▶ proxy_pass → 10.36.100.150:9877
  │                 └─▶ megaraid-api (Titan, systemd)
  │                       └─▶ MegaRAID controller (via storcli/perccli)
  │
  ├─▶ storage.xmsystems.co.uk/api/disks/titan/
  │     └─▶ nginx (Phobos, Docker)
  │           └─▶ proxy_pass → 10.36.100.150:9878
  │                 └─▶ disk-smart-api (Titan, systemd)
  │                       └─▶ smartctl -a -j <device>
  │
  ├─▶ storage.xmsystems.co.uk/api/disks/phobos/
  │     └─▶ nginx (Phobos, Docker)
  │           └─▶ proxy_pass → 10.36.100.151:9878
  │                 └─▶ disk-smart-api (Phobos, systemd)
  │                       └─▶ smartctl -a -j <device>
  │
  └─▶ storage.xmsystems.co.uk/api/disks/tethys/
        └─▶ nginx (Phobos, Docker)
              └─▶ proxy_pass → 10.36.100.152:9878
                    └─▶ disk-smart-api (Tethys, systemd)
                          └─▶ smartctl -a -j <device>
```

- The frontend is a single static page (`storage.html`, renamed from the
  original `megaraid.html` on 2026-08-29) served by nginx on Phobos.
- nginx proxies `/api/` to `megaraid-api` on Titan (port 9877) for the RAID section, and `/api/disks/{titan,phobos,tethys}/` to a `disk-smart-api` instance on each host (port 9878, internal only) for that host's plain drives.
- `disk-smart-api` is a small Python systemd service — one instance per host — that runs `smartctl -a -j` against a fixed, hand-maintained device → mount-point map (`/etc/systemd/system/disk-smart-api.service` → `/usr/local/bin/disk-smart-api`), classifies each drive as `nvme` / `ssd` / `mechanical` (NVMe by `device.type`, otherwise SSD vs. mechanical by `rotation_rate`), and returns controller-free JSON: model, serial, capacity, S.M.A.R.T. status, temperature, power-on hours, type-specific error counters, and filesystem usage. Response is cached 30s, same as `megaraid-api`. Tethys's instance uses `/dev/disk/by-id/...` paths (matching Phobos's convention) rather than raw `/dev/sdX` names.
- The page polls all four endpoints every 30 seconds (`cache: 'no-store'`) via `Promise.allSettled` and re-renders whichever view (overview or a host's detail) is currently active. A failed call for one host doesn't block the others — the RAID section and each host's drives update independently.
- The overview cards compute their own rollup client-side from the same data: worst-case status across controller/array/drive state, S.M.A.R.T. failures, error counters, and temperature/usage thresholds (≥55°C warn / ≥60°C critical per drive, ≥75%/≥90% used).
- On the overview cards, Titan's "RAID ARRAY" preview row shows the hottest
  temperature among the array's physical drives (previously this row showed
  no temperature at all) — the fix piggybacks on `maxTemp`, which the
  rollup function already tracks while iterating the array's drives.

!!! note "Adding a new drive"
    There's no auto-discovery — `disk-smart-api` reads from a static `DEVICES` dict in `/usr/local/bin/disk-smart-api` on the relevant host (`{"/dev/sdX-or-by-id-path": "/mount/point", ...}`). Add the new device/mount pair there and `systemctl restart disk-smart-api`.

!!! note "Adding a fourth host"
    Add the host to the `HOSTS` / `HOST_LABEL` / `DISK_ENDPOINTS` constants near the top of `storage.html`'s `<script>`, deploy a `disk-smart-api` instance there (see Tethys's setup: install `smartmontools`, adapt the `DEVICES` dict, drop in the systemd unit), and add an `/api/disks/<host>/` proxy block to nginx's `default.conf` mirroring the existing ones. No RAID card handling is needed unless the new host also has a MegaRAID controller — that logic is Titan-specific in the frontend (`host === 'titan'` branch).

!!! warning "Editing `default.conf` on Phobos"
    This file is bind-mounted into the nginx container as a **single file**
    (`/ssd/docker/appdata/nginx/default.conf` → `/etc/nginx/conf.d/default.conf`
    in `docker-compose.yml`), not the whole directory. Any edit that replaces
    the file's inode — `sed -i`, `mv` a new version over it, etc. — silently
    detaches the bind mount: the host-side file shows your change, but the
    running container keeps serving whatever content was mounted before,
    indefinitely, until the container is restarted (`docker restart nginx`).
    `nginx -s reload` does **not** fix this — it just re-parses the same
    stale file the container can already see. Symptom: config edits that
    "don't take effect" and, on the affected `location` block, nginx errors
    like `rewrite or internal redirection cycle` pointing at the *old*
    filename. To edit this file safely without a restart, write to it
    in-place instead (e.g. Python's `open(path, 'w')`, which truncates the
    existing inode rather than replacing it) — that was how the
    `/api/disks/tethys/` route got added earlier without issue. If a restart
    already happened, this is a non-issue going forward until the next
    inode-replacing edit. Every other page's docroot file
    (`piholestatus.html`, `serverstatus.html`, etc.) is unaffected — those
    live under the *directory* bind mount, which just re-resolves paths on
    every request and has no equivalent gotcha.

## S.M.A.R.T. trend history

Each drive pill (RAID array members excluded — they're covered by `megaraid-api`,
not `disk-smart-api`) also shows a muted line under its chips: `TRACKING N
WKS SINCE <date>`, plus a highlighted delta chip (e.g. `REALLOC +2 SINCE 12
Sept`) whenever a slow-moving counter — reallocated/pending/uncorrectable
sectors on ATA drives, media errors or wear % on NVMe — has actually grown
since the first recorded snapshot. A drive with no change shows the tracking
line and nothing else.

This exists because a single S.M.A.R.T. snapshot can't say whether a
non-zero counter (e.g. Titan's IronWolf sitting at 8 reallocated sectors)
is old and stable or actively climbing — added 2026-09-12 after exactly that
question came up.

```text
Timer (per host, staggered day, 05:00 — one day after that host's
docker-update run)
  └─▶ smart-trend-log (root, systemd oneshot)
        ├─▶ GET http://127.0.0.1:9878/  (that host's own disk-smart-api,
        │     reused rather than shelling out to smartctl again)
        └─▶ appends today's snapshot per drive to
              /var/log/smart-trend/history.json
                └─▶ disk-smart-api's own `/history` route serves it back
                      └─▶ nginx's existing /api/disks/<host>/ proxy prefix
                            already covers it, no new config needed
```

- Source: `smart-trend-log.py` in `~/scripts/smart-trend/` (deployed as
  near-identical copies per host, only `HOST` differs — same convention as
  `docker-update-check.py`), full write-up in that directory's `README.md`.
- `disk-smart-api` itself gained a `HISTORY_PATH` constant and a `/history`
  GET route returning that JSON file's contents — a small in-place patch,
  not tracked in this repo any more than `disk-smart-api`'s own source is
  (see the warning below); the patch is documented in
  `~/scripts/smart-trend/README.md` in case the service is ever redeployed
  from scratch.
- History is capped at 104 weekly entries per drive (~2 years) and stored
  as a plain JSON dict keyed by drive name (mount point).
- Deliberately a text delta summary, not a sparkline — a handful of weekly
  points isn't enough data yet to make a chart worthwhile, and "has this
  counter grown, and since when" is the actionable question.

!!! note "Running it on demand"
    ```bash
    ssh <host> sudo /usr/local/bin/smart-trend-log
    ```
    Safe to re-run — a second run on the same UTC date overwrites that
    day's entry instead of appending a duplicate.

## Status colours

For RAID controller/array/drive state:

| Colour | Meaning |
| --- | --- |
| Green (`OPTIMAL` / `ONLINE` / `HEALTHY`) | Healthy |
| Amber/Yellow | Degraded, rebuilding, or a warning-level condition |
| Red | Critical — offline, failed, S.M.A.R.T. failure, or an error counter above zero |

For per-drive **temperature**, independent of usage — green through the
whole normal operating range, only warming up as a drive actually runs hot:

| Range | Colour |
| --- | --- |
| < 50°C | Green |
| 50–54°C | Amber |
| 55–59°C | Orange |
| ≥ 60°C | Red |

For per-drive **capacity used**, shown as its own colour next to (not
blended with) the temperature figure:

| Range | Colour |
| --- | --- |
| < 70% | Green |
| 70–84% | Amber |
| 85–94% | Orange |
| ≥ 95% | Red |

!!! note "These two used to share one colour"
    Earlier versions of this page rendered a drive's temperature and its
    used-% with a single shared colour derived from usage alone, so a
    nearly-full but perfectly cool drive would show its temperature in the
    same orange as its usage figure. They're now computed and coloured
    independently. A related bug in the temperature scale itself — a
    below-35°C tier that pointed at a `--cyan` token which had been aliased
    to the same orange as `--accent` elsewhere on this page, so the coolest
    drives rendered in the "hot" colour — was also removed; anything under
    50°C is simply green now.

## Troubleshooting

- **Error banner reading "Could not reach the MegaRAID API on titan"** — the `megaraid-api` systemd service on Titan is down, or the nginx proxy to `10.36.100.150:9877` is failing. The page keeps showing the last known good data while it retries; Titan's overview card and detail page fall back to whatever its `disk-smart-api` data (other drives) can still provide.
- **A host's card shows UNREACHABLE** — check `systemctl status disk-smart-api` on that host, and that its nginx proxy target (`10.36.100.150:9878` Titan / `10.36.100.151:9878` Phobos / `10.36.100.152:9878` Tethys) is reachable.
- **Config edits to `default.conf` not taking effect** — see the bind-mount warning above; you likely need `docker restart nginx`, not just `nginx -s reload`.
- **Duplicated info after refresh** — historical bug in the array-storage render (fixed: it was appending a new usage block into the card instead of replacing it).
- **No "TRACKING" line under a drive pill** — `smart-trend-weekly.timer` hasn't fired yet on that host (check `systemctl list-timers smart-trend-weekly.timer`), or `/var/log/smart-trend/history.json` doesn't have an entry for that drive yet. Run `sudo /usr/local/bin/smart-trend-log` on the host to seed one immediately.

---

## Related

- [Server Health](moon-fleet.md) — fleet-wide status board, same visual theme, refreshed every 4 hours from a static snapshot rather than live polling
- [Unattended Upgrades](unattended-upgrades.md) — the `updates.xmsystems.co.uk` dashboard, same theme, checks once daily
- [Pi-hole Status](piholes.md) — the original template this visual theme was built from
- [Automatic Container Updates](container-updates.md) — weekly per-host Docker update dashboard, same theme
