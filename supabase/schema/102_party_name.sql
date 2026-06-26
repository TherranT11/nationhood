-- 102 · Party name change (penalised + cooldowned).
-- Renaming a party is a real decision: it costs standing and can't be done often. Routed
-- through an RPC (not a direct client write) so the penalty + cooldown are server-enforced.
-- Run after 94 (uses _apply_conviction_effect for the standing penalties).

alter table public.parties add column if not exists name_change_until_tick int;

-- Change the caller's party name. Costs −10 party popularity (floor-respecting) and −5
-- popularity ceiling, and locks renaming for 60 ticks. Server-authoritative.
create or replace function public.change_party_name(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_tick int; v_name text;
begin
  v_party := public._lock_party();
  v_name := left(btrim(coalesce(p_name, '')), 60);
  if v_name = '' then raise exception 'Enter a party name.'; end if;
  if v_name = v_party.name then raise exception 'That is already your party’s name.'; end if;
  select current_tick into v_tick from public.game_state where id;
  if v_party.name_change_until_tick is not null and v_tick < v_party.name_change_until_tick then
    raise exception 'Your party changed its name recently — it can rename again later.';
  end if;
  -- Rebranding penalty: reuse the conviction-effect engine (one source for the target → field
  -- mapping, floor and clamps).
  perform public._apply_conviction_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', -10));
  perform public._apply_conviction_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Popularity Ceiling', 'v', -5));
  update public.parties set name = v_name, name_change_until_tick = v_tick + 60 where id = v_party.id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party', v_party.name || ' has rebranded as ' || v_name || '.', public.current_game_date());
  return jsonb_build_object('ok', true, 'name', v_name, 'until', v_tick + 60);
end $$;
grant execute on function public.change_party_name(text) to authenticated;

notify pgrst, 'reload schema';
