-- ===========================================================================
-- 185 · Card corporation effects — a played card can move the corporate sector (schema/47).
--
-- Four authored effects, resolved here:
--   corp_grow / corp_shrink  — nudge a chosen firm's drift (the trajectory _corp_growth reads), so its
--                              per-tick growth rises/falls. The firm is picked on play (your nation only).
--   corp_acquire             — one firm buys another: the acquirer must hold at least TWICE the target's
--                              cash. On success the target's cash rolls into the acquirer and the target
--                              is dissolved (its sector bonus reversed). Both firms are picked on play.
--   corp_create              — found a STATE-OWNED firm in an authored sector with an authored name, in
--                              the playing nation (no pick). Reuses _corp_place (schema/47).
--
-- Depends on: 47 (corporations, _corp_place, _corp_apply_bonus, _corp_event, _corp_growth). Idempotent.
-- ===========================================================================

-- Nudge a placed firm's drift by p_delta, clamped to [-9, 9] (the growth band). A missing/queued firm is
-- a no-op. Positive = faster growth, negative = slower/decline.
create or replace function public._card_corp_growth(p_corp uuid, p_delta int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_corp is null or coalesce(p_delta, 0) = 0 then return; end if;
  update public.corporations
     set drift = greatest(-9, least(9, drift + p_delta))
   where id = p_corp and status = 'placed';
end $$;
revoke all on function public._card_corp_growth(uuid, int) from public, anon, authenticated;

-- One firm acquires another. The acquirer must hold >= 2× the target's cash on hand (the authored rule).
-- On success: the target's cash transfers to the acquirer, the target's sector bonus is reversed, and the
-- target is dissolved. Raises on a failed cash test (the atomic card play rolls back, nothing consumed) so
-- the player gets a clear reason; silent no-op on a missing/queued/same firm.
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
  delete from public.corporations where id = p_target;
  perform public._corp_event(v_acq.nation_id,
    v_acq.name || ' has acquired ' || v_tgt.name || ', absorbing its operations in the ' || v_tgt.category || ' sector.');
end $$;
revoke all on function public._card_corp_acquire(uuid, uuid) from public, anon, authenticated;

-- Found a state-owned firm in the playing nation: an authored sector + name, sensible starting figures.
-- No-op on a blank name. (Any non-empty sector string is accepted; the creator offers the real list.)
create or replace function public._card_create_so_corp(p_nation text, p_sector text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_name, '')); v_sector text := btrim(coalesce(p_sector, ''));
begin
  if p_nation is null or v_name = '' or v_sector = '' then return; end if;
  perform public._corp_place(p_nation, v_name, v_sector, 'so', 'Moderate', 1.0, 0, 1, 'placed', null);
end $$;
revoke all on function public._card_create_so_corp(text, text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
