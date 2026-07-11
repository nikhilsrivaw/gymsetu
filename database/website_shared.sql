-- ============================================================================
-- GYMSETU — WEBSITE-ONLY TABLES (support_tickets, waitlist)
-- Run AFTER schema.sql. These two are written by the public website
-- (gymsetu.it.com) contact + waitlist forms and have no migration of their own.
-- Both accept ANONYMOUS inserts (visitors aren't logged in).
--
-- The website's other extra tables (purchases, subscriptions columns,
-- franchise_*) come from GYMSETU--WEB/sql/*.sql — see the run order in
-- database/AWS_SELFHOST.md.
-- ============================================================================

-- Public contact form (src/components/ContactForm.tsx)
create table if not exists support_tickets (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;

-- anyone can submit a ticket; reads only via service role / dashboard
create policy support_tickets_anon_insert on support_tickets
  for insert to anon with check (true);
create policy support_tickets_auth_insert on support_tickets
  for insert to authenticated with check (true);

-- Public waitlist form (src/components/WaitlistForm.tsx)
create table if not exists waitlist (
  id            uuid primary key default gen_random_uuid(),
  owner_name    text,
  gym_name      text,
  city          text,
  phone         text,
  plan_interest text,
  created_at    timestamptz not null default now()
);

alter table waitlist enable row level security;

create policy waitlist_anon_insert on waitlist
  for insert to anon with check (true);
create policy waitlist_auth_insert on waitlist
  for insert to authenticated with check (true);
