# Backups

An overview of the cron-driven backups running across the fleet: what gets backed up, where it goes, and when it runs relative to each host's [unattended-upgrades](unattended-upgrades.md) window.

There are two kinds of backup in play — **file backups** (rsync) and **database backups** (`mysqldump`) — plus one image-recreate job that looks similar but isn't a backup.

---

## Schedule at a glance

All backup jobs run daily, well ahead of any host's weekly unattended-upgrades run (03:00) and its 05:00 reboot window:

| Time | Job | Host |
| --- | --- | --- |
| 01:00 | `backup-to-phobos.sh` (rsync, titan → phobos) | titan |
| 01:00 | local rsync (`disk2` → `disk4`) | phobos |
| 02:00 | `mysql-backup.sh` | titan |
| 02:00 | `mysql-backup.sh` | phobos |
| 02:00 | `mysql-backup.sh` | tethys |
| 03:00 (weekly) | unattended-upgrades | titan / phobos / tethys / NCC-1702 / NCC-1703 (staggered) |

```cron
# titan
0 1 * * *  /home/xander/backup-to-phobos.sh >> /home/xander/backup.log 2>&1
0 2 * * *  /ironwolf/Backups/mysql/mysql-backup.sh

# phobos
0 1 * * *  rsync -av /disk2/stanley-filestore /disk4/backup-main/
0 2 * * *  /ssd2/backups/mysql/mysql-backup.sh

# tethys
0 2 * * *  /home/xander/backups/mysql/mysql-backup.sh
```

!!! note "Why 01:00 and 02:00?"
    Both slots sit at least an hour clear of every host's 03:00 upgrade window, so a backup is never mid-transfer when `apt` starts, and always long finished before a 05:00 auto-reboot.

---

## File backups (rsync)

### Titan → Phobos

`/home/xander/backup-to-phobos.sh` on titan pushes two directories over SSH to phobos:

```bash
SRC_DIRS=(
  "/ironwolf/music"
  "/ironwolf/pictures"
)
DEST="xander@phobos:/disk4/backup-main/"
SSH_KEY="/home/xander/.ssh/phobos-backup"

rsync -av -e "ssh -i $SSH_KEY" "${SRC_DIRS[@]}" "$DEST"
```

- Authenticates with a dedicated key pair (`phobos-backup` / `phobos-backup.pub`) rather than Xander's personal key.
- Incremental — only changed files transfer after the first run.
- Logs to `/home/xander/backup.log` on titan.
- Lands in `/disk4/backup-main/music` and `/disk4/backup-main/pictures` on phobos.

### Phobos local (disk2 → disk4)

```bash
rsync -av /disk2/stanley-filestore /disk4/backup-main/
```

A local, same-host copy — no network involved. Lands in `/disk4/backup-main/stanley-filestore`, alongside (not overlapping with) the `music`/`pictures` folders titan pushes into the same `backup-main` root.

```text
/disk4/backup-main/
├── music/              ← from titan
├── pictures/            ← from titan
└── stanley-filestore/   ← from phobos disk2, local copy
```

!!! warning "Single point of storage"
    All three file backups converge on `/disk4` on phobos. There's no offsite or third copy — if `/disk4` fails, both the titan-sourced and phobos-sourced backups are lost at once. Worth keeping in mind if `stanley-filestore` or the music/pictures libraries are irreplaceable.

---

## Database backups (`mysqldump`)

Each host running a MySQL container dumps its own databases locally, gzipped, with a **3-day retention** (`find ... -mtime +3 -delete` at the end of each script — confirmed on all three hosts, oldest file present is always ≤3 days old).

| Host | Script | Databases dumped | Destination |
| --- | --- | --- | --- |
| titan | `/ironwolf/Backups/mysql/mysql-backup.sh` | `ghost1`, `ghost2`, `guacamole`, `firefly` | `/ironwolf/Backups/mysql/` |
| phobos | `/ssd2/backups/mysql/mysql-backup.sh` | `ipam`, `uptimekuma` | `/ssd2/backups/mysql/` |
| tethys | `/home/xander/backups/mysql/mysql-backup.sh` | `grafana` | `/home/xander/backups/mysql/` |

Each script follows the same pattern — pull the root password from the relevant compose stack's `.env`, dump via `docker exec`, gzip, prune anything older than 3 days:

```bash
PASS=$(grep MYSQL_ROOT_PASSWORD /ssd/docker/docker-compose/<stack>/.env | cut -d= -f2 | tr -d '"')
docker exec <container> mysqldump -uroot -p"$PASS" <db> | gzip > "$BACKUP_DIR/<db>-$(date +%Y%m%d-%H%M%S).sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +3 -delete
```

!!! note "Local only, no rsync"
    Unlike the file backups above, none of the MySQL dumps are currently copied off the host they're taken on — they sit locally in the paths above. If the host is lost, its own DB dumps go with it.

---

## Not a backup: `homers` recreate

Titan's crontab also has:

```cron
0 5 * * 4  docker compose -f /ssd/docker/docker-compose/monitoring/docker-compose.yml up -d --force-recreate homers >> /home/xander/homers-recreate.log 2>&1
```

This force-recreates the `homers` container weekly (Thursday 05:00) to pick up a fresh image — it's a container refresh job, not a backup. It's scheduled at the same 05:00 slot titan's unattended-upgrades uses for reboots, but on **Thursday**, deliberately kept off titan's own upgrade day (**Monday**) to avoid the two colliding.

---

## Related

- [Unattended Upgrades](unattended-upgrades.md) — the weekly upgrade schedule these backups are timed around.
- [MySQL Database](mysql.md) — the database containers these dumps are taken from.
