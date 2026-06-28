-- ===========================================================================
-- 112 · Youth Wing — the deferred Direct action, now built.
-- Depends on: 20 (parties), 30 (politicians), 40 (_begin_action, _bare_party, events),
-- 60 (_advance_tick), 111 (_politician_busy). Run after 111.
--
-- Expand the Youth Wing: $25K + 1 action. It rolls 1D12 + 3 → the drive lands that many ticks
-- out, where it raises the party's popularity FLOOR by 0.1% for every point of (1D3 + the
-- organiser's Image). A patient, long investment in the base. Resolution runs from the tick.
-- ===========================================================================

create table if not exists public.youth_wings (
  id              uuid primary key default gen_random_uuid(),
  party_id        uuid not null references public.parties (id) on delete cascade,
  politician_id   uuid references public.politicians (id) on delete set null,
  organiser_name  text not null,
  organiser_image int  not null default 0,        -- snapshot of the organiser's Image at start
  resolve_tick    int  not null,                   -- current tick + (1D12 + 3)
  created_at      timestamptz not null default now()
);
create index if not exists youth_wings_resolve_idx on public.youth_wings (resolve_tick);

-- World-readable (a pending drive is public); writes are RPC-only.
alter table public.youth_wings enable row level security;
drop policy if exists "yw_select_all" on public.youth_wings;
create policy "yw_select_all" on public.youth_wings for select using (true);

-- Start a youth-wing drive. $25K + 1 action. The member must not already be standing for office
-- (the shared busy check). Rolls the landing tick now; the floor gain is rolled at resolution.
create or replace function public.direct_youth_wing(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_mname text; v_image int; v_tick int; v_resolve int; v_cost bigint := 25000;
begin
  v_p := public._begin_action(v_cost);
  select btrim(first_name || ' ' || last_name), coalesce(com, 0) into v_mname, v_image
    from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;
  if public._politician_busy(p_member) then raise exception '%', v_mname || ' is standing for office — they can''t be directed elsewhere yet.'; end if;
  if public._politician_is_minister(p_member) then raise exception '%', v_mname || ' holds a cabinet ministry — a sitting minister can''t expand the youth wing.'; end if;
  select current_tick into v_tick from public.game_state where id;
  v_resolve := v_tick + floor(random() * 12)::int + 1 + 3;   -- 1D12 + 3 ticks out (4..15)

  insert into public.youth_wings (party_id, politician_id, organiser_name, organiser_image, resolve_tick)
    values (v_p.id, p_member, v_mname, v_image, v_resolve);
  update public.parties set funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
            v_mname || ' of the ' || public._bare_party(v_p.name) || ' has begun expanding the party''s youth wing — it pays off in ' || (v_resolve - v_tick) || ' ticks.',
            public.current_game_date());

  return jsonb_build_object('ticks', v_resolve - v_tick, 'actions', v_p.actions_remaining - 1, 'funds', v_p.funds - v_cost);
end $$;
grant execute on function public.direct_youth_wing(uuid) to authenticated;

-- Resolve due youth wings: raise the party's popularity floor by 0.1% × (1D3 + organiser Image),
-- clamped to the invariant (floor ≤ ceiling; popularity pulled up to — never above — the new floor).
create or replace function public._resolve_youth_wings(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_w record; v_pts int; v_gain numeric; v_bare text; v_nation text;
begin
  for v_w in select * from public.youth_wings where resolve_tick <= p_tick loop
    v_pts  := floor(random() * 3)::int + 1 + coalesce(v_w.organiser_image, 0);   -- 1D3 + Image
    v_gain := round(v_pts * 0.1, 1);
    update public.parties
       set pop_floor  = least(pop_ceiling, pop_floor + v_gain),
           popularity = greatest(popularity, least(pop_ceiling, pop_floor + v_gain))
     where id = v_w.party_id
     returning public._bare_party(name), nation_id into v_bare, v_nation;
    if found then
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (v_nation, v_w.party_id, 'party',
                'The ' || v_bare || '''s youth wing has come of age — popularity floor +' || trim(to_char(v_gain, 'FM990.0')) || '% (organised by ' || v_w.organiser_name || ').',
                public.current_game_date());
    end if;
    delete from public.youth_wings where id = v_w.id;
  end loop;
end $$;
revoke all on function public._resolve_youth_wings(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
