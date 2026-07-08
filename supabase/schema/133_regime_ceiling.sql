-- ===========================================================================
-- 133 · Regime ceiling — the cap on how high a party's popularity ceiling can climb, and the
-- permanent bite convictions take out of it.
--   • economy.party_ceiling (nation) is the REGIME MAX: the highest reach any party in the
--     nation can attain (Sessau's old "45% Ceiling" flavour, now enforced). Absent → 50.
--   • conv_ceiling_drop (party) is the party's CUMULATIVE conviction ceiling drop — permanent,
--     never restored, even on renounce (schema/94 feeds it).
-- A party's effective cap = economy.party_ceiling − conv_ceiling_drop. pop_ceiling can grow
-- toward that cap (national politics) but never above it — enforced each tick by
-- _reconcile_party_ceilings (schema/130). This is the ONE source for the cap.
-- Depends on: 20 (parties), 10 (nations.economy). Run after 20.
-- ===========================================================================

alter table public.parties add column if not exists conv_ceiling_drop numeric not null default 0;

-- A party's popularity-ceiling cap: its nation's regime max (default 50) less its cumulative,
-- permanent conviction ceiling drops, floored at 0. Read wherever pop_ceiling is bounded. A
-- one-party state (nations.ruling_party set) has NO cap — its ruler dominates totally (schema/98
-- sets pop_ceiling 100), so the regime cap must not claw that back.
create or replace function public._party_ceiling_cap(p_party uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select case when n.ruling_party is not null then 100
              else greatest(0, coalesce((n.economy->>'party_ceiling')::numeric, 50) - coalesce(p.conv_ceiling_drop, 0)) end
    from public.parties p join public.nations n on n.id = p.nation_id where p.id = p_party;
$$;
revoke all on function public._party_ceiling_cap(uuid) from public, anon, authenticated;

-- Sessau's regime allowed a 45% party ceiling (its legacy "45% Ceiling" text) — seed it. Every
-- other nation defaults to 50 via the helper until an admin sets its Max Party Ceiling.
update public.nations set economy = economy || jsonb_build_object('party_ceiling', 45)
 where id = 'sessau' and not (economy ? 'party_ceiling');

-- Reconcile any party already over its effective ceiling right now, so the invariant holds the moment
-- the schema is applied (not only from the next tick). Runs HERE, after _party_ceiling_cap is defined,
-- because _reconcile_party_ceilings (schema/130) calls it — running it back in 130 aborts a fresh
-- apply (the cap function doesn't exist yet) and stops everything after it from being created.
select public._reconcile_party_ceilings();

notify pgrst, 'reload schema';
