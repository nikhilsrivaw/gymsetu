-- ============================================================================
-- Complaints — members raise issues, the gym resolves them. (2026-07-19)
--
-- Replaces the old "Complaints & Injuries" stub. Injuries dropped entirely —
-- it's just complaints.
--
-- member_id is profiles.id (= auth.uid() for a logged-in member), matching the
-- progress_logs/weight_logs convention so the "self" policy is a plain
-- member_id = auth.uid() with no join.
--
-- RLS:
--   * member  → can INSERT their own complaint and SELECT only their own.
--               They can NEVER see another member's complaint, and cannot
--               change status/response (that's the gym's job) — enforced by a
--               trigger, since a column-level UPDATE grant can't express it.
--   * staff   → the gym's own manager/staff can read and update everything for
--               their gym (respond, change status).
--   * admin   → platform super-admin.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists complaints (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid not null references gyms(id) on delete cascade,
  member_id    uuid not null references profiles(id) on delete cascade,

  category     text not null default 'other'
                 check (category in ('equipment','cleanliness','staff','crowding','facilities','billing','other')),
  subject      text not null,
  description  text,

  status       text not null default 'open'
                 check (status in ('open','in_progress','resolved')),
  response     text,                 -- the gym's reply back to the member
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id) on delete set null,

  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists complaints_gym_idx    on complaints (gym_id, status);
create index if not exists complaints_member_idx on complaints (member_id);
create index if not exists complaints_open_idx   on complaints (gym_id) where status <> 'resolved';

drop trigger if exists touch_complaints on complaints;
create trigger touch_complaints before update on complaints
  for each row execute function touch_updated_at();

-- Members must not be able to resolve their own complaint or write the gym's
-- response. RLS grants row access; this guards the specific columns.
create or replace function guard_complaint_member_update()
returns trigger as $$
begin
  if is_gym_staff() or is_super_admin() then
    return new;                       -- gym side may change anything
  end if;
  if new.status      is distinct from old.status
  or new.response    is distinct from old.response
  or new.resolved_at is distinct from old.resolved_at
  or new.resolved_by is distinct from old.resolved_by then
    raise exception 'Only gym staff can change a complaint''s status or response';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists complaints_member_guard on complaints;
create trigger complaints_member_guard before update on complaints
  for each row execute function guard_complaint_member_update();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table complaints enable row level security;

drop policy if exists complaints_admin        on complaints;
drop policy if exists complaints_staff        on complaints;
drop policy if exists complaints_self_select  on complaints;
drop policy if exists complaints_self_insert  on complaints;
drop policy if exists complaints_self_update  on complaints;

create policy complaints_admin on complaints
  for all using (is_super_admin()) with check (is_super_admin());

create policy complaints_staff on complaints
  for all
  using      (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());

-- A member sees ONLY their own complaints.
create policy complaints_self_select on complaints
  for select using (member_id = auth.uid());

-- A member may raise a complaint for themselves, in their own gym.
create policy complaints_self_insert on complaints
  for insert with check (member_id = auth.uid() and gym_id = get_my_gym_id());

-- A member may edit their own text (guarded above from touching status/response).
create policy complaints_self_update on complaints
  for update using (member_id = auth.uid()) with check (member_id = auth.uid());

grant select, insert, update, delete on complaints to authenticated;
