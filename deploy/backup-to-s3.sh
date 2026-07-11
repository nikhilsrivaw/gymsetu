#!/usr/bin/env bash
# Daily GymSetu Postgres backup -> S3. Run from supabase/docker/.
# Usage:  ./backup-to-s3.sh s3://your-bucket/gymsetu
# Cron:   0 3 * * * cd /home/ubuntu/supabase/docker && /home/ubuntu/backup-to-s3.sh s3://your-bucket/gymsetu >> /var/log/gymsetu-backup.log 2>&1
set -euo pipefail

DEST="${1:?Usage: backup-to-s3.sh s3://your-bucket/gymsetu}"
STAMP="$(date +%F_%H%M)"
FILE="gymsetu_${STAMP}.sql.gz"

echo "[$(date)] dumping database..."
docker compose exec -T db pg_dump -U postgres postgres | gzip > "/tmp/${FILE}"

echo "[$(date)] uploading ${FILE} -> ${DEST}"
aws s3 cp "/tmp/${FILE}" "${DEST}/${FILE}"
rm -f "/tmp/${FILE}"

echo "[$(date)] done."
