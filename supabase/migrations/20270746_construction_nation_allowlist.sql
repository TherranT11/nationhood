-- ════════════════════════════════════════════════════════════════════
-- Construction nation allowlist
-- ════════════════════════════════════════════════════════════════════
-- Restricts where players can commission new buildings via Request
-- Construction (20270225 → 20270675's request_building_construction).
-- Until today every nation with a continent was eligible. Going
-- forward only the four canonical playable nations accept new builds:
-- Melizea, Avelia, Sierramar, Montequilla — the same four that
-- 20270725 opened for politician founding.
--
-- Mirrors 20270725's foundable_for_politician shape so the two flags
-- read consistently and can diverge per-nation if/when a fifth nation
-- opens for one mechanic but not the other.
--
-- Surface:
--   nations.foundable_for_construction boolean NOT NULL DEFAULT FALSE.
--   UPDATE on the column is REVOKED from anon/authenticated so it
--   can't be flipped through PostgREST — admin SQL only.
--
-- Backfill: the four playable nations get TRUE; everyone else stays
-- FALSE. Forward-only — open construction contracts already living
-- on a non-allowlisted nation continue to settle; only NEW requests
-- are blocked.
--
-- Gate: request_building_construction returns
--   { success:false, reason:'not_buildable' }
-- when the resolved nation has foundable_for_construction = FALSE.
-- All other branches unchanged from 20270675.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: foundable_for_construction ────────────────────────────
ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS foundable_for_construction boolean NOT NULL DEFAULT FALSE;

REVOKE UPDATE (foundable_for_construction) ON public.nations
    FROM anon, authenticated;

COMMENT ON COLUMN public.nations.foundable_for_construction IS
    'When TRUE, request_building_construction (20270225/20270675) accepts new builds in this nation. Backfilled by 20270746 for Melizea/Avelia/Sierramar/Montequilla. Mirrors foundable_for_politician (20270725) shape — independent flag so the two mechanics can diverge.';

UPDATE public.nations
   SET foundable_for_construction = TRUE
 WHERE name IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar')
   AND foundable_for_construction IS DISTINCT FROM TRUE;

-- ── 2. request_building_construction: add allowlist gate ─────────────
CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_bidding_ticks int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_req_sector   text;
    v_prof         record;
    v_nation       record;
    v_tick         int;
    v_id           uuid;
    v_num          text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant',
                               'aircraft_assembly_facility',
                               'apartment_basic','apartment_modest','apartment_luxury',
                               'pump_jack','refinery_small','refinery_regular','refinery_large',
                               'gas_station') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_req_sector := corp_building_required_sector(p_building_type);
    IF v_req_sector IS NOT NULL AND v_req_sector <> v_corp.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_req_sector, 'have', v_corp.industry);
    END IF;

    SELECT name, foundable_for_construction
      INTO v_nation
      FROM nations WHERE id = p_nation_id;
    IF v_nation.name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;
    IF v_nation.foundable_for_construction IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buildable');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_prof.cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, v_prof.eff_tier, v_prof.cost, NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true, 'contract_id', v_id, 'contract_number', v_num,
        'building_type', p_building_type, 'tier', v_prof.eff_tier,
        'cost', v_prof.cost, 'duration', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6))
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
