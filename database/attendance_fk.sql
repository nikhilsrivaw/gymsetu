-- ============================================================================
-- ATTENDANCE — enforce member_id = profiles.id
-- ============================================================================
-- attendance.member_id was a bare uuid with no FK, per the schema's blanket
-- "keep every insert working" rule. That rule is what allowed the bug: the
-- trainer's bulk attendance screen wrote members.id while member GPS check-in,
-- the owner's screen and member detail all wrote profiles.id. Consequences:
--   * a trainer-marked check-in was invisible to the member and the owner
--   * the same person could hold two rows for one day -- the existing
--     unique (member_id, check_in_date) cannot prevent that when the two ids
--     differ
--   * attendance counts and streaks silently disagreed between screens
--
-- The app code is now consistent (profiles.id everywhere). This FK makes the
-- convention enforceable instead of a comment someone re-breaks later, and it
-- also gives PostgREST the relationship it needs to embed profiles(full_name),
-- which previously failed with PGRST200.
--
-- Safe to apply: attendance is empty, and every member created through the app
-- (create-gym-user / bulk import) has an auth user and a profiles row.
-- ============================================================================

begin;

-- Any row not pointing at a real profile would block the constraint; there are
-- none today, and this makes that explicit rather than assumed.
do $$
declare n integer;
begin
  select count(*) into n from attendance a
   where not exists (select 1 from profiles p where p.id = a.member_id);
  if n > 0 then
    raise exception 'Cannot add FK: % attendance rows do not reference a profile. Re-map them first.', n;
  end if;
end $$;

alter table attendance drop constraint if exists attendance_member_id_fkey;
alter table attendance add constraint attendance_member_id_fkey
  foreign key (member_id) references profiles(id) on delete cascade;

comment on column attendance.member_id is
  'profiles.id (NOT members.id). Enforced by attendance_member_id_fkey.';

commit;

-- DOWN:
-- alter table attendance drop constraint if exists attendance_member_id_fkey;
