-- ============================================================================
-- GYMSETU — Daily WhatsApp reminder cron  (RECONSTRUCTED)
-- Original was a Supabase scheduled trigger @ 09:00 IST that scanned
-- member_plans + attendance and fired send-whatsapp reminder templates.
--
-- This recreates it with pg_cron + pg_net. Run AFTER schema.sql, and AFTER
-- the send-whatsapp edge function is deployed and its templates approved.
--
-- Self-hosted default URL is https://api.gymsetu.it.com/functions/v1/send-whatsapp
-- (change it below if your domain differs). webhook_secret must equal the
-- WEBHOOK_SECRET env set on the send-whatsapp function (default gymsetu_webhook_2026).
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- Config: store the function URL + secret once so the job can read them.
-- ----------------------------------------------------------------------------
create table if not exists app_config (key text primary key, value text);
insert into app_config (key, value) values
  ('whatsapp_fn_url', 'https://api.gymsetu.it.com/functions/v1/send-whatsapp'),
  ('webhook_secret',  'gymsetu_webhook_2026'),
  -- anon key is required so the request passes the Kong gateway; set the real
  -- value when loading (it's the public anon key, safe to store here).
  ('anon_key',        'REPLACE_WITH_ANON_KEY')
on conflict (key) do update set value = excluded.value;

-- ----------------------------------------------------------------------------
-- The daily job body
-- ----------------------------------------------------------------------------
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
    -- flip status so we don't message again tomorrow
    update member_plans set status = 'expired' where id = r.plan_id;
  end loop;

  -- 3) INACTIVE NUDGE — active member, no attendance in the last 7 days.
  --    NOTE: attendance.member_id can be members.id OR profiles.id depending on
  --    how the check-in was recorded, so we match on either.
  for r in
    select m.phone, m.full_name as member_name, g.name as gym_name, g.id as gym_id
    from members m
    join gyms g on g.id = m.gym_id
    where m.status = 'active' and m.phone is not null
      and not exists (
        select 1 from attendance a
        where a.check_in_date >= current_date - 7
          and (a.member_id = m.id or a.member_id = m.user_id)
      )
  loop
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',secret,'Authorization','Bearer '||anon,'apikey',anon),
      body    := jsonb_build_object(
        'type','inactive_nudge','phone',r.phone,'gym_id',r.gym_id,
        'data', jsonb_build_object('member_name',r.member_name,'gym_name',r.gym_name,
                                   'days_inactive', 7))
    );
  end loop;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- Schedule: 09:00 IST == 03:30 UTC, every day
-- ----------------------------------------------------------------------------
select cron.schedule('gymsetu-daily-whatsapp', '30 3 * * *', $$ select run_daily_whatsapp_reminders(); $$);

-- To inspect / remove:
--   select * from cron.job;
--   select cron.unschedule('gymsetu-daily-whatsapp');
