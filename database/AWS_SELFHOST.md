# GymSetu — Self-Host Supabase on AWS (Docker)

Run the full open-source Supabase stack on your own AWS EC2 instance.
You pay **only AWS** (from your $1200 credit). Supabase-the-company: $0.
The app needs **no code changes** — you just point its URL + keys at this server.

Total stack (all Docker containers on one EC2):
Postgres · GoTrue (auth) · PostgREST (REST API) · Storage · Kong (API gateway,
port 8000) · Edge Functions (Deno) · Studio (admin UI) · Realtime · imgproxy.

---

## 1. Launch the EC2 instance
- **AMI:** Ubuntu Server 24.04 LTS (x86_64)
- **Type:** `t3.medium` (2 vCPU / 4 GB) to start — ~$30/mo, credit lasts ~3 yrs.
  Bump to `t3.large` (8 GB) if it feels tight (the full stack is ~10 containers).
- **Storage:** 40 GB gp3 (holds DB + images + Docker).
- **Key pair:** create/download one for SSH.
- **Security group (inbound):**
  | Port | Source | Why |
  |---|---|---|
  | 22 | *your IP only* | SSH |
  | 80 | 0.0.0.0/0 | HTTP (Caddy/Cloudflare) |
  | 443 | 0.0.0.0/0 | HTTPS |

  Do **not** expose 8000/5432 publicly — traffic reaches Kong through 80/443 via the reverse proxy.
- Allocate an **Elastic IP** and associate it (so the IP is stable across reboots).

## 2. Install Docker
SSH in (`ssh -i key.pem ubuntu@<elastic-ip>`), then:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu && newgrp docker
docker --version && docker compose version
```

## 3. Get the Supabase self-host stack
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

## 4. Configure `.env` (the important part)
Edit `.env`. **Every default here is public/demo — change them all.**
```bash
# --- Secrets (generate strong random values) ---
POSTGRES_PASSWORD=<run: openssl rand -hex 24>
JWT_SECRET=<run: openssl rand -hex 40>          # min 32 chars
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<strong password for Studio login>

# --- ANON_KEY & SERVICE_ROLE_KEY ---
# These are JWTs signed with the JWT_SECRET above. Generate them with Supabase's
# key generator: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
# Paste the two resulting tokens:
ANON_KEY=<generated anon jwt>
SERVICE_ROLE_KEY=<generated service_role jwt>

# --- URLs (use your domain from step 7) ---
SITE_URL=https://api.gymsetu.it.com
API_EXTERNAL_URL=https://api.gymsetu.it.com
SUPABASE_PUBLIC_URL=https://api.gymsetu.it.com

# --- Auth: members/trainers are created programmatically → no email confirm ---
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_EMAIL_SIGNUP=true
```

## 5. Start the stack
```bash
docker compose pull
docker compose up -d
docker compose ps        # all services should be "healthy"
```
Studio is now reachable through Kong on port 8000 (we'll put TLS in front next).

## 6. Load the database — RUN IN THIS ORDER
The DB is **shared by the app AND the website** (gymsetu.it.com). Run these
files in order (the later ones ALTER tables the first one creates):

| # | File | Adds |
|---|---|---|
| 1 | `database/schema.sql` | 27 app tables + RLS + storage + helpers |
| 2 | `GYMSETU--WEB/sql/pricing-migration.sql` | subscriptions columns, `purchases`, token log |
| 3 | `GYMSETU--WEB/sql/payu-migration.sql` | PayU columns on subscriptions + purchases |
| 4 | `GYMSETU--WEB/sql/franchise-migration.sql` | 9 `franchise_*` tables (skip if not using franchise) |
| 5 | `database/website_shared.sql` | `support_tickets`, `waitlist` (public forms) |

The `supabase/postgres` image already includes **pg_cron** and **pg_net**.
```bash
# copy the SQL up to the server (from your PC):
#   scp -i key.pem database/schema.sql database/website_shared.sql database/cron.sql \
#       GYMSETU--WEB/sql/pricing-migration.sql GYMSETU--WEB/sql/payu-migration.sql \
#       GYMSETU--WEB/sql/franchise-migration.sql ubuntu@<ip>:~/

for f in schema.sql pricing-migration.sql payu-migration.sql franchise-migration.sql website_shared.sql; do
  echo ">>> $f"; docker compose exec -T db psql -U postgres -d postgres < ~/$f
done
```
Then the cron (already points at `https://api.gymsetu.it.com/functions/v1/send-whatsapp`):
```bash
docker compose exec -T db psql -U postgres -d postgres < ~/cron.sql
```
(You can also paste each file into Studio → SQL Editor, in the order above.)

> Why the order works: my `schema.sql` names its inline checks
> `subscriptions_status_check` / `subscriptions_plan_check` and the unique
> `subscription_tokens_gym_id_month_year_key` — exactly the names the website
> migrations `DROP ... IF EXISTS` and recreate. So they layer cleanly.

## 7. Domain + HTTPS (use your existing Cloudflare)
The app needs HTTPS. Easiest with your Cloudflare account:
1. Cloudflare DNS → add an **A record**: `api.gymsetu.it.com` → your Elastic IP, **Proxied (orange cloud)**. Cloudflare terminates TLS for you.
2. On the EC2, put a tiny reverse proxy in front of Kong so 443/80 → Kong:8000.
   Add a **Caddy** service (auto-HTTPS, or plain HTTP if Cloudflare handles TLS).
   Minimal `Caddyfile`:
   ```
   api.gymsetu.it.com {
       reverse_proxy localhost:8000
   }
   ```
   ```bash
   sudo apt install -y caddy
   sudo nano /etc/caddy/Caddyfile   # paste the above
   sudo systemctl restart caddy
   ```
   (Set Cloudflare SSL mode to "Full".)

Alternative: keep your existing **Cloudflare Worker** proxy and just change its
upstream/origin to `https://api.gymsetu.it.com`.

## 8. Deploy ALL 5 edge functions (self-host way)
Self-hosted serves functions from the `functions` volume — no `supabase functions deploy`.
There are **5** across both surfaces: 3 from the app, 2 from the website (PayU).
```bash
# app functions (from supabase/functions):
cp -r ~/app-functions/ai-assistant     volumes/functions/ai-assistant
cp -r ~/app-functions/create-gym-user  volumes/functions/create-gym-user
cp -r ~/app-functions/send-whatsapp    volumes/functions/send-whatsapp
# website functions (from GYMSETU--WEB/supabase/functions):
cp -r ~/web-functions/payu-initiate    volumes/functions/payu-initiate
cp -r ~/web-functions/payu-callback    volumes/functions/payu-callback
```
Add ALL secrets to `.env` (the edge-runtime reads them via docker-compose.override.yml):
```bash
# app:
GROQ_API_KEY=gsk_...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WEBHOOK_SECRET=gymsetu_webhook_2026
# website (PayU) — see GYMSETU--WEB/docs/PAYU_SETUP.md:
PAYU_MERCHANT_KEY=...
PAYU_SALT=...
PAYU_MODE=test          # or 'live'
APP_URL=https://gymsetu.it.com
# website AI:
GEMINI_API_KEY=...
```
Wire these into the functions container (extend `deploy/docker-compose.override.yml`
to include the PayU/Gemini/APP_URL vars too). `SUPABASE_URL` / `SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically. Reload:
```bash
docker compose up -d functions   # confirm the service name via `docker compose ps`
```
Test: `curl https://api.gymsetu.it.com/functions/v1/ai-assistant` (should respond).

## 8b. Point the WEBSITE at the new backend too
The website (`GYMSETU--WEB`) shares this DB. Update its `.env`:
```
VITE_SUPABASE_URL=https://api.gymsetu.it.com
VITE_SUPABASE_ANON_KEY=<same ANON_KEY from step 4>
```
Rebuild/redeploy the website (Vercel or wherever it's hosted) so owner
registration + PayU checkout write into the new shared database.

## 9. Point the app at your server
Edit `app/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://api.gymsetu.it.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=<the ANON_KEY from step 4>
```
Restart Expo (`npx expo start --web`) and hard-refresh.

## 10. Smoke test (same as before)
1. Register an owner → gym + profile created.
2. Add a member → `create-gym-user` returns code/password; rows in profiles + members.
3. Dashboard "Analyse" → `ai-assistant` + GROQ works.
4. Upload a gym logo → `gym-logos` storage works.

---

## Ops you now own (previously Supabase's job)
- **Backups (important!):** schedule `pg_dump` to S3 daily. Example cron on the host:
  ```bash
  docker compose exec -T db pg_dump -U postgres postgres | gzip > backup_$(date +%F).sql.gz
  aws s3 cp backup_$(date +%F).sql.gz s3://<your-bucket>/gymsetu/
  ```
- **Updates:** `docker compose pull && docker compose up -d` periodically.
- **Security:** keep 22 locked to your IP; never expose 5432/8000 publicly; rotate keys.
- **Monitoring:** `docker compose logs -f <service>`; consider CloudWatch agent.

## Cost sanity check — DECISION: t3.medium
`t3.medium` on-demand (~$33) + 40 GB gp3 (~$4) + public IPv4 (~$3.6) + S3 backups
(~$1) + transfer (~$2) ≈ **~$43/mo**.
```
Supabase bill: $0   |   AWS: ~$43/mo from credit   |   Out of pocket: $0
```
- $1200 credit → **~27 months (~2.25 years)** on-demand.
- Add a **1-year Savings Plan / Reserved Instance** → EC2 ~35% cheaper → ~$30/mo → **~3+ years**.
- ⚠️ **Check the credit's EXPIRY date** in AWS Billing — Activate credits often
  expire 1–2 yrs from issue regardless of balance; that may be the real limit.
- Only upsize to t3.large if the server actually feels slow under real load.
