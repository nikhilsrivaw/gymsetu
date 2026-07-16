-- ============================================================================
-- FREEZE / PAUSE MEMBERSHIP
-- ============================================================================
-- A gym freezes a plan when a member travels or is injured. The plan stops
-- counting down; on resume, end_date is pushed out by exactly the days frozen,
-- so the member gets back the time they paid for.
--
-- Why RPCs rather than app-side updates: a freeze touches three tables
-- (member_plans, members, profiles). The daily WhatsApp cron nudges on
-- members.status = 'active', so a freeze that updated only member_plans would
-- keep sending "we miss you, you haven't visited in 7 days" to someone who
-- told the gym they're away. Doing it in one transactional function makes a
-- partial freeze impossible.
--
-- Additive and reversible. DOWN block at the bottom.
-- ============================================================================

begin;

-- ── Schema ──────────────────────────────────────────────────────────────────
alter table member_plans drop constraint if exists member_plans_status_check;
alter table member_plans add constraint member_plans_status_check
  check (status in ('active','expired','cancelled','frozen'));

alter table member_plans add column if not exists frozen_at   date;
alter table member_plans add column if not exists frozen_days integer default 0;

comment on column member_plans.frozen_at is
  'Date the plan was frozen; null when running. end_date is extended by (resume date - frozen_at).';
comment on column member_plans.frozen_days is
  'Cumulative days this plan has spent frozen, for audit.';

-- ── Freeze ──────────────────────────────────────────────────────────────────
create or replace function freeze_member_plan(p_plan_id uuid)
  returns void language plpgsql security definer as $$
declare
  v_gym    uuid;
  v_member uuid;
begin
  select gym_id, member_id into v_gym, v_member from member_plans where id = p_plan_id;
  if v_gym is null then
    raise exception 'Plan not found';
  end if;
  -- Freezing pauses billing, so it is an owner/staff decision, not a trainer's.
  if not (is_super_admin() or (v_gym = get_my_gym_id() and is_gym_manager())) then
    raise exception 'Not allowed to freeze this plan';
  end if;

  update member_plans
     set status = 'frozen', frozen_at = current_date
   where id = p_plan_id and status = 'active';
  if not found then
    raise exception 'Only an active plan can be frozen';
  end if;

  update members  set status = 'frozen' where id = v_member;
  update profiles set status = 'frozen'
   where id = (select user_id from members where id = v_member);
end $$;

-- ── Resume ──────────────────────────────────────────────────────────────────
create or replace function resume_member_plan(p_plan_id uuid)
  returns date language plpgsql security definer as $$
declare
  v_gym      uuid;
  v_member   uuid;
  v_frozen   date;
  v_days     integer;
  v_new_end  date;
  v_status   text;
begin
  select gym_id, member_id, frozen_at into v_gym, v_member, v_frozen
    from member_plans where id = p_plan_id;
  if v_gym is null then
    raise exception 'Plan not found';
  end if;
  if not (is_super_admin() or (v_gym = get_my_gym_id() and is_gym_manager())) then
    raise exception 'Not allowed to resume this plan';
  end if;
  if v_frozen is null then
    raise exception 'This plan is not frozen';
  end if;

  -- Give back exactly the time paused.
  v_days := greatest(current_date - v_frozen, 0);

  update member_plans
     set end_date    = end_date + v_days,
         frozen_days = coalesce(frozen_days, 0) + v_days,
         frozen_at   = null,
         status      = case when end_date + v_days < current_date then 'expired' else 'active' end
   where id = p_plan_id
   returning end_date, status into v_new_end, v_status;

  update members  set status = v_status where id = v_member;
  update profiles set status = v_status
   where id = (select user_id from members where id = v_member);

  return v_new_end;
end $$;

grant execute on function freeze_member_plan(uuid), resume_member_plan(uuid) to authenticated;

commit;

-- ============================================================================
-- DOWN / rollback
-- ============================================================================
-- begin;
-- drop function if exists freeze_member_plan(uuid);
-- drop function if exists resume_member_plan(uuid);
-- -- unfreeze anything still paused before tightening the constraint back
-- update member_plans set status = 'active', frozen_at = null where status = 'frozen';
-- update members  set status = 'active' where status = 'frozen';
-- update profiles set status = 'active' where status = 'frozen';
-- alter table member_plans drop constraint if exists member_plans_status_check;
-- alter table member_plans add constraint member_plans_status_check
--   check (status in ('active','expired','cancelled'));
-- alter table member_plans drop column if exists frozen_at;
-- alter table member_plans drop column if exists frozen_days;
-- commit;
