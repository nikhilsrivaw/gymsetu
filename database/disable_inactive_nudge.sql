-- ============================================================================
-- Remove the INACTIVE NUDGE from the daily WhatsApp job.  (2026-07-17)
--
-- WHY: the nudge messaged every active member who had no attendance row in the
-- last 7 days. Attendance was broken until this week (member_id held members.id
-- in some rows and profiles.id in others, and the check-in date was computed in
-- UTC so it landed on the wrong day), so essentially NO member had usable
-- attendance history — and all 4 real members were being told "we haven't seen
-- you in 7 days" every morning at 09:00 IST regardless of whether they'd
-- actually come in. Verified live: cron.job_run_details shows a successful run
-- daily, and the nudge query still matched 4 of 4 active members.
--
-- SCOPE: this drops ONLY section 3. The job `gymsetu-daily-whatsapp` stays
-- scheduled and sections 1 (expiry reminder) and 2 (membership expired) are
-- unchanged — unscheduling the whole job would have silently killed those too,
-- since all three share one function.
--
-- IF YOU WANT IT BACK: don't just re-add it. The bug isn't the 7-day window,
-- it's that "no attendance rows" is indistinguishable from "this gym doesn't
-- track attendance". Gate it on members who have checked in at least once, e.g.
--   and exists (select 1 from attendance a
--               where a.member_id in (m.id, m.user_id))
-- so a gym that never uses check-ins never nudges anyone.
--
-- Idempotent: plain CREATE OR REPLACE, safe to run more than once.
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
  end loop;

  -- 3) INACTIVE NUDGE — removed 2026-07-17. See header.
end;
$$ language plpgsql security definer;
