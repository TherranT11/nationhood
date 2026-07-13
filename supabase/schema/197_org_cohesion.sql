-- ===========================================================================
-- 197 · International Organizations — Cohesion economy + the Resource sector's live laws.
--
-- Cohesion is an org's shared political capital (column on organizations, schema/186): it starts at 20,
-- rises +0.5 each tick (capped at 100), a Level I law spends it on enactment (schema/190 _org_resolve_law),
-- and a member leaving an ACTIVE org costs 5. The three Resource-sector laws now bite on the economy:
--   • Joint Pricing  ('res'/'pricing')  — outsiders importing the org's resource FROM a member pay the
--                                         org's agreed unit price instead of the world rate (economy_import).
--   • Emergency Reserves ('res'/'reserves') — a member importing the resource from a FELLOW member pays at
--                                         cost: base price, no scarcity markup, no tariff (economy_import).
--   • Survey Sharing ('res'/'survey')   — every member's Produce cycle yields +1 of the resource while the
--                                         law stands (economy_produce).
-- Reserves beats Joint Pricing: a fellow member always gets the internal at-cost price, never the cartel one.
--
-- CAP NOTE: cohesion is capped at 100 (a tunable — keeps +0.5/tick a real constraint so an old org can't
-- stockpile unlimited law-buying power). BALANCE NOTE: Joint Pricing has no downside yet (an org can pin
-- $30 forever) — shipped raw by design; a demand/relations counter-pressure is a later tuning pass.
--
-- Depends on: 186 (organizations + cohesion/resource), 190 (laws + _org_law_cost), 114
-- (_resource_base_price), 40 (events, current_game_date), 05 (game_state), 20 (parties). Idempotent.
-- ===========================================================================

-- +0.5 Cohesion per tick to every active org, capped at 100. Called once per tick from _advance_tick
-- (schema/60). A plain UPDATE — isolated and side-effect-free, so it can never abort the tick.
create or replace function public._org_cohesion_tick()
returns void language sql security definer set search_path = public as $$
  update public.organizations set cohesion = least(100, coalesce(cohesion, 0) + 0.5) where status = 'active';
$$;
revoke all on function public._org_cohesion_tick() from public, anon, authenticated;

-- Is a fellow-member at-cost supply owed between two nations for this resource? True when buyer and seller
-- are BOTH members of the same active org that governs p_resource and has Emergency Reserves enacted.
create or replace function public._org_reserves_between(p_buyer text, p_seller text, p_resource text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.organizations o
      join public.organization_members mb on mb.org_id = o.id and mb.nation_id = p_buyer
      join public.organization_members ms on ms.org_id = o.id and ms.nation_id = p_seller
      join public.organization_laws   l  on l.org_id  = o.id and l.sector = 'res' and l.law_id = 'reserves' and l.status = 'enacted'
     where o.status = 'active' and o.resource = p_resource);
$$;
revoke all on function public._org_reserves_between(text, text, text) from public, anon, authenticated;

-- The joint price outsiders must pay for p_resource bought FROM p_seller, or null if none applies. Set when
-- the seller belongs to an active org that governs the resource and has Joint Pricing enacted; if the seller
-- is in more than one such org, the highest agreed price wins (the cartel's intent).
create or replace function public._org_joint_price(p_seller text, p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select max((l.param->>'price')::numeric)
    from public.organizations o
    join public.organization_members ms on ms.org_id = o.id and ms.nation_id = p_seller
    join public.organization_laws   l  on l.org_id  = o.id and l.sector = 'res' and l.law_id = 'pricing' and l.status = 'enacted'
   where o.status = 'active' and o.resource = p_resource
     and (l.param->>'price') is not null;
$$;
revoke all on function public._org_joint_price(text, text) from public, anon, authenticated;

-- Flat Produce-cycle bonus a nation gets for p_resource from Survey Sharing: +1 per active org it belongs to
-- that governs the resource and has the law enacted (0 when in none). Read by economy_produce (schema/113).
create or replace function public._org_production_bonus(p_nation text, p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select count(*)::numeric
    from public.organizations o
    join public.organization_members m on m.org_id = o.id and m.nation_id = p_nation
    join public.organization_laws   l  on l.org_id = o.id and l.sector = 'res' and l.law_id = 'survey' and l.status = 'enacted'
   where o.status = 'active' and o.resource = p_resource;
$$;
revoke all on function public._org_production_bonus(text, text) from public, anon, authenticated;

-- leave_organization: a member's Foreign Affairs minister withdraws its nation from an ACTIVE org. The
-- nation is dropped from membership and its law votes cleared, and the org loses 5 Cohesion. The host can't
-- leave (it would orphan the org); founding-stage withdrawal is leave_charter (schema/192) instead.
create or replace function public.leave_organization(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_host text; v_status text; v_name text; v_pname text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id, name into v_pid, v_nation, v_pname from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can leave an organization.'; end if;

  select status, host_nation, name into v_status, v_host, v_name from public.organizations where id = p_org for update;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'active' then raise exception 'This organization is still in its charter convention.'; end if;
  if v_host = v_nation then raise exception 'The host cannot leave its own organization.'; end if;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Your nation is not a member.'; end if;

  delete from public.organization_members    where org_id = p_org and nation_id = v_nation;
  delete from public.organization_law_votes  where org_id = p_org and nation_id = v_nation;   -- drop their open votes
  update public.organizations set cohesion = greatest(0, coalesce(cohesion, 0) - 5) where id = p_org;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_pid, 'party', v_pname || ' withdrew ' ||
            coalesce((select name from public.nations where id = v_nation), v_nation) || ' from ' || left(v_name, 48) || '.',
            public.current_game_date());
end $$;
grant execute on function public.leave_organization(uuid) to authenticated;

notify pgrst, 'reload schema';
