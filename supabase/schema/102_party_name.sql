-- 102 · Edit Party — the player's party-branding edit (name, abbreviation, logo).
-- Routed through an RPC (not a direct client write) so the Influence cost is server-enforced.
-- Run after 40 (_lock_party). Supersedes the old penalised change_party_name (dropped below).
--
-- KNOWN LIMITATION: name/abbreviation/logo_url are still in the client UPDATE grant (20_parties)
-- because the founding/relaunch upsert sets them, so a crafted client could edit directly and skip
-- the Influence cost. The Edit Party UI always goes through this RPC; to fully lock it down, move the
-- founding/relaunch writes onto an RPC and drop those columns from the client grant.

-- The old rename cooldown column is no longer used (the Influence cost is the sole gate now); kept
-- for compatibility on databases that already have it.
alter table public.parties add column if not exists name_change_until_tick int;

-- Edit the caller's party — name, abbreviation and logo — for 5 Influence. No standing penalty and
-- no cooldown: the Influence cost is the limiter. Server-authoritative.
drop function if exists public.change_party_name(text);       -- superseded by edit_party
drop function if exists public.edit_party(text, text, text);  -- superseded by the colour-aware signature
create or replace function public.edit_party(p_name text, p_abbr text, p_logo_url text, p_color text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_name text; v_abbr text; v_logo text; v_color text; v_cost constant int := 5;
begin
  v_party := public._lock_party();
  perform public._spend_action_point(v_party.id);   -- editing your party costs 1 Action Point
  v_name := left(btrim(coalesce(p_name, '')), 48);
  v_abbr := upper(btrim(coalesce(p_abbr, '')));
  if v_name = '' then raise exception 'Enter a party name.'; end if;
  if v_abbr !~ '^[A-Z]{2,4}$' then raise exception 'The abbreviation must be 2–4 letters.'; end if;
  -- logo_url is an uploaded party-logos public URL (or empty to leave no logo); length-capped.
  v_logo := nullif(left(btrim(coalesce(p_logo_url, '')), 500), '');
  -- colour is a #rrggbb hex (or empty → null, which falls back to the archetype colour).
  v_color := nullif(btrim(coalesce(p_color, '')), '');
  if v_color is not null and v_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Pick a valid colour.'; end if;

  update public.parties
     set name = v_name, abbreviation = v_abbr, logo_url = v_logo, color = v_color
   where id = v_party.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party',
            case when v_name <> v_party.name then v_party.name || ' has rebranded as ' || v_name || '.'
                 else v_name || ' updated its party branding.' end,
            public.current_game_date());
  return jsonb_build_object('ok', true, 'actions', v_party.influence, 'name', v_name, 'abbreviation', v_abbr, 'logo_url', v_logo, 'color', v_color);
end $$;
grant execute on function public.edit_party(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
