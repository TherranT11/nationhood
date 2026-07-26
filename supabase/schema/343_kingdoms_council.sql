-- ===========================================================================
-- 343 · Kingdoms — the King's Council: the Sovereign appoints and dismisses the six great offices.
--
-- The realm's council (Steward, Master of Coin, Marshal of the Realm, Master of Laws, Master of Ships,
-- Spymaster) is filled by the Sovereign alone. kingdoms_council holds one row per FILLED seat per realm; an
-- empty seat is simply the absence of a row. Only the King sees or uses these actions (enforced here: both
-- RPCs require the caller to be their realm's Sovereign).
--
-- Appointing draws from any adult (18+) Personality of the realm — the King's own dynasty and every other
-- house — a Head of House or a grown child/sibling (kingdoms_children). The one who is seated is recorded by
-- reference (person_kind + person_id) so they can't hold two seats, with their name and house snapshotted for
-- display. The last option, Hire a Minor Lord, mints a fresh unaffiliated officer instead. Every appointment
-- costs 1 Gold; a Minor Lord costs an extra 1 House Prestige. Dismissal is free. Costs never drive a stat
-- negative (guarded). Seats carry no mechanical effect yet — that is deferred. Depends on: 307/311 (leaders),
-- 321/334 (children), 337 (event log). Idempotent. Apply after 342.
-- ===========================================================================

create table if not exists public.kingdoms_council (
  heritage          text not null,
  seat              text not null,
  person_kind       text not null check (person_kind in ('head', 'child', 'minor')),
  person_id         uuid,                                            -- leaders.id | children.id | null (minor)
  holder_name       text not null,
  holder_house      uuid references public.kingdoms_leaders(id) on delete cascade,   -- null for a Minor Lord
  holder_house_name text,                                            -- snapshot for display; null for a Minor Lord
  appointed_at      timestamptz not null default now(),
  primary key (heritage, seat)
);
alter table public.kingdoms_council enable row level security;
grant select on public.kingdoms_council to anon, authenticated;   -- the council is public; only the RPCs write it
drop policy if exists "kingdoms_council_select_all" on public.kingdoms_council;
create policy "kingdoms_council_select_all" on public.kingdoms_council for select using (true);

-- Appoint a Personality (or a fresh Minor Lord) to a council seat. Sovereign only. Returns a chronicle line.
create or replace function public.kingdoms_appoint(p_seat text, p_kind text, p_person uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_realm text; v_sov boolean; v_gold int; v_prestige int;
  v_name text; v_house uuid; v_house_name text; v_age int; v_gender text; v_msg text;
  v_valid text[] := array['Steward','Master of Coin','Marshal of the Realm','Master of Laws','Master of Ships','Spymaster'];
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select id, heritage, coalesce(is_sovereign, false),
         coalesce((resources->>'gold')::int, 0), coalesce((resources->>'prestige')::int, 0)
    into v_id, v_realm, v_sov, v_gold, v_prestige
  from public.kingdoms_leaders where user_id = auth.uid() order by created_at desc limit 1;
  if v_id is null then raise exception 'no_house'; end if;
  if not v_sov then raise exception 'not_sovereign'; end if;
  if p_seat <> all(v_valid) then raise exception 'unknown_seat'; end if;
  if v_gold < 1 then raise exception 'cannot_pay'; end if;

  -- Resolve who is being seated (name + house snapshot), validating eligibility per kind.
  if p_kind = 'minor' then
    if v_prestige < 1 then raise exception 'need_prestige'; end if;   -- a minor lord also costs 1 House Prestige
    v_gender := case when random() < 0.5 then 'male' else 'female' end;
    v_name := case when v_gender = 'male' then public.kingdoms_random_male_name() else public.kingdoms_random_female_name() end;
    v_house := null; v_house_name := null;
    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{prestige}', to_jsonb(greatest(0, v_prestige - 1))) where id = v_id;
  elsif p_kind = 'head' then
    select leader_name, id, house_name into v_name, v_house, v_house_name
      from public.kingdoms_leaders where id = p_person and heritage = v_realm;
    if v_name is null then raise exception 'no_such_person'; end if;
    if exists (select 1 from public.kingdoms_council where heritage = v_realm and person_kind = 'head' and person_id = p_person) then
      raise exception 'already_seated'; end if;
  elsif p_kind = 'child' then
    select c.name, c.age, c.house_id, l.house_name into v_name, v_age, v_house, v_house_name
      from public.kingdoms_children c join public.kingdoms_leaders l on l.id = c.house_id
      where c.id = p_person and l.heritage = v_realm;
    if v_name is null then raise exception 'no_such_person'; end if;
    if coalesce(v_age, 0) < 18 then raise exception 'too_young'; end if;
    if exists (select 1 from public.kingdoms_council where heritage = v_realm and person_kind = 'child' and person_id = p_person) then
      raise exception 'already_seated'; end if;
  else
    raise exception 'bad_kind';
  end if;

  -- Every appointment costs 1 Gold (one source for the cost, floored so it can't drive Gold negative).
  update public.kingdoms_leaders set resources = jsonb_set(resources, '{gold}', to_jsonb(greatest(0, v_gold - 1))) where id = v_id;

  insert into public.kingdoms_council (heritage, seat, person_kind, person_id, holder_name, holder_house, holder_house_name)
    values (v_realm, p_seat, p_kind, case when p_kind = 'minor' then null else p_person end, v_name, v_house, v_house_name)
  on conflict (heritage, seat) do update
    set person_kind = excluded.person_kind, person_id = excluded.person_id, holder_name = excluded.holder_name,
        holder_house = excluded.holder_house, holder_house_name = excluded.holder_house_name, appointed_at = now();

  v_msg := v_name || ' is named ' || p_seat || case when p_kind = 'minor' then ' (a minor lord)' else '' end || '.';
  perform public._kingdoms_log(v_id, 'Court', null, v_msg);
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_appoint(text, text, uuid) from public, anon;
grant execute on function public.kingdoms_appoint(text, text, uuid) to authenticated;

-- Dismiss whoever holds a seat. Sovereign only, free. Returns a chronicle line.
create or replace function public.kingdoms_dismiss(p_seat text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_realm text; v_sov boolean; v_name text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select id, heritage, coalesce(is_sovereign, false) into v_id, v_realm, v_sov
    from public.kingdoms_leaders where user_id = auth.uid() order by created_at desc limit 1;
  if v_id is null then raise exception 'no_house'; end if;
  if not v_sov then raise exception 'not_sovereign'; end if;

  select holder_name into v_name from public.kingdoms_council where heritage = v_realm and seat = p_seat;
  if v_name is null then raise exception 'empty_seat'; end if;
  delete from public.kingdoms_council where heritage = v_realm and seat = p_seat;

  perform public._kingdoms_log(v_id, 'Court', null, v_name || ' is dismissed from ' || p_seat || '.');
  return v_name || ' is dismissed from ' || p_seat || '.';
end;
$$;
revoke all on function public.kingdoms_dismiss(text) from public, anon;
grant execute on function public.kingdoms_dismiss(text) to authenticated;

notify pgrst, 'reload schema';
