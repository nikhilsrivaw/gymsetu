#!/usr/bin/env bash
# ============================================================================
# GymSetu backup — Postgres + storage volume, local with optional S3 offsite.
#
# Install:  sudo cp backup.sh /usr/local/bin/gymsetu-backup && sudo chmod +x /usr/local/bin/gymsetu-backup
# Cron:     sudo crontab -e   ->   30 20 * * * /usr/local/bin/gymsetu-backup >/dev/null 2>&1
#           (20:30 UTC = 02:00 IST — after the gym has closed, before the
#            03:30 UTC WhatsApp cron, so a bad night never lands mid-write.)
# Restore:  see database/RESTORE.md
#
# WHY THIS ISN'T THE OBVIOUS ONE-LINER:
#
#   * It verifies. A pg_dump that fails halfway still exits 0 through a pipe
#     without pipefail, and gzip will happily compress an empty stream. The
#     classic disaster is discovering your nightly backups have been 20-byte
#     files for eight months. Every dump here is gzip-tested and grepped for a
#     known table before it's allowed to count as a backup.
#   * It keeps the LAST GOOD backup. A verified-bad dump must never overwrite
#     or prune a good one, so pruning happens only after verification passes.
#   * It records status to a file, so uptime monitoring can alert on backups
#     silently stopping — the failure mode that actually kills companies.
#   * It backs up the storage volume too. The DB has storage.objects rows
#     pointing at files on disk; restoring the DB alone gives you dangling
#     references to member photos that no longer exist.
#
# WHAT THIS DOES *NOT* BACK UP, DELIBERATELY: supabase/docker/.env
#   Restoring is impossible without JWT_SECRET — a new one invalidates every
#   session AND changes the anon key that is COMPILED INTO the shipped app
#   bundle and the Caddyfile. But those secrets never change, so copying them
#   to S3 nightly just spreads them around for no benefit. Put .env in a
#   password manager ONCE. See the check at the end of this script.
# ============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/gymsetu}"
STORAGE_DIR="${STORAGE_DIR:-/home/ubuntu/supabase/docker/volumes/storage}"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STATUS_FILE="${STATUS_FILE:-/var/log/gymsetu-backup.status}"
LOG_FILE="${LOG_FILE:-/var/log/gymsetu-backup.log}"
# Set S3_DEST (e.g. s3://gymsetu-backups/db) to enable offsite copies. Without
# it the script still runs and still protects you from a bad migration or a
# fat-fingered DELETE — but NOT from losing the instance. Offsite is the point.
S3_DEST="${S3_DEST:-}"

STAMP="$(date -u +%F_%H%M)"
DEST="${BACKUP_DIR}/${STAMP}"

log() { echo "[$(date -u '+%F %T') UTC] $*" | tee -a "$LOG_FILE"; }

fail() {
  log "FAILED: $*"
  echo "FAIL $(date -u +%FT%TZ) $*" > "$STATUS_FILE"
  # Leave a failed attempt's partial files behind for diagnosis, but never let
  # them masquerade as a backup.
  [ -d "$DEST" ] && mv "$DEST" "${DEST}.FAILED" 2>/dev/null || true
  exit 1
}

# Overlapping runs would have two pg_dumps competing; if a run is somehow still
# going when the next fires, skip rather than pile up.
exec 9>/var/lock/gymsetu-backup.lock
flock -n 9 || { log "another backup is still running; skipping"; exit 0; }

mkdir -p "$DEST"
log "starting backup -> ${DEST}"

# ── 1. Roles/globals ────────────────────────────────────────────────────────
# pg_dump does NOT include roles. Restoring into a fresh cluster without these
# fails on every GRANT to anon/authenticated/service_role.
docker exec "$DB_CONTAINER" pg_dumpall -U postgres --globals-only 2>/dev/null \
  | gzip > "${DEST}/globals.sql.gz" || fail "pg_dumpall globals failed"

# ── 2. The database ─────────────────────────────────────────────────────────
# pipefail matters here: without it, a pg_dump that dies mid-stream still
# produces a valid gzip of a truncated dump and exits 0.
set -o pipefail
docker exec "$DB_CONTAINER" pg_dump -U postgres --no-owner postgres 2>/dev/null \
  | gzip > "${DEST}/db.sql.gz" || fail "pg_dump failed"

# ── 3. Storage volume (member photos etc.) ──────────────────────────────────
if [ -d "$STORAGE_DIR" ]; then
  tar -czf "${DEST}/storage.tar.gz" -C "$(dirname "$STORAGE_DIR")" \
      "$(basename "$STORAGE_DIR")" 2>/dev/null || fail "storage tar failed"
else
  log "WARN: storage dir ${STORAGE_DIR} not found — skipping file backup"
fi

# ── 4. VERIFY — the whole point ─────────────────────────────────────────────
gzip -t "${DEST}/db.sql.gz"      || fail "db.sql.gz is corrupt"
gzip -t "${DEST}/globals.sql.gz" || fail "globals.sql.gz is corrupt"
[ -f "${DEST}/storage.tar.gz" ] && { gzip -t "${DEST}/storage.tar.gz" || fail "storage.tar.gz is corrupt"; }

# A dump that gzips cleanly can still be empty or a permissions-error message.
# Insist the real schema is in there.
#
# NOTE: grep -c, not grep -q, on purpose. `zcat f | grep -q x` exits 141 under
# `set -o pipefail` even on success: grep -q stops reading at the first match,
# zcat takes SIGPIPE, and pipefail reports the pipeline as failed. That made
# this script condemn a perfectly good dump on its first run. grep -c reads to
# EOF, so there's no SIGPIPE; it exits 1 on zero matches, hence the `|| true`.
for marker in "CREATE TABLE public.members" "CREATE TABLE public.payments" "CREATE TABLE public.member_plans"; do
  N=$(zcat "${DEST}/db.sql.gz" | grep -c "$marker" || true)
  [ "${N:-0}" -gt 0 ] || fail "db.sql.gz missing '${marker}' — dump is not a real backup"
done

SIZE=$(stat -c %s "${DEST}/db.sql.gz")
[ "$SIZE" -gt 10240 ] || fail "db.sql.gz is only ${SIZE} bytes — suspiciously small"
log "verified: db.sql.gz ${SIZE} bytes, schema markers present"

# ── 5. Offsite ──────────────────────────────────────────────────────────────
if [ -n "$S3_DEST" ]; then
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "$DEST" "${S3_DEST}/${STAMP}/" --recursive --only-show-errors \
      || fail "S3 upload to ${S3_DEST} failed"
    log "uploaded to ${S3_DEST}/${STAMP}/"
  else
    fail "S3_DEST is set but the aws CLI is not installed"
  fi
else
  log "WARN: S3_DEST unset — this backup is LOCAL ONLY and will not survive losing the instance"
fi

# ── 6. Prune (only now that this backup is known good) ──────────────────────
find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' -mtime "+${KEEP_DAYS}" \
  -exec rm -rf {} + 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type d -name '*.FAILED' -mtime +3 \
  -exec rm -rf {} + 2>/dev/null || true

COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name '20*' | wc -l)
TOTAL=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "OK — ${COUNT} backups retained, ${TOTAL} total"
echo "OK $(date -u +%FT%TZ) size=${SIZE} kept=${COUNT}" > "$STATUS_FILE"

# ── 7. Nag about the one thing this script can't do for you ─────────────────
if [ ! -f "${BACKUP_DIR}/.env-was-saved-elsewhere" ]; then
  log "REMINDER: supabase/docker/.env (JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY,"
  log "  POSTGRES_PASSWORD) is NOT in this backup by design. Without JWT_SECRET"
  log "  these dumps cannot be restored into a working stack. Save it to a"
  log "  password manager, then: touch ${BACKUP_DIR}/.env-was-saved-elsewhere"
fi
