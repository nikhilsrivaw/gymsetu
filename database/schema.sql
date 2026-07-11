-- ============================================================================
-- GYMSETU — COMPLETE DATABASE SCHEMA (reconstructed)
-- Run this once, top-to-bottom, in the Supabase SQL Editor of a FRESH project.
--
-- Reconstructed from the app source (every .from()/.insert()/.select() call)
-- + types/database.ts + the three edge functions. 27 tables.
--
-- NOTE on the "two-table" design: members exist as BOTH a `members` row and a
-- `profiles` row (profiles.id = auth.uid()). Different screens write member_id
-- as EITHER members.id OR profiles.id. To keep every insert working, member_id
-- columns on the ambiguous tables are plain uuid WITHOUT a hard FK (indexed).
-- gym_id ALWAYS references gyms(id) and is safe to enforce.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- CORE TENANT TABLES
-- ============================================================================

-- 1. GYMS (also stores branches via parent_gym_id / is_branch)
create table gyms (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  owner_id       uuid references auth.users(id) on delete cascade not null,
  address        text,
  phone          text,
  email          text,
  logo_url       text,
  description    text,
  established     text,
  timings        jsonb,
  amenities      jsonb,
  rules          jsonb,
  social_links   jsonb,
  is_branch      boolean default false,
  parent_gym_id  uuid references gyms(id) on delete cascade,
  branch_code    text,
  branch_city    text,
  branch_address text,
  lat            double precision,
  lng            double precision,
  created_at     timestamptz default now()
);

-- 2. PROFILES (every auth user: owner / staff / member / trainer)
create table profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  gym_id                  uuid references gyms(id) on delete cascade,
  role                    text not null default 'member'
                            check (role in ('gym_owner','staff','member','trainer')),
  full_name               text not null,
  email                   text,
  phone                   text,
  avatar_url              text,
  gender                  text,
  date_of_birth           date,
  height_cm               numeric,
  weight_kg               numeric,
  target_weight           numeric,
  goal                    text,
  status                  text default 'active',
  join_date               date default current_date,
  notes                   text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  -- member / trainer login credentials (mirrored onto members/trainers rows)
  member_code             text unique,
  member_password         text,
  trainer_code            text unique,
  trainer_password        text,
  specialization          text,
  specialty               text,
  experience_years        integer,
  trainer_id              uuid references profiles(id) on delete set null, -- assigned trainer
  created_by              uuid references auth.users(id),
  expo_push_token         text,
  created_at              timestamptz default now()
);

-- 3. MEMBERS (gym customer record; user_id -> profiles/auth user)
create table members (
  id                      uuid primary key default uuid_generate_v4(),
  gym_id                  uuid references gyms(id) on delete cascade not null,
  user_id                 uuid references auth.users(id) on delete set null,
  full_name               text not null,
  phone                   text,
  email                   text,
  date_of_birth           date,
  gender                  text,
  address                 text,
  profile_photo_url       text,
  height_cm               numeric,
  weight_kg               numeric,
  goal                    text,
  join_date               date not null default current_date,
  status                  text not null default 'active',
  emergency_contact_name  text,
  emergency_contact_phone text,
  notes                   text,
  member_code             text,
  member_password         text,
  trainer_id              uuid,   -- loosely references a trainer's profiles.id
  created_by              uuid references auth.users(id),
  expo_push_token         text,
  created_at              timestamptz default now()
);

-- 4. TRAINERS (gym staff trainer record; user_id -> auth user)
create table trainers (
  id               uuid primary key default uuid_generate_v4(),
  gym_id           uuid references gyms(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete set null,
  full_name        text not null,
  phone            text,
  trainer_code     text,
  trainer_password text,
  specialization   text,
  experience_years integer,
  status           text default 'active',
  created_at       timestamptz default now()
);

-- ============================================================================
-- PLANS, PAYMENTS, ATTENDANCE
-- ============================================================================

-- 5. MEMBERSHIP PLANS (catalogue)
create table membership_plans (
  id            uuid primary key default uuid_generate_v4(),
  gym_id        uuid references gyms(id) on delete cascade not null,
  name          text not null,
  duration_days integer not null,
  price         numeric not null,
  description   text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- 6. MEMBER PLANS (a plan assigned to a members row)
create table member_plans (
  id         uuid primary key default uuid_generate_v4(),
  member_id  uuid references members(id) on delete cascade not null,
  gym_id     uuid references gyms(id) on delete cascade not null,
  plan_id    uuid references membership_plans(id) on delete restrict not null,
  start_date date not null,
  end_date   date not null,
  status     text not null default 'active' check (status in ('active','expired','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 7. PAYMENTS
create table payments (
  id             uuid primary key default uuid_generate_v4(),
  gym_id         uuid references gyms(id) on delete cascade not null,
  member_id      uuid not null,   -- members.id (loose; no hard FK)
  member_plan_id uuid references member_plans(id) on delete set null,
  amount         numeric not null,
  payment_date   date not null default current_date,
  payment_method text not null default 'cash'
                   check (payment_method in ('cash','upi','card','bank_transfer','other')),
  payment_type   text not null default 'full' check (payment_type in ('full','partial')),
  receipt_number text unique,
  note           text,
  notes          text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz default now()
);

-- 8. ATTENDANCE (member_id is profiles.id for GPS self check-in, members.id for owner marking)
create table attendance (
  id            uuid primary key default uuid_generate_v4(),
  gym_id        uuid references gyms(id) on delete cascade not null,
  member_id     uuid not null,
  check_in_date date not null default current_date,
  check_in_time time,
  method        text default 'gps',
  notes         text,
  marked_by     uuid references auth.users(id),
  created_at    timestamptz default now(),
  unique (member_id, check_in_date)
);

-- ============================================================================
-- SUBSCRIPTIONS & AI TOKENS (owner billing — populated by website/Razorpay)
-- ============================================================================

-- 9. SUBSCRIPTIONS
create table subscriptions (
  id                   uuid primary key default uuid_generate_v4(),
  gym_id               uuid references gyms(id) on delete cascade,
  owner_id             uuid references auth.users(id) on delete cascade not null,
  plan                 text not null default 'basic'
                         check (plan in ('basic','pro','pro_plus','pro_max')),
  status               text not null default 'trial'
                         check (status in ('trial','active','expired','cancelled')),
  trial_ends_at        timestamptz,
  current_period_start timestamptz default now(),
  current_period_end   timestamptz,
  branch_slots         integer default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- 10. SUBSCRIPTION TOKENS (monthly AI/WhatsApp token budget per gym)
create table subscription_tokens (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid references gyms(id) on delete cascade not null,
  month_year   text not null,        -- 'YYYY-MM'
  tokens_total integer not null default 0,
  tokens_used  integer not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (gym_id, month_year)
);

-- 11. TOKEN USAGE LOG (per-feature breakdown)
create table token_usage_log (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid references gyms(id) on delete cascade not null,
  feature      text,
  tokens_spent integer not null default 1,
  created_at   timestamptz default now()
);

-- ============================================================================
-- TRAINING: plans, sessions, progress
-- ============================================================================

-- 12. WORKOUT PLANS (created by trainers; days is TEXT, weeks is INT)
create table workout_plans (
  id         uuid primary key default uuid_generate_v4(),
  trainer_id uuid,                                        -- profiles.id
  gym_id     uuid references gyms(id) on delete cascade not null,
  name       text not null,
  goal       text,
  level      text,
  days       text,          -- e.g. "4 days/week"
  weeks      integer,
  color      text,
  emoji      text,
  exercises  jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 13. DIET PLANS (title is REQUIRED)
create table diet_plans (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid references gyms(id) on delete cascade not null,
  member_id    uuid references members(id) on delete cascade not null,
  title        text not null,
  content      text,
  trainer_id   uuid,                                      -- profiles.id
  created_by   uuid references auth.users(id),
  meals        jsonb,
  calorie_goal integer default 2200,
  protein_goal integer default 160,
  created_at   timestamptz default now()
);

-- 14. PLAN ASSIGNMENTS (workout_plan -> member; member_id is profiles.id)
create table plan_assignments (
  id          uuid primary key default uuid_generate_v4(),
  plan_id     uuid references workout_plans(id) on delete cascade,
  member_id   uuid,                                       -- profiles.id
  gym_id      uuid references gyms(id) on delete cascade,
  assigned_at timestamptz default now()
);

-- 15. TRAINER SESSIONS (weekly schedule)
create table trainer_sessions (
  id           uuid primary key default uuid_generate_v4(),
  trainer_id   uuid,                                      -- profiles.id
  gym_id       uuid references gyms(id) on delete cascade,
  member_id    uuid,
  member_name  text not null,
  session_type text not null,
  duration     text,
  time         text not null,
  day_of_week  text not null,
  location     text,
  emoji        text,
  color        text,
  status       text default 'upcoming' check (status in ('upcoming','done','cancelled')),
  created_at   timestamptz default now()
);

-- 16. PROGRESS LOGS (trainer notes on a member)
create table progress_logs (
  id         uuid primary key default uuid_generate_v4(),
  trainer_id uuid,                                        -- profiles.id
  member_id  uuid,                                        -- profiles.id
  gym_id     uuid references gyms(id) on delete cascade,
  weight     text,
  note       text,
  mood       text,
  tags       jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- MEMBER SELF-TRACKING
-- ============================================================================

-- 17. WORKOUT SESSIONS (member logs a workout)
create table workout_sessions (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid,                                       -- profiles.id
  gym_id      uuid references gyms(id) on delete cascade,
  exercises   jsonb default '[]'::jsonb,
  total_sets  integer,
  sets_done   integer,
  logged_date date default current_date,
  created_at  timestamptz default now()
);

-- 18. WEIGHT LOGS
create table weight_logs (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid,                                       -- profiles.id
  gym_id      uuid references gyms(id) on delete cascade,
  weight      numeric,
  logged_date date not null default current_date,
  created_at  timestamptz default now(),
  unique (member_id, logged_date)
);

-- 19. BODY MEASUREMENTS
create table body_measurements (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid,                                       -- profiles.id
  gym_id      uuid references gyms(id) on delete cascade,
  chest       numeric,
  waist       numeric,
  hips        numeric,
  arms        numeric,
  thighs      numeric,
  logged_date date default current_date,
  created_at  timestamptz default now()
);

-- 20. MEAL LOGS (member ticks off meals; NO gym_id — scoped by member_id)
create table meal_logs (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid,                                       -- profiles.id
  meal_id     text,
  logged_date date not null default current_date,
  created_at  timestamptz default now(),
  unique (member_id, meal_id, logged_date)
);

-- ============================================================================
-- CLASSES
-- ============================================================================

-- 21. GYM CLASSES (catalogue of scheduled classes)
create table gym_classes (
  id          uuid primary key default uuid_generate_v4(),
  gym_id      uuid references gyms(id) on delete cascade not null,
  name        text not null,
  instructor  text,
  day_of_week text,
  time        text,
  duration    text,
  capacity    integer default 20,
  enrolled    integer default 0,
  emoji       text,
  color       text,
  created_at  timestamptz default now()
);

-- 22. CLASS BOOKINGS (member books a class for a given week)
create table class_bookings (
  id         uuid primary key default uuid_generate_v4(),
  class_id   uuid references gym_classes(id) on delete cascade,
  member_id  uuid,                                        -- profiles.id
  gym_id     uuid references gyms(id) on delete cascade,
  week_start date,
  created_at timestamptz default now()
);

-- ============================================================================
-- OPERATIONS: announcements, expenses, equipment, staff, shifts
-- ============================================================================

-- 23. ANNOUNCEMENTS
create table announcements (
  id         uuid primary key default uuid_generate_v4(),
  gym_id     uuid references gyms(id) on delete cascade not null,
  title      text not null,
  body       text,
  category   text,
  emoji      text,
  created_at timestamptz default now()
);

-- 24. EXPENSES
create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  gym_id       uuid references gyms(id) on delete cascade not null,
  category     text,
  amount       numeric not null,
  description  text,
  expense_date date not null default current_date,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now()
);

-- 25. EQUIPMENT
create table equipment (
  id            uuid primary key default uuid_generate_v4(),
  gym_id        uuid references gyms(id) on delete cascade not null,
  name          text not null,
  status        text default 'working',
  purchase_date date,
  last_service  date,
  next_service  date,
  notes         text,
  created_at    timestamptz default now()
);

-- 26. STAFF (non-login staff records)
create table staff (
  id         uuid primary key default uuid_generate_v4(),
  gym_id     uuid references gyms(id) on delete cascade not null,
  full_name  text not null,
  role       text,
  shift      text,
  phone      text,
  salary     text,
  status     text default 'active',
  created_at timestamptz default now()
);

-- 27. STAFF SHIFTS
create table staff_shifts (
  id          uuid primary key default uuid_generate_v4(),
  gym_id      uuid references gyms(id) on delete cascade not null,
  staff_id    uuid references staff(id) on delete cascade,
  day_of_week text,
  start_time  text,
  end_time    text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index on gyms(parent_gym_id);
create index on profiles(gym_id);
create index on profiles(trainer_id);
create index on members(gym_id);
create index on members(user_id);
create index on members(status);
create index on trainers(gym_id);
create index on membership_plans(gym_id);
create index on member_plans(member_id);
create index on member_plans(gym_id);
create index on member_plans(end_date);
create index on payments(gym_id);
create index on payments(member_id);
create index on attendance(gym_id);
create index on attendance(member_id);
create index on attendance(check_in_date);
create index on subscriptions(owner_id);
create index on subscriptions(gym_id);
create index on subscription_tokens(gym_id);
create index on workout_plans(trainer_id);
create index on workout_plans(gym_id);
create index on diet_plans(member_id);
create index on diet_plans(gym_id);
create index on trainer_sessions(trainer_id);
create index on progress_logs(member_id);
create index on weight_logs(member_id);
create index on body_measurements(member_id);
create index on meal_logs(member_id);
create index on workout_sessions(member_id);
create index on class_bookings(member_id);
create index on announcements(gym_id);
create index on expenses(gym_id);
create index on equipment(gym_id);
create index on staff(gym_id);
create index on staff_shifts(gym_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto receipt number on payments
create or replace function generate_receipt_number()
returns trigger as $$
begin
  new.receipt_number := 'RCP-' || to_char(now(),'YYYYMMDD') || '-' || upper(substring(new.id::text,1,6));
  return new;
end;
$$ language plpgsql;

create trigger set_receipt_number
  before insert on payments
  for each row when (new.receipt_number is null)
  execute function generate_receipt_number();

-- Maintain updated_at
create or replace function touch_updated_at()
returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

create trigger touch_subscriptions        before update on subscriptions        for each row execute function touch_updated_at();
create trigger touch_subscription_tokens  before update on subscription_tokens  for each row execute function touch_updated_at();

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================
create or replace function get_my_gym_id()
returns uuid as $$ select gym_id from profiles where id = auth.uid() $$
language sql security definer stable;

create or replace function is_gym_owner()
returns boolean as $$ select role = 'gym_owner' from profiles where id = auth.uid() $$
language sql security definer stable;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
alter table gyms                enable row level security;
alter table profiles            enable row level security;
alter table members             enable row level security;
alter table trainers            enable row level security;
alter table membership_plans    enable row level security;
alter table member_plans        enable row level security;
alter table payments            enable row level security;
alter table attendance          enable row level security;
alter table subscriptions       enable row level security;
alter table subscription_tokens enable row level security;
alter table token_usage_log     enable row level security;
alter table workout_plans       enable row level security;
alter table diet_plans          enable row level security;
alter table plan_assignments    enable row level security;
alter table trainer_sessions    enable row level security;
alter table progress_logs       enable row level security;
alter table workout_sessions    enable row level security;
alter table weight_logs         enable row level security;
alter table body_measurements   enable row level security;
alter table meal_logs           enable row level security;
alter table gym_classes         enable row level security;
alter table class_bookings      enable row level security;
alter table announcements       enable row level security;
alter table expenses            enable row level security;
alter table equipment           enable row level security;
alter table staff               enable row level security;
alter table staff_shifts        enable row level security;

-- ============================================================================
-- RLS POLICIES
-- Model: any authenticated user belonging to the gym (owner/staff/member/
-- trainer, matched via profiles.gym_id) may read/write that gym's rows.
-- Tighten before hardening for production.
-- ============================================================================

-- GYMS
create policy gyms_select on gyms for select using (id = get_my_gym_id() or owner_id = auth.uid() or parent_gym_id = get_my_gym_id());
create policy gyms_insert on gyms for insert with check (owner_id = auth.uid());
create policy gyms_update on gyms for update using (owner_id = auth.uid() or id = get_my_gym_id());
-- anon: member-login step 2 reads gym branding before auth
create policy gyms_anon_branding on gyms for select to anon using (true);

-- PROFILES
create policy profiles_select on profiles for select using (gym_id = get_my_gym_id() or id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid() or gym_id = get_my_gym_id());
create policy profiles_update on profiles for update using (id = auth.uid() or gym_id = get_my_gym_id());
-- anon: member/trainer login looks up gym_id + branding by code before auth
create policy profiles_anon_code on profiles for select to anon using (member_code is not null or trainer_code is not null);

-- Generic tenant tables: gym_id = my gym
create policy members_all             on members             for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy trainers_all            on trainers            for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy membership_plans_all    on membership_plans    for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy member_plans_all        on member_plans        for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy payments_all            on payments            for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy attendance_all          on attendance          for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy subscription_tokens_all on subscription_tokens for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy token_usage_log_all     on token_usage_log     for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy workout_plans_all       on workout_plans       for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy diet_plans_all          on diet_plans          for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy plan_assignments_all    on plan_assignments    for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy trainer_sessions_all    on trainer_sessions    for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy progress_logs_all       on progress_logs       for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy workout_sessions_all    on workout_sessions    for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy weight_logs_all         on weight_logs         for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy body_measurements_all   on body_measurements   for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy gym_classes_all         on gym_classes         for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy class_bookings_all      on class_bookings      for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy announcements_all       on announcements       for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy expenses_all            on expenses            for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy equipment_all           on equipment           for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy staff_all               on staff               for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());
create policy staff_shifts_all        on staff_shifts        for all using (gym_id = get_my_gym_id())            with check (gym_id = get_my_gym_id());

-- meal_logs has no gym_id → scope by the member themselves
create policy meal_logs_own on meal_logs for all using (member_id = auth.uid()) with check (member_id = auth.uid());

-- subscriptions: the owner
create policy subscriptions_own on subscriptions for all using (owner_id = auth.uid() or gym_id = get_my_gym_id()) with check (owner_id = auth.uid());

-- ============================================================================
-- STORAGE: gym-logos bucket (public read, authenticated write)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('gym-logos', 'gym-logos', true)
on conflict (id) do nothing;

create policy "gym-logos public read"
  on storage.objects for select using (bucket_id = 'gym-logos');
create policy "gym-logos auth upload"
  on storage.objects for insert to authenticated with check (bucket_id = 'gym-logos');
create policy "gym-logos auth update"
  on storage.objects for update to authenticated using (bucket_id = 'gym-logos');
create policy "gym-logos auth delete"
  on storage.objects for delete to authenticated using (bucket_id = 'gym-logos');

-- ============================================================================
-- DONE. Next: deploy edge functions, add secrets, create cron (cron.sql),
-- and rewire the app .env + Cloudflare worker. See RESTORE.md.
-- ============================================================================
