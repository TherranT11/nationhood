-- ===========================================================================
-- 264 · FDI Phase 2 — Mergers: propagate corp acquisition to FDI plants.
--
-- Bug this closes: fdi_deals.corp_id references corporations ON DELETE CASCADE, and _card_corp_acquire
-- (schema/185) dissolves the target with a plain DELETE. So acquiring a corp that holds FDI plants
-- silently dropped those deals — Growth vanished from host and owner with no _end_fdi_deal, no event,
-- no world notice, breaking the "FDI Growth = Σ ACTIVE deals, ended only through one path" invariant.
--
-- Fix (the merger mechanic): before the target is dissolved, its FDI plants are handled explicitly.
--   • PENDING deal for the target      → ends 'MERGED' (a courtship of an absorbed firm collapses).
--   • ACTIVE, host = acquirer's nation  → ends 'MERGED' (the plant is now domestic — no longer FDI).
--   • ACTIVE, acquirer already invests in that host → the two plants MERGE: the acquirer's existing deal
--                                         survives (re-rated to the acquirer's tier) and the duplicate ends 'MERGED'.
--   • ACTIVE, otherwise                 → the plant TRANSFERS to the acquirer: new owner corp + home nation,
--                                         host_growth re-rated to the acquirer's tier. The deal stays ACTIVE.
-- Growth only ever moves through the ACTIVE set + host_growth, so the golden invariant still holds.
--
-- Adds 'MERGED' to the end_reason set and 'MERGED'/'TRANSFERRED' to the one emitter (_fdi_event).
-- Depends on: 243 (fdi_deals/_corp_fdi_tier), 244 (_fdi_growth_for), 245 (_fdi_event/_end_fdi_deal),
-- 185 (_card_corp_acquire), 47 (corporations). Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- Allow 'MERGED' as an end reason.
alter table public.fdi_deals drop constraint if exists fdi_deals_end_reason_check;
alter table public.fdi_deals add constraint fdi_deals_end_reason_check
  check (end_reason in ('EXPIRED', 'DEPARTED', 'NATIONALIZED', 'CLOSED', 'REJECTED', 'MERGED'));

-- Redefine the one emitter (body verbatim from schema/245) with MERGED (a lifecycle end) and TRANSFERRED
-- (a change of ownership, not an end) added. Mergers are quiet — no world declaration.
create or replace function public._fdi_event(p_deal uuid, p_type text)
returns void language plpgsql security definer set search_path = public as $$
declare v_d public.fdi_deals%rowtype; v_c text; v_h text; v_o text; v_hb text; v_ob text;
begin
  select * into v_d from public.fdi_deals where id = p_deal;
  if not found then return; end if;
  select name into v_c from public.corporations where id = v_d.corp_id;
  select name into v_h from public.nations where id = v_d.host_nation_id;
  select name into v_o from public.nations where id = v_d.owner_nation_id;
  v_c := coalesce(v_c, 'A foreign firm'); v_h := coalesce(v_h, v_d.host_nation_id); v_o := coalesce(v_o, v_d.owner_nation_id);

  v_hb := case p_type
    when 'SIGNED'       then v_c || ' of ' || v_o || ' has broken ground — foreign investment lands in ' || v_h || '.'
    when 'REJECTED'     then v_c || '''s board declined ' || v_h || '''s investment invitation.'
    when 'EXPIRED'      then v_c || '''s investment in ' || v_h || ' has run its term and wound down.'
    when 'NATIONALIZED' then v_h || ' has nationalised ' || v_c || '''s local operations.'
    when 'DEPARTED'     then v_c || ' has pulled its plant out of ' || v_h || '.'
    when 'CLOSED'       then v_c || ' failed at home; its ' || v_h || ' operation has closed.'
    when 'MERGED'       then v_c || '''s ' || v_h || ' plant has been folded into a merger.'
    when 'TRANSFERRED'  then v_c || ' of ' || v_o || ' has taken over a ' || v_h || ' plant through acquisition.'
    else v_c || ' — investment update.' end;
  insert into public.events (nation_id, kind, body, game_date)
    values (v_d.host_nation_id, 'economy', v_hb, public.current_game_date());

  v_ob := case p_type
    when 'SIGNED'       then v_c || '''s ' || v_h || ' plant opens; profits flow home to ' || v_o || '.'
    when 'NATIONALIZED' then v_h || ' has seized ' || v_c || '''s assets — a blow to ' || v_o || '.'
    when 'DEPARTED'     then v_c || ' has withdrawn its ' || v_h || ' operation.'
    when 'CLOSED'       then v_c || ' has failed, ending its ' || v_h || ' venture.'
    when 'TRANSFERRED'  then v_c || ' absorbed a ' || v_h || ' operation through acquisition.'
    else null end;
  if v_ob is not null then
    insert into public.events (nation_id, kind, body, game_date)
      values (v_d.owner_nation_id, 'economy', v_ob, public.current_game_date());
  end if;

  -- Third parties reprice confidence on seizures / departures: world-visible declaration.
  if p_type in ('NATIONALIZED', 'DEPARTED') then
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_d.host_nation_id, null, 'declaration', v_hb, public.current_game_date());
  end if;
end $$;
revoke all on function public._fdi_event(uuid, text) from public, anon, authenticated;

-- Move an acquired firm's FDI plants onto the acquirer BEFORE the target is dissolved (so nothing
-- cascades away silently). ONE place that decides transfer vs merge vs domestic-close.
create or replace function public._fdi_transfer_on_acquire(p_acquirer uuid, p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_acq public.corporations; v_g numeric; d record;
begin
  select * into v_acq from public.corporations where id = p_acquirer;
  if not found then return; end if;
  v_g := public._fdi_growth_for(public._corp_fdi_tier(v_acq.size));   -- the acquirer's tier Growth (re-rate target's plants to it)

  for d in select * from public.fdi_deals where corp_id = p_target and state in ('ACTIVE', 'PENDING') loop
    if d.state = 'PENDING' then
      perform public._end_fdi_deal(d.id, 'MERGED');                 -- courtship of the absorbed firm collapses
    elsif d.host_nation_id = v_acq.nation_id then
      perform public._end_fdi_deal(d.id, 'MERGED');                 -- plant is now domestic to the acquirer — no longer FDI
    elsif exists (select 1 from public.fdi_deals e
                   where e.corp_id = p_acquirer and e.host_nation_id = d.host_nation_id and e.state = 'ACTIVE') then
      update public.fdi_deals set host_growth = v_g                 -- merge into the acquirer's existing plant, re-rated
        where corp_id = p_acquirer and host_nation_id = d.host_nation_id and state = 'ACTIVE';
      perform public._end_fdi_deal(d.id, 'MERGED');                 -- the duplicate ends
    else
      update public.fdi_deals                                       -- transfer: new owner corp + home nation, re-rated
         set corp_id = p_acquirer, owner_nation_id = v_acq.nation_id, host_growth = v_g
       where id = d.id;
      perform public._fdi_event(d.id, 'TRANSFERRED');
    end if;
  end loop;
end $$;
revoke all on function public._fdi_transfer_on_acquire(uuid, uuid) from public, anon, authenticated;

-- Redefine _card_corp_acquire (body verbatim from schema/185) to hand off the target's FDI plants to the
-- acquirer BEFORE the dissolve — so the plants merge/transfer instead of cascading away with the DELETE.
create or replace function public._card_corp_acquire(p_acquirer uuid, p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_acq public.corporations; v_tgt public.corporations;
begin
  if p_acquirer is null or p_target is null or p_acquirer = p_target then return; end if;
  select * into v_acq from public.corporations where id = p_acquirer;
  if not found or v_acq.status <> 'placed' then return; end if;
  select * into v_tgt from public.corporations where id = p_target;
  if not found or v_tgt.status <> 'placed' then return; end if;
  if coalesce(v_acq.cash, 0) < 2 * coalesce(v_tgt.cash, 0) then
    raise exception '% needs at least twice %''s cash on hand to acquire it.', v_acq.name, v_tgt.name;
  end if;
  perform public._corp_apply_bonus(v_tgt, -1);   -- the dissolved firm's sector bonus is lost
  update public.corporations set cash = coalesce(cash, 0) + coalesce(v_tgt.cash, 0) where id = p_acquirer;
  perform public._fdi_transfer_on_acquire(p_acquirer, p_target);   -- move its FDI plants before the cascade drops them
  delete from public.corporations where id = p_target;
  perform public._corp_event(v_acq.nation_id,
    v_acq.name || ' has acquired ' || v_tgt.name || ', absorbing its operations in the ' || v_tgt.category || ' sector.');
end $$;
revoke all on function public._card_corp_acquire(uuid, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
