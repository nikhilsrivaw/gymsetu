-- ============================================================================
-- RLS HARDENING — role-aware access within a gym
-- ============================================================================
-- Cross-tenant isolation was already correct: gym A cannot see gym B.
-- The problem was INSIDE a gym. Every policy was `gym_id = get_my_gym_id()`
-- for ALL commands with no role check, so a plain member could read every
-- other member's phone, read all payments, insert payments, extend their own
-- plan, delete other members, rename the gym, and promote themselves to owner.
--
-- Separately, `profiles_anon_code` granted the public `anon` role SELECT on
-- every profile carrying a member/trainer code — including the plaintext
-- password column — across all gyms, to a caller holding only the public anon
-- key. That policy existed solely so the login screen could look up gym
-- branding from a code; it is replaced by a narrow RPC returning branding only.
--
-- Model:
--   gym_owner / staff -> full access to their gym  (is_gym_manager())
--   trainer           -> roster + coaching data, no gym finances/settings
--   member            -> only their own rows
--
-- Additive and reversible: the *_admin super-admin policies are untouched.
-- A DOWN block is at the bottom.
-- ============================================================================

begin;

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- SECURITY DEFINER so they keep working once profiles is locked down.

create or replace function my_role() returns text
  language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_gym_manager() returns boolean
  language sql security definer stable as $$
  select coalesce((select role from profiles where id = auth.uid())
                  in ('gym_owner','staff'), false)
$$;

create or replace function is_gym_trainer() returns boolean
  language sql security definer stable as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'trainer', false)
$$;

-- owner, staff or trainer — anyone who legitimately sees the roster
create or replace function is_gym_staff() returns boolean
  language sql security definer stable as $$
  select coalesce((select role from profiles where id = auth.uid())
                  in ('gym_owner','staff','trainer'), false)
$$;

-- payments / member_plans / diet_plans key off members.id, not profiles.id
create or replace function my_member_id() returns uuid
  language sql security definer stable as $$
  select id from members where user_id = auth.uid() limit 1
$$;

grant execute on function my_role, is_gym_manager, is_gym_trainer,
                          is_gym_staff, my_member_id to authenticated;

-- ── Anon credential leak ────────────────────────────────────────────────────
-- Drop the blanket anon read and replace with branding-only lookup.
drop policy if exists profiles_anon_code on profiles;

create or replace function gym_branding_for_code(code text)
  returns table (gym_name text, logo_url text)
  language sql security definer stable as $$
  select g.name, g.logo_url
  from profiles p
  join gyms g on g.id = p.gym_id
  where upper(p.member_code)  = upper(trim(code))
     or upper(p.trainer_code) = upper(trim(code))
  limit 1
$$;

grant execute on function gym_branding_for_code(text) to anon, authenticated;

-- Members can no longer read other profiles, but the Gym Info screen still
-- legitimately shows who the owner and trainers are. Expose only the safe
-- columns (never phone/email/passwords) for the caller's own gym.
create or replace function gym_staff_directory()
  returns table (id uuid, full_name text, role text, specialty text, experience_years integer)
  language sql security definer stable as $$
  select p.id, p.full_name, p.role, p.specialty, p.experience_years
  from profiles p
  where p.gym_id = get_my_gym_id()
    and p.role in ('gym_owner','trainer')
$$;

grant execute on function gym_staff_directory() to authenticated;

-- ── Roster / billing core ───────────────────────────────────────────────────

drop policy if exists members_all on members;
create policy members_manager on members for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
-- trainers onboard members from (trainer)/add-member.tsx, but never delete
create policy members_trainer_read on members for select
  using (gym_id = get_my_gym_id() and is_gym_trainer());
create policy members_trainer_insert on members for insert
  with check (gym_id = get_my_gym_id() and is_gym_trainer());
create policy members_trainer_update on members for update
  using (gym_id = get_my_gym_id() and is_gym_trainer())
  with check (gym_id = get_my_gym_id() and is_gym_trainer());
create policy members_self on members for select
  using (user_id = auth.uid());

drop policy if exists member_plans_all on member_plans;
create policy member_plans_manager on member_plans for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy member_plans_trainer on member_plans for select
  using (gym_id = get_my_gym_id() and is_gym_trainer());
create policy member_plans_trainer_insert on member_plans for insert
  with check (gym_id = get_my_gym_id() and is_gym_trainer());
create policy member_plans_trainer_update on member_plans for update
  using (gym_id = get_my_gym_id() and is_gym_trainer())
  with check (gym_id = get_my_gym_id() and is_gym_trainer());
-- members may read their own plan (dates/status) but never write it
create policy member_plans_self on member_plans for select
  using (member_id = my_member_id());

drop policy if exists payments_all on payments;
create policy payments_manager on payments for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy payments_trainer_read on payments for select
  using (gym_id = get_my_gym_id() and is_gym_trainer());
create policy payments_trainer_insert on payments for insert
  with check (gym_id = get_my_gym_id() and is_gym_trainer());
-- members read their own invoices (the member Invoices screen)
create policy payments_self on payments for select
  using (member_id = my_member_id());

drop policy if exists attendance_all on attendance;
create policy attendance_staff on attendance for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
-- members check themselves in (GPS) and see their own history
create policy attendance_self_read on attendance for select
  using (member_id = auth.uid());
create policy attendance_self_insert on attendance for insert
  with check (member_id = auth.uid() and gym_id = get_my_gym_id());

-- plan catalogue: everyone in the gym may read, only managers may change
drop policy if exists membership_plans_all on membership_plans;
create policy membership_plans_manager on membership_plans for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy membership_plans_read on membership_plans for select
  using (gym_id = get_my_gym_id());

-- ── Coaching data ───────────────────────────────────────────────────────────

drop policy if exists progress_logs_all on progress_logs;
create policy progress_logs_staff on progress_logs for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy progress_logs_self on progress_logs for select
  using (member_id = auth.uid());

drop policy if exists weight_logs_all on weight_logs;
create policy weight_logs_staff on weight_logs for select
  using (gym_id = get_my_gym_id() and is_gym_staff());
create policy weight_logs_self on weight_logs for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists body_measurements_all on body_measurements;
create policy body_measurements_staff on body_measurements for select
  using (gym_id = get_my_gym_id() and is_gym_staff());
create policy body_measurements_self on body_measurements for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists workout_sessions_all on workout_sessions;
create policy workout_sessions_staff on workout_sessions for select
  using (gym_id = get_my_gym_id() and is_gym_staff());
create policy workout_sessions_self on workout_sessions for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- diet_plans.member_id references members(id)
drop policy if exists diet_plans_all on diet_plans;
create policy diet_plans_staff on diet_plans for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy diet_plans_self on diet_plans for select
  using (member_id = my_member_id());

drop policy if exists workout_plans_all on workout_plans;
create policy workout_plans_staff on workout_plans for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy workout_plans_read on workout_plans for select
  using (gym_id = get_my_gym_id());

drop policy if exists plan_assignments_all on plan_assignments;
create policy plan_assignments_staff on plan_assignments for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy plan_assignments_self on plan_assignments for select
  using (member_id = auth.uid());

-- ── Classes / announcements / equipment ─────────────────────────────────────

drop policy if exists gym_classes_all on gym_classes;
create policy gym_classes_manager on gym_classes for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy gym_classes_read on gym_classes for select
  using (gym_id = get_my_gym_id());

drop policy if exists class_bookings_all on class_bookings;
create policy class_bookings_staff on class_bookings for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy class_bookings_self on class_bookings for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid() and gym_id = get_my_gym_id());

drop policy if exists announcements_all on announcements;
create policy announcements_manager on announcements for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy announcements_read on announcements for select
  using (gym_id = get_my_gym_id());

drop policy if exists equipment_all on equipment;
create policy equipment_manager on equipment for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy equipment_read on equipment for select
  using (gym_id = get_my_gym_id());

-- ── Trainers directory ──────────────────────────────────────────────────────
-- trainers.trainer_password lives here, so members must not read the table.
drop policy if exists trainers_all on trainers;
create policy trainers_manager on trainers for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy trainers_self on trainers for select
  using (user_id = auth.uid());

drop policy if exists trainer_sessions_all on trainer_sessions;
create policy trainer_sessions_staff on trainer_sessions for all
  using (gym_id = get_my_gym_id() and is_gym_staff())
  with check (gym_id = get_my_gym_id() and is_gym_staff());
create policy trainer_sessions_read on trainer_sessions for select
  using (gym_id = get_my_gym_id());

-- ── Gym finances & settings — managers only ─────────────────────────────────

drop policy if exists expenses_all on expenses;
create policy expenses_manager on expenses for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());

drop policy if exists staff_all on staff;
create policy staff_manager on staff for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());

drop policy if exists staff_shifts_all on staff_shifts;
create policy staff_shifts_manager on staff_shifts for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());

drop policy if exists subscription_tokens_all on subscription_tokens;
create policy subscription_tokens_manager on subscription_tokens for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());

-- AI features burn tokens for everyone, so the log must stay insertable by any
-- gym user; reading the ledger is a manager concern.
drop policy if exists token_usage_log_all on token_usage_log;
create policy token_usage_log_manager on token_usage_log for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy token_usage_log_insert on token_usage_log for insert
  with check (gym_id = get_my_gym_id());

drop policy if exists subscriptions_own on subscriptions;
create policy subscriptions_own on subscriptions for all
  using (owner_id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_manager()))
  with check (owner_id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_manager()));

-- ── The gym record itself ───────────────────────────────────────────────────
-- Previously any gym user could rename the gym or move its GPS.
drop policy if exists gyms_update on gyms;
create policy gyms_update on gyms for update
  using (owner_id = auth.uid() or (id = get_my_gym_id() and is_gym_manager()))
  with check (owner_id = auth.uid() or (id = get_my_gym_id() and is_gym_manager()));

-- ── Profiles ────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_staff()));

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_manager()))
  with check (id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_manager()));

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert
  with check (id = auth.uid() or (gym_id = get_my_gym_id() and is_gym_staff()));

-- RLS is row-level, not column-level: the self-update policy above would still
-- let a member set their own role to 'gym_owner'. Lock the privileged columns.
create or replace function guard_profile_escalation() returns trigger
  language plpgsql security definer as $$
begin
  if is_super_admin() or is_gym_manager() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.gym_id is distinct from old.gym_id
     or new.trainer_id is distinct from old.trainer_id then
    raise exception 'not allowed to change role, gym or assigned trainer';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_escalation on profiles;
create trigger trg_guard_profile_escalation
  before update on profiles
  for each row execute function guard_profile_escalation();

commit;

-- ============================================================================
-- DOWN / rollback — restores the previous permissive policies.
-- ============================================================================
-- begin;
-- drop trigger if exists trg_guard_profile_escalation on profiles;
-- drop function if exists guard_profile_escalation();
-- drop function if exists gym_branding_for_code(text);
--
-- drop policy if exists members_manager on members;
-- drop policy if exists members_trainer_read on members;
-- drop policy if exists members_trainer_insert on members;
-- drop policy if exists members_trainer_update on members;
-- drop policy if exists members_self on members;
-- create policy members_all on members for all
--   using (gym_id = get_my_gym_id()) with check (gym_id = get_my_gym_id());
-- -- ...repeat the same shape for each table above...
--
-- create policy profiles_anon_code on profiles for select to anon
--   using (member_code is not null or trainer_code is not null);
-- commit;
