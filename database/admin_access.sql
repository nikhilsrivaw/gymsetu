-- ============================================================================
-- ADMIN ACCESS — super-admin (platform operator) access for the /admin console
-- ============================================================================
-- SAFE TO RE-RUN. This migration is ADDITIVE: it does NOT alter or drop any
-- existing policy, so normal gym-owner / member / trainer access is unchanged.
-- It grants full read/write to rows for users whose email is in platform_admins.
--
-- To ADD an admin later:    insert into platform_admins(email) values ('you@x.com');
-- To REMOVE an admin:        delete from platform_admins where email = 'you@x.com';
-- To ROLL BACK entirely:     see the DOWN block at the bottom.
-- ============================================================================

-- 1. Allowlist of platform operators (matched against the JWT email) ----------
create table if not exists platform_admins (
  email       text primary key,
  note        text,
  created_at  timestamptz default now()
);

-- Seed platform operators. Change/add emails as needed. Case-insensitive at check.
insert into platform_admins (email, note) values
  ('nik@aqirox.com',     'Nikhil'),
  ('sam@aqirox.com',     'Sameer'),
  ('gymsetu@aqirox.com', 'GymSetu')
on conflict (email) do nothing;

-- 2. Predicate used by every admin policy -------------------------------------
create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from platform_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function is_super_admin() to authenticated;

-- Let admins read/manage the allowlist itself (RLS on the table).
alter table platform_admins enable row level security;
drop policy if exists platform_admins_admin on platform_admins;
create policy platform_admins_admin on platform_admins
  for all using (is_super_admin()) with check (is_super_admin());

-- 3. Additive admin policies on managed tables --------------------------------
-- Each is a SEPARATE permissive policy; Postgres ORs it with the existing ones,
-- so this only ever GRANTS access to admins and never restricts anyone.
do $$
declare
  t text;
  managed text[] := array[
    'gyms','profiles','subscriptions','subscription_tokens','token_usage_log',
    'members','trainers','payments','membership_plans','member_plans',
    'attendance','announcements','expenses','staff','purchases'
  ];
begin
  foreach t in array managed loop
    -- skip tables that don't exist in this database (e.g. purchases lives in the
    -- website-shared schema and may be absent on some environments)
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_admin', t);
    execute format(
      'create policy %I on %I for all using (is_super_admin()) with check (is_super_admin())',
      t || '_admin', t
    );
  end loop;
end $$;

-- ============================================================================
-- DOWN (rollback) — run manually if you ever need to remove admin access:
-- ============================================================================
-- do $$
-- declare t text; managed text[] := array[
--   'gyms','profiles','subscriptions','subscription_tokens','token_usage_log',
--   'members','trainers','payments','membership_plans','member_plans',
--   'attendance','announcements','expenses','staff','purchases'];
-- begin
--   foreach t in array managed loop
--     if to_regclass('public.'||t) is not null then
--       execute format('drop policy if exists %I on %I', t||'_admin', t);
--     end if;
--   end loop;
-- end $$;
-- drop policy if exists platform_admins_admin on platform_admins;
-- drop function if exists is_super_admin();
-- drop table if exists platform_admins;
