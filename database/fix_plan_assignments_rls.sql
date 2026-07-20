-- ============================================================================
-- Fix plan_assignments self-read RLS. (2026-07-20)
--
-- plan_assignments.member_id holds members.id (that's what the trainer writes
-- when assigning a workout plan). But the self policy checked
--   member_id = auth.uid()
-- and auth.uid() is profiles.id — a DIFFERENT id. So the check was always
-- false, and a member could never read their own assigned workout plan. The
-- member's workout screen showed nothing from their trainer as a result.
--
-- Correct it to resolve members.id from the logged-in user.
-- ============================================================================

drop policy if exists plan_assignments_self on plan_assignments;

create policy plan_assignments_self on plan_assignments
  for select
  using (member_id in (select id from members where user_id = auth.uid()));
