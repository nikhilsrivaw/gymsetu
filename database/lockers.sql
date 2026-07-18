-- ============================================================================
-- Lockers — assign/free gym lockers to members. (2026-07-18)
--
-- One row per physical locker. member_id NULL = free; set = occupied.
-- Assignment is just an UPDATE of member_id (+ assigned_at); freeing sets it
-- back to NULL. No separate history table — a locker has one current holder.
--
-- member_id references profiles(id) — the member roster identity the owner
-- picks from (role='member'), same as attendance/trainer-assignment screens.
-- ON DELETE SET NULL so removing a member frees their locker, never orphans it.
--
-- RLS mirrors expenses: platform admin (is_super_admin) or the gym's own
-- manager (gym_id = get_my_gym_id() AND is_gym_manager()).
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists lockers (
  id            uuid primary key default uuid_generate_v4(),
  gym_id        uuid not null references gyms(id) on delete cascade,
  locker_number text not null,
  member_id     uuid references profiles(id) on delete set null,
  assigned_at   timestamptz,
  notes         text,
  created_at    timestamptz default now()
);

-- A locker number is unique within a gym (per branch).
create unique index if not exists lockers_gym_number_uidx
  on lockers (gym_id, lower(locker_number));

create index if not exists lockers_gym_idx    on lockers (gym_id);
create index if not exists lockers_member_idx  on lockers (member_id) where member_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table lockers enable row level security;

drop policy if exists lockers_admin   on lockers;
drop policy if exists lockers_manager on lockers;

create policy lockers_admin on lockers
  for all using (is_super_admin()) with check (is_super_admin());

create policy lockers_manager on lockers
  for all
  using      (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());

grant select, insert, update, delete on lockers to authenticated;
