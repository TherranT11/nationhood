-- ===========================================================================
-- 127 · Military bases — the individual bases behind the Minister of Defence actions.
-- Replaces the old nations.military_bases INT count: a base is now its own row, so it
-- can hold a garrison (Slice 2) and be deployed between (Slice 3). This table is the ONE
-- source for how many bases a nation has and where they sit — the Conflict page and the
-- Defence page both count/read it; the int column is migrated in and dropped below.
--   • nation_id      — the OWNER (the nation that built + commands the base)
--   • host_nation_id — where the base physically sits. Home base: = nation_id. A base
--                      ABROAD (host <> owner) needs a mutual defence pact (a later slice);
--                      Slice 1 only builds at home, so host always equals the owner.
--   • garrison       — military stationed here. Populated from Slice 2 (Expand Military);
--                      stays 0 for now, so this slice never touches the on_hand.military
--                      economy resource (that reconciliation lands with Expand).
-- Depends on: 10 (nations), 05 (game_state.current_tick), 40 (_begin_action, events),
-- 91 (_apply_policy_effect: Budget), 114 (_party_holds_ministry). Run after 114.
-- build_military_base also calls _have_defense_pact (schema/131) for abroad builds — late-bound
-- (the body isn't resolved at CREATE), so 127 still applies before 131; it's only needed at call time.
-- ===========================================================================

create table if not exists public.military_bases (
  id             uuid primary key default gen_random_uuid(),
  nation_id      text not null references public.nations (id) on delete cascade,   -- owner
  host_nation_id text not null references public.nations (id) on delete cascade,   -- where it sits (= owner for home)
  armies         int  not null default 0,   -- typed units stationed here; a base holds at most 5 units total
  fleets         int  not null default 0,
  air_wings      int  not null default 0,
  built_tick     int,
  created_at     timestamptz not null default now()
);
create index if not exists military_bases_nation_idx on public.military_bases (nation_id);
-- Existing installs: add the typed-unit columns, fold the old undifferentiated garrison into
-- armies (one army per stationed unit), then drop it. A base now holds typed units, not a
-- single count. Guarded so re-applying is a no-op after the first pass.
alter table public.military_bases add column if not exists armies    int not null default 0;
alter table public.military_bases add column if not exists fleets     int not null default 0;
alter table public.military_bases add column if not exists air_wings  int not null default 0;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'military_bases' and column_name = 'garrison') then
    update public.military_bases set armies = armies + garrison where coalesce(garrison, 0) > 0;
    alter table public.military_bases drop column garrison;
  end if;
end $$;

-- World-readable (base counts show on the Conflict page for every nation), like nations.
-- No client write policy → all writes go through the security-definer RPCs below.
alter table public.military_bases enable row level security;
grant select on public.military_bases to authenticated;
drop policy if exists "military_bases_select_all" on public.military_bases;
create policy "military_bases_select_all" on public.military_bases for select using (true);

-- Migrate the old INT count into rows (one home base per counted base), then drop the
-- superseded column — the count now lives in this table (one source). Guarded on the column
-- still existing so re-applying this file is safe: the migration reads military_bases, so it
-- can only run while the column is there; the per-nation "already has rows" guard also stops
-- any double-seed. After the first apply the column is gone and this block is a no-op.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'nations' and column_name = 'military_bases') then
    insert into public.military_bases (nation_id, host_nation_id)
    select n.id, n.id
    from public.nations n
    cross join generate_series(1, greatest(coalesce(n.military_bases, 0), 0)) g
    where not exists (select 1 from public.military_bases mb where mb.nation_id = n.id);

    alter table public.nations drop column military_bases;
  end if;
end $$;

-- Does the signed-in user's party hold the Defence portfolio? Mirrors is_trade_minister
-- (schema/114) — reuses _party_holds_ministry, the one source for "is my party Minister of X".
create or replace function public.is_defence_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Defence') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_defence_minister() to authenticated;

-- Build a military base (Minister of Defence, 2 AP, $15B from the Budget). p_host names the
-- nation the base sits in: null/empty/own → a home base; another nation → ABROAD, which needs
-- a mutual defence pact with that nation (schema/131, _have_defense_pact). Either way the owner
-- is the builder (nation_id), so an abroad base still counts toward the builder's own capacity.
-- The $15B rides _apply_policy_effect's Budget target — the one money path (a shortfall floors
-- the Budget at 0 and rolls into Debt). Dropped first: the parameter was renamed (p_scope→p_host).
drop function if exists public.build_military_base(text);
create or replace function public.build_military_base(p_host text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_cost numeric := 15; v_host text; v_abroad boolean;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 2 AP are spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can build a military base.'; end if;
  if v_p.actions_remaining < 2 then
    raise exception 'Not enough actions left this turn (need 2).'; end if;

  v_host := coalesce(nullif(p_host, ''), v_nation);   -- default / empty / own → home
  v_abroad := v_host <> v_nation;
  if v_abroad then
    if not exists (select 1 from public.nations where id = v_host and not coalesce(dormant, false)) then
      raise exception 'No such nation to host the base.'; end if;
    if not public._have_defense_pact(v_nation, v_host) then
      raise exception 'You need a mutual defence pact with that nation to build there.'; end if;
  end if;

  select current_tick into v_tick from public.game_state where id;
  perform public._apply_policy_effect(v_nation, jsonb_build_object('t', 'Budget', 'v', -v_cost));   -- pay $15B (shortfall → Debt)
  insert into public.military_bases (nation_id, host_nation_id, built_tick)
    values (v_nation, v_host, v_tick);
  update public.parties set actions_remaining = actions_remaining - 2 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || ' has commissioned a new military base '
              || (case when v_abroad then 'in ' || (select name from public.nations where id = v_host) else 'at home' end) || '.',
            public.current_game_date());
  return jsonb_build_object('built', true, 'abroad', v_abroad, 'actions', v_p.actions_remaining - 2);
end $$;
grant execute on function public.build_military_base(text) to authenticated;

notify pgrst, 'reload schema';
