# Unattended Upgrades

All five hosts (Titan, Phobos, Tethys, NCC-1702, NCC-1703) run [`unattended-upgrades`](https://wiki.debian.org/UnattendedUpgrades) to keep Debian packages current without manual intervention. Every host runs a **full upgrade** (not just security patches) once a week, on a different day per host, so a bad upgrade can't take out every server at once.

---

## Schedule

Each host runs its upgrade at **03:00 Europe/London** on its own day of the week, with a 10-minute random jitter (`RandomizedDelaySec`) so they don't all hit the network at the exact same second:

| Host | Day | Time |
| --- | --- | --- |
| Titan | Monday | 03:00 |
| Phobos | Tuesday | 03:00 |
| Tethys | Wednesday | 03:00 |
| NCC-1702 | Thursday | 03:00 |
| NCC-1703 | Friday | 03:00 |

If a reboot is required (kernel, glibc, etc.), it happens at **05:00** the same morning — two hours after the upgrade starts, giving it plenty of time to finish before the box goes down.

!!! note "Why not just use the default apt timers?"
    The stock `apt-daily-upgrade.timer` runs unattended-upgrades once a day at a semi-random time with no easy way to pin different hosts to different days. To get predictable, staggered days we disabled the upgrade step in the default timer (`APT::Periodic::Unattended-Upgrade "0"`) and drive the actual run from a dedicated `unattended-upgrades-weekly.timer` instead — see [How it's implemented](#how-its-implemented) below.

---

## What gets upgraded

`Unattended-Upgrade::Origins-Pattern` in `/etc/apt/apt.conf.d/50unattended-upgrades` controls which packages are eligible. All five hosts use the same pattern, covering the **full stable release**, not just the security pocket:

```text
Unattended-Upgrade::Origins-Pattern {
        "origin=Debian,codename=${distro_codename},label=Debian";
        "origin=Debian,codename=${distro_codename}-updates";
        "origin=Debian,codename=${distro_codename},label=Debian-Security";
        "origin=Debian,codename=${distro_codename}-security,label=Debian-Security";
};
```

| Line | Covers |
| --- | --- |
| `codename,label=Debian` | Main archive — the packages that shipped with the release |
| `codename-updates` | The `stable-updates` pocket — routine point-release fixes that aren't security-critical |
| `codename-security` (x2, label variants) | Security advisories |

Third-party repos (Docker CE, NVIDIA container toolkit, etc.) are **not** in this pattern, so they're left alone — confirmed with a dry run on Titan, which correctly skipped `docker-ce`, `docker-buildx-plugin` and the `libnvidia-container*` packages while reporting no Debian-origin upgrades pending.

Unused kernels and dependencies left behind by an upgrade are cleaned up automatically:

```text
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

---

## Reboots

```text
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-WithUsers "true";
Unattended-Upgrade::Automatic-Reboot-Time "05:00";
```

Reboots are automatic and happen even if someone happens to be logged in over SSH at the time — the goal is to never run a stale kernel for long, and a homelab box being briefly unreachable at 5am is an acceptable trade-off. Because each host's upgrade day is different, a bad reboot only ever affects one host at a time.

!!! warning "Titan is edge-facing"
    Titan runs Traefik and terminates all inbound traffic ([homelab topology](titan.md)). A Monday 05:00 reboot means a brief (~1-2 minute) outage for anything proxied through it. Phobos and Tethys are internal-only, so their reboot windows have no external impact.

---

## How it's implemented

Rather than relying on the default daily apt timers (`apt-daily.timer` / `apt-daily-upgrade.timer`), each host has its own systemd timer + service pair so the day/time is explicit and easy to audit.

**`/etc/apt/apt.conf.d/20auto-upgrades`** — disables the upgrade step in the stock daily timer, but still lets it refresh the package list daily:

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "0";
APT::Periodic::Unattended-Upgrade "0";
APT::Periodic::AutocleanInterval "7";
```

**`/etc/systemd/system/unattended-upgrades-weekly.service`** — identical on every host:

```ini
[Unit]
Description=Weekly full unattended-upgrade run
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStartPre=/usr/bin/apt-get update -qq
ExecStart=/usr/bin/unattended-upgrade
```

**`/etc/systemd/system/unattended-upgrades-weekly.timer`** — this is the only file that differs per host (the `OnCalendar` day). Titan's, for example:

```ini
[Unit]
Description=Weekly full unattended-upgrade schedule (Mon 03:00 Europe/London)

[Timer]
OnCalendar=Mon *-*-* 03:00:00
RandomizedDelaySec=10min
Persistent=true

[Install]
WantedBy=timers.target
```

`Persistent=true` means if a host is down at its scheduled time (e.g. mid-reboot from a previous week, power outage), the run fires as soon as it's back up instead of waiting a full week.

---

## Live status dashboard

**[updates.xmsystems.co.uk](https://updates.xmsystems.co.uk)** shows this at a glance for all five hosts — last run time, what was installed/removed, whether a reboot was needed and whether it actually happened, and the next scheduled run. It's a small per-host API (`update-status-api`, port 9879, same pattern as `disk-smart-api` — see [storage monitor](titan.md)) that parses each host's own `unattended-upgrades.log` and `unattended-upgrades-weekly.timer`, proxied through Phobos nginx and Traefik like the other internal dashboards. No auth, internal-only (`websecure-int`).

Useful as the first stop instead of the manual commands below — reach for those only when you need more detail than the dashboard shows (full log context, dry-run testing, etc).

## Checking status

```bash
# Next scheduled run
systemctl list-timers unattended-upgrades-weekly.timer

# Did the last run succeed?
systemctl status unattended-upgrades-weekly.service

# Full upgrade log
less /var/log/unattended-upgrades/unattended-upgrades.log

# Dry run — see what *would* be upgraded without changing anything
sudo unattended-upgrade --dry-run --debug
```

---

## Changing a host's day or time

Edit the `OnCalendar` line in that host's `/etc/systemd/system/unattended-upgrades-weekly.timer`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart unattended-upgrades-weekly.timer
```

---

## Related

- [Backups](backups.md) — the daily rsync/mysqldump jobs deliberately scheduled ahead of this timer's 03:00 window.
