-- 98 · One-party state ⇄ multiparty transition (regime is the sole switch).
-- Depends on: 10 (nations.ruling_party/former_ruling_party, economy.regime), 20
-- (parties.pop_ceiling), 40 (events, current_game_date). Run after 40.
--
-- THE RULE: a nation is a one-party state iff its regime is 1–4 (One State / Functional
-- Autocracy's bottom). The admin makes a nation one-party by setting regime ≤ 4; it
-- erodes there organically through policy effects too. ruling_party is DERIVED from the
-- regime — it's never an independent toggle. _sync_one_party_state() reconciles the two:
--   regime ≤ 4 and not yet one-party → install the largest party as the ruling party
--                                      (its name → nations.ruling_party; its ceiling → 100);
--                                      everyone else is now a faction of it (a faction IS a
--                                      party row — no data moves).
--   regime ≥ 5 and currently one-party → restore multiparty: clear ruling_party, remember
--                                        who ruled in former_ruling_party (gates the home
--                                        "file for elections" banner; the former ruler keeps
--                                        its faction and its raised ceiling).
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
  v_raw text; v_regime numeric; v_ruling text; v_nname text;
  v_ruler_id uuid; v_ruler_name text;
begin
  select economy->>'regime', ruling_party, name
    into v_raw, v_ruling, v_nname
    from public.nations where id = p_nation;
  if not found then return; end if;

  -- Regime is the sole switch, and it must be a number to compare. A legacy free-text
  -- regime (an un-migrated nation) can't be ranked on the 1–20 scale, so leave the
  -- nation as-is rather than guess — same defensive stance as _nation_stat_add (schema/91).
  if v_raw is null or v_raw !~ '^-?[0-9]+(\.[0-9]+)?$' then return; end if;
  v_regime := v_raw::numeric;

  if v_regime <= 4 then
    -- Becoming a one-party state. No-op if it already is one.
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
                'With democracy extinguished, ' || v_nname || ' is now a one-party state under the ' || v_ruler_name || '.',
                public.current_game_date());
    end if;
  else
    -- Returning to multiparty. No-op if it already is. Remember who ruled (gates the
    -- home "file for elections" banner and exempts the former ruler from filing); cleared
    -- at the first election after restoration (resolve_election, schema/60).
    if v_ruling is not null then
      update public.nations
         set ruling_party = null, former_ruling_party = v_ruling
       where id = p_nation;
      insert into public.events (nation_id, kind, body, game_date)
        values (p_nation, 'government',
                v_nname || ' has restored multiparty politics.',
                public.current_game_date());
    end if;
  end if;
end $$;
-- Internal: only advance_tick (schema/60) and the admin RPC below call it.
revoke all on function public._sync_one_party_state(text) from public, anon, authenticated;

-- The admin's manual lever: after saving a nation (which may have moved its regime
-- across the 4/5 line), the /adminsetup save calls this to apply the transition
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

notify pgrst, 'reload schema';
