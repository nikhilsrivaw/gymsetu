# GymSetu — Supabase Restore Runbook

The old Supabase project was deleted. This rebuilds the backend from scratch.
Everything the app needs is in this repo. Follow top to bottom.

---

## 0. What you need on hand
- A Groq API key → `GROQ_API_KEY`
- Meta WhatsApp: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` (+ approved templates)
- Access to your Cloudflare worker (`gymsetu.nikhilksrivastav190.workers.dev`)

---

## 1. Create a fresh Supabase project
1. supabase.com → New project. Pick a region close to India (e.g. Mumbai/`ap-south-1`).
2. Note the **Project URL**, **anon key**, **service_role key** (Settings → API).
3. Note the **project ref** (the `xxxx` in `xxxx.supabase.co`).

## 2. Run the schema
1. SQL Editor → paste all of **`database/schema.sql`** → Run.
   - Creates 27 tables, indexes, triggers, RLS, and the `gym-logos` storage bucket.
   - Should complete with no errors on a clean project.

## 3. Auth settings
- Authentication → Providers → Email: **turn OFF "Confirm email"**.
  (Required — members/trainers are created programmatically with no inbox.)
- (Optional, later) enable Google provider for owner login.

## 4. Deploy the 3 edge functions
From the repo root (Supabase CLI installed + `supabase login`):
```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase functions deploy ai-assistant
supabase functions deploy create-gym-user
supabase functions deploy send-whatsapp
```

## 5. Set edge-function secrets
```bash
supabase secrets set GROQ_API_KEY=<groq_key>
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=<meta_phone_id>
supabase secrets set WHATSAPP_ACCESS_TOKEN=<meta_token>
supabase secrets set WEBHOOK_SECRET=gymsetu_webhook_2026
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them.

## 6. Create the daily cron
1. Database → Extensions → enable **pg_cron** and **pg_net**.
2. Edit **`database/cron.sql`**: replace `PROJECT_REF` with your project ref, and
   confirm the webhook secret matches step 5.
3. SQL Editor → paste `database/cron.sql` → Run.
4. Verify: `select * from cron.job;`

## 7. Rewire the app to the new project
- Edit `app/.env`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=<new project url OR the Cloudflare worker url>
  EXPO_PUBLIC_SUPABASE_ANON_KEY=<new anon key>
  ```
- **Cloudflare worker**: the proxy points at the OLD project. Update the worker's
  upstream/origin to the **new** `https://<project_ref>.supabase.co`, then keep
  `EXPO_PUBLIC_SUPABASE_URL` pointed at the worker (recommended — it's your ISP
  workaround). If you skip the worker, point the env var straight at the new
  Supabase URL.

## 8. Smoke test
1. `cd app && npx expo start --web`
2. Register a new owner (creates gym + profile).
   - If register fails on "email confirmation", re-check step 3.
3. Add a member (invokes `create-gym-user`) → confirm a code/password is returned
   and rows appear in `profiles` + `members`.
4. Dashboard AI "Analyse" → confirms `ai-assistant` + `GROQ_API_KEY`.
5. (If WhatsApp templates are live) trigger a welcome/announcement.

---

## Notes / gotchas baked into the rebuild
- **`risk_scan`** was added to `ai-assistant` (the Members-list AI risk scan called
  a type the function didn't have — it would have 400'd).
- **member_id ambiguity**: some tables store `members.id`, others `profiles.id`.
  Those columns are intentionally plain `uuid` (no hard FK) so every insert works.
- **RLS** is tenant-scoped by `gym_id` and functional for all 4 roles, but
  permissive — tighten before a hardened production launch.
- **Data** from the old project is gone (deletion is permanent). This restores
  structure + logic only.
- The old `database/schema.sql` (v1, 11 tables) was replaced by the full 27-table
  reconstruction.
