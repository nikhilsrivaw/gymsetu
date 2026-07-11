# GymSetu — deploy/ (AWS self-host helpers)

Ready-made config so the self-host launch is mostly copy-paste.
Full narrative steps live in **`../database/AWS_SELFHOST.md`** — this folder is the "what goes where".

| File | Where it goes on the server | Purpose |
|---|---|---|
| `gen-keys.mjs` | run anywhere with Node | Generates `ANON_KEY` + `SERVICE_ROLE_KEY` from your `JWT_SECRET` (skips Supabase's web tool) |
| `.env.gymsetu.example` | append into `supabase/docker/.env` | The extra keys GymSetu needs (function secrets + reminders) |
| `docker-compose.override.yml` | copy into `supabase/docker/` | Injects function secrets into the edge runtime |
| `Caddyfile` | `/etc/caddy/Caddyfile` | HTTPS reverse proxy → Kong :8000 |
| `backup-to-s3.sh` | `~/` on the server, add to cron | Daily DB backup → S3 |

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
10. Smoke test; enable `backup-to-s3.sh` in cron.

⚠️ Confirm the edge-functions service name with `docker compose ps` — the override
assumes it's `functions`. Rename in the override if your version differs.
