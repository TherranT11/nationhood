-- ===========================================================================
-- 335 · Kingdoms — Crown Authority framework: persisted realm laws + the sovereign's Decree.
--
-- The realm's laws (previously client-static) now live in kingdoms_realm_laws (one row per realm per law,
-- tier = current rung index). Only the realm's Sovereign may change them, via kingdoms_decree, which moves one
-- law one rung and enforces the design rules agreed:
--   * HARD CEILING: no capped law may sit at a tier higher than Crown Authority's own rung (Succession is a
--     mode, not an intensity, so it is exempt). Lowering Crown Authority CASCADES — any capped law above the
--     new ceiling drops to it (devolution).
--   * COST: flat — raising a rung (tightening) costs 1 House Prestige; lowering (loosening) refunds 1.
--   * ABSOLUTE GATE: reaching Absolute Crown Authority needs standing (Prestige >= 10).
--
-- DEFERRED (flagged): the vassal-Unrest backlash of tightening, the assembly/consent path at low Authority,
-- and the war/vassal triggers that would discount a raise — all need the vassal / multi-House layer. In a
-- realm of one they are simply absent, so a decree here costs only Prestige. Depends on: 304, 316 (sovereign).
-- Idempotent. Apply after 334.
-- ===========================================================================

create table if not exists public.kingdoms_realm_laws (
  heritage text not null,
  law      text not null,
  tier     int  not null default 0,
  primary key (heritage, law)
);
alter table public.kingdoms_realm_laws enable row level security;
grant select on public.kingdoms_realm_laws to anon, authenticated;   -- laws are public; writes go through the RPC
drop policy if exists "kingdoms_realm_laws_select_all" on public.kingdoms_realm_laws;
create policy "kingdoms_realm_laws_select_all" on public.kingdoms_realm_laws for select using (true);

-- Seed Aldren at its starting tiers (mirrors the client's law ladders). Do not overwrite a realm already decreed.
insert into public.kingdoms_realm_laws (heritage, law, tier) values
  ('Aldren', 'crown_authority', 3),   -- High
  ('Aldren', 'succession',      1),   -- Partition
  ('Aldren', 'crown_taxation',  1),   -- Tithe
  ('Aldren', 'right_of_toll',   1),   -- Granted
  ('Aldren', 'vassal_wars',     1),   -- With Cause
  ('Aldren', 'levy_obligation', 1),   -- One in Ten
  ('Aldren', 'right_of_trial',  1)    -- Trial by Combat
on conflict (heritage, law) do nothing;

-- The Sovereign decrees: move one law one rung (p_dir = +1 tighten / -1 loosen). Returns the new tier index.
create or replace function public.kingdoms_decree(p_law text, p_dir int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid; v_realm text; v_sov boolean; v_prestige int;
  v_cur int; v_new int; v_max int; v_capped boolean; v_auth int;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if p_dir <> 1 and p_dir <> -1 then raise exception 'bad_direction'; end if;

  select id, heritage, is_sovereign, coalesce((resources->>'prestige')::int, 0)
    into v_id, v_realm, v_sov, v_prestige
  from public.kingdoms_leaders where user_id = v_uid order by created_at desc limit 1;
  if v_id is null then raise exception 'no_house'; end if;
  if not coalesce(v_sov, false) then raise exception 'not_sovereign'; end if;

  -- Law metadata: max tier index, and whether Crown Authority caps it (Succession is exempt — it is a mode).
  v_max := case p_law
    when 'crown_authority' then 4
    when 'succession'      then 3
    when 'crown_taxation'  then 3
    when 'right_of_toll'   then 2
    when 'vassal_wars'     then 3
    when 'levy_obligation' then 2
    when 'right_of_trial'  then 2
    else -1 end;
  if v_max < 0 then raise exception 'unknown_law'; end if;
  v_capped := p_law not in ('crown_authority', 'succession');

  select tier into v_cur from public.kingdoms_realm_laws where heritage = v_realm and law = p_law;
  v_cur := coalesce(v_cur, 0);
  v_new := v_cur + p_dir;
  if v_new < 0 or v_new > v_max then raise exception 'at_bound'; end if;

  -- Hard ceiling: a capped law may not be raised above Crown Authority's rung.
  if v_capped and p_dir > 0 then
    select tier into v_auth from public.kingdoms_realm_laws where heritage = v_realm and law = 'crown_authority';
    if v_new > coalesce(v_auth, 0) then raise exception 'exceeds_authority'; end if;
  end if;

  -- Absolute gate: reaching Absolute Crown Authority needs standing (Prestige >= 10). Triggers deferred.
  if p_law = 'crown_authority' and v_new = 4 and v_prestige < 10 then raise exception 'need_prestige'; end if;

  -- Flat cost: raising a rung costs 1 Prestige; lowering refunds 1.
  if p_dir > 0 and v_prestige < 1 then raise exception 'cannot_pay'; end if;

  update public.kingdoms_realm_laws set tier = v_new where heritage = v_realm and law = p_law;

  -- Lowering Crown Authority cascades: any capped law above the new ceiling drops to it (devolution).
  if p_law = 'crown_authority' and p_dir < 0 then
    update public.kingdoms_realm_laws set tier = v_new
     where heritage = v_realm and law not in ('crown_authority', 'succession') and tier > v_new;
  end if;

  update public.kingdoms_leaders
     set resources = jsonb_set(resources, '{prestige}',
           to_jsonb(v_prestige - (case when p_dir > 0 then 1 else -1 end)))
   where id = v_id;

  return v_new;
end;
$$;
revoke all on function public.kingdoms_decree(text, int) from public, anon;
grant execute on function public.kingdoms_decree(text, int) to authenticated;

notify pgrst, 'reload schema';
