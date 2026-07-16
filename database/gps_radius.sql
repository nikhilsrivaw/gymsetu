-- Per-gym check-in radius. 100m was hardcoded in the app: too tight for a gym
-- inside a large complex, too loose in a dense market where 100m covers the
-- neighbours' shops and possibly the member's own flat upstairs.
alter table gyms add column if not exists checkin_radius_m integer default 150;
alter table gyms drop constraint if exists gyms_checkin_radius_sane;
alter table gyms add constraint gyms_checkin_radius_sane
  check (checkin_radius_m is null or (checkin_radius_m between 25 and 1000));
comment on column gyms.checkin_radius_m is
  'How close a member must be to GPS check in. Compared against the fix''s own accuracy, not treated as exact.';
