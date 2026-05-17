-- ════════════════════════════════════════════════════════════════
-- Report to Defense Minister — Phase 2 (consumer + public option).
--
-- 1. is_public flag: the filer may "Make report public" → every
--    party can read the body; default false → only the party that
--    currently controls the Defense ministry can.
-- 2. file_chief_of_staff_report gains p_public (signature change →
--    DROP the 2-arg + CREATE the 3-arg; p_public DEFAULT false keeps
--    name-arg callers working). Otherwise byte-for-byte 20270126.
-- 3. get_cos_reports(p_nation_id, p_faction_id): the gated read.
--    SECURITY DEFINER (tables have no client SELECT). Returns, for
--    the nation, every report the viewing faction has NOT acked,
--    newest first: headline fields always; body + stat_snapshot only
--    when is_public OR the viewer currently controls Defense. The
--    confidential body never leaves the DB for an unauthorised party.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE chief_of_staff_reports
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- ── file_chief_of_staff_report (now with p_public) ───────────────
DROP FUNCTION IF EXISTS public.file_chief_of_staff_report(UUID, TEXT);

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
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
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
            'manpower',  v_fac.army_manpower,
            'loyalty',   v_fac.army_loyalty,
            'training',  v_fac.army_training,
            'equipment', v_fac.army_equipment,
            'armor',     v_fac.army_armor,
            'artillery', v_fac.army_artillery,
            'logistics', v_fac.army_logistics,
            'supplies',  v_fac.army_supplies
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

-- ── get_cos_reports — gated read for the Pressing Issues consumer ──
CREATE OR REPLACE FUNCTION public.get_cos_reports(
    p_nation_id  UUID,
    p_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user    UUID := auth.uid();
    v_fid     UUID;
    v_link    UUID;
    v_defense UUID;
    v_out     JSONB;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT id, linked_user_id INTO v_fid, v_link FROM factions WHERE id = p_faction_id;
    IF v_fid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_fid <> v_user AND v_link IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not your faction');
    END IF;

    -- The party that CURRENTLY controls the Defense ministry.
    SELECT party_id INTO v_defense
      FROM ministries
     WHERE nation_id = p_nation_id AND ministry_key = 'defense' AND is_active = true
     LIMIT 1;

    SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'filed_at_tick')::int DESC), '[]'::jsonb)
      INTO v_out
      FROM (
        SELECT jsonb_build_object(
            'id',            r.id,
            'filed_at_tick', r.filed_at_tick,
            'report_year',   r.report_year,
            'chief_name',    r.chief_name,
            'faction_name',  r.faction_name,
            'nation_name',   r.nation_name,
            'minister_name', r.minister_name,
            'is_public',     r.is_public,
            'can_read',      (r.is_public OR p_faction_id = v_defense),
            'body',          CASE WHEN (r.is_public OR p_faction_id = v_defense)
                                  THEN r.body ELSE NULL END,
            'stat_snapshot', CASE WHEN (r.is_public OR p_faction_id = v_defense)
                                  THEN r.stat_snapshot ELSE NULL END
        ) AS row
        FROM chief_of_staff_reports r
        WHERE r.nation_id = p_nation_id
          AND NOT EXISTS (
              SELECT 1 FROM chief_of_staff_report_acks a
               WHERE a.report_id = r.id AND a.faction_id = p_faction_id
          )
      ) sub;

    RETURN jsonb_build_object('success', true, 'reports', v_out);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_cos_reports(UUID, UUID) TO authenticated;
