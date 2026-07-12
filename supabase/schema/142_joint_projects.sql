-- 142 · Joint Projects — the cross-nation negotiation for a joint national initiative (schema/140
-- authors definition.joint = { partner, quantity, target }). The proposer's Minister of Economic
-- Development sends the partner an offer (consent / 25% / 50% cost-share) with a message; the two
-- governments haggle in a message thread; when the standing terms are accepted the project starts
-- via _initiative_start (schema/141) with the cost split, and the partner receives its authored
-- benefit on completion. Proposing is free; the proposer's 2 AP are spent on acceptance.
-- Depends on: 141 (_initiative_start, national_initiatives), 137 (nation_relations),
-- 114 (_party_holds_ministry), 60 (governments), 40 (current_game_date). Run after 141.
-- ===========================================================================

-- A live negotiation: one per (initiative, proposer nation) while pending. Both sides + the world
-- can read it; only the security-definer RPCs below write.
create table if not exists public.joint_proposals (
  id              uuid primary key default gen_random_uuid(),
  initiative_id   uuid not null references public.national_initiatives (id) on delete cascade,
  proposer_nation text not null references public.nations (id) on delete cascade,
  partner_nation  text not null references public.nations (id) on delete cascade,
  proposer_party  uuid not null references public.parties (id) on delete cascade,  -- pays the 2 AP on accept
  ownership       text not null,                       -- 'private' | 'state' — the proposer's execution model
  corp_id         uuid references public.corporations (id) on delete set null,     -- state executor (proposer's SO firm)
  share           int  not null default 0,             -- STANDING offer: % of cost the partner covers (0/25/50)
  turn            text not null default 'partner',     -- whose move: 'partner' | 'proposer'
  status          text not null default 'pending',     -- 'pending' | 'accepted' | 'declined'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists joint_proposals_partner_idx  on public.joint_proposals (partner_nation)  where status = 'pending';
create index if not exists joint_proposals_proposer_idx on public.joint_proposals (proposer_nation) where status = 'pending';
-- At most one live negotiation per (initiative, proposer) — a double-click can't open two.
create unique index if not exists joint_proposals_one_pending
  on public.joint_proposals (initiative_id, proposer_nation) where status = 'pending';

alter table public.joint_proposals enable row level security;
drop policy if exists "joint_proposals_select_all" on public.joint_proposals;
create policy "joint_proposals_select_all" on public.joint_proposals for select using (true);

-- The negotiation thread. from_nation null = a system line ("Vesperia countered — they cover 25%").
create table if not exists public.joint_messages (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.joint_proposals (id) on delete cascade,
  from_nation text references public.nations (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists joint_messages_proposal_idx on public.joint_messages (proposal_id, created_at);

alter table public.joint_messages enable row level security;
drop policy if exists "joint_messages_select_all" on public.joint_messages;
create policy "joint_messages_select_all" on public.joint_messages for select using (true);

-- ---------------------------------------------------------------------------
-- The bilateral relation value A↔B (symmetric, canonical row; missing pair = 5). schema/137 stores
-- it; this is the read helper its header anticipated. One source for the ≥6 joint gate + any future
-- consumer.
create or replace function public._relation_value(p_a text, p_b text)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.nation_relations
                    where nation_a = least(p_a, p_b) and nation_b = greatest(p_a, p_b)), 5);
$$;

-- Who is the signed-in player to this proposal? 'proposer' (the Economic Development minister of the
-- proposing nation) | 'partner' (the head of government of the partner nation) | null (neither).
create or replace function public._joint_role(p_proposal uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_party uuid; v_nation text; v_pr public.joint_proposals%rowtype;
begin
  select id, nation_id into v_party, v_nation from public.parties where user_id = auth.uid();
  if v_party is null then return null; end if;
  select * into v_pr from public.joint_proposals where id = p_proposal;
  if not found then return null; end if;
  if v_nation = v_pr.proposer_nation and public._party_holds_ministry(v_party, 'Economic Development') then return 'proposer'; end if;
  if v_nation = v_pr.partner_nation and exists (
       select 1 from public.governments g
        where g.nation_id = v_pr.partner_nation and g.status = 'active' and g.formateur_party_id = v_party) then
    return 'partner';
  end if;
  return null;
end $$;
revoke all on function public._relation_value(text, text) from public, anon, authenticated;
revoke all on function public._joint_role(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- joint_propose(initiative, share, ownership, corp, message): the proposer's Minister of Economic
-- Development opens a negotiation with the initiative's authored partner. Free (no AP). Gated to the
-- portfolio + relations ≥ 6. The corp/ownership are validated for real at accept (in _initiative_start).
-- ---------------------------------------------------------------------------
create or replace function public.joint_propose(p_initiative uuid, p_share int, p_ownership text,
                                                p_corp uuid default null, p_message text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_def jsonb; v_partner text; v_id uuid;
begin
  select * into v_p from public.parties where user_id = auth.uid();
  if not found then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_p.id, 'Economic Development') then
    raise exception 'Only the Minister of Economic Development can propose a joint project.';
  end if;

  select definition into v_def from public.national_initiatives where id = p_initiative;
  if v_def is null then raise exception 'That initiative no longer exists.'; end if;
  if jsonb_typeof(v_def->'joint') <> 'object' then raise exception 'That initiative is not a joint project.'; end if;
  v_partner := v_def->'joint'->>'partner';
  if v_partner is null then raise exception 'That joint project has no partner nation set.'; end if;
  if v_partner = v_p.nation_id then raise exception 'A joint project needs a different partner nation.'; end if;

  if p_share not in (0, 25, 50) then raise exception 'The partner can be asked to cover 0%%, 25%% or 50%%.'; end if;
  if lower(coalesce(p_ownership, '')) not in ('private', 'state') then raise exception 'Choose private enterprise or state sanctioned.'; end if;
  if lower(p_ownership) = 'state' and p_corp is null then raise exception 'Choose a state-owned corporation to carry out this initiative.'; end if;

  if public._relation_value(v_p.nation_id, v_partner) < 6 then
    raise exception 'This project needs relations of at least 6 with the partner nation.';
  end if;
  if exists (select 1 from public.nation_initiatives where nation_id = v_p.nation_id and status = 'active') then
    raise exception 'Your nation already has an initiative under way — it must finish first.';
  end if;
  if exists (select 1 from public.joint_proposals
              where initiative_id = p_initiative and proposer_nation = v_p.nation_id and status = 'pending') then
    raise exception 'You already have a pending proposal for this project.';
  end if;

  insert into public.joint_proposals (initiative_id, proposer_nation, partner_nation, proposer_party, ownership, corp_id, share, turn, status)
    values (p_initiative, v_p.nation_id, v_partner, v_p.id, lower(p_ownership), p_corp, p_share, 'partner', 'pending')
    returning id into v_id;

  if nullif(btrim(coalesce(p_message, '')), '') is not null then
    insert into public.joint_messages (proposal_id, from_nation, body) values (v_id, v_p.nation_id, btrim(p_message));
  end if;

  return jsonb_build_object('id', v_id, 'share', p_share, 'turn', 'partner');
end $$;
grant execute on function public.joint_propose(uuid, int, text, uuid, text) to authenticated;

-- joint_message(proposal, body): append a chat line. Either participant, any time it's still open.
create or replace function public.joint_message(p_proposal uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare v_role text; v_pr public.joint_proposals%rowtype;
begin
  if nullif(btrim(coalesce(p_body, '')), '') is null then return; end if;
  v_role := public._joint_role(p_proposal);
  if v_role is null then raise exception 'You are not part of this negotiation.'; end if;
  select * into v_pr from public.joint_proposals where id = p_proposal;
  if v_pr.status <> 'pending' then raise exception 'This negotiation is closed.'; end if;
  insert into public.joint_messages (proposal_id, from_nation, body)
    values (p_proposal, case when v_role = 'proposer' then v_pr.proposer_nation else v_pr.partner_nation end, btrim(p_body));
end $$;
grant execute on function public.joint_message(uuid, text) to authenticated;

-- joint_counter(proposal, share): the side whose turn it is offers a different cost-share; the turn
-- passes to the other government. A system line records it.
create or replace function public.joint_counter(p_proposal uuid, p_share int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role text; v_pr public.joint_proposals%rowtype;
begin
  if p_share not in (0, 25, 50) then raise exception 'Offer 0%%, 25%% or 50%%.'; end if;
  v_role := public._joint_role(p_proposal);
  if v_role is null then raise exception 'You are not part of this negotiation.'; end if;
  select * into v_pr from public.joint_proposals where id = p_proposal for update;
  if v_pr.status <> 'pending' then raise exception 'This negotiation is closed.'; end if;
  if v_pr.turn <> v_role then raise exception 'It is not your turn to respond.'; end if;

  update public.joint_proposals
     set share = p_share, turn = case when v_pr.turn = 'partner' then 'proposer' else 'partner' end, updated_at = now()
   where id = p_proposal;
  insert into public.joint_messages (proposal_id, from_nation, body)
    values (p_proposal, null, (case when v_role = 'partner' then v_pr.partner_nation else v_pr.proposer_nation end)
                              || ' proposes the partner cover ' || p_share || '%.');
  return jsonb_build_object('id', p_proposal, 'share', p_share);
end $$;
grant execute on function public.joint_counter(uuid, int) to authenticated;

-- joint_decline(proposal): either government walks away. Closes the negotiation.
create or replace function public.joint_decline(p_proposal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_role text; v_pr public.joint_proposals%rowtype;
begin
  v_role := public._joint_role(p_proposal);
  if v_role is null then raise exception 'You are not part of this negotiation.'; end if;
  select * into v_pr from public.joint_proposals where id = p_proposal for update;
  if v_pr.status <> 'pending' then raise exception 'This negotiation is closed.'; end if;
  update public.joint_proposals set status = 'declined', updated_at = now() where id = p_proposal;
  insert into public.joint_messages (proposal_id, from_nation, body)
    values (p_proposal, null, (case when v_role = 'partner' then v_pr.partner_nation else v_pr.proposer_nation end) || ' declined the project.');
end $$;
grant execute on function public.joint_decline(uuid) to authenticated;

-- joint_accept(proposal): the side whose turn it is accepts the standing terms. The project starts
-- (proposer nation gets the production, cost split per share; partner gets its benefit on completion),
-- and the proposer's 2 AP are spent. _initiative_start re-validates eligibility / one-at-a-time /
-- the executor, so a stale proposal fails cleanly here.
create or replace function public.joint_accept(p_proposal uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role text; v_pr public.joint_proposals%rowtype; v_res jsonb;
begin
  v_role := public._joint_role(p_proposal);
  if v_role is null then raise exception 'You are not part of this negotiation.'; end if;
  select * into v_pr from public.joint_proposals where id = p_proposal for update;
  if v_pr.status <> 'pending' then raise exception 'This negotiation is closed.'; end if;
  if v_pr.turn <> v_role then raise exception 'It is not your turn to respond.'; end if;
  if public._relation_value(v_pr.proposer_nation, v_pr.partner_nation) < 6 then
    raise exception 'Relations with the partner nation have fallen below 6 — the project can no longer proceed.';
  end if;

  v_res := public._initiative_start(v_pr.proposer_nation, v_pr.initiative_id, v_pr.ownership, v_pr.corp_id, v_pr.partner_nation, v_pr.share);
  update public.parties set action_points = greatest(0, action_points - 1) where id = v_pr.proposer_party;   -- the project costs the proposer 1 Action Point (best-effort, floors at 0 so a partner's accept never fails)
  update public.joint_proposals set status = 'accepted', updated_at = now() where id = p_proposal;

  insert into public.joint_messages (proposal_id, from_nation, body)
    values (p_proposal, null, 'Agreed — the joint project is under way' || (case when v_pr.share > 0 then ' (partner covers ' || v_pr.share || '%).' else '.' end));
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_pr.partner_nation, null, 'economy',
            'Your government agreed to a joint project with ' || v_pr.proposer_nation
              || (case when v_pr.share > 0 then ' — covering ' || v_pr.share || '% of the cost.' else '.' end),
            public.current_game_date());

  return v_res;
end $$;
grant execute on function public.joint_accept(uuid) to authenticated;

notify pgrst, 'reload schema';
