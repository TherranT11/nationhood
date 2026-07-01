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
-- ===========================================================================

create table if not exists public.military_bases (
  id             uuid primary key default gen_random_uuid(),
  nation_id      text not null references public.nations (id) on delete cascade,   -- owner
  host_nation_id text not null references public.nations (id) on delete cascade,   -- where it sits (= owner for home)
  garrison       int  not null default 0,                                          -- military stationed here (Slice 2)
  built_tick     int,
  created_at     timestamptz not null default now()
);
create index if not exists military_bases_nation_idx on public.military_bases (nation_id);

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

-- Build a military base (Minister of Defence, 2 AP, $15B from the Budget). Slice 1 builds
-- at home only; an abroad build needs a mutual defence pact (a later slice). The $15B rides
-- _apply_policy_effect's Budget target — the one money path (a shortfall floors the Budget
-- at 0 and rolls into Debt, exactly like a debt-financed import).
create or replace function public.build_military_base(p_scope text default 'home')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_cost numeric := 15;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 2 AP are spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can build a military base.'; end if;
  if v_p.actions_remaining < 2 then
    raise exception 'Not enough actions left this turn (need 2).'; end if;
  if coalesce(p_scope, 'home') <> 'home' then
    raise exception 'Building a base abroad requires a mutual defence pact.'; end if;

  select current_tick into v_tick from public.game_state where id;
  perform public._apply_policy_effect(v_nation, jsonb_build_object('t', 'Budget', 'v', -v_cost));   -- pay $15B (shortfall → Debt)
  insert into public.military_bases (nation_id, host_nation_id, built_tick)
    values (v_nation, v_nation, v_tick);
  update public.parties set actions_remaining = actions_remaining - 2 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || ' has commissioned a new military base at home.',
            public.current_game_date());
  return jsonb_build_object('built', true, 'actions', v_p.actions_remaining - 2);
end $$;
grant execute on function public.build_military_base(text) to authenticated;

notify pgrst, 'reload schema';
