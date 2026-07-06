-- 153 · Shared party-effect applier + conviction teardown.
-- Depends on: 20 (parties), 70 (_mod_cap_raise/_mod_floor_drop), 91 (_apply_policy_effect),
-- 133 (_party_ceiling_cap/_effective_ceiling/conv_ceiling_drop). Run after 133.
--
-- Convictions were removed (superseded by the policy / ministry-stat model). This file (a)
-- relocates the one general-purpose "apply an effect to a party" helper the conviction engine
-- used to own — it is NOT conviction-specific and stays live for the systems that still call it:
-- party rename penalties (102), minority-government confidence (104), youth-wing ceiling raises
-- (112), and proposal popularity gains (81) — renamed here to _apply_party_effect; and (b) drops
-- the now-dead conviction objects so re-applying the bundle cleans an existing database.

-- Apply one effect {t, v} (flat) to a single party. Party-scoped targets (Party Popularity,
-- Popularity Ceiling) go through the archetype ceiling/floor helpers; every other target is a
-- national / resource / government effect and reuses the policy effects engine (schema/91) —
-- one source for the target→field mapping and clamps.
create or replace function public._apply_party_effect(p_party uuid, p_nation text, p_eff jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_t text := p_eff->>'t'; v_v numeric := coalesce((p_eff->>'v')::numeric, 0); v_arch text; v_pop numeric; v_ceil numeric; v_floor numeric; v_new numeric;
begin
  if v_t is null or v_v = 0 then return; end if;
  if v_t = 'Party Popularity' then
    select archetype, popularity, pop_ceiling, pop_floor into v_arch, v_pop, v_ceil, v_floor from public.parties where id = p_party;
    if not found then return; end if;
    if v_v >= 0 then
      -- A raise is capped at the party's OWN effective ceiling (pop_ceiling less crowding), then
      -- the national archetype modifier — the same two-step clamp Rally / Ad Blitz use (schema/40).
      v_new := least(v_pop + v_v, public._effective_ceiling(p_nation, v_arch, v_ceil, v_floor));
      v_new := public._mod_cap_raise(p_nation, v_arch, v_pop, v_new);
    else
      v_new := public._mod_floor_drop(p_nation, v_arch, v_pop, v_pop + v_v);
    end if;
    update public.parties set popularity = greatest(0, least(100, v_new)) where id = p_party;
  elsif v_t = 'Popularity Ceiling' then
    -- Party-scoped and PERMANENT (schema/133). A ceiling drop moves the party's cumulative drop
    -- first — never restored — which lowers its cap (regime max − drop). Then pop_ceiling drops by
    -- the same amount, clamped to that new cap; national politics can regrow it toward the cap,
    -- but never back to the old maximum.
    update public.parties set conv_ceiling_drop = greatest(0, conv_ceiling_drop - v_v) where id = p_party;
    update public.parties set pop_ceiling = greatest(0, least(pop_ceiling + v_v, public._party_ceiling_cap(id))) where id = p_party;
  else
    perform public._apply_policy_effect(p_nation, p_eff);
  end if;
end $$;
revoke all on function public._apply_party_effect(uuid, text, jsonb) from public, anon, authenticated;

-- ── Conviction teardown (idempotent) ───────────────────────────────────────────
-- Drop the removed conviction feature's runtime objects. Safe on a database that never had
-- them (all guarded). party_convictions references convictions, so drop it first.
drop function if exists public.adopt_conviction(uuid);
drop function if exists public.drop_conviction(uuid);
drop function if exists public._accrue_conviction(int);
drop function if exists public._apply_conviction_triggers(int);
drop function if exists public._recompute_party_archetype(uuid);
drop function if exists public._target_from_state(jsonb, jsonb, jsonb, numeric, text);
drop function if exists public._num(text);
drop function if exists public._apply_conviction_effect(uuid, text, jsonb);   -- superseded by _apply_party_effect
drop table if exists public.party_convictions;
drop table if exists public.convictions;

-- Dead conviction columns. conv_ceiling_drop STAYS (the permanent-ceiling accounting above +
-- schema/133 still use it); only the conviction-currency and trigger-snapshot columns go.
alter table public.parties drop column if exists conviction;
alter table public.parties drop column if exists conv_prev_pop;
alter table public.parties drop column if exists conv_prev_ceiling;
alter table public.nations  drop column if exists conv_snapshot;

notify pgrst, 'reload schema';
