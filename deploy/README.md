# GymSetu — deploy/ (AWS self-host helpers)

Ready-made config so the self-host launch is mostly copy-paste.
Full narrative steps live in **`../database/AWS_SELFHOST.md`** — this folder is the "what goes where".

| File | Where it goes on the server | Purpose |
|---|---|---|
| `gen-keys.mjs` | run anywhere with Node | Generates `ANON_KEY` + `SERVICE_ROLE_KEY` from your `JWT_SECRET` (skips Supabase's web tool) |
| `.env.gymsetu.example` | append into `supabase/docker/.env` | The extra keys GymSetu needs (function secrets + reminders) |
| `docker-compose.override.yml` | copy into `supabase/docker/` | Injects function secrets into the edge runtime |
| `Caddyfile` | `/etc/caddy/Caddyfile` | HTTPS reverse proxy → Kong :8000 |
| `backup.sh` | `/usr/local/bin/gymsetu-backup` + `/etc/cron.d/gymsetu-backup` | Nightly verified backup: DB + storage volume, local, optional S3 |

## Fast path (order of operations)
1. EC2 up + Docker installed (AWS_SELFHOST.md steps 1–2).
2. `git clone supabase`, `cd supabase/docker`, `cp .env.example .env`.
3. Generate secrets:
   ```bash
   JWT_SECRET=$(openssl rand -hex 40)
   node /path/to/deploy/gen-keys.mjs "$JWT_SECRET"
   ```
   Put `JWT_SECRET`, the two printed keys, `POSTGRES_PASSWORD`, dashboard creds,
   and the URLs into `.env` (see `.env.gymsetu.example`).
4. Copy `docker-compose.override.yml` into `supabase/docker/` and append the
   function secrets to `.env`.
5. `docker compose up -d`.
6. Load DB: pipe `database/schema.sql` then `database/cron.sql` into the `db` container.
7. Drop the 3 function folders into `supabase/docker/volumes/functions/`.
8. Caddy + Cloudflare DNS for `api.gymsetu.it.com` (Caddyfile).
9. Point `app/.env` at `https://api.gymsetu.it.com` + the `ANON_KEY`.
10. Smoke test; install `backup.sh` (see below).

## Backups
Installed and running as of 2026-07-17 (20:30 UTC / 02:00 IST nightly):
```bash
sudo cp deploy/backup.sh /usr/local/bin/gymsetu-backup && sudo chmod +x /usr/local/bin/gymsetu-backup
sudo cp deploy/cron.d-gymsetu-backup /etc/cron.d/gymsetu-backup   # or write it by hand
sudo /usr/local/bin/gymsetu-backup                                # run once, don't wait for night
```
Backups land in `/var/backups/gymsetu/<UTC stamp>/` (db + globals + storage), 14-day retention.
Health: `cat /var/log/gymsetu-backup.status` → `OK <iso8601> size=… kept=…`, or `FAIL …`.

**Offsite: enabled 2026-07-17.** Copies go to `s3://gymsetu--backup/db/<stamp>/`
(ap-south-1) using the `gymsetu-ec2-backup` instance role — no access keys on the
box. Verified end to end: all three files land in the bucket, and a broken
`S3_DEST` makes the backup FAIL loudly rather than silently skipping offsite.

The role can `s3:PutObject` and `s3:ListBucket` and **nothing else** — no
GetObject, no DeleteObject. So root on this instance can write backups but cannot
read or destroy them; with bucket versioning on, they can't be overwritten with
garbage either. An attacker with root already has the live DB, so read access
would buy them little, while delete protection is what actually saves you.

⚠️ Consequence: **the box cannot verify its own S3 copies** (HeadObject 403s by
design). Local dumps are verified before upload and `aws s3 cp` checksums the
transfer, but round-tripping an S3 object is a manual job — download one from the
console occasionally and confirm it restores. A backup nobody has restored is a
hypothesis.

Bucket name is `gymsetu--backup` — **two hyphens**. The IAM policy Resource ARN
must match exactly; a mismatch 403s every upload (it did, first try).

⚠️ **`supabase/docker/.env` is deliberately NOT backed up.** Restoring is
impossible without `JWT_SECRET` — a new one invalidates every session and
changes the `ANON_KEY` that is compiled into the shipped app bundle and the
Caddyfile. It never changes, so put it in a password manager once rather than
copying secrets offsite nightly.

**Restore is tested, not assumed** (2026-07-17): restored into a scratch DB and
compared against live — 42 public tables, 97 RLS policies, 41 RLS-enabled
tables, and all row counts matched. Expect ~82 errors from Supabase-internal
schemas (`realtime`, `vault`, default privileges) when restoring as `postgres`
rather than `supabase_admin`; they don't affect app data or RLS.

⚠️ Confirm the edge-functions service name with `docker compose ps` — the override
assumes it's `functions`. Rename in the override if your version differs.
