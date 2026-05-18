-- ════════════════════════════════════════════════════════════════
-- Rename 3 army operating-modifier stats (display-only stats; no
-- engine/tick consumers — confirmed by codebase grep):
--   army_loyalty   → army_officer_corps   ("Officer Corps")
--   army_armor     → army_cohesion        ("Cohesion")
--   army_artillery → army_professionalism ("Professionalism")
--
-- Same approach as the Special Forces→Loyalty rename (20270120):
-- RENAME (not add/drop) so existing values carry over and there is
-- exactly one source of truth — nothing is named army_armor while
-- meaning Cohesion. Idempotent guarded DO blocks (rename only when
-- the old column still exists and the new one doesn't), so re-running
-- or a partial apply is a safe no-op. Ordered after 20270104 (column
-- creation) / 20270120 (loyalty rename).
--
-- file_chief_of_staff_report is the ONLY function that reads these
-- columns (its stat_snapshot; get_cos_reports/acknowledge only read
-- the stored jsonb). CREATE OR REPLACE it (same signature → no
-- routing change; body byte-for-byte the 20270129 version with only
-- the 3 snapshot column refs + keys renamed). Note: reports filed
-- BEFORE this migration keep the old jsonb keys, so the renamed 3
-- stats render "—" on those historical reports — accepted cosmetic
-- consequence of a game-wide stat rename.
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_loyalty')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_officer_corps') THEN
        ALTER TABLE public.factions RENAME COLUMN army_loyalty TO army_officer_corps;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_armor')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_cohesion') THEN
        ALTER TABLE public.factions RENAME COLUMN army_armor TO army_cohesion;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_artillery')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='factions' AND column_name='army_professionalism') THEN
        ALTER TABLE public.factions RENAME COLUMN army_artillery TO army_professionalism;
    END IF;
END $$;

-- file_chief_of_staff_report — 20270129 body, only stat_snapshot's
-- 3 renamed keys/columns changed (loyalty→officer_corps,
-- armor→cohesion, artillery→professionalism).
CREATE OR REPLACE FUNCTION public.file_chief_of_staff_report(
    p_faction_id UUID,
    p_body       TEXT,
    p_public     BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user    UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_body    TEXT;
    v_tick    INT;
    v_cd      INT := 12;
    v_nation  TEXT;
    v_mfirst  TEXT;
    v_mlast   TEXT;
    v_mname   TEXT;
    v_rid     UUID;
    v_cost    NUMERIC := 1000000;
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

    v_body := btrim(COALESCE(p_body, ''));
    IF v_body = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Report body is required');
    END IF;
    IF char_length(v_body) > 1200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Report exceeds the 1200 character limit');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_fac.last_chief_of_staff_report_tick IS NOT NULL
       AND v_tick < v_fac.last_chief_of_staff_report_tick + v_cd THEN
        RETURN jsonb_build_object('success', false, 'error', 'cooldown',
            'ready_at_tick', v_fac.last_chief_of_staff_report_tick + v_cd);
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient Army Funds');
    END IF;

    SELECT name INTO v_nation FROM nations WHERE id = v_fac.nation_id;

    SELECT minister_first_name, minister_last_name
      INTO v_mfirst, v_mlast
      FROM ministries
     WHERE nation_id = v_fac.nation_id AND ministry_key = 'defense' AND is_active = true
     LIMIT 1;
    v_mname := NULLIF(btrim(COALESCE(v_mfirst,'') || ' ' || COALESCE(v_mlast,'')), '');

    INSERT INTO chief_of_staff_reports (
        nation_id, faction_id, filed_at_tick, report_year,
        chief_name, faction_name, nation_name, minister_name, body,
        stat_snapshot, is_public
    ) VALUES (
        v_fac.nation_id, p_faction_id, v_tick, 2000 + (v_tick / 12),
        NULLIF(btrim(COALESCE(v_fac.leader_first_name,'') || ' ' || COALESCE(v_fac.leader_last_name,'')), ''),
        COALESCE(v_fac.faction_name, 'Army'),
        COALESCE(v_nation, 'the nation'),
        v_mname,
        v_body,
        jsonb_build_object(
            'manpower',        v_fac.army_manpower,
            'officer_corps',   v_fac.army_officer_corps,
            'training',        v_fac.army_training,
            'equipment',       v_fac.army_equipment,
            'cohesion',        v_fac.army_cohesion,
            'professionalism', v_fac.army_professionalism,
            'logistics',       v_fac.army_logistics,
            'supplies',        v_fac.army_supplies
        ),
        COALESCE(p_public, false)
    )
    RETURNING id INTO v_rid;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost,
           last_chief_of_staff_report_tick = v_tick
     WHERE id = p_faction_id;

    RETURN jsonb_build_object('success', true, 'report_id', v_rid, 'is_public', COALESCE(p_public, false));
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.file_chief_of_staff_report(UUID, TEXT, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
