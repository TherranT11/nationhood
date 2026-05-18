-- ════════════════════════════════════════════════════════════════
-- Establish Combined Arms School — a Quartermaster army action.
--
-- Stands up a national staff college as a CONSTRUCTION CONTRACT that
-- construction corps bid on (mirrors post_interior_infrastructure /
-- 20261106 — same open→bid→award→active→completed pipeline). On
-- completion the issuing ARMY FACTION (not the nation) gains
-- Professionalism +6, Officer Corps +4. The school then costs the
-- nation $2/tick forever under National Infrastructure.
--
-- Per product decisions:
--   • $55 (=55,000,000) IS the contract budget, debited from the
--     army faction's party_funds the moment the action is used (the
--     corps bid on / are paid from it; sunk if never built — same as
--     any posted contract).
--   • 2,000 manpower is removed from the army faction IMMEDIATELY at
--     post time (clamped ≥0; REQUIREMENT: None, so no minimum gate).
--   • 24-tick cooldown, tracked by a new
--     factions.last_combined_arms_school_tick column (FOE pattern).
--   • Build is 36 months (corp_contracts.timeline_months; the
--     winning bid may quote faster/slower, like every contract).
--   • spec_category must satisfy the corp_contracts CHECK
--     ('Light/Heavy Infrastructure'|'Megaproject') — 'Heavy
--     Infrastructure' is used; the real discriminator is the
--     free-text project_subtype='Combined Arms School'.
--
-- combined_arms_school_spec() is the SINGLE SOURCE OF TRUTH read by
-- this RPC, processCombinedArmsSchoolCompletions (effects on
-- completion — only if the issuing faction is still active) and
-- computeCombinedArmsSchoolUpkeepAnnual (the $2/tick budget line).
--
-- Gating mirrors foreign_officer_exchange (20270133): SECURITY
-- DEFINER, army faction only, NOT is_admin() ownership check.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.combined_arms_school_spec()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "name":            "Combined Arms School",
        "budget":          55000000,
        "timeline":        36,
        "manpower_cost":   2000,
        "upkeep_per_tick": 2,
        "spec_category":   "Heavy Infrastructure",
        "project_subtype": "Combined Arms School",
        "stat_effects": [
            {"stat": "army_professionalism", "delta": 6},
            {"stat": "army_officer_corps",   "delta": 4}
        ]
    }'::JSONB
$$;

GRANT EXECUTE ON FUNCTION public.combined_arms_school_spec() TO authenticated, anon;

COMMENT ON FUNCTION public.combined_arms_school_spec() IS
    'Single source of truth for the Combined Arms School. Read by post_combined_arms_school (post), processCombinedArmsSchoolCompletions (completion stat effects on the issuing army faction) and computeCombinedArmsSchoolUpkeepAnnual ($2/tick National Infrastructure upkeep).';

ALTER TABLE public.factions
  ADD COLUMN IF NOT EXISTS last_combined_arms_school_tick INTEGER DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.post_combined_arms_school(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user        UUID := auth.uid();
    v_fac         factions%ROWTYPE;
    v_spec        JSONB := combined_arms_school_spec();
    v_tick        INT;
    v_cd          INT := 24;
    v_budget      NUMERIC := (v_spec->>'budget')::NUMERIC;
    v_mp_cost     INT := (v_spec->>'manpower_cost')::INT;
    v_timeline    INT := (v_spec->>'timeline')::INT;
    v_spec_cat    TEXT := v_spec->>'spec_category';
    v_subtype     TEXT := v_spec->>'project_subtype';
    v_nation      TEXT;
    v_contract_id UUID;
    v_contract_no TEXT;
    v_year        INT;
BEGIN
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF NOT is_admin() AND v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_fac.last_combined_arms_school_tick IS NOT NULL
       AND v_tick < v_fac.last_combined_arms_school_tick + v_cd THEN
        RETURN jsonb_build_object('success', false, 'error', 'cooldown',
            'ready_at_tick', v_fac.last_combined_arms_school_tick + v_cd);
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_budget THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient Army Funds');
    END IF;

    -- $55 debited up front + 2,000 manpower removed immediately
    -- (clamped ≥0) + cooldown stamped — one write.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_budget,
           army_manpower = GREATEST(0, COALESCE(army_manpower, 0) - v_mp_cost),
           last_combined_arms_school_tick = v_tick
     WHERE id = p_faction_id;

    SELECT name INTO v_nation FROM nations WHERE id = v_fac.nation_id;
    v_year        := 2000 + (v_tick / 12);
    v_contract_no := 'CAS-' || v_year::TEXT || '-' ||
                     lpad((floor(random() * 1000)::INT)::TEXT, 3, '0');

    -- issuer_faction_id = the army faction so the completion sweep
    -- knows whom to buff (FK ON DELETE SET NULL → NULL = skip buff).
    INSERT INTO corp_contracts (
        contract_number, name, description,
        contract_type,   issuer_name,                          issuer_faction_id, issuer_nation_id,
        required_sector, spec_category,                         budget,            timeline_months,
        project_type,    project_subtype,                       status,
        created_at_tick, expires_at_tick
    ) VALUES (
        v_contract_no,
        v_spec->>'name',
        'Combined Arms School — national staff college teaching combined arms doctrine, joint operations and modern warfare. Commissioned by the '
            || COALESCE(v_fac.faction_name, 'Army') || ' (Quartermaster).',
        'GOVERNMENT',
        COALESCE(v_fac.faction_name, 'Army') || ' (Quartermaster)',
        p_faction_id,
        v_fac.nation_id,
        'Construction',
        v_spec_cat,
        v_budget,
        v_timeline,
        'Civil Engineering',
        v_subtype,
        'open',
        v_tick,
        v_tick + 6
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object(
        'success',         true,
        'contract_id',     v_contract_id,
        'nation',          COALESCE(v_nation, 'the nation'),
        'budget',          v_budget,
        'timeline',        v_timeline,
        'manpower_removed', v_mp_cost
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.post_combined_arms_school(UUID) TO authenticated;

COMMENT ON FUNCTION public.post_combined_arms_school(UUID) IS
    'Quartermaster army action. Debits $55 from the army faction party_funds + removes 2,000 manpower immediately, posts a Combined Arms School corp_contracts row (status=open, 36-month timeline, project_subtype=Combined Arms School, issuer_faction_id=the army faction). 24-tick cooldown. Completion effects (+6 Professionalism / +4 Officer Corps on the issuing faction, if still active) applied by processCombinedArmsSchoolCompletions; $2/tick perpetual National Infrastructure upkeep via computeCombinedArmsSchoolUpkeepAnnual.';

COMMIT;

NOTIFY pgrst, 'reload schema';
