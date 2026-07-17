-- ============================================================================
-- GYMSETU — Field sales leads (door-to-door gym canvassing)
--
-- For marketers walking gym to gym. One row per GYM (not per visit) — the row
-- is updated as the lead progresses, and `notes` carries the running story.
--
-- DESIGN NOTES (why it looks like this):
--
-- * `objection` and `liked` are CODED values, not free text. This is the whole
--   point of the exercise: if 30 of 50 rejections say price_high that's a
--   pricing decision; if they say uses_competitor that's a product problem.
--   Free text cannot be counted, so the reason is a dropdown and `notes` keeps
--   the human story alongside it.
--
-- * `owner_absent` is its own status. On a cold door-knock the single most
--   common outcome is that the owner isn't there and you spoke to a trainer or
--   the front desk. If that gets coded as 'lost' you will throw away half your
--   pipeline and your rejection stats will be nonsense.
--
-- * `approx_members` drives which plan to pitch (<=200 Pro, 200-500 Pro Plus,
--   500+ Pro Max), so it's the qualification field that decides whether a
--   second visit is worth the trip.
--
-- * `follow_up_on` exists because door-to-door deals die from silence, not from
--   rejection. The admin UI surfaces overdue follow-ups first.
--
-- * `phone` is deliberately NOT unique: two gyms can share an owner's number,
--   and a rep keying a duplicate should not hit a hard error mid-visit. The UI
--   warns on duplicates instead.
--
-- ACCESS: platform admins only, via is_super_admin() (see admin_access.sql).
-- Gym owners must never see this table — it holds notes about their rivals.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists leads (
  id             uuid primary key default uuid_generate_v4(),

  -- ── Who and where ──────────────────────────────────────────────────────
  gym_name       text not null,
  owner_name     text,
  phone          text not null,
  alt_phone      text,
  area           text,                       -- locality / landmark
  city           text,
  maps_url       text,                       -- paste a Google Maps link

  -- ── Qualification ──────────────────────────────────────────────────────
  approx_members integer check (approx_members is null or approx_members >= 0),
  current_system text check (current_system in
                   ('register','excel','whatsapp','competitor','other_software','nothing')),
  competitor_name text,

  -- ── Pipeline ───────────────────────────────────────────────────────────
  status         text not null default 'new' check (status in
                   ('new','owner_absent','visited','interested','demo_done','trial','won','lost')),
  interest       text check (interest in ('hot','warm','cold','none')),

  -- What they responded well to. Multi-select; drives the pitch and the roadmap.
  liked          text[] default '{}',

  -- Single primary reason they didn't buy. Counted, so keep the list short.
  objection      text check (objection in
                   ('price_high','happy_with_register','uses_competitor','not_tech_savvy',
                    'no_smartphone','needs_partner_approval','gym_too_small',
                    'missing_feature','no_time','other')),

  -- ── Action ─────────────────────────────────────────────────────────────
  visited_on     date,
  follow_up_on   date,
  notes          text,                       -- the running summary of the lead
  rep_name       text,                       -- which marketer walked in

  -- ── Meta ───────────────────────────────────────────────────────────────
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Overdue follow-ups are the main read pattern, then filtering by status/city.
create index if not exists leads_follow_up_idx on leads (follow_up_on) where follow_up_on is not null;
create index if not exists leads_status_idx    on leads (status);
create index if not exists leads_city_idx      on leads (city);
create index if not exists leads_phone_idx     on leads (phone);

drop trigger if exists touch_leads on leads;
create trigger touch_leads before update on leads
  for each row execute function touch_updated_at();

-- ── RLS: platform admins only ───────────────────────────────────────────────
-- Not "authenticated" — every gym owner is authenticated, and this table holds
-- notes about their competitors and what those gyms pay.
alter table leads enable row level security;

drop policy if exists leads_admin_all on leads;
create policy leads_admin_all on leads
  for all using (is_super_admin()) with check (is_super_admin());

grant select, insert, update, delete on leads to authenticated;
