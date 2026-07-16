-- ============================================================================
-- BIOMETRIC ATTENDANCE (ZKTeco / eSSL "ADMS" push devices)
-- ============================================================================
-- Attendance should cost the owner nothing. GPS didn't work (indoor gyms) and
-- manual marking is daily data entry. A biometric already at the door is the
-- only mechanism where the member does the work and the owner does nothing.
--
-- ZK-family devices (eSSL rebadges ZKTeco, so one protocol covers most of the
-- Indian market) can be pointed at an HTTP server and will POST every finger
-- scan to it in real time. See supabase/functions/biometric-push.
--
-- Trust model — read this before deploying:
--   The iClock protocol authenticates with NOTHING but the device serial
--   number, in cleartext. Anyone who learns a gym's SN could POST fake punches
--   for that gym. We mitigate by requiring the SN to be pre-registered by the
--   owner and by recording device IP + last_seen, but the residual risk is
--   real. It is bounded: attendance carries no money, and a punch can only
--   ever land on a PIN already mapped to a member of that one gym.
-- ============================================================================

begin;

-- The device enrolment number ("PIN" on the keypad), unique within a gym.
alter table members add column if not exists biometric_pin text;

drop index if exists members_gym_biometric_pin_idx;
create unique index members_gym_biometric_pin_idx
  on members (gym_id, biometric_pin)
  where biometric_pin is not null;

comment on column members.biometric_pin is
  'Enrolment number on the gym''s biometric device. Maps a device punch to this member.';

-- Registered devices. A punch is only accepted from an SN listed here.
create table if not exists biometric_devices (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid references gyms(id) on delete cascade not null,
  serial_number text not null unique,     -- the device's SN, as printed/shown in its menu
  name         text,                      -- "Front desk", owner-facing label
  active       boolean not null default true,
  last_seen_at timestamptz,               -- updated on every heartbeat
  last_ip      text,
  punches_today integer default 0,
  created_at   timestamptz default now()
);

create index if not exists biometric_devices_gym_idx on biometric_devices (gym_id);

alter table biometric_devices enable row level security;

-- Owners manage their own gym's devices; super admins see everything.
create policy biometric_devices_manager on biometric_devices for all
  using (gym_id = get_my_gym_id() and is_gym_manager())
  with check (gym_id = get_my_gym_id() and is_gym_manager());
create policy biometric_devices_admin on biometric_devices for all
  using (is_super_admin()) with check (is_super_admin());

-- ── Punch ingestion ─────────────────────────────────────────────────────────
-- SECURITY DEFINER because the device is not an authenticated user: it has no
-- JWT, so RLS would reject it. All authority comes from the SN lookup here.
-- Returns the number of punches actually recorded.
create or replace function record_biometric_punch(
  p_serial text,
  p_pin    text,
  p_ts     timestamptz
) returns integer language plpgsql security definer as $$
declare
  v_gym    uuid;
  v_active boolean;
  v_member uuid;   -- profiles.id — attendance keys on this, not members.id
begin
  select gym_id, active into v_gym, v_active
    from biometric_devices where serial_number = p_serial;
  if v_gym is null or not v_active then
    return 0;                       -- unregistered or disabled device: ignore
  end if;

  -- The PIN must map to a member OF THAT GYM. A device cannot punch for
  -- someone in another gym even if the PINs collide.
  select m.user_id into v_member
    from members m
   where m.gym_id = v_gym and m.biometric_pin = p_pin
   limit 1;
  if v_member is null then
    return 0;                       -- unmapped PIN (staff, guest, stale enrolment)
  end if;

  -- One check-in per member per day: the first scan is the check-in, later
  -- scans that day (leaving, re-entering) are ignored rather than erroring.
  insert into attendance (gym_id, member_id, check_in_date, check_in_time, method)
  values (v_gym, v_member, (p_ts at time zone 'Asia/Kolkata')::date,
          (p_ts at time zone 'Asia/Kolkata')::time, 'biometric')
  on conflict (member_id, check_in_date) do nothing;

  if not found then
    return 0;
  end if;
  return 1;
end $$;

-- Heartbeat/liveness, so the owner can see "device last seen 2 min ago"
-- instead of silently losing attendance for a week.
create or replace function touch_biometric_device(p_serial text, p_ip text)
  returns void language sql security definer as $$
  update biometric_devices
     set last_seen_at = now(), last_ip = coalesce(p_ip, last_ip)
   where serial_number = p_serial;
$$;

commit;

-- DOWN:
-- drop function if exists record_biometric_punch(text, text, timestamptz);
-- drop function if exists touch_biometric_device(text, text);
-- drop table if exists biometric_devices;
-- drop index if exists members_gym_biometric_pin_idx;
-- alter table members drop column if exists biometric_pin;
