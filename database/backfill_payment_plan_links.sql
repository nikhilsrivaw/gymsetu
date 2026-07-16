-- ============================================================================
-- BACKFILL payments.member_plan_id
-- ============================================================================
-- Outstanding balance = plan price - sum(payments against that plan), which
-- needs payments.member_plan_id. That column was never populated before
-- 2026-07-17, so every pre-existing payment is unlinked and its member shows
-- no dues history at all.
--
-- A payment is linked only when it falls inside exactly ONE of that member's
-- plan windows. Ambiguous rows (overlapping plans) and orphans are left null
-- on purpose: a wrong link would invent or hide a debt, and the app already
-- treats "no linked payment" as "no balance known" rather than guessing.
--
-- Safe to re-run: it only touches rows that are still null.
-- ============================================================================

begin;

update payments p
   set member_plan_id = mp.id
  from member_plans mp
 where p.member_plan_id is null
   and mp.member_id = p.member_id
   and p.payment_date between mp.start_date and mp.end_date
   -- exactly one candidate window, otherwise we would be guessing
   and (select count(*) from member_plans m2
         where m2.member_id = p.member_id
           and p.payment_date between m2.start_date and m2.end_date) = 1;

-- Report what is still unlinked so it is visible rather than silent.
do $$
declare n integer;
begin
  select count(*) into n from payments where member_plan_id is null;
  raise notice 'payments still unlinked (ambiguous or orphaned): %', n;
end $$;

commit;

-- DOWN: there is no meaningful rollback -- the links are reconstructed facts,
-- not new data. To undo: update payments set member_plan_id = null;
