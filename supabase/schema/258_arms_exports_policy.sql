-- ===========================================================================
-- 258 · Arms Exports policy — seed the 5-tier definition + a production-gated propose_law.
--
-- Slice 1 of Arms Exports: the policy appears on the Policies slate (visible-but-locked until the
-- nation produces >= 3 Military, via the requires prod gate). The tier STAT effects are standing
-- (cad 'tick' → read through _nation_policy_stat while the tier is in force). The trade mechanics
-- (who may import Military, the T4 discount, the T3 request/approval flow) land in later slices, keyed
-- off definition.special = 'arms_export'.
--
--   T1 No Exports — nothing.
--   T2 Allied Sales Only — Relations 7+ or a shared Security org may import your Military. +3 National Pride.
--   T3 Licensed Global Sales — any nation may REQUEST; the Minister of Trade approves/denies.
--   T4 Anyone Who Pays — open, 20% off. +3 Growth, +1 Terrorism.
--   T5 Military Industrial Complex — the economy reorganizes. +5 Growth, +7 Terrorism.
--
-- Also gates propose_law: a policy whose requires carries a { prod, min } condition can't be changed
-- unless the nation meets it (server enforcement behind the client's visible-but-locked state).
-- Depends on: 90 (policies), 92 (propose_law). Idempotent (seed guarded by name). Apply after 92.
-- ===========================================================================

set check_function_bodies = off;

insert into public.policies (definition)
select '{
  "name": "Arms Exports",
  "desc": "Whether — and to whom — the nation sells its Military abroad.",
  "type": "spectrum",
  "special": "arms_export",
  "defaultIdx": 0,
  "popRaise": 2,
  "requires": { "mode": "all", "conds": [ { "prod": "military", "min": 3 } ] },
  "spectrum": [
    { "name": "No Exports", "desc": "The nation sells no Military abroad.", "effects": [] },
    { "name": "Allied Sales Only", "desc": "Only nations at Relations 7+ or in a shared Security organization may import your Military.", "effects": [ { "t": "National Pride", "v": 3, "cad": "tick" } ] },
    { "name": "Licensed Global Sales", "desc": "Any nation may request to import your Military; the Minister of Trade approves or denies each request.", "effects": [] },
    { "name": "Anyone Who Pays", "desc": "Any nation may import your Military, at 20% off. The arms trade lifts the economy.", "effects": [ { "t": "Growth", "v": 3, "cad": "tick" }, { "t": "Terrorism", "v": 1, "cad": "tick" } ] },
    { "name": "Military Industrial Complex", "desc": "The economy reorganizes around the arms trade.", "effects": [ { "t": "Growth", "v": 5, "cad": "tick" }, { "t": "Terrorism", "v": 7, "cad": "tick" } ] }
  ]
}'::jsonb
where not exists (select 1 from public.policies where definition->>'name' = 'Arms Exports');

-- A reusable check: does p_nation meet every { prod, min } requirement in a policy definition's requires?
-- (Policy-on-policy conditions are unaffected — this only enforces the production gate server-side.)
create or replace function public._policy_prod_requirements_met(p_nation text, p_def jsonb)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(bool_and(
           coalesce((select (production->>(c->>'prod'))::numeric from public.nations where id = p_nation), 0)
             >= coalesce((c->>'min')::numeric, 0)
         ), true)
    from jsonb_array_elements(coalesce(p_def->'requires'->'conds', '[]'::jsonb)) c
   where c ? 'prod';
$$;
revoke all on function public._policy_prod_requirements_met(text, jsonb) from public, anon, authenticated;

-- Redefine propose_law (body verbatim from schema/92) to enforce the production gate: a policy whose
-- requires carries a { prod, min } condition can't be sent to the chamber unless the nation meets it.
create or replace function public.propose_law(p_policy uuid, p_option int,
  p_title text default null, p_intro text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_name text; v_opt text; v_def jsonb;
  v_tick int; v_curopt int; v_extra int; v_swing numeric; v_cost int; v_pid uuid; v_i int;
  v_title text; v_intro text;
begin
  select policy_name, option_name into v_name, v_opt from public._check_law(p_policy, p_option);
  select definition into v_def from public.policies where id = p_policy;
  select current_tick into v_tick from public.game_state where id;
  v_title := left(coalesce(nullif(btrim(p_title), ''), v_name || ' → ' || v_opt), 120);
  v_intro := left(nullif(btrim(p_intro), ''), 400);

  v_party := public._begin_action(0);   -- lock the party + spend the base Action Point

  -- Production-gated policy (Arms Exports requires Military production >= 3): can't be changed unless met.
  if not public._policy_prod_requirements_met(v_party.nation_id, v_def) then
    raise exception 'This policy is locked until your nation meets its production requirement.'; end if;

  if v_party.seats < 1 then raise exception 'A party with no legislature seats cannot propose a bill.'; end if;

  v_curopt := public._nation_policy_option(v_party.nation_id, p_policy);
  if v_curopt = p_option then raise exception 'That policy is already set to that option.'; end if;

  v_swing := abs(coalesce((v_def->>'popRaise')::numeric, 0) * (p_option - v_curopt));
  v_extra := floor(v_swing / 5)::int;
  for v_i in 1 .. v_extra loop perform public._spend_action_point(v_party.id); end loop;
  v_cost := 1 + v_extra;

  perform 1 from public.nations where id = v_party.nation_id for update;
  if exists (select 1 from public.proposals
               where nation_id = v_party.nation_id and kind = 'law'
                 and status in ('committee', 'voting', 'agenda')
                 and payload->>'policy_id' = p_policy::text) then
    raise exception 'A bill to change this policy is already before the chamber — it must resolve first.';
  end if;
  if exists (select 1 from public.nation_law_implementations
               where nation_id = v_party.nation_id and policy_id = p_policy) then
    raise exception 'A change to this policy is already being implemented — wait for it to take effect.';
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (v_party.nation_id, v_party.id, 'law', v_title,
            jsonb_build_object('policy_id', p_policy, 'option_idx', p_option, 'policy_name', v_name, 'option_name', v_opt)
              || case when v_intro is null then '{}'::jsonb else jsonb_build_object('intro', v_intro) end,
            'committee', v_tick)
    returning id into v_pid;

  return jsonb_build_object('id', v_pid, 'status', 'committee', 'cost', v_cost, 'actions', v_party.influence);
end $$;
grant execute on function public.propose_law(uuid, int, text, text) to authenticated;

notify pgrst, 'reload schema';
