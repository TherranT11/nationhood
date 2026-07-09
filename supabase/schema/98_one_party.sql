-- 98 · One-party state ⇄ multiparty transition (regime is the sole switch).
-- Depends on: 10 (nations.ruling_party/former_ruling_party, economy.regime), 20
-- (parties.pop_ceiling), 40 (events, current_game_date). Run after 40.
--
-- THE RULE: a nation is a one-party state iff it is an autocracy at the reform floor (reform
-- ≤ 3) OR an ABSOLUTE MONARCHY (a monarchy at reform ≥ 3 — the monarch's party rules alone).
-- Constitutional monarchies (monarchy, reform ≤ 2) are ordinary multiparty democracies. The
-- admin makes a nation one-party by setting the regime into either band; it erodes to the
-- autocratic floor organically through reform-lowering effects too. ruling_party is DERIVED
-- from the regime — it's never an independent toggle. _sync_one_party_state() reconciles the
-- two (_regime_is_one_party, schema/166, is the ONE test):
--   one-party band, not yet one-party → install the largest party as the ruling party
--                                      (its name → nations.ruling_party; its ceiling → 100);
--                                      everyone else is now a faction of it (a faction IS a
--                                      party row — no data moves).
--   multiparty band and currently one-party → restore multiparty: clear ruling_party, name the
--                                        former ruler in former_ruling_party (for the relaunch
--                                        copy), and flag every OTHER party awaiting_relaunch so
--                                        it may relaunch as a full party. The former ruler is
--                                        left unflagged — it keeps its faction and raised ceiling.
-- The per-party awaiting_relaunch flag (schema/20) is what gates each player's relaunch prompt;
-- it persists until that player relaunches (party_relaunch), so the choice never expires.
-- Idempotent: it only acts on a genuine crossing, so it's safe to call for every nation
-- every tick (advance_tick, schema/60) and after each admin nation save (admin_sync_one_party).
-- New parties keep their defaults (0% popularity, 5% ceiling, schema/20) — nothing here
-- touches them, so only the ruling party is elevated.

create or replace function public._sync_one_party_state(p_nation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eco jsonb; v_ruling text; v_nname text;
  v_ruler_id uuid; v_ruler_name text;
begin
  select economy, ruling_party, name
    into v_eco, v_ruling, v_nname
    from public.nations where id = p_nation;
  if not found then return; end if;

  -- Regime type is the sole switch. An unset type (an un-configured nation) can't be ranked,
  -- so leave the nation as-is rather than guess — same defensive stance as _nation_stat_add.
  if public._regime_type(v_eco) is null then return; end if;

  -- One-party iff the regime is at the autocratic floor OR an ABSOLUTE MONARCHY (both are
  -- sole-ruler states where players join as factions of the ruling party). Constitutional
  -- monarchies stay multiparty democracies. _regime_is_one_party (schema/166) is the ONE test.
  if public._regime_is_one_party(v_eco) then
    -- Becoming a one-party state. No-op if it already is one. NOTE (accepted by design):
    -- a non-null ruling_party is treated as AUTHORITATIVE and never re-derived — this is
    -- what lets the admin name the ruling party directly in the /adminsetup form. The
    -- trade-off is that an admin-set ruling_party persists even if it isn't the largest
    -- party; regime is the switch, this field is the (optional) name. Keep the two
    -- consistent: a name set while regime is ≥5 will be cleared on the next sync (restore).
    if v_ruling is null then
      -- The largest party becomes the sole legal party (most seats, then popularity,
      -- then the oldest). No parties yet → the state itself is the ruling party, named
      -- after the nation, so the framing still holds until players arrive.
      select id, name into v_ruler_id, v_ruler_name
        from public.parties where nation_id = p_nation
        order by seats desc, popularity desc, created_at asc
        limit 1;
      v_ruler_name := coalesce(v_ruler_name, v_nname);

      update public.nations set ruling_party = v_ruler_name where id = p_nation;
      -- The ruling party's reach opens to the maximum; its rivals-turned-factions keep
      -- whatever ceiling they had. New factions still start at the 5% default (schema/20).
      if v_ruler_id is not null then
        update public.parties set pop_ceiling = 100 where id = v_ruler_id;
      end if;

      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (p_nation, v_ruler_id, 'government',
                case when public._regime_is_monarchy(v_eco)
                     then v_nname || ' has been proclaimed an absolute monarchy under the ' || v_ruler_name || '.'
                     else 'With democracy extinguished, ' || v_nname || ' is now a one-party state under the ' || v_ruler_name || '.' end,
                public.current_game_date());
    end if;
  else
    -- Returning to multiparty. No-op if it already is. Remember who ruled (former_ruling_party
    -- names the larger party the lingering factions belong to), and flag every OTHER party as
    -- a faction that may relaunch itself as a full party. The flag persists until that player
    -- relaunches (party_relaunch) — the choice never expires; the former ruler is left unflagged
    -- (it keeps its faction + its raised ceiling).
    if v_ruling is not null then
      update public.nations
         set ruling_party = null, former_ruling_party = v_ruling
       where id = p_nation;
      update public.parties
         set awaiting_relaunch = (lower(name) is distinct from lower(v_ruling))
       where nation_id = p_nation;
      insert into public.events (nation_id, kind, body, game_date)
        values (p_nation, 'government',
                v_nname || ' has restored multiparty politics.',
                public.current_game_date());
    end if;
  end if;
end $$;
-- Internal: only advance_tick (schema/60) and the admin RPC below call it.
revoke all on function public._sync_one_party_state(text) from public, anon, authenticated;

-- The admin's manual lever: after saving a nation (which may have moved it across the
-- one-party band line), the /adminsetup save calls this to apply the transition
-- immediately rather than waiting for the next tick. Admin-gated; thin wrapper.
create or replace function public.admin_sync_one_party(p_nation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  perform public._sync_one_party_state(p_nation);
end $$;
grant execute on function public.admin_sync_one_party(text) to authenticated;

-- A player relaunches their faction as a full party: /party-creation has already
-- rewritten the (client-granted) name/abbreviation/description on their own row; this
-- clears the game-controlled awaiting_relaunch flag so the relaunch prompt retires. It
-- locks the caller's own party (which also stamps the activity heartbeat). No-op if the
-- flag wasn't set, so calling it spuriously is harmless.
create or replace function public.party_relaunch()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_p public.parties%rowtype;
begin
  v_p := public._lock_party();   -- caller's own party, FOR UPDATE; stamps last_active_at
  update public.parties set awaiting_relaunch = false where id = v_p.id;
end $$;
grant execute on function public.party_relaunch() to authenticated;

notify pgrst, 'reload schema';
