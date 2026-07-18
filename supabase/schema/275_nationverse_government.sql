-- ===========================================================================
-- 275 · Nationverse government structure + personality party/office.
--
-- The government is authored ONCE on the nation and everything else derives from it:
--   nationverse_nations.government jsonb = { system, type, lead, coalition:[names], supply:[names],
--                                            stability, formed }
--   (parties are referenced by NAME — the same names in nationverse_nations.parties.)
-- A personality's ALIGNMENT is NOT stored; it's derived from its party vs the nation's government
-- (lead → Lead Government, coalition → Coalition Government, supply → Government Supporter, else
-- Opposition). Personalities gain two authored fields: `party` (the party name a politician belongs to,
-- null for non-party roles) and `office` (an optional Starting Office / cabinet post). Opposition/seat
-- totals/majority threshold are derived in the UI, never stored.
-- Auth unchanged (existing nationverse_* policies cover the new columns). Depends on: 271, 272.
-- Idempotent. Apply after 274.
-- ===========================================================================

alter table public.nationverse_nations       add column if not exists government jsonb not null default '{}'::jsonb;
alter table public.nationverse_personalities add column if not exists party  text;
alter table public.nationverse_personalities add column if not exists office text;

notify pgrst, 'reload schema';
