-- ============================================================================
-- Renewal nudge — replaces the old attendance-based inactive_nudge. (2026-07-18)
--
-- NEW RULE (plan-based, per owner's decision): nudge a member whose plan has
-- EXPIRED and who has NOT renewed / bought a new plan. Driven by plan data,
-- never attendance — so it can't misfire the way the old nudge did.
--
-- Anti-spam by construction: fires ONCE, on the exact day the plan is 7 days
-- past expiry, and only if the member still has no active plan. An exact-day
-- condition (end_date = current_date - 7) can match at most one morning, so
-- there is no "every day" behaviour — that was the whole failure of the old one.
--
-- Reuses the `membership_expired` template (already worded as a renewal/
-- win-back), so NO new Meta template approval is needed. The member sees:
--   day 0  → "membership expired on <date>… renew today"  (section 2)
--   day 7  → same win-back, if still not renewed             (section 3, this)
--
-- To change the timing, edit the `- 7` below (e.g. `- 3`). To add a second
-- nudge, add another loop with a different offset. Keep every trigger an
-- EXACT-day match, never a range, or it becomes daily spam again.
--
-- Idempotent CREATE OR REPLACE — safe to re-run.
-- ============================================================================

create or replace function run_daily_whatsapp_reminders()
returns void as $$
declare
  fn_url  text := (select value from app_config where key = 'whatsapp_fn_url');
  secret  text := (select value from app_config where key = 'webhook_secret');
  anon    text := (select value from app_config where key = 'anon_key');
  r       record;
begin
  -- 1) EXPIRY REMINDER — active plans ending in exactly 3 days
  for r in
    select m.phone, m.full_name as member_name, g.name as gym_name, g.id as gym_id,
           to_char(mp.end_date, 'DD Mon YYYY') as expiry_date,
           (mp.end_date - current_date) as days_left
    from member_plans mp
    join members m on m.id = mp.member_id
    join gyms    g on g.id = mp.gym_id
    where mp.status = 'active'
      and mp.end_date = current_date + 3
      and m.phone is not null
  loop
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',secret,'Authorization','Bearer '||anon,'apikey',anon),
      body    := jsonb_build_object(
        'type','expiry_reminder','phone',r.phone,'gym_id',r.gym_id,
        'data', jsonb_build_object('member_name',r.member_name,'gym_name',r.gym_name,
                                   'days_left',r.days_left,'expiry_date',r.expiry_date))
    );
  end loop;

  -- 2) MEMBERSHIP EXPIRED — active plans that end today
  for r in
    select mp.id as plan_id, m.phone, m.full_name as member_name,
           g.name as gym_name, g.id as gym_id,
           to_char(mp.end_date, 'DD Mon YYYY') as expiry_date
    from member_plans mp
    join members m on m.id = mp.member_id
    join gyms    g on g.id = mp.gym_id
    where mp.status = 'active'
      and mp.end_date = current_date
      and m.phone is not null
  loop
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',secret,'Authorization','Bearer '||anon,'apikey',anon),
      body    := jsonb_build_object(
        'type','membership_expired','phone',r.phone,'gym_id',r.gym_id,
        'data', jsonb_build_object('member_name',r.member_name,'gym_name',r.gym_name,
                                   'expiry_date',r.expiry_date))
    );
    update member_plans set status = 'expired' where id = r.plan_id;
  end loop;

  -- 3) RENEWAL NUDGE — plan expired exactly 7 days ago AND not renewed.
  --    Plan-based (reliable), fires once, reuses membership_expired template.
  for r in
    select distinct m.phone, m.full_name as member_name, g.name as gym_name, g.id as gym_id,
           to_char(mp.end_date, 'DD Mon YYYY') as expiry_date
    from member_plans mp
    join members m on m.id = mp.member_id
    join gyms    g on g.id = mp.gym_id
    where mp.end_date = current_date - 7
      and m.phone is not null
      -- not renewed: no currently-active plan
      and not exists (
        select 1 from member_plans act
        where act.member_id = mp.member_id
          and act.status = 'active'
          and act.end_date >= current_date
      )
      -- don't nudge a paused (frozen) membership
      and not exists (
        select 1 from member_plans frz
        where frz.member_id = mp.member_id
          and frz.status = 'frozen'
      )
  loop
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',secret,'Authorization','Bearer '||anon,'apikey',anon),
      body    := jsonb_build_object(
        'type','membership_expired','phone',r.phone,'gym_id',r.gym_id,
        'data', jsonb_build_object('member_name',r.member_name,'gym_name',r.gym_name,
                                   'expiry_date',r.expiry_date))
    );
  end loop;
end;
$$ language plpgsql security definer;
