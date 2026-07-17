#!/usr/bin/env bash
# ============================================================================
# GymSetu health probe. Runs every 5 min, writes a plain-text verdict that
# Caddy serves at https://app.<host>/healthz for an external uptime check.
#
# Install: sudo cp health.sh /usr/local/bin/gymsetu-health && sudo chmod +x /usr/local/bin/gymsetu-health
# Cron:    /etc/cron.d/gymsetu-health  ->  */5 * * * * root /usr/local/bin/gymsetu-health
#
# WHY A FILE AND NOT A LIVE ENDPOINT: the probe has to run ON the box (docker,
# psql, df) but the alert has to come from OFF the box, or a dead instance
# reports nothing and you hear about it from your customer. So: the box writes
# a verdict to disk, Caddy serves it as static text, and an external monitor
# keyword-matches "OK". That covers both failure shapes —
#   box/network dead    -> monitor can't fetch /healthz at all      -> alert
#   box up, guts broken -> /healthz says FAIL, keyword misses "OK"  -> alert
#
# IMPORTANT for whoever configures the monitor: alert on the ABSENCE of the
# keyword "OK", not on HTTP status. This file is served 200 either way — a
# monitor watching only status codes will report green while the DB is down.
#
# Checks are deliberately the things that have actually bitten this project:
# a container quietly exiting, the DB refusing connections, Kong not routing,
# backups silently stopping, and the disk filling up (Postgres goes read-only
# and the app starts failing writes with no obvious cause).
# ============================================================================
set -uo pipefail   # NOT -e: a failing check must be REPORTED, not abort the script

OUT_DIR="${OUT_DIR:-/var/www/health}"
OUT="${OUT_DIR}/status.txt"
BACKUP_STATUS="${BACKUP_STATUS:-/var/log/gymsetu-backup.status}"
BACKUP_MAX_AGE_H="${BACKUP_MAX_AGE_H:-36}"   # nightly + 12h grace
DISK_MAX_PCT="${DISK_MAX_PCT:-90}"
EXPECTED_CONTAINERS="supabase-db supabase-kong supabase-auth supabase-rest supabase-edge-functions"

mkdir -p "$OUT_DIR"
PROBLEMS=()
NOW="$(date -u +%FT%TZ)"

# ── 1. Containers running ───────────────────────────────────────────────────
for c in $EXPECTED_CONTAINERS; do
  state="$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo missing)"
  [ "$state" = "running" ] || PROBLEMS+=("container:${c}=${state}")
done

# ── 2. Postgres actually answers ────────────────────────────────────────────
# "container is running" is not "database is accepting queries" — a wedged
# Postgres stays "running" indefinitely.
if ! docker exec supabase-db psql -U postgres -d postgres -tAc 'select 1' >/dev/null 2>&1; then
  PROBLEMS+=("postgres:not-answering")
fi

# ── 3. Kong routes to PostgREST ─────────────────────────────────────────────
# 401 is the CORRECT answer here (no apikey) and proves the whole chain is up.
# Anything else — 000 (refused), 502, 503 — means the gateway or REST is down.
code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 http://localhost:8000/rest/v1/ 2>/dev/null)"
[ "$code" = "401" ] || PROBLEMS+=("kong-rest:http=${code:-000}")

# ── 4. Backups still happening ──────────────────────────────────────────────
if [ -f "$BACKUP_STATUS" ]; then
  if ! grep -q '^OK' "$BACKUP_STATUS"; then
    PROBLEMS+=("backup:last-run-failed")
  else
    age_h=$(( ( $(date +%s) - $(stat -c %Y "$BACKUP_STATUS") ) / 3600 ))
    [ "$age_h" -le "$BACKUP_MAX_AGE_H" ] || PROBLEMS+=("backup:stale-${age_h}h")
  fi
else
  PROBLEMS+=("backup:never-run")
fi

# ── 5. Disk ─────────────────────────────────────────────────────────────────
pct="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
[ "${pct:-100}" -lt "$DISK_MAX_PCT" ] || PROBLEMS+=("disk:${pct}%")

# ── Verdict ─────────────────────────────────────────────────────────────────
# Written atomically: a monitor polling mid-write must never read a half file
# and page someone at 3am over nothing.
TMP="$(mktemp)"
if [ ${#PROBLEMS[@]} -eq 0 ]; then
  echo "OK ${NOW} disk=${pct}%" > "$TMP"
else
  echo "FAIL ${NOW} ${PROBLEMS[*]}" > "$TMP"
fi
chmod 644 "$TMP"
mv -f "$TMP" "$OUT"
chown -R caddy:caddy "$OUT_DIR" 2>/dev/null || true
cat "$OUT"
