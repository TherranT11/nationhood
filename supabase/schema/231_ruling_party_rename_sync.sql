-- ===========================================================================
-- 231 · Keep a one-party state's name in sync when the ruling party rebrands.
--
-- nations.ruling_party stores the ruling party's NAME (schema/98), and the one-party system identifies
-- the ruler by name-matching. But edit_party (schema/102) renamed the party WITHOUT updating that stored
-- name, so after a rebrand the Elections / one-party framing stayed stuck on the old name (e.g. a nation
-- kept showing "National Conservative Party" after its ruler renamed).
--
--   • edit_party: after the rename, if this party WAS the ruling party (its old name matched
--     nations.ruling_party), carry the new name onto nations.ruling_party — so the field stays equal to
--     the ruler's current name (one source: parties.name).
--   • One-time backfill: any one-party nation whose stored ruling_party no longer matches ANY of its
--     parties (its ruler renamed before this fix) is re-derived from its largest party's current name.
--     Guarded to the clearly-stale case only, so a deliberately admin-set name that still matches a party
--     is left alone.
--
-- Depends on: 102 (edit_party), 98/10 (ruling_party), 20 (parties). Idempotent. Apply after 230.
-- ===========================================================================

set check_function_bodies = off;

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
  v_logo := nullif(left(btrim(coalesce(p_logo_url, '')), 500), '');
  v_color := nullif(btrim(coalesce(p_color, '')), '');
  if v_color is not null and v_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Pick a valid colour.'; end if;

  update public.parties
     set name = v_name, abbreviation = v_abbr, logo_url = v_logo, color = v_color
   where id = v_party.id;

  -- If this party is the ruling party of a one-party state, keep nations.ruling_party equal to its new
  -- name (the field is a name snapshot; without this the one-party framing sticks on the old name).
  if v_name <> v_party.name then
    update public.nations
       set ruling_party = v_name
     where id = v_party.nation_id
       and ruling_party is not null
       and lower(ruling_party) = lower(v_party.name);
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party',
            case when v_name <> v_party.name then v_party.name || ' has rebranded as ' || v_name || '.'
                 else v_name || ' updated its party branding.' end,
            public.current_game_date());
  return jsonb_build_object('ok', true, 'actions', v_party.influence, 'name', v_name, 'abbreviation', v_abbr, 'logo_url', v_logo, 'color', v_color);
end $$;
grant execute on function public.edit_party(text, text, text, text) to authenticated;

-- One-time backfill: re-derive ruling_party for any one-party nation whose stored name matches no current
-- party (its ruler rebranded before this fix landed). Largest party = most seats, then popularity, then
-- oldest — the same order schema/98 uses to pick the ruler.
update public.nations n
   set ruling_party = (
     select p.name from public.parties p where p.nation_id = n.id
     order by p.seats desc, p.popularity desc, p.created_at asc limit 1)
 where n.ruling_party is not null
   and exists (select 1 from public.parties p where p.nation_id = n.id)
   and not exists (select 1 from public.parties p where p.nation_id = n.id and lower(p.name) = lower(n.ruling_party));

notify pgrst, 'reload schema';
