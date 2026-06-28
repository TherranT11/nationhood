-- ===========================================================================
-- 119 · Statement — the Head of Government's public address.
-- Depends on: 40 (_lock_party), 60 (_head_of_government_label, governments),
-- 10 (nations), events (40). Run after 60.
--
-- The premier releases a written statement (≤ 360 chars). Costs $10K Party Funds,
-- no action. Domestic lands only in the home nation's feed; International lands in
-- every (non-dormant) nation's feed. The rendered line is the ONE source of the
-- wording, so every nation sees the same text. HoG-gated; writes are RPC-only
-- (events has no client insert policy).
-- ===========================================================================

create or replace function public.release_statement(p_scope text, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_nation text;
  v_cost constant int := 10000; v_msg text; v_nname text; v_body text; v_intl boolean;
begin
  v_p := public._lock_party();   -- 0 AP; funds-gated below, row locked against a double-spend
  v_nation := v_p.nation_id;

  select * into v_gov from public.governments where nation_id = v_nation and status = 'active';
  if not found or v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the Head of Government can release a statement.'; end if;

  if v_p.funds < v_cost then raise exception 'Not enough funds (need $10K).'; end if;

  v_msg := btrim(coalesce(p_message, ''));
  if v_msg = '' then raise exception 'Write a statement first.'; end if;
  if length(v_msg) > 360 then raise exception 'A statement is limited to 360 characters.'; end if;

  v_intl := lower(coalesce(p_scope, '')) = 'international';

  select name into v_nname from public.nations where id = v_nation;
  v_body := public._head_of_government_label(v_nation, v_p.id) || ' of ' || coalesce(v_nname, v_nation)
            || ' has released the following statement: ' || v_msg;

  update public.parties set funds = funds - v_cost where id = v_p.id;

  if v_intl then
    insert into public.events (nation_id, party_id, kind, body, game_date)
      select n.id, v_p.id, 'declaration', v_body, public.current_game_date()
        from public.nations n where not coalesce(n.dormant, false);
  else
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_nation, v_p.id, 'declaration', v_body, public.current_game_date());
  end if;

  return jsonb_build_object('scope', case when v_intl then 'international' else 'domestic' end,
    'funds', v_p.funds - v_cost);
end $$;
grant execute on function public.release_statement(text, text) to authenticated;

notify pgrst, 'reload schema';
